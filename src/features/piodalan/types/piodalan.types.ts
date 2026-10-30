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
  latitude?: number | null;
  longitude?: number | null;

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
// 4B. STRUKTUR HIERARKIS 3-LEVEL PIODALAN (Piodalan -> List Pura -> Detail Acara)
// ==============================================================================

/**
 * Representasi profil pura pada daftar pura yang melangsungkan piodalan (Level 2)
 */
export interface PiodalanDayPuraItem {
  id: number;
  name: string;
  type: string;
  address: string;
  city: string;
  province: string;
  phone?: string | null;
  location_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  benchmark?: string | null;
  wuku?: string | null;
  saptawara?: string | null;
  pancawara?: string | null;
  sasih?: string | null;
  purnama_tilem?: string | null;
  /** Pelaksanaan aktual & susunan acara yang diinput kontributor */
  pelaksanaan_aktual?: {
    piodalan_id?: string | number;
    tingkat_upacara?: string;
    deskripsi?: string;
    total_acara?: number;
    acaras?: {
      id: string | number;
      nama: string;
      waktu: string;
      pic_nama?: string;
      pic_phone?: string;
    }[];
  } | null;
  rawPura?: PuraBackendItem;
}

/**
 * Kelompok agenda piodalan per tanggal/hari kalender (Level 1 dalam hierarki piodalan)
 * Ditampilkan sebagai kartu piodalan utama dengan tombol 'List Pura' dan 'Detail Tanggal'
 */
export interface PiodalanDayGroup {
  /** Tanggal dalam format ISO (YYYY-MM-DD) */
  dateStr: string;
  /** Tanggal lengkap bahasa Indonesia (contoh: 'Sabtu, 10 Oktober 2026') */
  formattedDate: string;
  /** Nama hari bahasa Indonesia (contoh: 'Sabtu') */
  dayName: string;
  /** Nama rahinan / wewaran (contoh: 'Saniscara Kliwon Wayang') */
  wewaran: string;
  /** Nama sasih jika berbasis sasih */
  sasih?: string;
  /** Nama hari raya jika bertepatan (contoh: 'Tumpek Wayang') */
  hariRaya?: string;
  /** Total pura yang merayakan piodalan pada tanggal ini */
  totalPura: number;
  /** Daftar seluruh pura yang melaksanakan piodalan pada hari ini */
  puras: PiodalanDayPuraItem[];
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

// ==============================================================================
// 7. KONTRAK DATA MESIN PENCARIAN PIODALAN (BACKEND GO: /api/v1/search/piodalan)
// ==============================================================================

/**
 * Parameter kueri yang dikirimkan ke mesin pencari piodalan backend Go:
 * GET /api/v1/search/piodalan
 */
export interface PiodalanSearchParams {
  /** Mode pencarian: 'wewaran' (Pawukon), 'bulan', 'pura' (nama/wilayah), atau 'rentang' */
  mode: 'wewaran' | 'bulan' | 'pura' | 'rentang';
  /** Nama Saptawara untuk mode wewaran (contoh: "Buda") */
  saptawara?: string;
  /** Nama Pancawara untuk mode wewaran (contoh: "Kliwon") */
  pancawara?: string;
  /** Nama Wuku untuk mode wewaran (contoh: "Dungulan" / "Dunggulan") */
  wuku?: string;
  /** Tahun Masehi target pencarian (contoh: 2026) */
  tahun?: number | string;
  /** Nomor bulan Masehi 1-12 untuk mode bulan (contoh: 6 untuk Juni) */
  bulan?: number | string;
  /** Kata kunci nama pura atau wilayah pada mode pura */
  q?: string;
  /** Nomor ID pura spesifik pada mode pura */
  pura_id?: number | string;
  /** Tanggal awal (YYYY-MM-DD) pada mode rentang */
  start_date?: string;
  /** Tanggal akhir (YYYY-MM-DD) pada mode rentang */
  end_date?: string;
}

/**
 * Rincian tahapan susunan acara aktual (Melasti, Puncak, Nyineb)
 * yang disertakan di dalam hasil pencarian piodalan backend Go
 */
export interface BackendPiodalanAcaraDetail {
  id: string;
  nama: string;
  waktu: string;
  pic_nama?: string;
  pic_phone?: string;
}

/**
 * Ringkasan rekaman riil perayaan piodalan pura dari database backend Go
 */
export interface BackendPiodalanActual {
  piodalan_id: string;
  tingkat_upacara?: string;
  deskripsi?: string;
  total_acara?: number;
  acaras?: BackendPiodalanAcaraDetail[];
}

/**
 * Profil ringkas pura penyelenggara piodalan dari hasil pencarian backend Go
 */
export interface BackendPiodalanPuraDetail {
  id: string;
  nama: string;
  tipe: string;
  alamat: string;
  kabupaten: string;
  provinsi: string;
  latitude?: number;
  longitude?: number;
  pelaksanaan_aktual?: BackendPiodalanActual;
}

/**
 * Pengelompokan seluruh agenda perayaan piodalan pada satu tanggal kalender Masehi
 */
export interface BackendPiodalanScheduleDay {
  tanggal: string;
  wewaran: string;
  sasih: string;
  hari_raya?: string;
  total_pura: number;
  puras: BackendPiodalanPuraDetail[];
}

/**
 * Struktur payload respons lengkap dari endpoint pencarian piodalan backend Go:
 * GET /api/v1/search/piodalan
 */
export interface BackendPiodalanSearchResult {
  mode: string;
  filter: Record<string, unknown>;
  total_jadwal: number;
  schedules: BackendPiodalanScheduleDay[];
}
