/**
 * ============================================================================
 * TIPE DATA & KONTRAK KALENDER BALI
 * ============================================================================
 * Berkas ini mendefinisikan seluruh antarmuka (interface) data untuk fitur
 * Kalender Bali di frontend React, diselaraskan secara presisi dengan skema
 * JSON backend Go (domain.KalenderHarian) serta model UI/UX pendukung.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Kontrak Elemen Kalender & Wewaran (Sesuai Backend Go)
// ---------------------------------------------------------------------------

/**
 * ElemenKalender merepresentasikan satu nilai elemen kalender Bali,
 * seperti Pancawara "Umanis" atau Wuku "Sinta".
 * ID diserialisasikan sebagai string untuk menjaga presisi angka 64-bit di JS.
 */
export interface ElemenKalender {
  id?: string;
  nama: string;
}

/**
 * Wewaran merangkum seluruh 10 siklus wara (Ekawara s.d. Dasawara) ditambah Wuku.
 */
export interface Wewaran {
  ekawara: ElemenKalender;
  dwiwara: ElemenKalender;
  triwara: ElemenKalender;
  caturwara: ElemenKalender;
  pancawara: ElemenKalender;
  sadwara: ElemenKalender;
  saptawara: ElemenKalender;
  astawara: ElemenKalender;
  sangawara: ElemenKalender;
  dasawara: ElemenKalender;
  wuku: ElemenKalender;
}

// ---------------------------------------------------------------------------
// 2. Kontrak Sasih & Pengalantaka (Sesuai Backend Go)
// ---------------------------------------------------------------------------

/**
 * SasihInfo merangkum nomor bulan Bali (1-12), nama sasih, dan Tahun Saka.
 */
export interface SasihInfo {
  no_sasih: number;
  nama_sasih: string;
  tahun_saka: number;
}

/**
 * PengalantakaInfo merangkum fase peredaran bulan harian:
 * - pengalantaka: "Penanggal" (fase terang/waxing) atau "Pangelong" (fase gelap/waning)
 * - penanggal_1: Angka penanggal/pangelong 1 s.d. 15
 * - penanggal_2: Angka tambahan jika terjadi Ngunaratri (0 jika hari biasa)
 * - purnama_tilem: "Purnama", "Tilem", atau "-"
 */
export interface PengalantakaInfo {
  pengalantaka: string;
  penanggal_1: number;
  penanggal_2: number;
  purnama_tilem: string;
}

// ---------------------------------------------------------------------------
// 3. Kontrak Hari Raya & Rerainan (Sesuai Backend Go)
// ---------------------------------------------------------------------------

/**
 * HariRayaItem merepresentasikan satu perayaan keagamaan Hindu Bali pada suatu tanggal.
 */
export interface HariRayaItem {
  id: string;
  nama: string;
  simbol?: string;
  jenis: 'hari_raya' | 'rerainan' | string;
}

// ---------------------------------------------------------------------------
// 4. Model Kalender Harian Utuh & Response API Backend
// ---------------------------------------------------------------------------

/**
 * KalenderHarian adalah objek agregasi utama untuk satu tanggal Masehi di zona WITA.
 */
export interface KalenderHarian {
  tanggal: string; // Format ISO: "YYYY-MM-DD"
  wewaran: Wewaran;
  sasih: SasihInfo;
  pengalantaka: PengalantakaInfo;
  hari_raya: HariRayaItem[];
}

/**
 * ApiResponseEnvelope adalah standar bungkus response dari backend Go.
 */
export interface KalenderApiResponse {
  data: KalenderHarian[];
  meta: {
    request_id?: string;
    total_hari: number;
  };
  error: string | null;
}

// ---------------------------------------------------------------------------
// 5. Model Pendukung UI & Komponen Kalender
// ---------------------------------------------------------------------------

/**
 * CalendarGridDay merepresentasikan satu kotak/sel tanggal pada matriks kalender 7 kolom.
 */
export interface CalendarGridDay {
  dateString: string; // Format "YYYY-MM-DD"
  dayNumber: number; // Angka tanggal (1 - 31)
  isCurrentMonth: boolean; // True jika tanggal ini berada di bulan yang sedang aktif
  isToday: boolean; // True jika bertepatan dengan tanggal hari ini di WITA
  isSelected: boolean; // True jika sel ini sedang dipilih/diklik oleh pengguna
  data?: KalenderHarian; // Data lengkap kalender dari backend Go (jika tersedia)
}

/**
 * PiodalanItem merepresentasikan item piodalan pura untuk daftar hari ini.
 * (Digunakan sebagai wadah data sebelum backend piodalan siap).
 */
export interface PiodalanItem {
  id: string;
  puraName: string;
  location: string;
  distance: string;
  accentColor?: 'teal' | 'amber';
}

/**
 * PiodalanTerdekatItem merepresentasikan ringkasan piodalan pada panel bawah kanan.
 */
export interface PiodalanTerdekatItem {
  id: string;
  dayNumber: string; // "05", "10", "30"
  wukuTitle: string; // "Saniscara Kliwon Uye"
  puraCountText: string; // "3 pura"
}

/**
 * DewasaAyuItem merepresentasikan panduan hari baik untuk kartu inspector.
 */
export interface DewasaAyuItem {
  title: string;
  advice: string;
}
