import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data kalender & ensiklopedia bersifat pasti, jadi kita beri staleTime yang aman
      staleTime: 1000 * 60 * 30, // 30 menit data dianggap fresh (tidak fetch ulang)
      gcTime: 1000 * 60 * 60 * 24, // 24 jam data disimpan di cache memori browser
      refetchOnWindowFocus: false, // Jangan fetch ulang saat pengguna bolak-balik tab browser
      retry: (failureCount, error: any) => {
        // Jangan coba ulang jika error dari klien (4xx seperti 400 Bad Request / Validasi)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 1;
      },
    },
  },
});
