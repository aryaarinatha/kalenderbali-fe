import { apiClient } from '@/lib/axios';
import type { KalenderApiResponse, KalenderHarian } from '../types/kalender.types';

/**
 * ============================================================================
 * LAPISAN API: KALENDER BALI
 * ============================================================================
 * Berkas ini bertanggung jawab menghubungkan antarmuka React dengan endpoint
 * backend Go (GET /api/v1/kalender).
 *
 * Menerapkan Strategi 1-Year Chunking (fe_strategy.md):
 * Mengambil data 365/366 hari sekaligus dalam satu request ringan (~100 KB).
 * Mengeliminasi round-trip HTTP berulang setiap kali user mengganti bulan kalender.
 * ============================================================================
 */

/**
 * Mengambil data kalender Bali lengkap untuk satu tahun Masehi tertentu.
 *
 * @param year Tahun yang diminta (contoh: 2026, rentang didukung 1800 - 2200)
 * @returns Promise berisi array KalenderHarian (365 atau 366 hari)
 */
export async function fetchKalenderTahun(year: number): Promise<KalenderHarian[]> {
  // Panggil endpoint backend Go: GET /api/v1/kalender?year={year}
  const response = await apiClient.get<KalenderApiResponse>('/kalender', {
    params: { year },
  });

  // Backend Go membungkus response dalam format { data: [...], meta: {...}, error: null }
  if (response.data.error) {
    throw new Error(response.data.error);
  }

  return response.data.data;
}
