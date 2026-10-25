import { useQuery } from '@tanstack/react-query';
import {
  searchOtonan,
  fetchMasterWewaran,
  fetchOtonanDaySasih,
} from '../api/otonanApi';
import type {
  OtonanSearchParams,
  OtonanResponseData,
  MasterWewaranItem,
} from '../types/otonan.types';

/**
 * ============================================================================
 * CUSTOM HOOKS: FITUR OTONAN (TANSTACK QUERY ORCHESTRATOR)
 * ============================================================================
 * Berkas ini menyediakan custom hook React Query untuk mengelola data Otonan:
 *  1. useOtonanSearch: Menangani eksekusi pencarian otonan dengan Lapis 3 RAM Cache.
 *  2. useMasterWewaranOptions: Menyediakan daftar opsi Saptawara, Pancawara, dan Wuku
 *     dengan staleTime: Infinity (data statis tidak pernah basi).
 * ============================================================================
 */

// ============================================================================
// 1. Custom Hook: Pencarian & Pengayaan Hasil Otonan
// ============================================================================

/**
 * useOtonanSearch menjalankan query pencarian otonan ke backend Go
 * sekaligus memperkaya data hasil dengan nama Sasih resmi dari mesin kalender.
 *
 * Menerapkan Prinsip fe_strategy.md:
 *  - staleTime: 30 menit (mencegah refetch berlebih saat navigasi bolak-balik).
 *  - gcTime: 24 jam di memori RAM browser.
 *  - Mengisi elemen wewaran hari otonan (secara budaya otonan selalu sama dengan wewaran lahir).
 *
 * @param params Objek parameter pencarian atau null jika belum ada input
 * @param enabled Penanda apakah query boleh dieksekusi
 */
export function useOtonanSearch(
  params: OtonanSearchParams | null,
  enabled: boolean = true
) {
  // Evaluasi kelayakan eksekusi query (mencegah request prematur dengan parameter kosong)
  const isParamsValid = Boolean(
    params &&
      params.tahun_target > 0 &&
      (params.tipe_pencarian === 'tanggal_lahir'
        ? Boolean(params.tanggal_lahir)
        : Boolean(params.saptawara_id && params.pancawara_id && params.wuku_id))
  );

  return useQuery<OtonanResponseData, Error>({
    queryKey: ['otonan', 'search', params],
    queryFn: async () => {
      if (!params) {
        throw new Error('Parameter pencarian otonan tidak valid');
      }

      // 1. Eksekusi pencarian utama ke backend Go (GET /api/v1/search/otonan)
      const data = await searchOtonan(params);

      // 2. Pengayaan Data Hasil (Data Enrichment)
      if (data && data.hasil && data.hasil.length > 0) {
        const elemenLahir = data.input_dinormalisasi?.elemen;

        // Tampilkan murni data balikan dari backend Go tanpa menambah/menghitung tanggal di FE
        for (let i = 0; i < data.hasil.length; i++) {
          const item = data.hasil[i];

          if (!item.detail_elemen.saptawara && elemenLahir?.saptawara) {
            item.detail_elemen.saptawara = elemenLahir.saptawara;
          }
          if (!item.detail_elemen.pancawara && elemenLahir?.pancawara) {
            item.detail_elemen.pancawara = elemenLahir.pancawara;
          }
          if (!item.detail_elemen.wuku && elemenLahir?.wuku) {
            item.detail_elemen.wuku = elemenLahir.wuku;
          }

          // Jika nama Sasih pada hari otonan belum terisi, tarik nama Sasih resmi dari mesin kalender
          if (!item.detail_elemen.sasih && item.tanggal) {
            const sasih = await fetchOtonanDaySasih(item.tanggal);
            item.detail_elemen.sasih = sasih || 'Kalima';
          }
        }
      }

      return data;
    },
    enabled: enabled && isParamsValid,
    staleTime: 1000 * 60 * 30, // Fresh selama 30 menit
    gcTime: 1000 * 60 * 60 * 24, // 24 jam di cache RAM browser
    retry: (failureCount, error: any) => {
      // Langsung lemparkan error tanpa jeda retry jika input/kombinasi tidak valid (HTTP 4xx)
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 1;
    },
  });
}

// ============================================================================
// 2. Custom Hook: Master Opsi Wewaran (Tab Manual)
// ============================================================================

/**
 * useMasterWewaranOptions memuat seluruh daftar master elemen kalender:
 *  - 7 Saptawara (Redite s.d. Saniscara)
 *  - 5 Pancawara (Umanis s.d. Kliwon)
 *  - 30 Wuku (Sinta s.d. Watugunung)
 *
 * Menerapkan Prinsip fe_strategy.md:
 *  - staleTime: Infinity (data referensi permanen tidak akan basi selama sesi aktif).
 *  - Mengambil data 1 kali saat tab manual pertama kali dibuka.
 */
export function useMasterWewaranOptions() {
  // Query 1: Master Saptawara (7 Hari)
  const saptawaraQuery = useQuery<MasterWewaranItem[], Error>({
    queryKey: ['keterangan', 'types', 'saptawara', 'values'],
    queryFn: () => fetchMasterWewaran('saptawara'),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // Query 2: Master Pancawara (5 Hari)
  const pancawaraQuery = useQuery<MasterWewaranItem[], Error>({
    queryKey: ['keterangan', 'types', 'pancawara', 'values'],
    queryFn: () => fetchMasterWewaran('pancawara'),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  // Query 3: Master Wuku (30 Wuku)
  const wukuQuery = useQuery<MasterWewaranItem[], Error>({
    queryKey: ['keterangan', 'types', 'wuku', 'values'],
    queryFn: () => fetchMasterWewaran('wuku'),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });

  const isLoading =
    saptawaraQuery.isLoading || pancawaraQuery.isLoading || wukuQuery.isLoading;

  const isError =
    saptawaraQuery.isError || pancawaraQuery.isError || wukuQuery.isError;

  return {
    saptawaraList: saptawaraQuery.data || [],
    pancawaraList: pancawaraQuery.data || [],
    wukuList: wukuQuery.data || [],
    isLoading,
    isError,
  };
}
