import { apiClient } from '@/lib/axios';
import type { KalenderHarian } from '@/features/kalender/types/kalender.types';
import type {
  PuraBackendItem,
  MasterDropdownOption,
  PuraPiodalanRecord,
  PiodalanAcaraItem,
  PiodalanSearchParams,
  BackendPiodalanSearchResult,
} from '../types/piodalan.types';

/**
 * ==============================================================================
 * LAPISAN API: FITUR PIODALAN (Kalender Bali)
 * ==============================================================================
 * Berkas ini bertindak sebagai jembatan komunikasi antara antarmuka React
 * dengan seluruh endpoint Backend Go terkait Piodalan, Pura, dan Kalender Wariga.
 *
 * Menerapkan prinsip:
 * 1. Zero Duplicate Logic: Mengonsumsi data resmi backend tanpa meniru rumus kalender di frontend.
 * 2. Hemat Bandwidth (1-Year Chunking): Menggunakan caching cerdas TanStack Query.
 * 3. Graceful Fallback: Menangani status kosong atau error secara aman tanpa crash.
 * ==============================================================================
 */

// ==============================================================================
// 1. ENDPOINT MASTER DATA PURA RESMI (GET /api/v1/puras)
// ==============================================================================

/**
 * fetchPuraList mengambil seluruh daftar pura resmi dari backend Go:
 * GET /api/v1/puras
 *
 * Mengembalikan 461 data pura lengkap dengan lokasi (kabupaten/kota), tipe pura,
 * peta Google Maps, dan aturan observasi piodalannya (wuku, saptawara, pancawara, sasih).
 *
 * @param searchQuery Kata kunci pencarian opsional (nama pura / wilayah)
 * @returns Promise berisi array PuraBackendItem
 */
export async function fetchPuraList(searchQuery?: string): Promise<PuraBackendItem[]> {
  const params: Record<string, string> = {};
  if (searchQuery && searchQuery.trim()) {
    params.q = searchQuery.trim();
  }

  const response = await apiClient.get('/puras', { params });
  const items = response.data?.data;

  if (!Array.isArray(items)) {
    return [];
  }

  return items;
}

/**
 * fetchPuraDetail mengambil data lengkap satu pura tertentu:
 * GET /api/v1/puras/:id
 *
 * @param id Nomor pengenal unik pura
 * @returns Promise berisi PuraBackendItem atau null jika tidak ditemukan
 */
export async function fetchPuraDetail(id: number | string): Promise<PuraBackendItem | null> {
  try {
    const response = await apiClient.get(`/puras/${id}`);
    return response.data?.data || null;
  } catch {
    return null;
  }
}

// ==============================================================================
// 2. ENDPOINT MASTER REFERENSI DROPDOWN WEWARAN (GET /api/v1/keterangan/types/:type)
// ==============================================================================

/**
 * fetchMasterDropdown mengambil opsi dropdown untuk form pencarian wewaran:
 * GET /api/v1/keterangan/types/{typeCode}
 *
 * - 'saptawara': 7 hari peredaran matahari (Redite s.d. Saniscara)
 * - 'pancawara': 5 hari peredaran bumi (Umanis s.d. Kliwon)
 * - 'wuku': 30 wuku siklus Pawukon (Sinta s.d. Watugunung)
 * - 'sasih': 12 sasih penanggalan candra (Kasa s.d. Sada)
 *
 * @param typeCode Kategori wewaran yang diminta
 * @returns Promise berisi array MasterDropdownOption
 */
export async function fetchMasterDropdown(
  typeCode: 'saptawara' | 'pancawara' | 'wuku' | 'sasih'
): Promise<MasterDropdownOption[]> {
  try {
    const response = await apiClient.get(`/keterangan/types/${typeCode}`);
    const values = response.data?.data?.values;

    if (!Array.isArray(values)) {
      return [];
    }

    return values.map((val: Record<string, unknown>) => ({
      id: String(val.id),
      name: String(val.name),
      description: val.description ? String(val.description).trim() : undefined,
    }));
  } catch {
    return [];
  }
}

// ==============================================================================
// 3. ENDPOINT KALKULASI TANGGAL MASEHI PIODALAN (GET /api/v1/search/otonan)
// ==============================================================================

/**
 * fetchPiodalanDates memanfaatkan mesin kalender backend Go untuk menghitung
 * tanggal Masehi di tahun target di mana kombinasi wewaran tersebut jatuh:
 * GET /api/v1/search/otonan?tipe_pencarian=elemen_kalender&...
 *
 * Backend Go menghitung secara O(1) berbasis siklus 210 hari Pawukon.
 * Contoh: Buda (481) + Wage (433) + Klawu (524) di tahun 2026
 * mengembalikan: ["2026-03-18", "2026-10-14"]
 *
 * @param saptawaraId ID database elemen Saptawara
 * @param pancawaraId ID database elemen Pancawara
 * @param wukuId ID database elemen Wuku
 * @param targetYear Tahun Masehi tujuan (contoh: 2026)
 * @returns Promise berisi array tanggal string ISO (YYYY-MM-DD)
 */
export async function fetchPiodalanDates(
  saptawaraId: string,
  pancawaraId: string,
  wukuId: string,
  targetYear: number
): Promise<string[]> {
  try {
    const response = await apiClient.get('/search/otonan', {
      params: {
        tipe_pencarian: 'elemen_kalender',
        saptawara_id: saptawaraId,
        pancawara_id: pancawaraId,
        wuku_id: wukuId,
        tahun_target: targetYear,
      },
    });

    const hasilList = response.data?.data?.hasil;
    if (!Array.isArray(hasilList)) {
      return [];
    }

    // Ekstrak string tanggal YYYY-MM-DD
    return hasilList
      .map((item: Record<string, unknown>) => String(item.tanggal || ''))
      .filter((dateStr: string) => Boolean(dateStr));
  } catch {
    // Jika kombinasi tidak valid menurut kalender Pawukon, kembalikan array kosong secara aman
    return [];
  }
}

// ==============================================================================
// 4. ENDPOINT SECTION 1: DETAIL WARIGA TANGGAL (GET /api/v1/kalender)
// ==============================================================================

/**
 * fetchDayWariga mengambil data penanggalan Wariga lengkap (15 dimensi kalender)
 * untuk tanggal tertentu dari endpoint harian kalender:
 * GET /api/v1/kalender?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
 *
 * Digunakan untuk mengisi Section 1 (Detail Wariga) sesuai Gambar 1 & 2:
 * - Tahun Saka & Sasih (Ekawara s.d. Dwiwara)
 * - Pengalantaka (Triwara & Caturwara)
 * - Wewaran (Pancawara s.d. Wuku, Ingkel, Jejepan, Lintang)
 * - Elemen Lainnya (Panca Sudha, Pangarasan, Rakam, Neptu, Zodiak, Pratiti)
 *
 * @param dateStr Tanggal Masehi dalam format YYYY-MM-DD
 * @returns Promise berisi objek data harian kalender atau null
 */
export async function fetchDayWariga(dateStr: string): Promise<KalenderHarian | null> {
  try {
    const response = await apiClient.get('/kalender', {
      params: {
        start_date: dateStr,
        end_date: dateStr,
      },
    });

    return (response.data?.data?.[0] as KalenderHarian) || null;
  } catch {
    return null;
  }
}

// ==============================================================================
// 5. ENDPOINT SECTION 2: RANGKAIAN ACARA & JAM PURA (KONTRIBUSI KONTRIBUTOR)
// ==============================================================================

/**
 * fetchPuraPiodalans mengambil riwayat/agenda kegiatan piodalan suatu pura:
 * GET /api/v1/puras/:id/piodalans
 *
 * Data ini diinput oleh kontributor pura terverifikasi.
 * Jika kontributor belum menginput data, endpoint mengembalikan array kosong [].
 *
 * @param puraId ID pura yang diperiksa
 * @returns Promise berisi array PuraPiodalanRecord
 */
export async function fetchPuraPiodalans(puraId: number | string): Promise<PuraPiodalanRecord[]> {
  try {
    const response = await apiClient.get(`/puras/${puraId}/piodalans`);
    const data = response.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * fetchPiodalanAcaras mengambil rincian tahapan acara dan jam dari suatu kegiatan piodalan:
 * GET /api/v1/piodalans/:id/acaras
 *
 * Menghasilkan susunan acara (Melasti, Puncak Karya, Nyineb) beserta jam WITA dan kontak PIC.
 * Jika belum diinput kontributor, mengembalikan array kosong [].
 *
 * @param piodalanId ID kegiatan piodalan
 * @returns Promise berisi array PiodalanAcaraItem
 */
export async function fetchPiodalanAcaras(
  piodalanId: number | string
): Promise<PiodalanAcaraItem[]> {
  try {
    const response = await apiClient.get(`/piodalans/${piodalanId}/acaras`);
    const data = response.data?.data;
    if (Array.isArray(data)) {
      return data;
    }
    return [];
  } catch {
    return [];
  }
}

// ==============================================================================
// 6. ENDPOINT PENJELASAN MAKNA ELEMEN WARIGA (SUB-MODAL PENJELASAN)
// ==============================================================================

export interface KeteranganElementExplanation {
  id?: string;
  name: string;
  description: string;
  typeName?: string;
  typeCode?: string;
}

/**
 * fetchWarigaElementExplanation mengambil makna filosofis dari nilai elemen kalender
 * (contoh: Saptawara 'Wraspati', Wuku 'Sungsang', Jejepan 'Taru', Panca Sudha 'Tunggak Semi')
 * dari katalog ensiklopedia backend:
 * GET /api/v1/keterangan/types/{typeCode} atau GET /api/v1/keterangan/search?q={name}
 *
 * Dipicu ketika pengguna mengklik baris panah (→) pada modal Section 1: Detail Wariga.
 *
 * @param typeCode Kode kategori wewaran (misal: 'saptawara', 'wuku', 'panca_sudha')
 * @param name Nama nilai elemen wariga (misal: 'Sungsang')
 * @returns Promise berisi KeteranganElementExplanation atau null
 */
export async function fetchWarigaElementExplanation(
  typeCode: string,
  name: string
): Promise<KeteranganElementExplanation | null> {
  if (!name) return null;
  const cleanName = name.trim().toLowerCase();

  try {
    // 1. Coba pencarian langsung ke tipe kategori jika typeCode tersedia
    if (typeCode) {
      try {
        const res = await apiClient.get(`/keterangan/types/${typeCode}`);
        const values = res.data?.data?.values;
        if (Array.isArray(values)) {
          const match = values.find(
            (v: Record<string, unknown>) =>
              String(v.name || '').toLowerCase().trim() === cleanName ||
              (Array.isArray(v.aliases) && (v.aliases as string[]).includes(cleanName))
          );
          if (match) {
            return {
              id: String(match.id),
              name: String(match.name),
              description: String(match.description || ''),
              typeName: String(res.data?.data?.type?.name || ''),
              typeCode: typeCode,
            };
          }
        }
      } catch {
        // Lanjutkan ke pencarian fleksibel
      }
    }

    // 2. Pencarian fleksibel lintas kategori: /keterangan/search?q={name}
    const searchRes = await apiClient.get('/keterangan/search', {
      params: { q: name },
    });
    const matches = searchRes.data?.data;
    if (Array.isArray(matches) && matches.length > 0) {
      const exactMatch = matches.find(
        (m: Record<string, unknown>) =>
          m.type_code === typeCode ||
          String(m.name || '').toLowerCase().trim() === cleanName ||
          (Array.isArray(m.aliases) && (m.aliases as string[]).includes(cleanName))
      );
      const chosen = exactMatch || matches[0];
      return {
        id: String(chosen.id),
        name: String(chosen.name),
        description: String(chosen.description || ''),
        typeName: String(chosen.type_name || ''),
        typeCode: String(chosen.type_code || ''),
      };
    }

    return null;
  } catch {
    return null;
  }
}

// ==============================================================================
// 7. MESIN PENCARIAN PIODALAN TERPADU BACKEND GO (GET /api/v1/search/piodalan)
// ==============================================================================

/**
 * searchPiodalan memanggil mesin pencarian piodalan terpadu backend Go:
 * GET /api/v1/search/piodalan
 *
 * Menggantikan beban iterasi 461 pura dan 365 hari kalender di memori browser.
 * Seluruh komputasi siklus 210 hari Pawukon, fase Sasih candra, dan penelusuran
 * database PostgreSQL dieksekusi secara instan dan efisien di server Go.
 *
 * Mendukung 4 skenario pencarian:
 * 1. Mode Wewaran ('wewaran'): saptawara, pancawara, wuku, tahun
 * 2. Mode Bulan ('bulan'): bulan (1-12), tahun
 * 3. Mode Pura ('pura'): q (kata kunci nama/lokasi) atau pura_id, tahun
 * 4. Mode Rentang ('rentang'): start_date, end_date (paritas legacy GET /api/cariPiodalan)
 *
 * @param params Objek parameter pencarian PiodalanSearchParams
 * @returns Promise berisi payload BackendPiodalanSearchResult atau null jika gagal
 */
export async function searchPiodalan(
  params: PiodalanSearchParams
): Promise<BackendPiodalanSearchResult | null> {
  try {
    const response = await apiClient.get('/search/piodalan', { params });
    const data = response.data?.data;
    if (!data) return null;
    return data as BackendPiodalanSearchResult;
  } catch (error) {
    console.error('Gagal melakukan pencarian piodalan ke backend Go:', error);
    return null;
  }
}
