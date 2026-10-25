import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchKalenderTahun } from '../api/kalenderApi';
import type { KalenderHarian } from '../types/kalender.types';

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
