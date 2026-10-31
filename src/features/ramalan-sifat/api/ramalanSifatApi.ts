import { apiClient } from '@/lib/axios';
import type {
  RamalanSifatRequest,
  RamalanSifatData,
  RamalanSifatAPIEnvelope,
} from '../types/ramalanSifat.types';

/**
 * ============================================================================
 * LAPISAN API: RAMALAN SIFAT (WATAK KELAHIRAN KALENDER BALI)
 * ============================================================================
 * Berkas ini bertindak sebagai jembatan komunikasi antara aplikasi antarmuka React
 * dan layanan Backend Go untuk modul Ramalan Sifat.
 *
 * Prinsip Desain:
 *  1. Preservasi Privasi Data (PII): Menggunakan metode HTTP POST dengan payload
 *     pada request body agar tanggal lahir pengguna tidak terekspos di access log
 *     Nginx/Proxy maupun riwayat peramban.
 *  2. Keamanan & Sanitasi: Menggunakan instance terpusat `apiClient` dari `@/lib/axios`
 *     yang sudah terintegrasi dengan prefix `/api/v1` dan interseptor autentikasi.
 *  3. Penanganan Kesalahan Terpadu: Memetakan error code backend Go ke pesan
 *     yang informatif bagi pengguna.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: FUNGSI UTAMA PENCARIAN RAMALAN SIFAT KELAHIRAN
// ----------------------------------------------------------------------------
/**
 * searchRamalanSifat mengirimkan permintaan perhitungan perwatakan ke server Go.
 *
 * Endpoint Backend:
 *   POST /api/v1/search/ramalan-sifat
 *
 * Logika di Backend Go:
 *  - Memvalidasi format ISO tanggal lahir (YYYY-MM-DD) dan batas epoch (1970 s.d. hari ini).
 *  - Menyesuaikan penanggalan adat wewaran jika `sebelum_jam_6` bernilai true.
 *  - Mengagregasikan 4 pilar watak (Pancawara, Saptawara, Wuku, dan Zodiak) dari
 *    master data in-memory RAM dengan latensi O(1) (< 0.5 ms, 0 DB Hit).
 *
 * @param payload Parameter masukan tanggal lahir dan opsi pergantian hari adat jam 06.00.
 * @returns Promise berisi RamalanSifatData (identitas weton, 4 pilar watak, dan ringkasan umum).
 */
export async function searchRamalanSifat(payload: RamalanSifatRequest): Promise<RamalanSifatData> {
  // Validasi parameter lokal sebelum mengirimkan request ke jaringan
  if (!payload.tanggal_lahir || payload.tanggal_lahir.trim() === '') {
    throw new Error('Tanggal lahir wajib diisi.');
  }

  try {
    const response = await apiClient.post<RamalanSifatAPIEnvelope>(
      '/search/ramalan-sifat',
      {
        tanggal_lahir: payload.tanggal_lahir.trim(),
        sebelum_jam_6: Boolean(payload.sebelum_jam_6),
      }
    );

    // Pastikan payload data dari amplop API backend tersedia dan valid
    if (!response.data || !response.data.data) {
      const errorMessage =
        response.data?.error?.message || 'Data ramalan sifat tidak ditemukan dari server.';
      throw new Error(errorMessage);
    }

    return response.data.data;
  } catch (error: any) {
    // ------------------------------------------------------------------------
    // BLOK 2: PENANGANAN KESALAHAN RESPON DARI BACKEND
    // ------------------------------------------------------------------------
    // Menangkap pesan kesalahan ramah pengguna dari error envelope server Go
    if (error?.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }

    if (error?.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    if (error?.message) {
      throw new Error(error.message);
    }

    throw new Error('Terjadi kesalahan saat menghubungkan ke server Kalender Bali.');
  }
}

