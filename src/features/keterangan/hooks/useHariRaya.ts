import { useQuery } from '@tanstack/react-query';
import { fetchHariRayaKeteranganList } from '../api/hariRayaApi';
import type { HariRayaKeterangan } from '../types/hariRaya.types';

/**
 * ============================================================================
 * CUSTOM HOOK: useHariRayaKeteranganList & useHariRayaDetail
 * ============================================================================
 * Mengelola data penjelasan makna hari raya dengan prinsip Zero-Loading:
 *  - staleTime: Infinity (data statis/abadi di-cache di memori browser).
 *  - Pencarian instan (O(1) / O(N)) berdasarkan id hari raya atau nama.
 * ============================================================================
 */

export function useHariRayaKeteranganList() {
  return useQuery<HariRayaKeterangan[], Error>({
    queryKey: ['keterangan', 'types', 'hari_raya'],
    queryFn: fetchHariRayaKeteranganList,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 jam di memori
  });
}

/**
 * Mengambil satu objek penjelasan hari raya berdasarkan ID atau nama hari raya.
 */
export function useHariRayaDetail(holidayId?: string, holidayName?: string) {
  const { data: list, isLoading } = useHariRayaKeteranganList();

  const detail = list?.find((item) => {
    if (holidayId && item.id === String(holidayId)) return true;
    if (holidayName && item.name.toLowerCase() === holidayName.toLowerCase()) return true;
    return false;
  });

  return {
    detail,
    isLoading,
  };
}
