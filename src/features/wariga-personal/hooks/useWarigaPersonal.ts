import { useState, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  searchWarigaPersonal,
  fetchDewasaKelahiran,
} from '../api/warigaPersonalApi';
import type {
  WarigaPersonalRequest,
  WarigaPersonalResponse,
  WarigaFilterType,
  PadewasanItem,
} from '../types/warigaPersonal.types';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * CUSTOM HOOK: useWarigaPersonal
 * ============================================================================
 * Hook orkestrator terpusat untuk mengelola fitur Wariga Personal:
 *  1. Server State via TanStack Query (staleTime 30 menit, RAM cache 24 jam).
 *  2. URL-as-State Synchronization (tgl_lahir, sebelum_jam_6, bulan, tahun).
 *  3. Client-Side Instant Filtering (Semua, Guru, Ratu, Lara, Pati, Baik, Buruk).
 *  4. Navigasi Bulan Reaktif (< Prev, Next >, Reset Today).
 *  5. State Pengendali Dialog Modal (Wariga Tanggal Lahir, Dewasa Tanggal Lahir, Detail Tanggal).
 * ============================================================================
 */
export function useWarigaPersonal() {
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------------
  // BLOK 1: RESOLUSI PARAMETER AWAL DARI URL & DEFAULT HARI INI (WITA)
  // -------------------------------------------------------------------------
  const todayWITA = getTodayWITA(); // "YYYY-MM-DD" dalam zona waktu Asia/Makassar
  const [currentYearStr, currentMonthStr] = todayWITA.split('-');
  const defaultYear = parseInt(currentYearStr, 10);
  const defaultMonth = parseInt(currentMonthStr, 10);

  // Baca parameter aktif dari URL query string (URL-as-State pattern)
  const queryTglLahir = searchParams.get('tgl_lahir') || '';
  const querySebelumJam6 = searchParams.get('sebelum_jam_6') === 'true';
  const queryBulan = parseInt(searchParams.get('bulan') || '', 10) || defaultMonth;
  const queryTahun = parseInt(searchParams.get('tahun') || '', 10) || defaultYear;

  // -------------------------------------------------------------------------
  // BLOK 2: LOCAL STATE UNTUK FILTER, SELEKSI TANGGAL, & MODAL POP-UP
  // -------------------------------------------------------------------------
  // Filter status wariga lokal (Client-Side filtering 0ms latency)
  const [filterType, setFilterType] = useState<WarigaFilterType>('all');

  // Tanggal yang sedang diklik pada matriks kalender
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Status buka/tutup modal dialog
  const [isWarigaModalOpen, setIsWarigaModalOpen] = useState(false);
  const [isDewasaModalOpen, setIsDewasaModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // BLOK 3: QUERY UTAMA WARIGA PERSONAL (TANSTACK QUERY)
  // -------------------------------------------------------------------------
  // Query hanya dieksekusi jika parameter tanggal_lahir valid dan berformat YYYY-MM-DD
  const isBirthDateValid = Boolean(
    queryTglLahir && /^\d{4}-\d{2}-\d{2}$/.test(queryTglLahir)
  );

  const queryPayload: WarigaPersonalRequest = useMemo(
    () => ({
      tanggal_lahir: queryTglLahir,
      sebelum_jam_6: querySebelumJam6,
      bulan_target: queryBulan,
      tahun_target: queryTahun,
    }),
    [queryTglLahir, querySebelumJam6, queryBulan, queryTahun]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<WarigaPersonalResponse, Error>({
    queryKey: [
      'wariga-personal',
      queryTglLahir,
      querySebelumJam6,
      queryBulan,
      queryTahun,
    ],
    queryFn: () => searchWarigaPersonal(queryPayload),
    enabled: isBirthDateValid,
    staleTime: 1000 * 60 * 30, // Data fresh selama 30 menit
    gcTime: 1000 * 60 * 60 * 24, // Bertahan 24 jam di RAM memori browser
  });

  // -------------------------------------------------------------------------
  // BLOK 4: QUERY PADEWASAN TANGGAL LAHIR (UNTUK MODAL DEWASA KELAHIRAN)
  // -------------------------------------------------------------------------
  // Mengambil daftar ala ayuning dewasa aktif pada tanggal kelahiran
  const {
    data: dewasaKelahiran = [],
    isLoading: isDewasaLoading,
  } = useQuery<PadewasanItem[], Error>({
    queryKey: ['dewasa-kelahiran', queryTglLahir],
    queryFn: () => fetchDewasaKelahiran(queryTglLahir),
    enabled: isDewasaModalOpen && Boolean(queryTglLahir),
    staleTime: 1000 * 60 * 60 * 24, // Data permanen di-cache 24 jam
  });

  // -------------------------------------------------------------------------
  // BLOK 5: CLIENT-SIDE FILTERING HASIL HARIAN (ZERO LATENCY)
  // -------------------------------------------------------------------------
  // Menyaring daftar hasil tanggal berdasarkan filter yang dipilih pengguna
  const filteredHasil = useMemo(() => {
    const items = data?.hasil || [];
    if (filterType === 'all') return items;

    return items.filter((item) => {
      if (filterType === 'baik') return item.status_hari === 'baik';
      if (filterType === 'buruk') return item.status_hari === 'buruk';
      return item.wariga === filterType;
    });
  }, [data?.hasil, filterType]);

  // Butir evaluasi untuk tanggal yang sedang dipilih
  const selectedItem = useMemo(() => {
    if (!selectedDate || !data?.hasil) return null;
    return data.hasil.find((item) => item.tanggal === selectedDate) || null;
  }, [selectedDate, data?.hasil]);

  // -------------------------------------------------------------------------
  // BLOK 6: SINKRONISASI AKSI PENGGUNA KE URL QUERY PARAMS
  // -------------------------------------------------------------------------
  /**
   * Mengirimkan pencarian baru dari form input ke URL
   */
  const handleSubmitSearch = useCallback(
    (
      birthDate: string,
      sebelumJam6: boolean,
      bulanTarget: number,
      tahunTarget: number
    ) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tgl_lahir', birthDate);
      nextParams.set('sebelum_jam_6', String(sebelumJam6));
      nextParams.set('bulan', String(bulanTarget));
      nextParams.set('tahun', String(tahunTarget));
      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * Navigasi ke bulan sebelumnya
   */
  const handlePrevMonth = useCallback(() => {
    let nextMonth = queryBulan - 1;
    let nextYear = queryTahun;

    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('bulan', String(nextMonth));
    nextParams.set('tahun', String(nextYear));
    setSearchParams(nextParams);
  }, [queryBulan, queryTahun, searchParams, setSearchParams]);

  /**
   * Navigasi ke bulan berikutnya
   */
  const handleNextMonth = useCallback(() => {
    let nextMonth = queryBulan + 1;
    let nextYear = queryTahun;

    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('bulan', String(nextMonth));
    nextParams.set('tahun', String(nextYear));
    setSearchParams(nextParams);
  }, [queryBulan, queryTahun, searchParams, setSearchParams]);

  /**
   * Reset navigasi ke bulan dan tahun hari ini
   */
  const handleResetToday = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('bulan', String(defaultMonth));
    nextParams.set('tahun', String(defaultYear));
    setSearchParams(nextParams);
  }, [defaultMonth, defaultYear, searchParams, setSearchParams]);

  // -------------------------------------------------------------------------
  // BLOK 7: HANDLER SELEKSI TANGGAL & MODAL DIALOG
  // -------------------------------------------------------------------------
  const handleSelectDate = useCallback((dateString: string) => {
    setSelectedDate(dateString);
  }, []);

  const handleCloseDetailModal = useCallback(() => {
    setSelectedDate(null);
  }, []);

  const openWarigaModal = useCallback(() => setIsWarigaModalOpen(true), []);
  const closeWarigaModal = useCallback(() => setIsWarigaModalOpen(false), []);

  const openDewasaModal = useCallback(() => setIsDewasaModalOpen(true), []);
  const closeDewasaModal = useCallback(() => setIsDewasaModalOpen(false), []);

  // -------------------------------------------------------------------------
  // BLOK 8: RETURN API SURFACE LENGKAP & BERSIH
  // -------------------------------------------------------------------------
  return {
    // Parameter URL aktif
    queryTglLahir,
    querySebelumJam6,
    queryBulan,
    queryTahun,
    isBirthDateValid,

    // Data hasil query server
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,

    // Filter status wariga & hasil terfilter
    filterType,
    setFilterType,
    filteredHasil,

    // Seleksi sel tanggal kalender
    selectedDate,
    selectedItem,
    handleSelectDate,
    handleCloseDetailModal,

    // Navigasi kalender
    handlePrevMonth,
    handleNextMonth,
    handleResetToday,
    handleSubmitSearch,

    // Modal Wariga Kelahiran
    isWarigaModalOpen,
    openWarigaModal,
    closeWarigaModal,

    // Modal Dewasa Kelahiran
    isDewasaModalOpen,
    openDewasaModal,
    closeDewasaModal,
    dewasaKelahiran,
    isDewasaLoading,
  };
}

