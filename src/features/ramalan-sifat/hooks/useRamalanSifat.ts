import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { searchRamalanSifat } from '../api/ramalanSifatApi';
import type {
  RamalanSifatData,
  RamalanSifatRequest,
  RamalanSifatSearchParams,
} from '../types/ramalanSifat.types';

/**
 * ============================================================================
 * CUSTOM HOOK: useRamalanSifat
 * ============================================================================
 * Hook orkestrator terpusat untuk fitur Ramalan Sifat Penanggalan Bali:
 *  1. Server State Management: Menggunakan TanStack Query dengan konfigurasi Lapis 3
 *     RAM Cache (staleTime 30 menit, gcTime 24 jam) sesuai panduan fe_strategy.md.
 *  2. URL-as-State Synchronization: Menyinkronkan status pencarian ke query parameter
 *     URL (?birth_date=YYYY-MM-DD&time=before_06) sehingga tautan dapat dibagikan,
 *     tahan refresh browser (F5), dan mendukung navigasi Back/Forward.
 *  3. Validasi Presisi: Memastikan hanya tanggal lahir berformat ISO valid (YYYY-MM-DD)
 *     yang memicu pemanggilan jaringan ke server Go.
 *  4. Zero Duplicate Fetch: Mencegah refetch berlebih saat navigasi bolak-balik.
 * ============================================================================
 */

export function useRamalanSifat() {
  const [searchParams, setSearchParams] = useSearchParams();

  // -------------------------------------------------------------------------
  // BLOK 1: RESOLUSI PARAMETER DARI URL (URL-AS-STATE PATTERN)
  // -------------------------------------------------------------------------
  // Membaca parameter tanggal lahir dan preferensi waktu lahir dari query string URL
  const queryBirthDate = searchParams.get('birth_date') || '';
  const queryTimeParam = searchParams.get('time') || 'after_06';
  const querySebelumJam6 = queryTimeParam === 'before_06';

  // Validasi format tanggal ISO (YYYY-MM-DD) sebelum memicu query API
  const isBirthDateValid = useMemo(() => {
    return Boolean(queryBirthDate && /^\d{4}-\d{2}-\d{2}$/.test(queryBirthDate));
  }, [queryBirthDate]);

  // Objek parameter aktif yang digunakan oleh komponen antarmuka
  const activeParams: RamalanSifatSearchParams | null = useMemo(() => {
    if (!isBirthDateValid) return null;
    return {
      tanggal_lahir: queryBirthDate,
      sebelum_jam_6: querySebelumJam6,
    };
  }, [isBirthDateValid, queryBirthDate, querySebelumJam6]);

  // -------------------------------------------------------------------------
  // BLOK 2: EKSEKUSI QUERY DENGAN TANSTACK QUERY (LAPIS 3 RAM CACHE)
  // -------------------------------------------------------------------------
  // Payload request yang dikirimkan ke backend Go (POST /api/v1/search/ramalan-sifat)
  const queryPayload: RamalanSifatRequest = useMemo(
    () => ({
      tanggal_lahir: queryBirthDate,
      sebelum_jam_6: querySebelumJam6,
    }),
    [queryBirthDate, querySebelumJam6]
  );

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<RamalanSifatData, Error>({
    queryKey: ['ramalan-sifat', queryBirthDate, querySebelumJam6],
    queryFn: async () => {
      return await searchRamalanSifat(queryPayload);
    },
    // Query hanya dieksekusi jika parameter tanggal lahir telah diisi secara valid
    enabled: isBirthDateValid,

    // Konfigurasi cache resmi fe_strategy.md:
    // 1. Data segar selama 30 menit (navigasi instan 0ms tanpa loading ulang)
    staleTime: 1000 * 60 * 30,

    // 2. Data dipertahankan di RAM memori browser selama 24 jam
    gcTime: 1000 * 60 * 60 * 24,

    // 3. Matikan auto-refetch saat pengguna berpindah tab peramban
    refetchOnWindowFocus: false,

    // 4. Coba ulang 1 kali jika terjadi kegagalan jaringan sementara
    retry: 1,
  });

  // -------------------------------------------------------------------------
  // BLOK 3: FUNGSI AKSI NAVIGASI PENCARIAN (SET PARAMETER URL)
  // -------------------------------------------------------------------------
  /**
   * executeSearch memperbarui URL query params untuk memicu pencarian ramalan sifat.
   *
   * @param birthDate Tanggal lahir berformat "YYYY-MM-DD"
   * @param sebelumJam6 Opsi apakah lahir sebelum jam 06.00 WITA
   */
  const executeSearch = useCallback(
    (birthDate: string, sebelumJam6: boolean) => {
      const nextParams = new URLSearchParams(searchParams);

      if (birthDate) {
        nextParams.set('birth_date', birthDate);
      } else {
        nextParams.delete('birth_date');
      }

      if (sebelumJam6) {
        nextParams.set('time', 'before_06');
      } else {
        nextParams.set('time', 'after_06');
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  /**
   * resetSearch membersihkan parameter pencarian aktif dari URL.
   */
  const resetSearch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('birth_date');
    nextParams.delete('time');
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // -------------------------------------------------------------------------
  // BLOK 4: KONTRAK KELUARAN HOOK UNTUK KOMPONEN UI
  // -------------------------------------------------------------------------
  return {
    data: data || null,
    isLoading,
    isFetching,
    isError,
    error: error?.message || null,
    refetch,
    activeParams,
    hasActiveSearch: isBirthDateValid,
    executeSearch,
    resetSearch,
  };
}

