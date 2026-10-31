import { apiClient } from '@/lib/axios';
import type {
  WarigaPersonalRequest,
  WarigaPersonalResponse,
  WarigaPersonalAPIEnvelope,
  PadewasanItem,
} from '../types/warigaPersonal.types';

// Re-export fungsi fetchDayWariga & fetchKeteranganValueByName dari modul otonan
// untuk menghindari penulisan kode duplikat (DRY principle).
export {
  fetchDayWariga,
  fetchKeteranganValueByName,
} from '@/features/otonan/api/otonanApi';

/**
 * ============================================================================
 * LAPISAN API: WARIGA PERSONAL & PADEWASAN KELAHIRAN
 * ============================================================================
 * Berkas ini bertanggung jawab menghubungkan antarmuka React dengan backend Go
 * untuk:
 *  1. Perhitungan Wariga Personal bulanan (POST /api/v1/search/wariga-personal).
 *  2. Pengambilan daftar Ala Ayuning Dewasa kelahiran (GET /api/v1/search/ala-ayuning-dewasa).
 *  3. Pengambilan 15 dimensi wewaran & makna filosofis (reused dari otonan API).
 *
 * Menggunakan instance terpusat `apiClient` dari `@/lib/axios` yang otomatis
 * menyertakan Authorization Bearer token (jika user login) dan baseURL `/api/v1`.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: ENDPOINT UTAMA EVALUASI WARIGA PERSONAL
// ----------------------------------------------------------------------------

/**
 * searchWarigaPersonal mengirim permintaan perhitungan kecocokan hari
 * berdasarkan weton tanggal lahir pengguna dan bulan/tahun target.
 *
 * Endpoint: POST /api/v1/search/wariga-personal
 *
 * @param payload Parameter input (tanggal lahir, sebelum jam 6, bulan, tahun target)
 * @returns Promise berisi WarigaPersonalResponse lengkap dari backend Go
 */
export async function searchWarigaPersonal(
  payload: WarigaPersonalRequest
): Promise<WarigaPersonalResponse> {
  // Susun payload bersih untuk dikirimkan via HTTP POST
  const body: WarigaPersonalRequest = {
    tanggal_lahir: payload.tanggal_lahir,
    sebelum_jam_6: Boolean(payload.sebelum_jam_6),
    bulan_target: Number(payload.bulan_target),
    tahun_target: Number(payload.tahun_target),
  };

  if (payload.tanggal_mulai) body.tanggal_mulai = payload.tanggal_mulai;
  if (payload.tanggal_selesai) body.tanggal_selesai = payload.tanggal_selesai;

  const response = await apiClient.post<WarigaPersonalAPIEnvelope>(
    '/search/wariga-personal',
    body
  );

  return response.data.data;
}

// ----------------------------------------------------------------------------
// BLOK 2: ENDPOINT DEWASA KELAHIRAN (ALA AYUNING DEWASA)
// ----------------------------------------------------------------------------

/**
 * fetchDewasaKelahiran mengambil seluruh kriteria padewasan (ala ayuning dewasa)
 * yang aktif pada tanggal kelahiran pengguna.
 *
 * Endpoint: GET /api/v1/search/ala-ayuning-dewasa
 *
 * @param tanggalLahir Tanggal Masehi kelahiran (format YYYY-MM-DD)
 * @returns Promise berisi daftar PadewasanItem (nama kriteria, makna/anjuran, & tingkat keparahan)
 */
export async function fetchDewasaKelahiran(
  tanggalLahir: string
): Promise<PadewasanItem[]> {
  try {
    const response = await apiClient.get('/search/ala-ayuning-dewasa', {
      params: {
        tanggal_mulai: tanggalLahir,
        tanggal_selesai: tanggalLahir,
        beserta_keterangan: true,
      },
    });

    const harianList = response.data?.data;
    if (Array.isArray(harianList) && harianList.length > 0) {
      return harianList[0].padewasan || [];
    }

    return [];
  } catch (error) {
    console.error('Gagal mengambil data dewasa kelahiran:', error);
    return [];
  }
}

