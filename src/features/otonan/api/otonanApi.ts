import { apiClient } from '@/lib/axios';
import type {
  OtonanAPIEnvelope,
  OtonanResponseData,
  OtonanSearchParams,
  MasterWewaranItem,
} from '../types/otonan.types';

/**
 * ============================================================================
 * LAPISAN API: FITUR OTONAN & MASTER WEWARAN (KALENDER BALI)
 * ============================================================================
 * Berkas ini bertanggung jawab menghubungkan antarmuka React dengan endpoint
 * backend Go untuk perhitungan otonan serta master referensi wewaran.
 *
 * Seluruh fungsi di sini memanfaatkan instance Axios terpusat (`apiClient`)
 * yang sudah dikonfigurasi dengan baseURL `/api/v1` dan penanganan error standar.
 * ============================================================================
 */

// ============================================================================
// 1. Endpoint Utama: Pencarian Jadwal Otonan
// ============================================================================

/**
 * searchOtonan memanggil endpoint:
 *   GET /api/v1/search/otonan
 *
 * Fungsi ini menangani dua skenario input:
 *  1. Berdasarkan Tanggal Lahir (Masehi + waktu lahir < 06.00 WITA)
 *  2. Berdasarkan Kombinasi Wewaran Manual (SaptawaraID + PancawaraID + WukuID)
 *
 * Backend Go menghitung tanggal otonan secara matematis (O(1)) berbasis siklus 210 hari
 * dan mengembalikan daftar tanggal otonan yang jatuh pada tahun target.
 *
 * @param params Objek parameter pencarian (OtonanSearchParams)
 * @returns Promise berisi OtonanResponseData (input yang dinormalisasi, hasil[], dan penjelasan)
 */
export async function searchOtonan(params: OtonanSearchParams): Promise<OtonanResponseData> {
  // Susun query parameters bersih (eliminasi nilai undefined / string kosong)
  const queryParams: Record<string, any> = {
    tipe_pencarian: params.tipe_pencarian,
    tahun_target: params.tahun_target,
  };

  if (params.tipe_pencarian === 'tanggal_lahir') {
    queryParams.tanggal_lahir = params.tanggal_lahir;
    queryParams.sebelum_jam_6 = Boolean(params.sebelum_jam_6);
  } else if (params.tipe_pencarian === 'elemen_kalender') {
    queryParams.saptawara_id = params.saptawara_id;
    queryParams.pancawara_id = params.pancawara_id;
    queryParams.wuku_id = params.wuku_id;
  }

  const response = await apiClient.get<OtonanAPIEnvelope>('/search/otonan', {
    params: queryParams,
  });

  // Validasi apakah respons backend menyertakan data
  if (!response.data || !response.data.data) {
    throw new Error('Data perhitungan otonan tidak ditemukan');
  }

  return response.data.data;
}

// ============================================================================
// 2. Endpoint Master Referensi: Dropdown Wewaran Manual
// ============================================================================

/**
 * fetchMasterWewaran memanggil endpoint:
 *   GET /api/v1/keterangan/types/{typeCode}
 *
 * Digunakan untuk mengisi opsi dropdown pada tab "Wewaran manual":
 *  - 'saptawara' -> 7 hari (Redite s.d. Saniscara beserta ID)
 *  - 'pancawara' -> 5 hari (Umanis s.d. Kliwon beserta ID)
 *  - 'wuku'      -> 30 wuku (Sinta s.d. Watugunung beserta ID)
 *
 * @param typeCode Jenis kategori wewaran yang diminta
 * @returns Promise berisi array MasterWewaranItem siap pakai untuk <select>
 */
export async function fetchMasterWewaran(
  typeCode: 'saptawara' | 'pancawara' | 'wuku'
): Promise<MasterWewaranItem[]> {
  const response = await apiClient.get(`/keterangan/types/${typeCode}`);

  const values = response.data?.data?.values;
  if (!Array.isArray(values)) {
    return [];
  }

  // Petakan data ke struktur ringkas MasterWewaranItem
  return values.map((val: any) => ({
    id: String(val.id),
    name: String(val.name),
    description: val.description ? String(val.description).trim() : undefined,
  }));
}

// ============================================================================
// 3. Endpoint Sinkronisasi: Pengambilan Sasih Resmi Hari Otonan
// ============================================================================

/**
 * fetchOtonanDaySasih mengambil nama Sasih resmi untuk tanggal tertentu
 * langsung dari mesin kalender Go:
 *   GET /api/v1/kalender?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Hal ini memastikan nama Sasih yang ditampilkan di kartu otonan 100% konsisten
 * dengan penanggalan Sasih resmi Kalender Bali (misal: "Kalima", "Kasa", dll)
 * tanpa perlu menduplikasi rumus peredaran bulan di frontend.
 *
 * @param dateStr Tanggal Masehi dalam format YYYY-MM-DD
 * @returns Promise berisi nama sasih (contoh: "Kalima") atau string kosong jika gagal
 */
export async function fetchOtonanDaySasih(dateStr: string): Promise<string> {
  try {
    const response = await apiClient.get('/kalender', {
      params: {
        start_date: dateStr,
        end_date: dateStr,
      },
    });

    const dayData = response.data?.data?.[0];
    const namaSasih = dayData?.sasih?.nama_sasih;

    if (namaSasih && typeof namaSasih === 'string') {
      // Kapitalisasi huruf pertama (contoh: "kalima" -> "Kalima")
      return namaSasih.charAt(0).toUpperCase() + namaSasih.slice(1);
    }

    return '';
  } catch {
    // Jika ada gangguan jaringan ringan, kembalikan string kosong secara aman
    return '';
  }
}

// ============================================================================
// 4. Endpoint Pengambilan Data Lengkap Wariga Kalender Harian
// ============================================================================

/**
 * fetchDayWariga mengambil data wariga lengkap (wewaran 10 siklus, sasih, pengalantaka)
 * untuk tanggal tertentu dari endpoint GET /api/v1/kalender.
 * Digunakan untuk mengisi modal dialog "Detail Wariga".
 *
 * @param dateStr Tanggal Masehi dalam format YYYY-MM-DD
 * @returns Promise berisi objek KalenderHarian atau null jika gagal
 */
export async function fetchDayWariga(dateStr: string): Promise<any | null> {
  try {
    const response = await apiClient.get('/kalender', {
      params: {
        start_date: dateStr,
        end_date: dateStr,
      },
    });

    return response.data?.data?.[0] || null;
  } catch {
    return null;
  }
}

// ============================================================================
// 5. Endpoint Penjelasan Makna Nilai Elemen Wariga
// ============================================================================

export interface KeteranganItemDetail {
  id?: string;
  name: string;
  description: string;
  typeName?: string;
  typeCode?: string;
}

/**
 * fetchKeteranganValueByName mengambil penjelasan filosofis/makna dari suatu elemen wariga
 * (misal: Saptawara "Anggara", Wuku "Krulut", Lintang "Puwuh Atarung", dll)
 * dari backend Go (GET /api/v1/keterangan/types/{typeCode} atau GET /api/v1/keterangan/search).
 */
export async function fetchKeteranganValueByName(
  typeCode: string,
  name: string
): Promise<KeteranganItemDetail | null> {
  if (!name) return null;
  const cleanName = name.trim().toLowerCase();

  try {
    // 1. Coba ambil dari master kategori: /keterangan/types/{typeCode}
    if (typeCode) {
      try {
        const res = await apiClient.get(`/keterangan/types/${typeCode}`);
        const values = res.data?.data?.values;
        if (Array.isArray(values)) {
          const match = values.find(
            (v: any) =>
              v.name?.toLowerCase().trim() === cleanName ||
              (Array.isArray(v.aliases) && v.aliases.includes(cleanName))
          );
          if (match) {
            return {
              id: String(match.id),
              name: match.name,
              description: match.description || '',
              typeName: res.data?.data?.type?.name,
              typeCode: typeCode,
            };
          }
        }
      } catch {
        // Lanjutkan ke pencarian fleksibel
      }
    }

    // 2. Pencarian fleksibel: /keterangan/search?q={name}
    const searchRes = await apiClient.get('/keterangan/search', {
      params: { q: name },
    });
    const matches = searchRes.data?.data;
    if (Array.isArray(matches) && matches.length > 0) {
      const exactTypeMatch = matches.find(
        (m: any) =>
          m.type_code === typeCode ||
          m.name?.toLowerCase().trim() === cleanName ||
          (Array.isArray(m.aliases) && m.aliases.includes(cleanName))
      );
      const chosen = exactTypeMatch || matches[0];
      return {
        id: String(chosen.id),
        name: chosen.name,
        description: chosen.description || '',
        typeName: chosen.type_name,
        typeCode: chosen.type_code,
      };
    }

    return null;
  } catch {
    return null;
  }
}


