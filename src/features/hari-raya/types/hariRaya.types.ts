/**
 * ============================================================================
 * TIPE DATA & KONTRAK FITUR HARI RAYA BALI
 * ============================================================================
 * Berkas ini mendefinisikan seluruh kontrak data (interface & types) untuk
 * modul Hari Raya Bali pada frontend React.
 *
 * Selaras dengan:
 *  - Skema JSON backend Go (internal/domain/hari_raya.go)
 *  - Prinsip arsitektur fe_strategy.md (keamanan presisi ID string 64-bit)
 *  - Standar UI/UX AGENTS.md (pilihan tampilan bulanan/tahunan, kategori semantik)
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Kontrak Master Hari Raya (GET /api/v1/hari-raya/master)
// ---------------------------------------------------------------------------

/**
 * HariRayaMasterItem merepresentasikan satu data master hari raya dari
 * basis data referensi (total 106 entitas resmi).
 * ID diserialisasikan sebagai string untuk mematuhi keamanan presisi angka IEEE-754 di JS.
 */
export interface HariRayaMasterItem {
  id: string;
  nama: string;
  simbol?: string;
  jenis: 'hari_raya' | 'rerainan' | string;
  keterangan?: string;
}

// ---------------------------------------------------------------------------
// 2. Kontrak Pencarian Spesifik Hari Raya (GET /api/v1/search/hari-raya)
// ---------------------------------------------------------------------------

/**
 * KejadianHariRayaDetail merangkum informasi satu kejadian jatuhnya hari raya,
 * lengkap dengan posisi Wewaran, Sasih, dan Pengalantaka pada hari tersebut.
 */
export interface KejadianHariRayaDetail {
  tanggal: string; // Format ISO: "YYYY-MM-DD"
  wuku: string;
  saptawara: string;
  pancawara: string;
  sasih: {
    no_sasih: number;
    nama_sasih: string;
    tahun_saka: number;
  };
  pengalantaka: {
    pengalantaka: string;
    penanggal_1: number;
    penanggal_2: number;
    purnama_tilem: string;
  };
}

/**
 * HariRayaSearchResponse merepresentasikan amplop data hasil pencarian
 * tanggal jatuh suatu hari raya spesifik dari backend Go.
 */
export interface HariRayaSearchResponse {
  hari_raya: HariRayaMasterItem;
  tahun_target: number;
  total_jatuh: number;
  kejadian: KejadianHariRayaDetail[];
}

// ---------------------------------------------------------------------------
// 3. State & Parameter Filter Pencarian di Antarmuka Pengguna
// ---------------------------------------------------------------------------

/**
 * Mode tampilan jadwal hari raya pada halaman:
 * - 'bulanan': Menampilkan daftar hari raya pada bulan terpilih (default).
 * - 'tahunan': Menampilkan seluruh agenda hari raya sepanjang tahun (Januari s.d. Desember).
 */
export type HariRayaViewMode = 'bulanan' | 'tahunan';

/**
 * HariRayaFilterState menampung parameter aktif yang dipilih oleh pengguna
 * melalui form filter dan disinkronisasikan ke query string URL.
 */
export interface HariRayaFilterState {
  year: number;
  month: number; // 1 s.d. 12
  viewMode: HariRayaViewMode;
  holidayName: string; // "all" untuk semua hari raya, atau nama hari raya spesifik
}

// ---------------------------------------------------------------------------
// 4. Model Tampilan Kartu Hari Raya (UI Presentation Model)
// ---------------------------------------------------------------------------

/**
 * Kategori badge visual untuk menandai jenis hari raya secara kultural:
 * - 'Tumpek'   : Perayaan siklus 210 hari Saniscara Kliwon (Tumpek Landep, Uye, dsb.)
 * - 'Kajeng'   : Pertemuan Triwara Pasah & Pancawara Kliwon (Kajeng Kliwon)
 * - 'Bulan'    : Fase bulan astronomis (Purnama & Tilem)
 * - 'Wewaran'  : Pertemuan wewaran sakral (Buda Kliwon, Anggara Kasih, Buda Cemeng)
 * - 'Rahina'   : Piodalan rahina suci (Saraswati, Pagerwesi, Hari Bhatari Sri)
 */
export type HariRayaCategoryTag = 'Tumpek' | 'Kajeng' | 'Bulan' | 'Wewaran' | 'Rahina';

/**
 * Varian warna kartu dan tanggal sesuai palet resmi AGENTS.md:
 * - 'gold'   : Purnama, Galungan, Kuningan, Nyepi
 * - 'rose'   : Tilem, Kajeng Kliwon
 * - 'mint'   : Tumpek, Buda Kliwon
 * - 'purple' : Rahina Bhatari Sri, Saraswati
 * - 'emerald': Wewaran berkah / Dewasa Ayu
 */
export type HariRayaBadgeVariant = 'gold' | 'rose' | 'mint' | 'purple' | 'emerald';

/**
 * HariRayaCardItem merepresentasikan satu kartu hari raya yang siap
 * dirender ke dalam grid daftar hari raya.
 */
export interface HariRayaCardItem {
  id: string;
  tanggal: string; // "YYYY-MM-DD"
  nama: string;
  simbol?: string;
  jenis: string;
  keterangan?: string;
  dayName: string; // Contoh: "Sabtu", "Kamis", "Jumat"
  dayNumber: string; // Contoh: "05", "10", "26"
  monthShort: string; // Contoh: "SEP", "OKT"
  categoryTag: HariRayaCategoryTag;
  badgeVariant: HariRayaBadgeVariant;
  wuku?: string;
  sasih?: string;
  tahunSaka?: number;
}

// ---------------------------------------------------------------------------
// 5. Model Ringkasan Hari Raya Terdekat & Metrik Hero (Sidebar & Hero Widget)
// ---------------------------------------------------------------------------

/**
 * HariRayaUpcomingInfo merangkum detail satu hari raya terdekat yang akan
 * dirayakan dari tanggal hari ini, ditampilkan pada panel samping kanan.
 */
export interface HariRayaUpcomingInfo {
  item: HariRayaCardItem;
  daysRemaining: number; // 0 jika hari ini, > 0 jika di masa depan
  countdownText: string; // Contoh: "4 hari menuju Purnama" atau "Hari ini perayaan Purnama"
  moonPhaseText?: string; // Contoh: "Sukla Paksa • Bulan penuh"
  wuku: string; // Contoh: "Sinta"
  sasih: string; // Contoh: "Kapat"
}

/**
 * HariRayaHeroMetrics menampung 3 nilai ringkasan angka untuk banner atas:
 * 1. Total rahina pada bulan/tahun aktif
 * 2. Hitung mundur hari raya terdekat
 * 3. Status perayaan pada hari ini (today)
 */
export interface HariRayaHeroMetrics {
  monthName: string; // Contoh: "SEPTEMBER 2026"
  totalRahina: number; // Contoh: 8
  upcomingDays: number; // Contoh: 4
  upcomingHolidayName: string; // Contoh: "Purnama"
  todayHolidays: HariRayaMasterItem[]; // Daftar hari raya hari ini (kosong jika tidak ada)
}

// ---------------------------------------------------------------------------
// 6. Amplop Respons API Standar Backend Go
// ---------------------------------------------------------------------------

/**
 * ApiSuccessResponse adalah amplop standar respons sukses { data, meta, error: null }
 * yang dikembalikan oleh backend Go.
 */
export interface ApiSuccessResponse<T> {
  data: T;
  meta?: {
    request_id?: string;
    total?: number;
    total_hari?: number;
    total_perayaan?: number;
  };
  error: null;
}
