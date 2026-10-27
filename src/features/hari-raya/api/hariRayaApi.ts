import { apiClient } from '@/lib/axios';
import type {
  ApiSuccessResponse,
  HariRayaMasterItem,
  HariRayaSearchResponse,
} from '../types/hariRaya.types';

/**
 * ============================================================================
 * LAPISAN KOMUNIKASI API: HARI RAYA BALI
 * ============================================================================
 * Berkas ini bertindak sebagai jembatan HTTP resmi antara frontend React dan
 * server backend Go (Echo REST API) untuk seluruh fungsionalitas Hari Raya Bali.
 *
 * Mengonsumsi endpoint resmi:
 *  1. GET /api/v1/hari-raya/master -> Mengambil katalog 106 master hari raya & deskripsinya.
 *  2. GET /api/v1/search/hari-raya -> Mencari tanggal jatuh hari raya tertentu (wuku, sasih, dsb).
 *  3. GET /api/v1/hari-raya        -> Mengambil rentang hari raya per tahun/tanggal.
 * ============================================================================
 */

/**
 * BLOK 1: Pengambilan Katalog Master Hari Raya
 * ----------------------------------------------------------------------------
 * Fungsi ini digunakan untuk mengisi daftar pilihan dropdown pada form pencarian
 * dan sebagai kamus referensi cepat untuk menampilkan deskripsi filosofis hari raya.
 *
 * Karena data master hari raya (106 entitas) bersifat statis, fungsi ini dirancang
 * untuk dikonsumsi dengan TanStack Query berkonfigurasi `staleTime: Infinity`
 * (hanya di-request 1 kali saat aplikasi pertama kali membutuhkan data ini).
 *
 * @returns Promise berisi array seluruh 106 HariRayaMasterItem
 */
export async function fetchMasterHariRaya(): Promise<HariRayaMasterItem[]> {
  // Melakukan request HTTP GET ke endpoint backend Go: /api/v1/hari-raya/master
  const response = await apiClient.get<ApiSuccessResponse<HariRayaMasterItem[]>>(
    '/hari-raya/master'
  );

  // Periksa apakah server backend Go mengembalikan pesan error dalam amplop respons
  if (response.data.error) {
    throw new Error(
      typeof response.data.error === 'string'
        ? response.data.error
        : 'Gagal memuat katalog master hari raya'
    );
  }

  // Mengembalikan array data master hari raya murni (106 item)
  return response.data.data;
}

/**
 * BLOK 2: Pencarian Tanggal Jatuh Hari Raya Spesifik
 * ----------------------------------------------------------------------------
 * Fungsi ini memanggil endpoint pencarian backend Go untuk menemukan seluruh
 * tanggal jatuhnya suatu hari raya tertentu pada tahun (dan opsional bulan) target.
 *
 * Contoh: Mencari "Galungan" pada tahun 2026 akan mengembalikan 2 tanggal kejadian
 * (karena siklus pawukon 210 hari berulang 1-2 kali per tahun Masehi), lengkap dengan
 * rincian posisi wuku, saptawara, pancawara, sasih, dan fase pengalantaka.
 *
 * @param nama Nama hari raya yang dicari (contoh: "Galungan", "Nyepi", "Purnama")
 * @param year Tahun target Masehi (contoh: 2026)
 * @param month Bulan Masehi opsional (1 s.d. 12) jika ingin mempersempit hasil
 * @returns Promise berisi HariRayaSearchResponse yang merangkum semua kejadian
 */
export async function searchHariRayaSpesifik(
  nama: string,
  year: number,
  month?: number
): Promise<HariRayaSearchResponse> {
  // Menyiapkan parameter query string yang bersih
  const params: Record<string, string | number> = {
    nama,
    year,
  };

  // Sisipkan parameter bulan hanya jika disediakan oleh pemanggil
  if (month && month >= 1 && month <= 12) {
    params.month = month;
  }

  // Melakukan request HTTP GET ke: /api/v1/search/hari-raya?nama=...&year=...(&month=...)
  const response = await apiClient.get<ApiSuccessResponse<HariRayaSearchResponse>>(
    '/search/hari-raya',
    { params }
  );

  // Periksa apakah ada pesan error dari backend (misal: nama hari raya tidak ditemukan)
  if (response.data.error) {
    throw new Error(
      typeof response.data.error === 'string'
        ? response.data.error
        : 'Hari raya tidak ditemukan'
    );
  }

  // Mengembalikan objek hasil pencarian kejadian hari raya
  return response.data.data;
}

/**
 * BLOK 3: Pengambilan Hari Raya Mode Rentang / Tahunan
 * ----------------------------------------------------------------------------
 * Fungsi ini memanggil endpoint GET /api/v1/hari-raya untuk mengambil jadwal
 * hari raya dalam 1 tahun penuh atau rentang tanggal spesifik.
 *
 * Parameter `include_description=true` menyertakan uraian makna filosofis dari
 * lontar Sundarigama pada tiap perayaan.
 *
 * @param year Tahun target Masehi (contoh: 2026)
 * @param includeDescription Apakah menyertakan teks deskripsi lengkap (default: true)
 * @returns Promise berisi array kejadian per tanggal
 */
export async function fetchHariRayaTahun(
  year: number,
  includeDescription: boolean = true
): Promise<Array<{ tanggal: string; hari_raya: HariRayaMasterItem[] }>> {
  // Panggil endpoint: /api/v1/hari-raya?year=...&include_description=true
  const response = await apiClient.get<
    ApiSuccessResponse<Array<{ tanggal: string; hari_raya: HariRayaMasterItem[] }>>
  >('/hari-raya', {
    params: {
      year,
      include_description: includeDescription ? 'true' : 'false',
    },
  });

  if (response.data.error) {
    throw new Error(
      typeof response.data.error === 'string'
        ? response.data.error
        : 'Gagal memuat jadwal hari raya'
    );
  }

  return response.data.data;
}
