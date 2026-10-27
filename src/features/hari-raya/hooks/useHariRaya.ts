import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchKalenderTahun } from '@/features/kalender/api/kalenderApi';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import {
  fetchMasterHariRaya,
  searchHariRayaSpesifik,
} from '../api/hariRayaApi';
import type {
  HariRayaCardItem,
  HariRayaMasterItem,
  HariRayaSearchResponse,
} from '../types/hariRaya.types';
import {
  computeHeroMetrics,
  extractHariRayaCards,
  findUpcomingHariRaya,
} from '../utils/hariRayaUtils';

/**
 * ============================================================================
 * CUSTOM HOOKS: HARI RAYA BALI (TanStack Query Orchestrator)
 * ============================================================================
 * Berkas ini menyediakan custom hooks yang mengorkestrasi pengambilan data,
 * caching memori Lapis 3, dan pengolahan data riil Hari Raya Bali.
 *
 * Menerapkan Prinsip Efisiensi fe_strategy.md:
 *  1. Zero-Duplication Cache: Memanfaatkan cache ['kalender', year] yang sudah
 *     berisi seluruh 365 hari lengkap dengan wewaran, sasih, dan hari raya.
 *  2. In-Memory O(1) Master Lookup: Menyimpan katalog 106 hari raya dalam Map
 *     sehingga pencarian deskripsi saat membuka modal berlangsung dalam 0ms.
 *  3. Silent Prefetching: Menarik data tahun berikutnya di latar belakang
 *     saat user berada di bulan November atau Desember.
 * ============================================================================
 */

/**
 * BLOK 1: Hook Master Katalog Hari Raya (106 Entitas)
 * ----------------------------------------------------------------------------
 * Menarik seluruh data master hari raya dari `GET /api/v1/hari-raya/master`.
 * Data ini bersifat statis dan permanen, sehingga dicache dengan `staleTime: Infinity`.
 *
 * Mengembalikan:
 *  - masterList: Array 106 HariRayaMasterItem
 *  - masterMap : Map<string, HariRayaMasterItem> untuk pencarian O(1) instan
 *                berdasarkan ID maupun nama lowercase.
 */
export function useMasterHariRaya() {
  const {
    data: masterList = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['hari-raya', 'master'],
    queryFn: fetchMasterHariRaya,
    staleTime: Infinity, // Data referensi permanen tidak akan pernah basi
    gcTime: 1000 * 60 * 60 * 24, // 24 jam tersimpan di RAM browser
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Susun Map in-memory untuk pencarian O(1)
  const masterMap = useMemo(() => {
    const map = new Map<string, HariRayaMasterItem>();
    for (const item of masterList) {
      if (item.id) {
        map.set(item.id, item);
      }
      if (item.nama) {
        map.set(item.nama.toLowerCase().trim(), item);
      }
    }
    return map;
  }, [masterList]);

  return {
    masterList,
    masterMap,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * BLOK 2: Hook Utama Jadwal Hari Raya Tahunan & Bulanan
 * ----------------------------------------------------------------------------
 * Hook ini mengorkestrasi seluruh data hari raya untuk tahun dan bulan terpilih.
 *
 * Menggunakan query key `['kalender', year]` yang berbagi cache dengan halaman
 * Kalender utama. Ini memastikan:
 *  - Jika user sudah membuka halaman Kalender, halaman Hari Raya langsung terbuka
 *    seketika dalam 0ms tanpa ada request jaringan tambahan (*Zero-Loading*).
 *  - Seluruh data wuku dan sasih otomatis tersedia tanpa perlu endpoint terpisah.
 *
 * @param year Tahun yang dievaluasi (contoh: 2026)
 * @param activeMonth Bulan aktif (1 s.d. 12, default: 9 / September)
 */
export function useHariRayaData(year: number, activeMonth: number = 9) {
  const queryClient = useQueryClient();
  const todayDate = useMemo(() => getTodayWITA(), []);

  // 1. Ambil data master 106 hari raya untuk melengkapi deskripsi
  const { masterList, masterMap, isLoading: isLoadingMaster } = useMasterHariRaya();

  // 2. Tarik data kalender 1 tahun utuh (1-Year Chunking)
  const {
    data: rawCalendarDays = [],
    isLoading: isLoadingCalendar,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['kalender', year],
    queryFn: () => fetchKalenderTahun(year),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // 3. Silent Background Prefetching Tahun Berikutnya (fe_strategy.md Bab 4)
  useEffect(() => {
    if (activeMonth >= 11 && year < 2200) {
      const nextYear = year + 1;
      queryClient.prefetchQuery({
        queryKey: ['kalender', nextYear],
        queryFn: () => fetchKalenderTahun(nextYear),
        staleTime: Infinity,
      });
    }
  }, [year, activeMonth, queryClient]);

  // 4. Ekstrak seluruh kartu hari raya sepanjang tahun (Semua 12 Bulan)
  const allCards = useMemo(() => {
    return extractHariRayaCards(rawCalendarDays, masterMap);
  }, [rawCalendarDays, masterMap]);

  // 5. Filter kartu hari raya khusus untuk bulan aktif (Mode Tampilan Bulanan)
  const monthCards = useMemo(() => {
    const monthPrefix = `${year}-${String(activeMonth).padStart(2, '0')}-`;
    return allCards.filter((card) => card.tanggal.startsWith(monthPrefix));
  }, [allCards, year, activeMonth]);

  // 6. Hitung hari raya terdekat dari hari ini (todayWITA)
  const upcomingInfo = useMemo(() => {
    return findUpcomingHariRaya(allCards, todayDate);
  }, [allCards, todayDate]);

  // 7. Hitung 3 metrik statistik untuk banner Hero atas
  const heroMetrics = useMemo(() => {
    return computeHeroMetrics(
      monthCards,
      upcomingInfo,
      todayDate,
      year,
      activeMonth
    );
  }, [monthCards, upcomingInfo, todayDate, year, activeMonth]);

  // 8. Pengelompokan kartu per bulan untuk Mode Tampilan Tahunan
  const yearGroupedByMonth = useMemo(() => {
    const grouped = new Map<number, HariRayaCardItem[]>();
    for (let m = 1; m <= 12; m++) {
      grouped.set(m, []);
    }

    for (const card of allCards) {
      const m = parseInt(card.tanggal.split('-')[1], 10);
      const list = grouped.get(m) || [];
      list.push(card);
      grouped.set(m, list);
    }

    return grouped;
  }, [allCards]);

  const isLoading = isLoadingCalendar || isLoadingMaster;

  return {
    rawCalendarDays,
    allCards,
    monthCards,
    upcomingInfo,
    heroMetrics,
    yearGroupedByMonth,
    masterList,
    masterMap,
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    refetch,
  };
}

/**
 * BLOK 3: Hook Pencarian Hari Raya Spesifik Berdasarkan Nama
 * ----------------------------------------------------------------------------
 * Digunakan jika pengguna secara eksplisit mencari tanggal jatuh suatu hari raya
 * tertentu melalui endpoint `GET /api/v1/search/hari-raya`.
 *
 * @param nama Nama perayaan yang dicari (contoh: "Galungan", "Saraswati")
 * @param year Tahun target Masehi (contoh: 2026)
 * @param month Bulan Masehi opsional
 * @param enabled Apakah query diaktifkan secara otomatis
 */
export function useSearchHariRaya(
  nama: string,
  year: number,
  month?: number,
  enabled: boolean = false
) {
  return useQuery<HariRayaSearchResponse, Error>({
    queryKey: ['hari-raya', 'search', nama, year, month],
    queryFn: () => searchHariRayaSpesifik(nama, year, month),
    enabled: enabled && Boolean(nama.trim()),
    staleTime: 1000 * 60 * 30, // Fresh selama 30 menit
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
