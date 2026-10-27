/**
 * ============================================================================
 * CUSTOM HOOKS: KETERANGAN ELEMEN KALENDER BALI
 * ============================================================================
 * Berkas ini menyediakan custom hooks TanStack Query untuk mengelola state data,
 * caching memori Lapis 3 di RAM browser, dan penggabungan kategori referensi.
 *
 * Menerapkan Prinsip Efisiensi fe_strategy.md (Bab 6.2 & Bab 7):
 *  1. Zero-Loading UX: Data ensiklopedia adalah data referensi permanen abadi,
 *     sehingga dikonfigurasikan dengan `staleTime: Infinity`. Permintaan jaringan
 *     hanya terjadi 1 kali saat cold start, navigasi berikutnya bernilai 0ms.
 *  2. Long-Lived Garbage Collection: Data dipertahankan di RAM selama 24 jam
 *     (`gcTime: 1000 * 60 * 60 * 24`).
 *  3. On-Demand Fetching: Detail isi elemen (`useKeteranganTypeDetail`) hanya
 *     ditarik saat pengguna mengklik kartu kategori bersangkutan (`enabled: Boolean(...)`).
 *  4. Single Source of Truth: Menghindari duplikasi data ke Zustand store.
 * ============================================================================
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  fetchKeteranganTypes,
  fetchKeteranganTypeDetail,
} from '../api/keteranganApi';
import {
  ALL_CATEGORY_REGISTRY,
  type KeteranganType,
  type KeteranganTypeDetail,
} from '../types/keterangan.types';

/**
 * ----------------------------------------------------------------------------
 * 1. HOOK: useKeteranganTypes
 * ----------------------------------------------------------------------------
 * Mengambil daftar 16 kategori referensi aktif dari Backend Go dan menggabungkannya
 * secara harmonis dengan seluruh daftar master kategori sistem lama (ALL_CATEGORY_REGISTRY).
 *
 * Logika Penggabungan (Audit-Ready):
 *  - Kategori yang sudah aktif di Backend Go (16 kategori inti) akan memuat nama,
 *    ID resmi, dan deskripsi filosofis riil dari database PostgreSQL.
 *  - Kategori yang belum aktif di backend (Sadwara, Astawara, Dasawara, Neptu, dll.)
 *    tetap dimunculkan dengan flag `isPendingBackend: true` dan deskripsi default,
 *    sehingga pengguna/pengembang langsung memahami bagian mana yang perlu diisi di backend.
 *
 * @returns Objek berisi daftar kategori gabungan (`categories`), status loading, dan error
 */
export function useKeteranganTypes() {
  const query = useQuery<KeteranganType[], Error>({
    queryKey: ['keterangan', 'types'],
    queryFn: fetchKeteranganTypes,
    staleTime: Infinity, // Data referensi permanen tidak akan kedaluwarsa selama sesi aktif
    gcTime: 1000 * 60 * 60 * 24, // Bertahan di RAM browser hingga 24 jam
    refetchOnWindowFocus: false, // Hindari refetch berlebih saat berpindah tab browser
    retry: 1, // Toleransi 1 kali percobaan ulang jika terjadi fluktuasi jaringan
  });

  // Gabungkan respons Backend Go dengan registri lengkap kategori
  const categories = useMemo<KeteranganType[]>(() => {
    const backendTypes = query.data || [];

    // Buat lookup map dari data backend berdasarkan kode kategori (snake_case)
    const backendMap = new Map<string, KeteranganType>();
    backendTypes.forEach((item) => {
      backendMap.set(item.code.toLowerCase().trim(), item);
    });

    // Petakan seluruh registri kategori
    return ALL_CATEGORY_REGISTRY.map((regItem) => {
      const liveData = backendMap.get(regItem.code.toLowerCase());

      if (liveData) {
        // Kategori aktif: gunakan data resmi dari Backend Go
        return {
          id: liveData.id,
          code: liveData.code,
          name: liveData.name,
          description: liveData.description || regItem.defaultDescription,
          isPendingBackend: false,
        };
      }

      // Kategori pending: tampilkan kartu dengan status menunggu pengisian di backend
      return {
        id: `pending_${regItem.code}`,
        code: regItem.code,
        name: regItem.name,
        description: regItem.defaultDescription,
        isPendingBackend: true,
      };
    });
  }, [query.data]);

  return {
    categories,
    backendTypes: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

/**
 * ----------------------------------------------------------------------------
 * 2. HOOK: useKeteranganTypeDetail
 * ----------------------------------------------------------------------------
 * Mengambil informasi metadata kategori beserta seluruh daftar elemen bernilainya
 * dari backend Go (misal: saat pengguna mengklik kartu "Wuku", "Ingkel", atau "Hari Raya").
 *
 * Karakteristik Eksekusi:
 *  - Bersifat reaktif: Query hanya berjalan jika parameter `typeCode` memiliki nilai (`enabled: Boolean(...)`).
 *  - Jika `typeCode` adalah kategori yang statusnya pending di backend (misal: "sadwara"),
 *    hook ini secara cerdas tidak menembak request ke backend, melainkan mengembalikan
 *    kondisi kosong yang aman tanpa melempar error jaringan.
 *  - Hasil pemanggilan pertama langsung disimpan di memori RAM, sehingga klik berikutnya
 *    pada kategori yang sama terbuka seketika dalam 0 milidetik.
 *
 * @param typeCode - Kode slug kategori yang dipilih (misal: "wuku", "hari_raya"), atau null jika modal tertutup
 * @returns Objek detail kategori, array values, status loading, dan error
 */
export function useKeteranganTypeDetail(typeCode: string | null) {
  // Evaluasi apakah kategori ini merupakan salah satu dari kategori pending
  const isPending = useMemo(() => {
    if (!typeCode) return false;
    const item = ALL_CATEGORY_REGISTRY.find(
      (c) => c.code.toLowerCase() === typeCode.toLowerCase()
    );
    return item ? !item.isCoreActive : false;
  }, [typeCode]);

  const query = useQuery<KeteranganTypeDetail, Error>({
    queryKey: ['keterangan', 'types', typeCode],
    queryFn: () => {
      if (!typeCode) {
        throw new Error('Kode kategori tidak valid');
      }
      return fetchKeteranganTypeDetail(typeCode);
    },
    // Query hanya aktif jika ada typeCode terpilih dan kategori tersebut aktif di backend
    enabled: Boolean(typeCode && !isPending),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Jika kategori berstatus pending di backend, sajikan objek detail kosong yang aman
  const safeDetail = useMemo<KeteranganTypeDetail | null>(() => {
    if (isPending && typeCode) {
      const regItem = ALL_CATEGORY_REGISTRY.find(
        (c) => c.code.toLowerCase() === typeCode.toLowerCase()
      );
      return {
        type: {
          id: `pending_${typeCode}`,
          code: typeCode,
          name: regItem?.name || typeCode,
          description: regItem?.defaultDescription || '',
          isPendingBackend: true,
        },
        values: [],
        total: 0,
      };
    }
    return query.data || null;
  }, [isPending, typeCode, query.data]);

  return {
    detail: safeDetail,
    values: safeDetail?.values || [],
    total: safeDetail?.total || 0,
    isPending,
    isLoading: isPending ? false : query.isLoading,
    isError: isPending ? false : query.isError,
    error: query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}
