import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  PuraBackendItem,
  MasterDropdownOption,
  PiodalanFilterParams,
  PiodalanScheduleItem,
  PuraPiodalanRecord,
  PiodalanAcaraItem,
} from '../types/piodalan.types';
import {
  fetchPuraList,
  fetchPuraDetail,
  fetchMasterDropdown,
  fetchPiodalanDates,
  fetchDayWariga,
  fetchPuraPiodalans,
  fetchPiodalanAcaras,
  fetchWarigaElementExplanation,
} from '../api/piodalanApi';
import {
  getTodayWITA,
  formatIndoDate,
  getIndoDayName,
  createDateBadge,
} from '../utils/piodalanUtils';
import { useKalenderTahun } from '@/features/kalender/hooks/useKalender';

/**
 * ==============================================================================
 * CUSTOM HOOKS: FITUR PIODALAN (Kalender Bali)
 * ==============================================================================
 * Berkas ini mengelola siklus hidup data, reaktivitas, dan caching multi-layer:
 * 1. useAllPuras: Menarik 461 master pura dari PostgreSQL (staleTime 24 jam / 0 DB Hit).
 * 2. useMasterDropdown: Menarik opsi wewaran & wuku (staleTime Infinity).
 * 3. usePiodalanSearch: Selector komposit untuk pencarian instan (0ms) berbasis:
 *    - Mode Wewaran & Wuku (mengonsumsi tanggal resmi dari backend Go)
 *    - Mode Bulan (penyaringan piodalan per-bulan)
 *    - Mode Nama Pura (penyaringan toleran nama pura di memori klien)
 * 4. useUpcomingPiodalan: Menentukan jadwal piodalan paling dekat dari hari ini.
 * 5. useDayWariga: Mengambil data 15 dimensi wariga untuk Section 1 modal.
 * 6. usePuraCeremonies: Mengambil data susunan acara kontributor untuk Section 2 modal.
 * ==============================================================================
 */

// ==============================================================================
// 1. HOOK MASTER DAFTAR PURA (GET /api/v1/puras)
// ==============================================================================

/**
 * useAllPuras mengambil seluruh 461 data pura resmi dari backend Go.
 * Disimpan dalam memori RAM TanStack Query selama 24 jam sehingga pencarian
 * berikutnya berjalan dalam 0 milidetik tanpa membebani server backend.
 */
export function useAllPuras() {
  return useQuery<PuraBackendItem[]>({
    queryKey: ['piodalan', 'puras', 'all'],
    queryFn: () => fetchPuraList(),
    staleTime: 1000 * 60 * 60 * 24, // 24 jam di cache memori
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 2. HOOK MASTER REFERENSI DROPDOWN WEWARAN
// ==============================================================================

/**
 * useMasterDropdown mengambil opsi pilihan dropdown:
 * 'saptawara' (7), 'pancawara' (5), 'wuku' (30), atau 'sasih' (12).
 */
export function useMasterDropdown(typeCode: 'saptawara' | 'pancawara' | 'wuku' | 'sasih') {
  return useQuery<MasterDropdownOption[]>({
    queryKey: ['piodalan', 'master', typeCode],
    queryFn: () => fetchMasterDropdown(typeCode),
    staleTime: Infinity, // Data referensi budaya permanen
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 3. HOOK SELECTOR UTAMA PENCARIAN PIODALAN (COMPOSITE SELECTOR)
// ==============================================================================

/**
 * usePiodalanSearch mengorkestrasi pencarian piodalan berdasarkan filter aktif:
 * - Mengambil tanggal Masehi dari kalkulasi backend Go (GET /search/otonan)
 * - Mencocokkan 461 pura dari memori RAM (0ms latency)
 * - Menyusun daftar kartu jadwal siap render dengan badge tanggal visual
 *
 * @param filter Parameter pencarian aktif (tab, saptawara, pancawara, wuku, tahun, dll)
 */
export function usePiodalanSearch(
  filter: PiodalanFilterParams | null,
  enabled: boolean = true
) {
  // 1. Ambil seluruh data pura dari cache
  const { data: puras = [], isLoading: isPurasLoading } = useAllPuras();

  // 2. Ambil master dropdown untuk memetakan nama ke ID backend
  const { data: saptawaraOpts = [] } = useMasterDropdown('saptawara');
  const { data: pancawaraOpts = [] } = useMasterDropdown('pancawara');
  const { data: wukuOpts = [] } = useMasterDropdown('wuku');

  // Cari ID database dari nama elemen yang dipilih di form
  const selectedSaptawaraId = useMemo(() => {
    if (!filter || !filter.saptawara) return undefined;
    return saptawaraOpts.find(
      (opt) => opt.name.toLowerCase() === filter.saptawara.toLowerCase()
    )?.id;
  }, [saptawaraOpts, filter?.saptawara]);

  const selectedPancawaraId = useMemo(() => {
    if (!filter || !filter.pancawara) return undefined;
    return pancawaraOpts.find(
      (opt) => opt.name.toLowerCase() === filter.pancawara.toLowerCase()
    )?.id;
  }, [pancawaraOpts, filter?.pancawara]);

  const selectedWukuId = useMemo(() => {
    if (!filter || !filter.wuku) return undefined;
    return wukuOpts.find(
      (opt) => opt.name.toLowerCase() === filter.wuku.toLowerCase()
    )?.id;
  }, [wukuOpts, filter?.wuku]);

  // Syarat eksekusi kalkulasi tanggal Masehi dari backend Go
  const canFetchDates = Boolean(
    enabled &&
      filter &&
      filter.tab === 'wewaran' &&
      selectedSaptawaraId &&
      selectedPancawaraId &&
      selectedWukuId &&
      filter.tahun
  );

  // 3. Tarik data kalender tahun Masehi aktif jika pencarian membutuhkan kalender (Bulan / Nama Pura)
  const targetYear = filter?.tahun ? Number(filter.tahun) : new Date().getFullYear();
  const targetMonth = filter?.bulan ? Number(filter.bulan) : undefined;
  const isKalenderNeeded = Boolean(
    enabled && filter && (filter.tab === 'bulan' || filter.tab === 'pura')
  );

  const { kalenderData = [], isLoading: isKalenderLoading } = useKalenderTahun(
    targetYear,
    targetMonth
  );

  // 4. Panggil API backend Go untuk menghitung tanggal Masehi di tahun target (khusus Tab Wewaran)
  const {
    data: targetDates = [],
    isLoading: isDatesLoading,
    isError: isDatesError,
    error: datesError,
    refetch,
  } = useQuery<string[]>({
    queryKey: [
      'piodalan',
      'dates',
      selectedSaptawaraId,
      selectedPancawaraId,
      selectedWukuId,
      filter?.tahun,
    ],
    queryFn: () =>
      fetchPiodalanDates(
        selectedSaptawaraId!,
        selectedPancawaraId!,
        selectedWukuId!,
        Number(filter!.tahun)
      ),
    enabled: canFetchDates,
    staleTime: 1000 * 60 * 60 * 12, // 12 jam
    refetchOnWindowFocus: false,
  });

  // 5. Selector memori: Rakit PiodalanScheduleItem[] berdasarkan Tab yang aktif
  const scheduleList: PiodalanScheduleItem[] = useMemo(() => {
    if (!enabled || !filter || !Array.isArray(puras) || puras.length === 0) {
      return [];
    }

    const normSasih = (s?: string | null): string => {
      if (!s) return '';
      const lower = s.toLowerCase().trim();
      if (lower === 'kedasa') return 'kadasa';
      if (lower === 'kenam') return 'kanem';
      return lower;
    };

    const capFirst = (text?: string | null): string => {
      if (!text) return '';
      const trimmed = text.trim();
      return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    };

    const items: PiodalanScheduleItem[] = [];

    // --------------------------------------------------------------------------
    // A. MODE WEWARAN & WUKU (PAWUKON 210 HARI)
    // --------------------------------------------------------------------------
    if (filter.tab === 'wewaran') {
      if (!filter.wuku || !filter.saptawara || !filter.pancawara || !filter.tahun) {
        return [];
      }
      const cleanWuku = filter.wuku.trim().toLowerCase();
      const cleanSaptawara = filter.saptawara.trim().toLowerCase();
      const cleanPancawara = filter.pancawara.trim().toLowerCase();

      // Filter pura di memori yang memiliki observasi wewaran lengkap yang cocok
      const matchingPuras = puras.filter((p) => {
        const pWuku = p.wuku?.trim().toLowerCase();
        const pSapta = p.saptawara?.trim().toLowerCase();
        const pPanca = p.pancawara?.trim().toLowerCase();

        return pWuku === cleanWuku && pSapta === cleanSaptawara && pPanca === cleanPancawara;
      });

      // Gunakan tanggal resmi dari backend Go
      const datesToRender = targetDates.length > 0 ? targetDates : [];

      let itemCounter = 0;
      for (const dateStr of datesToRender) {
        for (const pura of matchingPuras) {
          const locCity = pura.city || pura.address || 'Bali';
          const locProvince = pura.province || 'Indonesia';
          const shortLoc = pura.address ? `${pura.address}, ${locCity}` : locCity;

          items.push({
            id: `${dateStr}-${pura.id}`,
            dateStr,
            formattedDate: formatIndoDate(dateStr),
            dayName: getIndoDayName(dateStr),
            dateBadge: createDateBadge(dateStr, itemCounter),
            puraName: pura.name,
            puraId: pura.id,
            location: shortLoc,
            fullAddress: pura.address || `${locCity}, ${locProvince}`,
            puraType: pura.type || 'Kahyangan Jagat',
            penanggalan: `${pura.saptawara || filter.saptawara} · ${pura.pancawara || filter.pancawara} · ${pura.wuku || filter.wuku}`,
            cycleInfo: 'Pawukon 210 hari',
            timeString: null,
            mapUrl: pura.location_url,
            phone: pura.phone,
            rawPura: pura,
          });
          itemCounter++;
        }
      }
    }

    // --------------------------------------------------------------------------
    // B. MODE NAMA PURA (PENCARIAN NAMA BERBASIS PENANGGALAN PASTI & KALENDER RIIL)
    // --------------------------------------------------------------------------
    else if (filter.tab === 'pura') {
      const query = (filter.namaPura || '').trim().toLowerCase();
      if (!query || !Array.isArray(kalenderData) || kalenderData.length === 0) {
        return [];
      }

      // HANYA ambil pura yang memiliki penanggalan pasti (Pawukon lengkap atau Sasih lengkap)
      // Pura tanpa aturan penanggalan yang pasti tidak ditampilkan agar tidak menyajikan tanggal palsu
      const matchingPuras = puras.filter((p) => {
        const hasValidPawukon = Boolean(p.wuku && p.saptawara && p.pancawara);
        const hasValidSasih = Boolean(p.sasih && p.purnama_tilem);
        if (!hasValidPawukon && !hasValidSasih) {
          return false;
        }

        const nameMatch = p.name?.toLowerCase().includes(query);
        const cityMatch = p.city?.toLowerCase().includes(query);
        const addressMatch = p.address?.toLowerCase().includes(query);
        return nameMatch || cityMatch || addressMatch;
      });

      let itemCounter = 0;
      for (const pura of matchingPuras) {
        const locCity = pura.city || pura.address || 'Bali';
        const locProvince = pura.province || 'Indonesia';
        const shortLoc = pura.address ? `${pura.address}, ${locCity}` : locCity;

        const pWuku = pura.wuku?.trim().toLowerCase();
        const pSapta = pura.saptawara?.trim().toLowerCase();
        const pPanca = pura.pancawara?.trim().toLowerCase();
        const pSasih = normSasih(pura.sasih);
        const pPT = pura.purnama_tilem?.trim().toLowerCase();

        const isPawukon = Boolean(pWuku && pSapta && pPanca);
        const isSasih = Boolean(pSasih && pPT);

        // Cari tanggal-tanggal riil piodalan pura ini di dalam kalenderData tahun target
        for (const day of kalenderData) {
          const dWuku = day.wewaran?.wuku?.nama?.trim().toLowerCase();
          const dSapta = day.wewaran?.saptawara?.nama?.trim().toLowerCase();
          const dPanca = day.wewaran?.pancawara?.nama?.trim().toLowerCase();
          const dSasih = normSasih(day.sasih?.nama_sasih);
          const dPT = day.pengalantaka?.purnama_tilem?.trim().toLowerCase();

          const isMatch = isPawukon
            ? pWuku === dWuku && pSapta === dSapta && pPanca === dPanca
            : isSasih && pSasih === dSasih && pPT === dPT;

          if (isMatch) {
            const dateStr = day.tanggal;
            const penanggalanText = isPawukon
              ? `${pura.saptawara} · ${pura.pancawara} · ${pura.wuku}`
              : `${capFirst(pura.purnama_tilem)} ${capFirst(pura.sasih)}`;

            const cycleText = isPawukon ? 'Pawukon 210 hari' : 'Penanggalan Sasih';

            items.push({
              id: `pura-${pura.id}-${dateStr}`,
              dateStr,
              formattedDate: formatIndoDate(dateStr),
              dayName: getIndoDayName(dateStr),
              dateBadge: createDateBadge(dateStr, itemCounter),
              puraName: pura.name,
              puraId: pura.id,
              location: shortLoc,
              fullAddress: pura.address || `${locCity}, ${locProvince}`,
              puraType: pura.type || 'Kahyangan Jagat',
              penanggalan: penanggalanText,
              cycleInfo: cycleText,
              timeString: null,
              mapUrl: pura.location_url,
              phone: pura.phone,
              rawPura: pura,
            });
            itemCounter++;
          }
        }
      }

      // Urutkan jadwal berdasarkan urutan tanggal terdekat
      items.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    }

    // --------------------------------------------------------------------------
    // C. MODE BULAN (PENYARINGAN PER BULAN MASEHI BERBASIS KALENDER RIIL)
    // --------------------------------------------------------------------------
    else if (filter.tab === 'bulan') {
      if (
        !filter.bulan ||
        !filter.tahun ||
        !Array.isArray(kalenderData) ||
        kalenderData.length === 0
      ) {
        return [];
      }
      const targetMonth = Number(filter.bulan);
      const todayYear = Number(filter.tahun);

      // Ambil hari-hari yang termasuk dalam bulan yang dipilih
      const monthPrefix = `${todayYear}-${String(targetMonth).padStart(2, '0')}-`;
      const monthDays = kalenderData.filter((d) => d.tanggal.startsWith(monthPrefix));

      let itemCounter = 0;
      for (const day of monthDays) {
        const dateStr = day.tanggal;
        const dWuku = day.wewaran?.wuku?.nama?.trim().toLowerCase();
        const dSapta = day.wewaran?.saptawara?.nama?.trim().toLowerCase();
        const dPanca = day.wewaran?.pancawara?.nama?.trim().toLowerCase();
        const dSasih = normSasih(day.sasih?.nama_sasih);
        const dPT = day.pengalantaka?.purnama_tilem?.trim().toLowerCase();

        for (const pura of puras) {
          const pWuku = pura.wuku?.trim().toLowerCase();
          const pSapta = pura.saptawara?.trim().toLowerCase();
          const pPanca = pura.pancawara?.trim().toLowerCase();
          const pSasih = normSasih(pura.sasih);
          const pPT = pura.purnama_tilem?.trim().toLowerCase();

          // 1. Cek kecocokan sistem Pawukon (Wuku + Saptawara + Pancawara)
          const isPawukonMatch = Boolean(
            pWuku &&
              pSapta &&
              pPanca &&
              pWuku === dWuku &&
              pSapta === dSapta &&
              pPanca === dPanca
          );

          // 2. Cek kecocokan sistem Sasih (Sasih + Purnama/Tilem)
          const isSasihMatch = Boolean(
            pSasih &&
              pPT &&
              (pPT === 'purnama' || pPT === 'tilem') &&
              pSasih === dSasih &&
              pPT === dPT
          );

          // Jika pura tidak punya penanggalan pasti atau tidak jatuh di tanggal ini -> JANGAN TAMPILKAN
          if (!isPawukonMatch && !isSasihMatch) {
            continue;
          }

          const locCity = pura.city || pura.address || 'Bali';
          const locProvince = pura.province || 'Indonesia';
          const shortLoc = pura.address ? `${pura.address}, ${locCity}` : locCity;

          const penanggalanText = isPawukonMatch
            ? `${pura.saptawara} · ${pura.pancawara} · ${pura.wuku}`
            : `${capFirst(pura.purnama_tilem)} ${capFirst(pura.sasih)}`;

          const cycleText = isPawukonMatch ? 'Pawukon 210 hari' : 'Penanggalan Sasih';

          items.push({
            id: `bulan-${dateStr}-${pura.id}`,
            dateStr,
            formattedDate: formatIndoDate(dateStr),
            dayName: getIndoDayName(dateStr),
            dateBadge: createDateBadge(dateStr, itemCounter),
            puraName: pura.name,
            puraId: pura.id,
            location: shortLoc,
            fullAddress: pura.address || `${locCity}, ${locProvince}`,
            puraType: pura.type || 'Kahyangan Jagat',
            penanggalan: penanggalanText,
            cycleInfo: cycleText,
            timeString: null,
            mapUrl: pura.location_url,
            phone: pura.phone,
            rawPura: pura,
          });
          itemCounter++;
        }
      }

      // Pastikan jadwal terurut tanggal menaik (1 s.d. akhir bulan)
      items.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    }

    return items;
  }, [puras, filter, targetDates, kalenderData, enabled]);

  return {
    scheduleList,
    totalCount: scheduleList.length,
    isLoading:
      isPurasLoading ||
      (canFetchDates && isDatesLoading) ||
      (isKalenderNeeded && isKalenderLoading),
    isError: isDatesError,
    error: datesError,
    refetch,
  };
}

// ==============================================================================
// 4. HOOK PIODALAN TERDEKAT (SIDEBAR WIDGET KANAN ATAS)
// ==============================================================================

/**
 * useUpcomingPiodalan menentukan satu pura yang piodalannya paling dekat
 * terhadap tanggal hari ini (todayWITA) untuk ditampilkan di widget kanan.
 */
export function useUpcomingPiodalan(scheduleList: PiodalanScheduleItem[]) {
  return useMemo(() => {
    if (!scheduleList || scheduleList.length === 0) {
      return null;
    }

    const todayStr = getTodayWITA();

    // 1. Cari piodalan pada atau setelah hari ini
    const upcoming = scheduleList.find((item) => item.dateStr >= todayStr);
    if (upcoming) {
      return upcoming;
    }

    // 2. Fallback: ambil jadwal pertama jika semua jadwal sudah berlalu
    return scheduleList[0];
  }, [scheduleList]);
}

// ==============================================================================
// 5. HOOK SECTION 1: DETAIL WARIGA TANGGAL (GET /api/v1/kalender)
// ==============================================================================

/**
 * useDayWariga mengambil 15 dimensi penanggalan wariga harian untuk tanggal terpilih:
 * Digunakan untuk mengisi Section 1 modal (Gambar 1 & 2).
 */
export function useDayWariga(dateStr?: string | null) {
  return useQuery({
    queryKey: ['piodalan', 'wariga', 'day', dateStr],
    queryFn: () => (dateStr ? fetchDayWariga(dateStr) : null),
    enabled: Boolean(dateStr),
    staleTime: Infinity, // Data astronomis hari tertentu tidak pernah berubah
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 6. HOOK SECTION 2: DETAIL ACARA & JAM PURA (KONTRIBUSI KONTRIBUTOR)
// ==============================================================================

/**
 * usePuraCeremonies mengambil susunan kegiatan piodalan dan acara suatu pura:
 * GET /api/v1/puras/:id/piodalans & GET /api/v1/piodalans/:id/acaras
 *
 * Mengembalikan susunan acara jika sudah diinput kontributor,
 * atau array kosong [] jika data belum diinput.
 */
export function usePuraCeremonies(puraId?: number | null) {
  return useQuery<{
    records: PuraPiodalanRecord[];
    acaras: PiodalanAcaraItem[];
    hasContributedData: boolean;
  }>({
    queryKey: ['piodalan', 'pura', 'ceremonies', puraId],
    queryFn: async () => {
      if (!puraId) {
        return { records: [], acaras: [], hasContributedData: false };
      }

      // 1. Ambil piodalan record pura
      const records = await fetchPuraPiodalans(puraId);
      if (!records || records.length === 0) {
        return { records: [], acaras: [], hasContributedData: false };
      }

      // 2. Jika ada piodalan, ambil susunan acaras untuk piodalan terbaru
      const latestPiodalan = records[0];
      const acaras = await fetchPiodalanAcaras(latestPiodalan.id);

      return {
        records,
        acaras,
        hasContributedData: acaras.length > 0,
      };
    },
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 5, // 5 menit
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 7. HOOK DETAIL SATU PURA
// ==============================================================================

/**
 * usePuraDetail mengambil data profil lengkap satu pura:
 * GET /api/v1/puras/:id
 */
export function usePuraDetail(puraId?: number | null) {
  return useQuery<PuraBackendItem | null>({
    queryKey: ['piodalan', 'pura', 'detail', puraId],
    queryFn: () => (puraId ? fetchPuraDetail(puraId) : null),
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 30, // 30 menit
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 8. HOOK PENJELASAN MAKNA NILAI ELEMEN WARIGA
// ==============================================================================

/**
 * useWarigaExplanation mengambil makna filosofis elemen wariga saat baris panah (→) diklik:
 */
export function useWarigaExplanation(typeCode?: string, itemName?: string) {
  return useQuery({
    queryKey: ['piodalan', 'wariga', 'explanation', typeCode, itemName],
    queryFn: () =>
      typeCode && itemName ? fetchWarigaElementExplanation(typeCode, itemName) : null,
    enabled: Boolean(typeCode && itemName),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}
