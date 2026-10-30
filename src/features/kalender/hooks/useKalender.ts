import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchKalenderTahun } from '../api/kalenderApi';
import type { KalenderHarian, PiodalanItem, PiodalanTerdekatItem } from '../types/kalender.types';
import { searchPiodalan } from '@/features/piodalan/api/piodalanApi';
import { useAllPuras } from '@/features/piodalan/hooks/usePiodalan';
import { matchPurasForDay, extractMonthPiodalanSummary } from '../utils/calendarUtils';

/**
 * ============================================================================
 * CUSTOM HOOK: useKalenderTahun (TanStack Query Orchestrator)
 * ============================================================================
 * Hook ini bertindak sebagai otak penyedia data Kalender Bali di frontend.
 *
 * Prinsip Arsitektur Utama (Sesuai fe_strategy.md):
 *  1. 1-Year Chunking: Tarik 1 tahun penuh sekaligus (GET /api/v1/kalender?year=YYYY).
 *  2. Zero-Loading Navigation: Konfigurasi `staleTime: Infinity` menjamin navigasi
 *     antar bulan (Januari s.d. Desember) berjalan seketika dalam 0 milidetik
 *     tanpa HTTP request berulang ke server.
 *  3. In-Memory O(1) Lookup: Mengonversi array 365 hari ke Map<string, KalenderHarian>
 *     agar pencarian data tanggal mana pun selesai dalam waktu O(1) tanpa looping array.
 *  4. Silent Prefetching: Mengunduh data tahun berikutnya secara tersembunyi
 *     di background saat user berada di bulan November atau Desember, sehingga
 *     ketika user menekan tombol pindah tahun ke tahun depan, datanya sudah siap di RAM.
 * ============================================================================
 */

export function useKalenderTahun(year: number, activeMonth?: number) {
  const queryClient = useQueryClient();

  // -------------------------------------------------------------------------
  // 1. Eksekusi Query 1 Tahun Penuh dengan TanStack Query
  // -------------------------------------------------------------------------
  const {
    data: rawData = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['kalender', year],
    queryFn: () => fetchKalenderTahun(year),
    // Data penanggalan matematis bersifat pasti dan permanen untuk tahun tersebut
    staleTime: Infinity,
    // Pertahankan di memori RAM browser selama 24 jam
    gcTime: 1000 * 60 * 60 * 24,
    // Jangan fetch ulang saat pengguna bolak-balik tab browser
    refetchOnWindowFocus: false,
    // Coba ulang 1x jika ada kegagalan jaringan
    retry: 1,
  });

  // -------------------------------------------------------------------------
  // 2. In-Memory Map untuk Pencarian Instan O(1) berdasarkan "YYYY-MM-DD"
  // -------------------------------------------------------------------------
  const daysMap = useMemo(() => {
    const map = new Map<string, KalenderHarian>();
    for (let i = 0; i < rawData.length; i++) {
      const day = rawData[i];
      if (day?.tanggal) {
        map.set(day.tanggal, day);
      }
    }
    return map;
  }, [rawData]);

  // -------------------------------------------------------------------------
  // 3. Silent Background Prefetching (fe_strategy.md Bab 4)
  // -------------------------------------------------------------------------
  useEffect(() => {
    // Hanya lakukan prefetch tahun berikutnya (year + 1) jika user sudah berada
    // di pengujung tahun (November atau Desember) untuk menyambut pergantian tahun.
    if (activeMonth && activeMonth >= 11 && year < 2200) {
      const nextYear = year + 1;
      queryClient.prefetchQuery({
        queryKey: ['kalender', nextYear],
        queryFn: () => fetchKalenderTahun(nextYear),
        staleTime: Infinity,
      });
    }
  }, [year, activeMonth, queryClient]);

  // -------------------------------------------------------------------------
  // 4. Helper Penyarik Data (Derived Helpers Tanpa Duplikasi State)
  // -------------------------------------------------------------------------

  /**
   * Mengambil data satu hari tertentu dalam O(1).
   */
  const getDayData = (dateString: string): KalenderHarian | undefined => {
    return daysMap.get(dateString);
  };

  /**
   * Mengambil seluruh hari di bulan tertentu (1 - 12).
   */
  const getMonthDays = (month: number): KalenderHarian[] => {
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}-`;
    return rawData.filter((item) => item.tanggal.startsWith(monthPrefix));
  };

  /**
   * Mengambil seluruh hari raya/rahinan yang jatuh pada bulan tertentu (1 - 12).
   */
  const getMonthHolidays = (month: number): KalenderHarian[] => {
    const monthDays = getMonthDays(month);
    return monthDays.filter((item) => item.hari_raya && item.hari_raya.length > 0);
  };

  return {
    kalenderData: rawData,
    daysMap,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
    // Helper fungsi langsung
    getDayData,
    getMonthDays,
    getMonthHolidays,
  };
}

// ============================================================================
// 5. HOOK INTEGRASI MESIN PIODALAN RESILIEN (HYBRID BE & RAM CACHE)
// ============================================================================

/**
 * useDayPiodalan mengambil daftar pura yang melangsungkan piodalan pada tanggal tertentu.
 * Menggunakan pendekatan Hybrid Resilient:
 *  1. Instan O(1): Menghitung kecocokan 461 master pura dari cache RAM TanStack Query jika dayData tersedia.
 *  2. Sinkronisasi Backend: Memanggil GET /api/v1/search/piodalan (mode 'rentang' 1 hari) secara asinkron.
 *  3. Zero Empty Flash: Komponen langsung menerima data riil tanpa menunggu roundtrip jaringan.
 *
 * @param dateStr Tanggal target format YYYY-MM-DD
 * @param dayData Objek KalenderHarian tanggal terpilih (opsional, dari daysMap)
 */
export function useDayPiodalan(dateStr?: string, dayData?: KalenderHarian) {
  // Konsumsi master 461 pura resmi dari backend Go (tersimpan 24 jam di cache memori)
  const { data: purasList = [] } = useAllPuras();

  // Hitung kecocokan pura secara instan di memori browser berdasarkan wewaran & sasih tanggal tersebut
  const inMemoryResult = useMemo(() => {
    if (!dayData || purasList.length === 0) return null;
    const matched = matchPurasForDay(dayData, purasList);
    const items: PiodalanItem[] = matched.map((p, idx) => ({
      id: `pio-${p.id}`,
      puraName: p.name,
      location: p.city || p.address || 'Bali',
      distance: p.type || 'Kahyangan Jagat',
      accentColor: (idx % 2 === 0 ? 'teal' : 'amber') as 'teal' | 'amber',
    }));
    return {
      items,
      totalCount: items.length,
    };
  }, [dayData, purasList]);

  return useQuery<{
    items: PiodalanItem[];
    totalCount: number;
  }>({
    queryKey: ['kalender', 'piodalan', 'day', dateStr],
    queryFn: async () => {
      if (!dateStr) return { items: [], totalCount: 0 };

      try {
        const res = await searchPiodalan({
          mode: 'rentang',
          start_date: dateStr,
          end_date: dateStr,
        });

        if (res && Array.isArray(res.schedules) && res.schedules.length > 0) {
          const daySched = res.schedules[0];
          const puras = Array.isArray(daySched.puras) ? daySched.puras : [];
          if (puras.length > 0) {
            const items: PiodalanItem[] = puras.map((p, idx) => ({
              id: `pio-${p.id || idx}`,
              puraName: p.nama,
              location: p.kabupaten || p.alamat || 'Bali',
              distance: p.tipe || 'Kahyangan Jagat',
              accentColor: idx % 2 === 0 ? 'teal' : 'amber',
            }));
            return { items, totalCount: items.length };
          }
        }
      } catch (err) {
        console.warn('Backend piodalan rentang gagal, menggunakan kalkulasi memori:', err);
      }

      // Jika backend gagal atau kosong, fallback ke hasil pencocokan memori data riil
      if (inMemoryResult) {
        return inMemoryResult;
      }

      return { items: [], totalCount: 0 };
    },
    enabled: Boolean(dateStr),
    initialData: inMemoryResult || undefined,
    staleTime: 1000 * 60 * 15, // Fresh 15 menit di memori RAM
    refetchOnWindowFocus: false,
  });
}

/**
 * useMonthlyPiodalan mengambil ringkasan agenda piodalan seluruh pura dalam satu bulan kalender.
 * Menggunakan pendekatan Hybrid Resilient:
 *  1. Instan O(1): Menghitung total piodalan dan 3 agenda terdekat dari seluruh hari bulan aktif
 *     berdasarkan master 461 pura di RAM. Menghilangkan masalah timeout / latensi loop SQL harian.
 *  2. Lookahead Antar-Bulan: Jika sisa piodalan bulan aktif kurang dari 3, secara cerdas mengambil
 *     agenda dari bulan mendatang (selama dateStr >= todayISO), tanpa menampilkan tanggal masa lalu.
 *  3. Navigasi Presisi: Setiap item dilengkapi `dateStr` sehingga pengguna dapat mengklik
 *     kartu piodalan terdekat untuk langsung memfokuskan kalender ke tanggal tersebut.
 *
 * @param year Tahun Masehi target
 * @param month Nomor bulan Masehi (1 s.d. 12)
 * @param monthDays Daftar hari dalam bulan aktif (opsional, dari getMonthDays)
 * @param todayISO Tanggal hari ini format YYYY-MM-DD WITA (opsional)
 * @param allYearDays Seluruh hari dalam tahun aktif untuk lookahead ke bulan depan (opsional)
 */
export function useMonthlyPiodalan(
  year: number,
  month: number,
  monthDays?: KalenderHarian[],
  todayISO?: string,
  allYearDays?: KalenderHarian[]
) {
  // Konsumsi master 461 pura resmi dari backend Go (tersimpan 24 jam di cache memori)
  const { data: purasList = [] } = useAllPuras();

  // Hitung ringkasan piodalan bulanan secara instan di memori browser (0ms)
  const inMemorySummary = useMemo(() => {
    if (!monthDays || monthDays.length === 0 || purasList.length === 0) return null;
    return extractMonthPiodalanSummary(monthDays, purasList, todayISO, allYearDays);
  }, [monthDays, purasList, todayISO, allYearDays]);

  const queryResult = useQuery<{
    totalPuras: number;
    upcomingItems: PiodalanTerdekatItem[];
  }>({
    queryKey: [
      'kalender',
      'piodalan',
      'month',
      year,
      month,
      todayISO,
      purasList.length,
      allYearDays ? allYearDays.length : 0,
    ],
    queryFn: async () => {
      // 1. Jika kalkulasi in-memory sudah tersedia dan memiliki hasil, prioritaskan langsung
      if (inMemorySummary && (inMemorySummary.totalPuras > 0 || inMemorySummary.upcomingItems.length > 0)) {
        return inMemorySummary;
      }

      try {
        const res = await searchPiodalan({
          mode: 'bulan',
          bulan: month,
          tahun: year,
        });

        if (res && Array.isArray(res.schedules) && res.schedules.length > 0) {
          let totalPuras = 0;
          for (let i = 0; i < res.schedules.length; i++) {
            totalPuras += res.schedules[i].puras ? res.schedules[i].puras.length : 0;
          }

          if (inMemorySummary) {
            return {
              totalPuras: totalPuras || inMemorySummary.totalPuras,
              upcomingItems: inMemorySummary.upcomingItems,
            };
          }
        }
      } catch (err) {
        console.warn('Backend piodalan bulan gagal, fallback ke inMemorySummary:', err);
      }

      // 2. Selalu fallback ke hasil memori
      if (inMemorySummary) {
        return inMemorySummary;
      }

      return { totalPuras: 0, upcomingItems: [] };
    },
    enabled: Boolean(year && month),
    initialData: inMemorySummary || undefined,
    staleTime: 1000 * 60 * 10, // Fresh 10 menit di memori RAM
    refetchOnWindowFocus: false,
  });

  // Pastikan data yang dikembalikan tidak pernah kosong jika inMemorySummary memiliki isi
  const data =
    queryResult.data && (queryResult.data.totalPuras > 0 || queryResult.data.upcomingItems.length > 0)
      ? queryResult.data
      : inMemorySummary || queryResult.data || { totalPuras: 0, upcomingItems: [] };

  return {
    ...queryResult,
    data,
  };
}
