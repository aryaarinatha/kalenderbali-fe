/**
 * ==============================================================================
 * MODUL TIPE DATA FITUR PIODALAN (Kalender Bali)
 * ==============================================================================
 * Berkas ini mendefinisikan seluruh kontrak antarmuka TypeScript untuk fitur Piodalan:
 * 1. Mode navigasi pencarian (Wewaran, Bulan, Nama Pura)
 * 2. Struktur data Pura resmi dari database PostgreSQL Backend Go
 * 3. Kelompok jadwal perayaan Piodalan per tanggal
 * 4. Rangkaian upacara (Acara) yang diinput oleh kontributor pura
 * 5. State kontrol modal dialog 2-section (Detail Wariga & Detail Pura)
 * ==============================================================================
 */

// ==============================================================================
// 1. TIPE MODE PENCARIAN & FILTER
// ==============================================================================

/**
 * Tiga metode pencarian piodalan sesuai dengan desain mockup:
 * - 'wewaran': Pencarian berbasis siklus Pawukon 210 hari (Saptawara + Pancawara + Wuku + Tahun)
 * - 'bulan': Pencarian berbasis bulan kalender (Januari s.d. Desember atau Sasih)
 * - 'pura': Pencarian langsung berdasarkan kata kunci nama pura
 */
export type PiodalanSearchTab = 'wewaran' | 'bulan' | 'pura';

/**
 * Parameter filter pencarian piodalan yang dapat disinkronkan ke URL Search Params
 */
export interface PiodalanFilterParams {
  /** Tab metode pencarian yang sedang aktif */
  tab: PiodalanSearchTab;

  /** Nama atau ID Saptawara (contoh: 'Redite', 'Buda') */
  saptawara: string;

  /** Nama atau ID Pancawara (contoh: 'Umanis', 'Wage') */
  pancawara: string;

  /** Nama atau ID Wuku (contoh: 'Sinta', 'Klawu') */
  wuku: string;

  /** Tahun Masehi target pencarian (contoh: 2026 atau string kosong saat belum diisi) */
  tahun: number | string;

  /** Nomor bulan Masehi (1 - 12) untuk pencarian berbasis bulan */
  bulan?: number | string;

  /** Nama Sasih (contoh: 'Kadasa', 'Kapat') untuk pencarian berbasis sasih */
  sasih?: string;

  /** Kata kunci nama pura pada tab pencarian pura */
  namaPura?: string;
}

// ==============================================================================
// 2. STRUKTUR DATA PURA RESMI (BACKEND GO)
// ==============================================================================

/**
 * Tipe data Pura yang diterima dari endpoint publik:
 * GET /api/v1/puras
 *
 * Backend Go mengembalikan 461 data pura resmi dengan relasi wilayah dan observasi piodalannya.
 */
export interface PuraBackendItem {
  id: number;
  name: string;
  type: string;
  status: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  city_id?: number | null;
  province?: string | null;
  province_id?: number | null;
  country?: string | null;
  country_id?: number | null;
  location_url?: string | null;

  /** Dasar penentuan piodalan: 'Pawukon' (siklus 210 hari) atau 'Sasih' (lunar phase) */
  benchmark?: string | null;

  /** Elemen penanggalan piodalan jika berbasis Pawukon */
  wuku?: string | null;
  saptawara?: string | null;
  pancawara?: string | null;

  /** Elemen penanggalan piodalan jika berbasis Sasih */
  sasih?: string | null;
  purnama_tilem?: string | null;

  created_at?: string;
  updated_at?: string;
}

// ==============================================================================
// 3. RANGKAIAN UPACARA / ACARA PIODALAN (KONTRIBUSI KONTRIBUTOR)
// ==============================================================================

/**
 * Data acara piodalan yang diinput oleh kontributor/pengelola pura:
 * GET /api/v1/piodalans/:id/acaras
 */
export interface PiodalanAcaraItem {
  id: number;
  piodalan_id: number;
  name: string;
  event_at: string;
  ceremony_level?: string;
  pic_name?: string;
  pic_phone?: string;
}

/**
 * Data pencatatan kegiatan piodalan pura:
 * GET /api/v1/puras/:id/piodalans
 */
export interface PuraPiodalanRecord {
  id: number;
  pura_id: number;
  ceremony_date: string;
  description: string;
  ceremony_level_id?: number;
  ceremony_level_name?: string;
  acaras?: PiodalanAcaraItem[];
}

// ==============================================================================
// 4. KELOMPOK JADWAL PIODALAN (HASIL PENCARIAN & DISPLAY UI)
// ==============================================================================

/**
 * Representasi satu agenda perayaan piodalan pada tanggal tertentu
 * yang disajikan pada tabel kolom kiri di halaman utama:
 */
export interface PiodalanScheduleItem {
  /** Pengenal unik jadwal (contoh: '2026-03-18-klawu-131') */
  id: string;

  /** Tanggal pelaksanaan dalam format ISO (YYYY-MM-DD) */
  dateStr: string;

  /** Tanggal terformat bahasa Indonesia (contoh: '18 Maret 2026') */
  formattedDate: string;

  /** Nama hari bahasa Indonesia (contoh: 'Rabu') */
  dayName: string;

  /** Angka tanggal dan singkatan bulan untuk kotak visual kartu (contoh: { day: '18', month: 'MAR' }) */
  dateBadge: {
    day: string;
    month: string;
    /** Indikator aksen warna semantik badge: teal, emerald, indigo, amber */
    colorVariant: 'teal' | 'emerald' | 'indigo' | 'amber';
  };

  /** Nama pura penyelenggara piodalan */
  puraName: string;

  /** ID Pura untuk pemanggilan modal detail */
  puraId: number;

  /** Lokasi ringkas pura (contoh: 'Serangan, Denpasar' atau 'Ubud, Gianyar') */
  location: string;

  /** Alamat lengkap pura */
  fullAddress: string;

  /** Kategori pura (contoh: 'Kahyangan Jagat', 'Swagina', 'Kawitan') */
  puraType: string;

  /** Rangkaian penanggalan wewaran (contoh: 'Buda · Wage · Klawu') */
  penanggalan: string;

  /** Keterangan siklus penanggalan (contoh: 'Pawukon 210 hari' atau 'Sasih Kadasa') */
  cycleInfo: string;

  /** Waktu jam pelaksanaan jika diinput oleh kontributor (contoh: '08.00 WITA') atau null */
  timeString: string | null;

  /** Tautan Google Maps pura */
  mapUrl?: string | null;

  /** Nomor telepon kontak pura */
  phone?: string | null;

  /** Data utuh entitas pura */
  rawPura?: PuraBackendItem;
}

// ==============================================================================
// 5. MASTER REFERENSI WEWARAN & DROPDOWN
// ==============================================================================

/**
 * Item opsi dropdown yang diambil dari master keterangan backend
 * (GET /api/v1/keterangan/types/{typeCode})
 */
export interface MasterDropdownOption {
  id: string;
  name: string;
  description?: string;
}

// ==============================================================================
// 6. KONTROL STATE MODAL DIALOG 2 SECTION
// ==============================================================================

/**
 * Bagian section yang aktif di dalam modal detail piodalan:
 * - 'wariga': Section 1 - Rincian lengkap 15 dimensi Wariga tanggal tersebut (Gambar 1 & 2)
 * - 'pura': Section 2 - Rincian daftar pura dan susunan acara yang diinput kontributor
 */
export type PiodalanModalActiveSection = 'wariga' | 'pura';

/**
 * State pengontrol pembukaan modal detail
 */
export interface PiodalanModalState {
  isOpen: boolean;
  activeSection: PiodalanModalActiveSection;
  selectedSchedule: PiodalanScheduleItem | null;
}
