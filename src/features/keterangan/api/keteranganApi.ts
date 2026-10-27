/**
 * ============================================================================
 * LAPISAN API: KETERANGAN ELEMEN KALENDER BALI
 * ============================================================================
 * Berkas ini menyediakan fungsi pemanggilan HTTP (API Client) terpusat untuk
 * fitur Ensiklopedia & Keterangan Elemen Kalender Bali.
 *
 * Mengikuti Prinsip Arsitektur Efisien & Bersih:
 *  1. Terpusat & Reusable: Cukup 2 fungsi generik untuk melayani seluruh
 *     16 kategori aktif dari Backend Go tanpa membuat file API berulang.
 *  2. Terintegrasi Interceptor Axios: Menggunakan instance `apiClient` dari
 *     `@/lib/axios` yang telah terkonfigurasi dengan baseURL `/api/v1`,
 *     penyisipan token autentikasi, serta normalisasi error otomatis.
 *  3. Responsif & Andal: Menangani ekstraksi data dari amplop API standar
 *     { data, meta, error } dan melempar error deskriptif jika permintaan gagal.
 * ============================================================================
 */

import { apiClient } from '@/lib/axios';
import type {
  KeteranganApiResponse,
  KeteranganType,
  KeteranganTypeDetail,
} from '../types/keterangan.types';

/**
 * ----------------------------------------------------------------------------
 * 1. FUNGSI: fetchKeteranganTypes
 * ----------------------------------------------------------------------------
 * Mengambil daftar seluruh kategori referensi kalender Bali yang aktif dilayani
 * di backend Go (saat ini 16 kategori inti: Hari Raya, Ala Ayuning, Wuku, dsb).
 *
 * Endpoint Backend Go:
 *  - URL : GET /api/v1/keterangan/types
 *  - Cache: Cache-Control public 24 jam (Zero-Loading UX)
 *
 * @returns Promise berisi array KeteranganType
 * @throws Error jika server mengembalikan error atau koneksi terputus
 */
export async function fetchKeteranganTypes(): Promise<KeteranganType[]> {
  const response = await apiClient.get<KeteranganApiResponse<KeteranganType[]>>(
    '/keterangan/types'
  );

  // Jika payload JSON mengandung pesan error dari backend Go, lemparkan error
  if (response.data.error) {
    throw new Error(
      response.data.error.message || 'Gagal memuat daftar kategori keterangan'
    );
  }

  // Kembalikan array kategori (fallback array kosong jika null/undefined)
  return response.data.data || [];
}

/**
 * ----------------------------------------------------------------------------
 * 2. FUNGSI: fetchKeteranganTypeDetail
 * ----------------------------------------------------------------------------
 * Mengambil informasi metadata suatu kategori beserta seluruh daftar elemen bernilainya.
 * Fungsi ini dipanggil saat pengguna mengklik salah satu kartu kategori pada katalog
 * untuk membuka dialog modal rincian.
 *
 * Parameter `typeIdentifier` bersifat fleksibel di backend Go:
 *  - Slug kode: "wuku", "hari_raya", "ingkel", "ala_ayuning_dewasa", "zodiak"
 *  - Nama tampilan: "Wuku", "Hari Raya"
 *  - ID numerik: "25", "1", "3"
 *
 * Endpoint Backend Go:
 *  - URL : GET /api/v1/keterangan/types/:type
 *  - Cache: Cache-Control public 24 jam (Zero-Loading UX)
 *
 * @param typeIdentifier - Kode slug, nama, atau ID kategori yang ingin diambil
 * @returns Promise berisi KeteranganTypeDetail (objek type, array values, total count)
 * @throws Error jika kategori tidak ditemukan (404) atau terjadi gangguan jaringan
 */
export async function fetchKeteranganTypeDetail(
  typeIdentifier: string
): Promise<KeteranganTypeDetail> {
  const normalizedIdentifier = encodeURIComponent(typeIdentifier.trim());

  const response = await apiClient.get<KeteranganApiResponse<KeteranganTypeDetail>>(
    `/keterangan/types/${normalizedIdentifier}`
  );

  if (response.data.error) {
    throw new Error(
      response.data.error.message ||
        `Gagal memuat detail kategori ${typeIdentifier}`
    );
  }

  return response.data.data;
}
