import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type {
  PuraBackendItem,
  MasterDropdownOption,
  PiodalanFilterParams,
  PiodalanScheduleItem,
  PuraPiodalanRecord,
  PiodalanAcaraItem,
  PiodalanSearchParams,
  BackendPiodalanSearchResult,
  PiodalanDayGroup,
  PiodalanDayPuraItem,
} from '../types/piodalan.types';
import {
  fetchPuraList,
  fetchPuraDetail,
  fetchMasterDropdown,
  fetchDayWariga,
  fetchPuraPiodalans,
  fetchPiodalanAcaras,
  fetchWarigaElementExplanation,
  searchPiodalan,
} from '../api/piodalanApi';
import {
  getTodayWITA,
  formatIndoDate,
  getIndoDayName,
  createDateBadge,
} from '../utils/piodalanUtils';
import { fetchKalenderTahun } from '@/features/kalender/api/kalenderApi';
import { matchPurasForDay, normalizeCalendarString } from '@/features/kalender/utils/calendarUtils';

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
// 3. HOOK SELECTOR UTAMA PENCARIAN PIODALAN (BACKEND GO INTEGRATION)
// ==============================================================================

/**
 * usePiodalanSearch mengorkestrasi pemanggilan mesin pencarian piodalan backend Go:
 * GET /api/v1/search/piodalan
 *
 * Menggantikan kalkulasi manual dan loop join berat di sisi browser.
 * Seluruh komputasi kalender Pawukon 210 hari, penanggalan Sasih candra, dan
 * pencocokan relasi pura dijalankan secara instan oleh server backend Go.
 *
 * @param filter Parameter pencarian aktif (tab, saptawara, pancawara, wuku, tahun, bulan, namaPura)
 * @param enabled Flag pengaktif kueri (hanya dijalankan saat pengguna menekan tombol cari)
 */
export function usePiodalanSearch(
  filter: PiodalanFilterParams | null,
  enabled: boolean = true
) {
  // Ambil data cache master seluruh 461 pura dari database resmi PostgreSQL
  const { data: puras = [], isLoading: isPurasLoading } = useAllPuras();

  // Tahun target pencarian (default tahun berjalan)
  const targetYear = filter?.tahun ? Number(filter.tahun) : new Date().getFullYear();

  // Ambil data kalender 365 hari tahun target untuk mesin komputasi pencocokan hybrid deterministik
  const { data: kalenderData = [], isLoading: isKalenderLoading } = useQuery({
    queryKey: ['kalender', targetYear],
    queryFn: () => fetchKalenderTahun(targetYear),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    enabled: enabled && Boolean(filter),
  });

  // Buat indeks pemetaan instan (Map O(1)) berdasarkan ID pura untuk pengayaan profil kartu
  const purasMap = useMemo(() => {
    const map = new Map<number, PuraBackendItem>();
    if (Array.isArray(puras)) {
      for (const p of puras) {
        map.set(p.id, p);
      }
    }
    return map;
  }, [puras]);

  // 1. Ekstraksi dan sanitasi parameter pencarian untuk dikirim ke backend Go
  const searchParams: PiodalanSearchParams | null = useMemo(() => {
    if (!enabled || !filter) return null;

    const tahun = filter.tahun ? Number(filter.tahun) : targetYear;

    // Mode Wewaran (Siklus Pawukon 210 hari)
    if (filter.tab === 'wewaran') {
      if (!filter.wuku || !filter.saptawara || !filter.pancawara) return null;
      return {
        mode: 'wewaran',
        saptawara: filter.saptawara.trim(),
        pancawara: filter.pancawara.trim(),
        wuku: filter.wuku.trim(),
        tahun,
      };
    }

    // Mode Bulan (Pencarian piodalan dalam 1 bulan Masehi penuh)
    if (filter.tab === 'bulan') {
      if (!filter.bulan) return null;
      return {
        mode: 'bulan',
        bulan: Number(filter.bulan),
        tahun,
      };
    }

    // Mode Pura (Pencarian berbasis kata kunci nama pura atau ID)
    if (filter.tab === 'pura') {
      const q = (filter.namaPura || '').trim();
      if (!q) return null;

      // Temukan pura di cache master puras untuk menyertakan pura_id resmi ke backend
      const matchedPura = puras.find(
        (p) =>
          p.name.toLowerCase() === q.toLowerCase() ||
          p.name.toLowerCase().includes(q.toLowerCase()) ||
          q.toLowerCase().includes(p.name.toLowerCase())
      );

      return {
        mode: 'pura',
        q,
        pura_id: matchedPura?.id,
        tahun,
      };
    }

    return null;
  }, [enabled, filter, targetYear, puras]);

  // 2. Pemanggilan API backend Go secara asinkron menggunakan TanStack Query
  const {
    data: searchResult,
    isLoading: isSearchLoading,
    isError: isSearchError,
    error: searchError,
    refetch,
  } = useQuery<BackendPiodalanSearchResult | null>({
    queryKey: ['piodalan', 'search', searchParams],
    queryFn: () => (searchParams ? searchPiodalan(searchParams) : null),
    enabled: Boolean(searchParams),
    staleTime: 1000 * 60 * 30, // 30 menit di cache memori browser
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
  });

  // 3. Mapping data hasil backend Go dengan Fallback Hybrid Deterministik
  // Menghasilkan hierarki 3-level: Piodalan Hari -> List Pura -> Detail Pura & Acara
  const { dayGroups, scheduleList } = useMemo(() => {
    // =========================================================================
    // A. Prioritas 1: Konsumsi data terstruktur resmi dari server backend Go
    // =========================================================================
    if (
      searchResult &&
      Array.isArray(searchResult.schedules) &&
      searchResult.schedules.length > 0
    ) {
      const groups: PiodalanDayGroup[] = [];
      const flatItems: PiodalanScheduleItem[] = [];
      let itemCounter = 0;

      for (const day of searchResult.schedules) {
        const dayPuras: PiodalanDayPuraItem[] = [];

        for (const pura of day.puras) {
          const puraIdNum = parseInt(pura.id, 10) || 0;
          const cachedPura = purasMap.get(puraIdNum);

          const locCity = pura.kabupaten || cachedPura?.city || cachedPura?.address || 'Bali';
          const locProvince = pura.provinsi || cachedPura?.province || 'Indonesia';
          const shortLoc = pura.alamat ? `${pura.alamat}, ${locCity}` : locCity;
          const fullLoc = pura.alamat
            ? `${pura.alamat}, ${locCity}, ${locProvince}`
            : `${locCity}, ${locProvince}`;

          let timeStr: string | null = null;
          let contactPhone: string | null = cachedPura?.phone || null;
          if (pura.pelaksanaan_aktual?.acaras && pura.pelaksanaan_aktual.acaras.length > 0) {
            const firstAcara = pura.pelaksanaan_aktual.acaras[0];
            if (firstAcara.waktu) {
              const parts = firstAcara.waktu.split(' ');
              if (parts.length > 1) {
                timeStr = `${parts[1].substring(0, 5)} WITA`;
              }
            }
            if (firstAcara.pic_phone) {
              contactPhone = firstAcara.pic_phone;
            }
          }

          const penanggalanText = day.wewaran || day.sasih || 'Piodalan Pura';
          const cycleText = day.wewaran ? 'Pawukon 210 hari' : day.sasih || 'Penanggalan Sasih';

          // 1. Bentuk item pura untuk Level 2 (Daftar Pura pada hari ini)
          dayPuras.push({
            id: puraIdNum,
            name: pura.nama,
            type: pura.tipe || cachedPura?.type || 'Kahyangan Jagat',
            address: pura.alamat || cachedPura?.address || '',
            city: locCity,
            province: locProvince,
            phone: contactPhone,
            location_url: cachedPura?.location_url || null,
            latitude: pura.latitude ?? cachedPura?.latitude ?? null,
            longitude: pura.longitude ?? cachedPura?.longitude ?? null,
            benchmark: cachedPura?.benchmark || (day.wewaran ? 'Pawukon' : 'Sasih'),
            wuku: cachedPura?.wuku || null,
            saptawara: cachedPura?.saptawara || null,
            pancawara: cachedPura?.pancawara || null,
            sasih: cachedPura?.sasih || null,
            purnama_tilem: cachedPura?.purnama_tilem || null,
            pelaksanaan_aktual: pura.pelaksanaan_aktual || null,
            rawPura: cachedPura || {
              id: puraIdNum,
              name: pura.nama,
              type: pura.tipe,
              status: 'active',
              address: pura.alamat,
              city: pura.kabupaten,
              province: pura.provinsi,
              phone: contactPhone,
            },
          });

          // 2. Bentuk item flat untuk widget samping & backward-compatibility
          flatItems.push({
            id: `${day.tanggal}-${pura.id}`,
            dateStr: day.tanggal,
            formattedDate: formatIndoDate(day.tanggal),
            dayName: getIndoDayName(day.tanggal),
            dateBadge: createDateBadge(day.tanggal, itemCounter),
            puraName: pura.nama,
            puraId: puraIdNum,
            location: shortLoc,
            fullAddress: fullLoc,
            puraType: pura.tipe || cachedPura?.type || 'Kahyangan Jagat',
            penanggalan: penanggalanText,
            cycleInfo: cycleText,
            timeString: timeStr,
            mapUrl: cachedPura?.location_url || null,
            phone: contactPhone,
            rawPura: cachedPura || {
              id: puraIdNum,
              name: pura.nama,
              type: pura.tipe,
              status: 'active',
              address: pura.alamat,
              city: pura.kabupaten,
              province: pura.provinsi,
              phone: contactPhone,
            },
          });
          itemCounter++;
        }

        // Simpan kelompok tanggal (Level 1)
        groups.push({
          dateStr: day.tanggal,
          formattedDate: formatIndoDate(day.tanggal),
          dayName: getIndoDayName(day.tanggal),
          wewaran: day.wewaran || day.sasih || 'Piodalan Pura',
          sasih: day.sasih,
          hariRaya: day.hari_raya,
          totalPura: dayPuras.length,
          puras: dayPuras,
        });
      }

      if (groups.length > 0) {
        return { dayGroups: groups, scheduleList: flatItems };
      }
    }

    // =========================================================================
    // B. Prioritas 2 (Hybrid Fallback Engine):
    // Jika respon jaringan kosong atau masih loading, komputasi O(1) deterministik di browser
    // =========================================================================
    if (
      !enabled ||
      !filter ||
      !Array.isArray(kalenderData) ||
      kalenderData.length === 0 ||
      !Array.isArray(puras) ||
      puras.length === 0
    ) {
      return { dayGroups: [], scheduleList: [] };
    }

    const groups: PiodalanDayGroup[] = [];
    const flatItems: PiodalanScheduleItem[] = [];
    let counter = 0;

    // SKENARIO 1: TAB WEWARAN & WUKU
    if (filter.tab === 'wewaran') {
      const targetSapta = normalizeCalendarString(filter.saptawara);
      const targetPanca = normalizeCalendarString(filter.pancawara);
      const targetWuku = normalizeCalendarString(filter.wuku);

      if (!targetSapta || !targetPanca || !targetWuku) {
        return { dayGroups: [], scheduleList: [] };
      }

      const matchingDays = kalenderData.filter((d) => {
        const dSapta = normalizeCalendarString(d.wewaran?.saptawara?.nama);
        const dPanca = normalizeCalendarString(d.wewaran?.pancawara?.nama);
        const dWuku = normalizeCalendarString(d.wewaran?.wuku?.nama);
        return dSapta === targetSapta && dPanca === targetPanca && dWuku === targetWuku;
      });

      for (const day of matchingDays) {
        const celebratingPuras = matchPurasForDay(day, puras);
        const dayPuras: PiodalanDayPuraItem[] = [];

        for (const p of celebratingPuras) {
          const locCity = p.city || p.address || 'Bali';
          const locProvince = p.province || 'Indonesia';
          const shortLoc = p.address ? `${p.address}, ${locCity}` : locCity;
          const fullLoc = p.address ? `${p.address}, ${locCity}, ${locProvince}` : `${locCity}, ${locProvince}`;
          const penanggalanText = `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim() || 'Pawukon 210 hari';

          dayPuras.push({
            id: p.id,
            name: p.name,
            type: p.type || 'Kahyangan Jagat',
            address: p.address || '',
            city: locCity,
            province: locProvince,
            phone: p.phone || null,
            location_url: p.location_url || null,
            latitude: null,
            longitude: null,
            benchmark: p.benchmark || 'Pawukon',
            wuku: p.wuku,
            saptawara: p.saptawara,
            pancawara: p.pancawara,
            sasih: p.sasih,
            purnama_tilem: p.purnama_tilem,
            pelaksanaan_aktual: null,
            rawPura: p,
          });

          flatItems.push({
            id: `${day.tanggal}-${p.id}`,
            dateStr: day.tanggal,
            formattedDate: formatIndoDate(day.tanggal),
            dayName: getIndoDayName(day.tanggal),
            dateBadge: createDateBadge(day.tanggal, counter),
            puraName: p.name,
            puraId: p.id,
            location: shortLoc,
            fullAddress: fullLoc,
            puraType: p.type || 'Kahyangan Jagat',
            penanggalan: penanggalanText,
            cycleInfo: 'Pawukon 210 hari',
            timeString: null,
            mapUrl: p.location_url || null,
            phone: p.phone || null,
            rawPura: p,
          });
          counter++;
        }

        if (dayPuras.length > 0) {
          groups.push({
            dateStr: day.tanggal,
            formattedDate: formatIndoDate(day.tanggal),
            dayName: getIndoDayName(day.tanggal),
            wewaran: `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim() || 'Pawukon 210 hari',
            sasih: day.sasih?.nama_sasih,
            hariRaya: day.hari_raya?.[0]?.nama,
            totalPura: dayPuras.length,
            puras: dayPuras,
          });
        }
      }
    }

    // SKENARIO 2: TAB BULAN
    else if (filter.tab === 'bulan') {
      const targetBulan = Number(filter.bulan);
      if (!targetBulan || targetBulan < 1 || targetBulan > 12) {
        return { dayGroups: [], scheduleList: [] };
      }

      const monthDays = kalenderData.filter((d) => {
        const parts = d.tanggal.split('-');
        return parts.length >= 2 && parseInt(parts[1], 10) === targetBulan;
      });

      for (const day of monthDays) {
        const celebratingPuras = matchPurasForDay(day, puras);
        if (celebratingPuras.length === 0) continue;

        const dayPuras: PiodalanDayPuraItem[] = [];
        for (const p of celebratingPuras) {
          const locCity = p.city || p.address || 'Bali';
          const locProvince = p.province || 'Indonesia';
          const shortLoc = p.address ? `${p.address}, ${locCity}` : locCity;
          const fullLoc = p.address ? `${p.address}, ${locCity}, ${locProvince}` : `${locCity}, ${locProvince}`;
          const penanggalanText = (p.benchmark || '').toLowerCase().includes('sasih') || p.sasih
            ? `${p.sasih || day.sasih?.nama_sasih || ''} ${p.purnama_tilem || day.pengalantaka?.purnama_tilem || ''}`.trim()
            : `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim();

          const cycleText = (p.benchmark || '').toLowerCase().includes('sasih') || p.sasih
            ? 'Penanggalan Sasih'
            : 'Pawukon 210 hari';

          dayPuras.push({
            id: p.id,
            name: p.name,
            type: p.type || 'Kahyangan Jagat',
            address: p.address || '',
            city: locCity,
            province: locProvince,
            phone: p.phone || null,
            location_url: p.location_url || null,
            latitude: null,
            longitude: null,
            benchmark: p.benchmark || (p.sasih ? 'Sasih' : 'Pawukon'),
            wuku: p.wuku,
            saptawara: p.saptawara,
            pancawara: p.pancawara,
            sasih: p.sasih,
            purnama_tilem: p.purnama_tilem,
            pelaksanaan_aktual: null,
            rawPura: p,
          });

          flatItems.push({
            id: `${day.tanggal}-${p.id}`,
            dateStr: day.tanggal,
            formattedDate: formatIndoDate(day.tanggal),
            dayName: getIndoDayName(day.tanggal),
            dateBadge: createDateBadge(day.tanggal, counter),
            puraName: p.name,
            puraId: p.id,
            location: shortLoc,
            fullAddress: fullLoc,
            puraType: p.type || 'Kahyangan Jagat',
            penanggalan: penanggalanText,
            cycleInfo: cycleText,
            timeString: null,
            mapUrl: p.location_url || null,
            phone: p.phone || null,
            rawPura: p,
          });
          counter++;
        }

        groups.push({
          dateStr: day.tanggal,
          formattedDate: formatIndoDate(day.tanggal),
          dayName: getIndoDayName(day.tanggal),
          wewaran: `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim() || day.sasih?.nama_sasih || 'Piodalan Pura',
          sasih: day.sasih?.nama_sasih,
          hariRaya: day.hari_raya?.[0]?.nama,
          totalPura: dayPuras.length,
          puras: dayPuras,
        });
      }
    }

    // SKENARIO 3: TAB NAMA PURA
    else if (filter.tab === 'pura') {
      const q = (filter.namaPura || '').trim().toLowerCase();
      if (!q) return { dayGroups: [], scheduleList: [] };

      const targetPuras = puras.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          q.includes(p.name.toLowerCase()) ||
          (p.city && p.city.toLowerCase().includes(q)) ||
          (p.address && p.address.toLowerCase().includes(q))
      );

      if (targetPuras.length === 0) return { dayGroups: [], scheduleList: [] };

      for (const day of kalenderData) {
        const celebratingPuras = matchPurasForDay(day, targetPuras);
        if (celebratingPuras.length === 0) continue;

        const dayPuras: PiodalanDayPuraItem[] = [];
        for (const p of celebratingPuras) {
          const locCity = p.city || p.address || 'Bali';
          const locProvince = p.province || 'Indonesia';
          const shortLoc = p.address ? `${p.address}, ${locCity}` : locCity;
          const fullLoc = p.address ? `${p.address}, ${locCity}, ${locProvince}` : `${locCity}, ${locProvince}`;
          const penanggalanText = (p.benchmark || '').toLowerCase().includes('sasih') || p.sasih
            ? `${p.sasih || day.sasih?.nama_sasih || ''} ${p.purnama_tilem || day.pengalantaka?.purnama_tilem || ''}`.trim()
            : `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim();

          const cycleText = (p.benchmark || '').toLowerCase().includes('sasih') || p.sasih
            ? 'Penanggalan Sasih'
            : 'Pawukon 210 hari';

          dayPuras.push({
            id: p.id,
            name: p.name,
            type: p.type || 'Kahyangan Jagat',
            address: p.address || '',
            city: locCity,
            province: locProvince,
            phone: p.phone || null,
            location_url: p.location_url || null,
            latitude: null,
            longitude: null,
            benchmark: p.benchmark || (p.sasih ? 'Sasih' : 'Pawukon'),
            wuku: p.wuku,
            saptawara: p.saptawara,
            pancawara: p.pancawara,
            sasih: p.sasih,
            purnama_tilem: p.purnama_tilem,
            pelaksanaan_aktual: null,
            rawPura: p,
          });

          flatItems.push({
            id: `${day.tanggal}-${p.id}`,
            dateStr: day.tanggal,
            formattedDate: formatIndoDate(day.tanggal),
            dayName: getIndoDayName(day.tanggal),
            dateBadge: createDateBadge(day.tanggal, counter),
            puraName: p.name,
            puraId: p.id,
            location: shortLoc,
            fullAddress: fullLoc,
            puraType: p.type || 'Kahyangan Jagat',
            penanggalan: penanggalanText,
            cycleInfo: cycleText,
            timeString: null,
            mapUrl: p.location_url || null,
            phone: p.phone || null,
            rawPura: p,
          });
          counter++;
        }

        groups.push({
          dateStr: day.tanggal,
          formattedDate: formatIndoDate(day.tanggal),
          dayName: getIndoDayName(day.tanggal),
          wewaran: `${day.wewaran?.saptawara?.nama || ''} ${day.wewaran?.pancawara?.nama || ''} ${day.wewaran?.wuku?.nama || ''}`.trim() || day.sasih?.nama_sasih || 'Piodalan Pura',
          sasih: day.sasih?.nama_sasih,
          hariRaya: day.hari_raya?.[0]?.nama,
          totalPura: dayPuras.length,
          puras: dayPuras,
        });
      }
    }

    return { dayGroups: groups, scheduleList: flatItems };
  }, [searchResult, purasMap, enabled, filter, kalenderData, puras]);

  return {
    dayGroups,
    scheduleList,
    totalDays: dayGroups.length,
    totalCount: scheduleList.length,
    isLoading: isPurasLoading || isKalenderLoading || (Boolean(searchParams) && isSearchLoading && dayGroups.length === 0),
    isError: isSearchError && dayGroups.length === 0,
    error: searchError,
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
 * Mengutamakan pemilihan siklus piodalan yang cocok dengan tanggal (dateStr) jika disediakan,
 * atau memilih siklus piodalan terbaru sebagai fallback cerdas.
 * Mengembalikan susunan acara jika sudah diinput kontributor,
 * atau array kosong [] jika data belum diinput.
 */
export function usePuraCeremonies(puraId?: number | null, dateStr?: string) {
  return useQuery<{
    records: PuraPiodalanRecord[];
    acaras: PiodalanAcaraItem[];
    hasContributedData: boolean;
  }>({
    queryKey: ['piodalan', 'pura', 'ceremonies', puraId, dateStr],
    queryFn: async () => {
      if (!puraId) {
        return { records: [], acaras: [], hasContributedData: false };
      }

      // 1. Ambil seluruh catatan riwayat piodalan pura
      const records = await fetchPuraPiodalans(puraId);
      if (!records || records.length === 0) {
        return { records: [], acaras: [], hasContributedData: false };
      }

      // 2. Tentukan siklus piodalan yang dievaluasi:
      // Cocokkan dengan tanggal jadwal piodalan spesifik jika ada, atau gunakan yang terbaru
      let targetPiodalan = records[0];
      if (dateStr) {
        const cleanDate = dateStr.slice(0, 10);
        const matched = records.find(
          (r) => r.ceremony_date && r.ceremony_date.startsWith(cleanDate)
        );
        if (matched) {
          targetPiodalan = matched;
        }
      }

      // 3. Ambil susunan tahapan acara untuk siklus piodalan terpilih
      const acaras = await fetchPiodalanAcaras(targetPiodalan.id);

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
