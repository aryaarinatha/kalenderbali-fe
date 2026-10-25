import { apiClient } from '@/lib/axios';
import type { ZodiacApiResponse, ZodiacItem } from '../types/zodiac.types';

/**
 * ============================================================================
 * LAPISAN API: ZODIAK (KETERANGAN & ENSIKLOPEDIA)
 * ============================================================================
 * Menghubungkan antarmuka React dengan endpoint Backend Go:
 * GET /api/v1/keterangan/types/zodiak
 *
 * Mengikuti pedoman arsitektur (fe_strategy.md Bagian 6 & zodiac.md):
 *  - Mengambil 12 master data zodiak dalam satu panggilan tunggal.
 *  - Memetakan legacy_id (1 = Jan/Capricorn s.d 12 = Des/Sagitarius).
 *  - Memformat rentang tanggal astronomis ke dalam bahasa Indonesia.
 * ============================================================================
 */

// Kamus nama bulan Indonesia untuk pemformatan rentang tanggal
const NAMA_BULAN_INDO: Record<number, string> = {
  1: 'Januari',
  2: 'Februari',
  3: 'Maret',
  4: 'April',
  5: 'Mei',
  6: 'Juni',
  7: 'Juli',
  8: 'Agustus',
  9: 'September',
  10: 'Oktober',
  11: 'November',
  12: 'Desember',
};

// Fallback rentang tanggal jika backend tidak menyertakan zodiac_detail
const FALLBACK_DATE_RANGES: Record<number, string> = {
  1: '22 Desember - 20 Januari',
  2: '21 Januari - 19 Februari',
  3: '20 Februari - 20 Maret',
  4: '21 Maret - 19 April',
  5: '20 April - 20 Mei',
  6: '21 Mei - 20 Juni',
  7: '21 Juni - 21 Juli',
  8: '22 Juli - 21 Agustus',
  9: '22 Agustus - 21 September',
  10: '22 September - 21 Oktober',
  11: '22 Oktober - 20 November',
  12: '21 November - 21 Desember',
};

/**
 * Mengambil seluruh daftar 12 zodiak dari backend Go.
 *
 * @returns Promise berisi array ZodiacItem yang sudah dinormalisasi untuk UI
 */
export async function fetchZodiacList(): Promise<ZodiacItem[]> {
  // Panggil endpoint backend Go: GET /api/v1/keterangan/types/zodiak
  const response = await apiClient.get<ZodiacApiResponse>('/keterangan/types/zodiak');

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  const values = response.data.data.values || [];

  return values.map((val, idx) => {
    // Nomor bulan (1 = Januari s/d 12 = Desember) berdasarkan legacy_id
    const monthNum = val.legacy_id ? Number(val.legacy_id) : idx + 1;

    // Susun string rentang tanggal (contoh: "22 September - 21 Oktober")
    let formattedDateRange = FALLBACK_DATE_RANGES[monthNum] || '';
    if (val.zodiac_detail) {
      const { start_day, start_month, end_day, end_month } = val.zodiac_detail;
      const startMonthName = NAMA_BULAN_INDO[start_month] || `${start_month}`;
      const endMonthName = NAMA_BULAN_INDO[end_month] || `${end_month}`;
      formattedDateRange = `${start_day} ${startMonthName} - ${end_day} ${endMonthName}`;
    }

    return {
      id: val.id,
      name: val.name,
      description: val.description.trim(),
      monthIndex: monthNum,
      dateRange: formattedDateRange,
      imagePath: `/assets/images/zodiak/Asset_${monthNum}.svg`,
      detail: val.zodiac_detail,
    };
  });
}
