import { useQuery } from '@tanstack/react-query';
import { fetchZodiacList } from '../api/zodiacApi';
import type { ZodiacItem } from '../types/zodiac.types';

/**
 * ============================================================================
 * CUSTOM HOOK: useZodiacList & useMonthlyZodiac
 * ============================================================================
 * Hook React Query untuk mengelola data Zodiak dengan prinsip Zero-Loading:
 *
 * 1. TanStack Query Cache:
 *    - `staleTime: Infinity`: Data master zodiak bersifat statis/immutable.
 *      Hanya di-fetch 1 kali dari backend, selanjutnya selalu diambil dari memory cache.
 *    - `gcTime: 24 jam`: Menjaga data tetap hangat di memori selama sesi pengguna.
 *
 * 2. Shared Reusability:
 *    - Dapat dipanggil oleh halaman Kalender, Ensiklopedia Keterangan,
 *      dan kalkulator Ramalan Sifat Kelahiran.
 * ============================================================================
 */

/**
 * Mengambil seluruh 12 zodiak dari server dan menyimpannya di cache TanStack Query.
 */
export function useZodiacList() {
  return useQuery<ZodiacItem[], Error>({
    queryKey: ['keterangan', 'types', 'zodiak'],
    queryFn: fetchZodiacList,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24, // 24 jam di memori
  });
}

/**
 * Mengambil satu objek Zodiak yang aktif menaungi nomor bulan tertentu (1 s/d 12).
 * Digunakan oleh widget kalender bulanan.
 *
 * @param month Nomor bulan kalender aktif (1 = Jan, 10 = Okt, 12 = Des)
 */
export function useMonthlyZodiac(month: number) {
  const { data: zodiacList, isLoading, isError, error } = useZodiacList();

  // Cari item zodiak yang memiliki monthIndex sesuai dengan bulan aktif kalender
  const activeZodiac = zodiacList?.find((item) => item.monthIndex === month);

  return {
    activeZodiac,
    isLoading,
    isError,
    error,
    zodiacList,
  };
}
