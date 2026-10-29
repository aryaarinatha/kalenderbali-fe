import { apiClient } from '@/lib/axios';
import type {
  PuraBackendItem,
  PuraFilterParams,
  PuraFinanceCategory,
  PuraFinanceEntry,
  PuraFinanceSummary,
  CreateFinanceEntryPayload,
  UpdateFinanceEntryPayload,
  PuraPiodalanRecord,
  PuraAcaraItem,
  CreatePiodalanPayload,
  CreateAcaraPayload,
} from '../types/kelolaPura.types';

/**
 * ==============================================================================
 * LAPISAN API: Fitur Kelola Pura (Kalender Bali Digital)
 * ==============================================================================
 * Jembatan komunikasi HTTP antara antarmuka React dengan seluruh endpoint Backend Go
 * terkait Pura, Piodalan, Acara, dan Transparansi Kas Keuangan Pura.
 *
 * Menerapkan prinsip:
 * 1. 100% Real API: Mengonsumsi langsung endpoint resmi backend Go tanpa data palsu.
 * 2. Token JWT Otomatis: apiClient otomatis melampirkan header Authorization.
 * 3. Graceful Error Handling: Mengembalikan array kosong atau null jika terjadi error.
 * ==============================================================================
 */

// ==============================================================================
// 1. ENDPOINT DATA INDUK PURA
// ==============================================================================

/**
 * fetchPuraList mengambil seluruh daftar master pura resmi dari backend Go:
 * GET /api/v1/puras
 * Mendukung filter parameter nama (q), tipe pura (type), dan kabupaten (city).
 */
export async function fetchPuraList(params?: PuraFilterParams): Promise<PuraBackendItem[]> {
  try {
    const queryParams: Record<string, string> = {};
    if (params?.q?.trim()) queryParams.q = params.q.trim();
    if (params?.type && params.type !== 'Semua') queryParams.type = params.type;
    if (params?.city && params.city !== 'Semua') queryParams.city = params.city;
    if (params?.province) queryParams.province = params.province;

    const response = await apiClient.get('/puras', { params: queryParams });
    const items = response.data?.data;
    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error('Gagal mengambil daftar pura dari backend:', error);
    return [];
  }
}

/**
 * fetchPuraDetail mengambil data lengkap satu pura tertentu:
 * GET /api/v1/puras/:id
 */
export async function fetchPuraDetail(id: number | string): Promise<PuraBackendItem | null> {
  try {
    const response = await apiClient.get(`/puras/${id}`);
    return response.data?.data || null;
  } catch (error) {
    console.error(`Gagal mengambil detail pura ID ${id}:`, error);
    return null;
  }
}

// ==============================================================================
// 2. ENDPOINT PIODALAN & ACARA UPACARA
// ==============================================================================

/**
 * fetchPuraPiodalans mengambil jadwal upacara piodalan untuk pura tertentu:
 * GET /api/v1/puras/:id/piodalans
 */
export async function fetchPuraPiodalans(puraId: number | string): Promise<PuraPiodalanRecord[]> {
  try {
    const response = await apiClient.get(`/puras/${puraId}/piodalans`);
    const data = response.data?.data;
    if (!Array.isArray(data)) return [];
    return data.map((item: Record<string, unknown>) => ({
      ...item,
      ceremony_date: String(item.ceremony_date || item.date || ''),
      date: String(item.date || item.ceremony_date || ''),
      ceremony_level_name: String(item.ceremony_level_name || item.level || ''),
      level: String(item.level || item.ceremony_level_name || ''),
      ceremony_level_id: (item.ceremony_level_id ?? item.level_id ?? null) as number | null,
      level_id: (item.level_id ?? item.ceremony_level_id ?? null) as number | null,
    })) as PuraPiodalanRecord[];
  } catch (error) {
    console.error(`Gagal mengambil piodalan pura ID ${puraId}:`, error);
    return [];
  }
}

/**
 * fetchPiodalanAcaras mengambil susunan tahapan acara piodalan (Melasti, Puncak, Nyineb):
 * GET /api/v1/piodalans/:id/acaras
 */
export async function fetchPiodalanAcaras(piodalanId: number | string): Promise<PuraAcaraItem[]> {
  try {
    const response = await apiClient.get(`/piodalans/${piodalanId}/acaras`);
    const data = response.data?.data;
    if (!Array.isArray(data)) return [];
    return data.map((item: Record<string, unknown>) => ({
      ...item,
      ceremony_level_name: String(item.ceremony_level_name || item.level || ''),
      level: String(item.level || item.ceremony_level_name || ''),
      ceremony_level_id: (item.ceremony_level_id ?? item.level_id ?? null) as number | null,
      level_id: (item.level_id ?? item.ceremony_level_id ?? null) as number | null,
    })) as PuraAcaraItem[];
  } catch (error) {
    console.error(`Gagal mengambil tahapan acara piodalan ID ${piodalanId}:`, error);
    return [];
  }
}

/**
 * createPuraPiodalan membuat entri siklus piodalan baru untuk pura tertentu:
 * POST /api/v1/puras/:id/piodalans
 */
export async function createPuraPiodalan(
  puraId: number | string,
  payload: CreatePiodalanPayload
): Promise<PuraPiodalanRecord> {
  const response = await apiClient.post(`/puras/${puraId}/piodalans`, payload);
  const item = response.data?.data;
  if (!item) return response.data?.data;
  return {
    ...item,
    ceremony_date: String(item.ceremony_date || item.date || ''),
    date: String(item.date || item.ceremony_date || ''),
    ceremony_level_name: String(item.ceremony_level_name || item.level || ''),
    level: String(item.level || item.ceremony_level_name || ''),
  } as PuraPiodalanRecord;
}

/**
 * deletePuraPiodalan menghapus data riwayat piodalan dari database:
 * DELETE /api/v1/piodalans/:id
 */
export async function deletePuraPiodalan(piodalanId: number | string): Promise<boolean> {
  await apiClient.delete(`/piodalans/${piodalanId}`);
  return true;
}

/**
 * createPiodalanAcara menambahkan satu tahapan susunan acara ke siklus piodalan:
 * POST /api/v1/piodalans/:id/acaras
 */
export async function createPiodalanAcara(
  piodalanId: number | string,
  payload: CreateAcaraPayload
): Promise<PuraAcaraItem> {
  const response = await apiClient.post(`/piodalans/${piodalanId}/acaras`, payload);
  return response.data?.data;
}

/**
 * deletePiodalanAcara menghapus tahapan acara piodalan dari database:
 * DELETE /api/v1/acaras/:id
 */
export async function deletePiodalanAcara(acaraId: number | string): Promise<boolean> {
  await apiClient.delete(`/acaras/${acaraId}`);
  return true;
}

// ==============================================================================
// 3. ENDPOINT TRANSPARANSI KAS KEUANGAN PURA
// ==============================================================================

/**
 * fetchFinanceCategories mengambil master kategori keuangan:
 * GET /api/v1/finance/categories
 */
export async function fetchFinanceCategories(): Promise<PuraFinanceCategory[]> {
  try {
    const response = await apiClient.get('/finance/categories');
    const data = response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Gagal mengambil kategori keuangan:', error);
    return [];
  }
}

/**
 * fetchPuraFinance mengambil seluruh baris transaksi mutasi kas pura:
 * GET /api/v1/puras/:id/finance
 * Dapat difilter berdasarkan tahun (year), kategori (category_id), dan jenis (entry_type).
 */
export async function fetchPuraFinance(
  puraId: number | string,
  year?: number | string,
  categoryId?: number | string,
  entryType?: string
): Promise<PuraFinanceEntry[]> {
  try {
    const params: Record<string, string | number> = {};
    if (year && year !== 'Semua') params.year = year;
    if (categoryId && categoryId !== 'Semua') params.category_id = categoryId;
    if (entryType && entryType !== 'Semua') params.entry_type = entryType;

    const response = await apiClient.get(`/puras/${puraId}/finance`, { params });
    const data = response.data?.data;
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`Gagal mengambil riwayat kas pura ID ${puraId}:`, error);
    return [];
  }
}

/**
 * fetchPuraFinanceSummary mengambil ringkasan matematis kas pura (Total Debit, Kredit, Saldo, % Kategori):
 * GET /api/v1/puras/:id/finance/summary
 */
export async function fetchPuraFinanceSummary(
  puraId: number | string,
  year?: number | string,
  categoryId?: number | string
): Promise<PuraFinanceSummary | null> {
  try {
    const params: Record<string, string | number> = {};
    if (year && year !== 'Semua') params.year = year;
    if (categoryId && categoryId !== 'Semua') params.category_id = categoryId;

    const response = await apiClient.get(`/puras/${puraId}/finance/summary`, { params });
    return response.data?.data || null;
  } catch (error) {
    console.error(`Gagal mengambil ringkasan kas pura ID ${puraId}:`, error);
    return null;
  }
}

// ==============================================================================
// 4. ENDPOINT MUTASI KAS ADMINISTRATOR (CRUD LANGSUNG)
// ==============================================================================

/**
 * createFinanceEntry mencatat mutasi kas baru langsung ke database (Khusus Admin):
 * POST /api/v1/puras/:id/finance
 */
export async function createFinanceEntry(
  puraId: number | string,
  payload: CreateFinanceEntryPayload
): Promise<PuraFinanceEntry> {
  const response = await apiClient.post(`/puras/${puraId}/finance`, payload);
  return response.data?.data;
}

/**
 * updateFinanceEntry mengubah catatan mutasi kas yang ada (Khusus Admin):
 * PUT /api/v1/finance/:id
 */
export async function updateFinanceEntry(
  entryId: number | string,
  payload: UpdateFinanceEntryPayload
): Promise<PuraFinanceEntry> {
  const response = await apiClient.put(`/finance/${entryId}`, payload);
  return response.data?.data;
}

/**
 * deleteFinanceEntry menghapus transaksi kas dari database (Khusus Admin):
 * DELETE /api/v1/finance/:id
 */
export async function deleteFinanceEntry(entryId: number | string): Promise<void> {
  await apiClient.delete(`/finance/${entryId}`);
}

