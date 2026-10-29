/**
 * ==============================================================================
 * TIPE DATA: Kelola Pura (Kalender Bali Digital)
 * ==============================================================================
 * Berkas ini mendefinisikan seluruh antarmuka (interface) data resmi yang
 * dikonsumsi dari Backend Go serta state antarmuka untuk fitur Kelola Pura.
 *
 * Menerapkan prinsip:
 * 1. Single Source of Truth: Struktur selaras persis dengan domain & DTO Go.
 * 2. Keamanan Presisi ID: ID menggunakan format number/string aman.
 * 3. Strict Typing: Tidak menggunakan tipe 'any' untuk mencegah bug runtime.
 * ==============================================================================
 */

// ==============================================================================
// 1. TIPE TAMPILAN (VIEW MODE) ORKESTRATOR
// ==============================================================================

/**
 * Mode tampilan sub-halaman pada orkestrator KelolaPuraPage:
 * - 'list': Katalog utama pencarian & kartu pura
 * - 'piodalan': Rincian jadwal upacara piodalan & susunan acara pura terpilih
 * - 'keuangan': Laporan transparansi kas pura (Saldo, Punia, Belanja, Mutasi)
 */
export type PuraViewMode = 'list' | 'piodalan' | 'keuangan';

// ==============================================================================
// 2. STRUKTUR DATA PURA (SESUAI RESPONSE BACKEND GO)
// ==============================================================================

/**
 * Tipe data Pura lengkap dari endpoint backend Go:
 * GET /api/v1/puras & GET /api/v1/puras/:id
 */
export interface PuraBackendItem {
  /** ID unik pura dari database PostgreSQL */
  id: number;

  /** Nama lengkap pura (contoh: Pura Penataran Agung) */
  name: string;

  /** Klasifikasi tipe pura (Kahyangan Jagat, Kahyangan Tiga, Kawitan, Swagina, Suka Duka) */
  type: string;

  /** Status publikasi (Published, Review, Rejected) */
  status: string;

  /** Nomor telepon kontak penanggungjawab (opsional) */
  phone?: string | null;

  /** Alamat fisik jalan / banjar */
  address?: string | null;

  /** Nama kabupaten / kota (contoh: KABUPATEN GIANYAR) */
  city?: string | null;
  city_id?: number | null;

  /** Nama provinsi (contoh: BALI) */
  province?: string | null;
  province_id?: number | null;

  /** Nama negara (contoh: Indonesia) */
  country?: string | null;
  country_id?: number | null;

  /** Tautan peta lokasi Google Maps eksternal */
  location_url?: string | null;

  /** Titik koordinat latitude peta */
  latitude?: number | null;

  /** Titik koordinat longitude peta */
  longitude?: number | null;

  /** Dasar penentuan piodalan: 'Pawukon' (siklus 210 hari) atau 'Sasih' (fase bulan candra) */
  benchmark?: string | null;

  /** Elemen penanggalan piodalan jika berbasis Pawukon */
  wuku?: string | null;
  saptawara?: string | null;
  pancawara?: string | null;

  /** Elemen penanggalan piodalan jika berbasis Sasih */
  sasih?: string | null;
  purnama_tilem?: string | null;

  /** Nilai angka urip/bobot piodalan */
  value?: number | null;

  /** Waktu pencatatan di database */
  created_at?: string;
  updated_at?: string;
}

/**
 * Parameter filter pencarian pada katalog pura:
 */
export interface PuraFilterParams {
  /** Kata kunci pencarian nama pura atau banjar */
  q?: string;

  /** Filter tipe pura spesifik */
  type?: string;

  /** Filter kabupaten/kota tertentu di Bali */
  city?: string;

  /** Filter provinsi */
  province?: string;
}

// ==============================================================================
// 3. STRUKTUR DATA KEUANGAN PURA (MUTASI, SUMMARY, & KATEGORI)
// ==============================================================================

/**
 * Kategori transaksi kas pura (dari GET /api/v1/finance/categories)
 */
export interface PuraFinanceCategory {
  id: number;
  name: string;
}

/**
 * Satu baris entri mutasi kas pura (dari GET /api/v1/puras/:id/finance)
 */
export interface PuraFinanceEntry {
  /** ID unik mutasi transaksi */
  id: number;

  /** ID pura yang memiliki catatan ini */
  pura_id: number;

  /** ID kategori transaksi (Banten, Punia, Renovasi, dll) */
  category_id: number;

  /** Nama kategori transaksi */
  category_name: string;

  /** Tanggal transaksi (format ISO YYYY-MM-DD) */
  transaction_date: string;

  /** Jenis arus kas: 'debit' (punia/masuk) atau 'kredit' (pengeluaran/keluar) */
  entry_type: 'debit' | 'kredit';

  /** Jumlah nominal uang dalam Rupiah */
  amount: number;

  /** Catatan rincian keperluan transaksi */
  note: string;

  created_at?: string;
  updated_at?: string;
}

/**
 * Ringkasan persentase transaksi per kategori
 */
export interface PuraFinanceCategorySummary {
  category_name: string;
  total_amount: number;
  percentage: number;
}

/**
 * Ringkasan total kalkulasi kas pura dari backend Go:
 * GET /api/v1/puras/:id/finance/summary
 */
export interface PuraFinanceSummary {
  /** Daftar seluruh entri transaksi */
  entries: PuraFinanceEntry[];

  /** Total uang masuk (punia/dana masuk) */
  total_debit: number;

  /** Total uang keluar (belanja upakara/operasional) */
  total_kredit: number;

  /** Sisa saldo kas riil (debit - kredit) */
  saldo: number;

  /** Rincian pembagian persentase kategori pemasukan */
  debit_per_category: PuraFinanceCategorySummary[];

  /** Rincian pembagian persentase kategori pengeluaran */
  kredit_per_category: PuraFinanceCategorySummary[];
}

/**
 * Payload pengiriman mutasi kas baru langsung oleh Admin:
 * POST /api/v1/puras/:id/finance
 */
export interface CreateFinanceEntryPayload {
  pura_id: number;
  category_id: number;
  transaction_date: string;
  entry_type: 'debit' | 'kredit';
  amount: number;
  note?: string;
}

/**
 * Payload pembaruan transaksi kas oleh Admin:
 * PUT /api/v1/finance/:id
 */
export interface UpdateFinanceEntryPayload {
  category_id?: number;
  transaction_date?: string;
  entry_type?: 'debit' | 'kredit';
  amount?: number;
  note?: string;
}

/**
 * Data draf usulan perubahan kas yang dikirimkan oleh Member (Premium)
 * untuk ditinjau dan disetujui (Approve) atau ditolak (Reject) oleh Admin:
 */
export interface FinanceSubmission {
  id: string;
  pura_id: number;
  pura_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  entry_type: 'debit' | 'kredit';
  amount: number;
  category_id: number;
  category_name: string;
  transaction_date: string;
  note: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

// ==============================================================================
// 4. STRUKTUR DATA PIODALAN & ACARA PURA
// ==============================================================================

/**
 * Riwayat pelaksanaan upacara piodalan pura dari database:
 * GET /api/v1/puras/:id/piodalans
 */
export interface PuraPiodalanRecord {
  id: number;
  pura_id: number;
  date?: string;
  ceremony_date?: string;
  description: string;
  ceremony_level_id?: number | null;
  level_id?: number | null;
  ceremony_level_name?: string;
  level?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Rincian tahapan susunan acara piodalan (Melasti, Puncak, Nyineb):
 * GET /api/v1/piodalans/:id/acaras
 */
export interface PuraAcaraItem {
  id: number;
  piodalan_id: number;
  pura_id: number;
  event_at: string;
  name: string;
  ceremony_level_id?: number | null;
  level_id?: number | null;
  ceremony_level_name?: string;
  level?: string;
  pic_name?: string;
  pic_phone?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Payload pengiriman data pembuatan siklus piodalan baru (Admin):
 * POST /api/v1/puras/:id/piodalans
 */
export interface CreatePiodalanPayload {
  date: string;
  description?: string;
  level_id?: number | null;
}

/**
 * Payload pengiriman data pembuatan tahapan acara piodalan baru (Admin):
 * POST /api/v1/piodalans/:id/acaras
 */
export interface CreateAcaraPayload {
  event_at: string;
  name: string;
  level_id?: number | null;
  pic_name?: string;
  pic_phone?: string;
}

/**
 * Usulan jadwal piodalan baru yang diajukan oleh Member:
 */
export interface PiodalanSubmission {
  id: string;
  pura_id: number;
  pura_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  ceremony_date: string;
  description: string;
  level_id?: number | null;
  level_name?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

/**
 * Usulan tahapan susunan acara piodalan yang diajukan oleh Member:
 */
export interface AcaraSubmission {
  id: string;
  piodalan_id: number;
  pura_id: number;
  pura_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  name: string;
  event_at: string;
  level_id?: number | null;
  level_name?: string;
  pic_name?: string;
  pic_phone?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

