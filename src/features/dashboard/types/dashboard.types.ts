/**
 * ============================================================================
 * TIPE DATA & KONTRAK MODEL: DASHBOARD KALENDER BALI
 * ============================================================================
 * Berkas ini mendefinisikan seluruh kontrak TypeScript untuk halaman Dashboard.
 *
 * Selaras dengan:
 *  1. fe_strategy.md: Konsumsi data terpusat TanStack Query tanpa duplikasi data.
 *  2. AGENTS.md: Standar tipografi (tabular-nums) dan warna semantik resmi.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Kontrak Section Hero "HARI INI"
// ---------------------------------------------------------------------------

/**
 * Model data yang merangkum identitas penanggalan Bali hari ini:
 * Menggabungkan tanggal Masehi, wewaran, sasih, pengalantaka, urip, dan arah.
 */
export interface DashboardHeroData {
  /** Tanggal dalam format ISO standar: "YYYY-MM-DD" (dikunci ke zona WITA) */
  tanggalISO: string;

  /** Format tanggal lengkap bahasa Indonesia: "20 September 2026" */
  tanggalFormatted: string;

  /** Nama hari Masehi bahasa Indonesia: "Minggu", "Senin", dst. */
  hariMasehi: string;

  /** Nama Saptawara: "Redite", "Soma", dst. */
  saptawara: string;

  /** Nama Pancawara: "Umanis", "Paing", "Pon", "Wage", "Kliwon" */
  pancawara: string;

  /** Nama Wuku: "Sinta", "Landep", dst. */
  wuku: string;

  /** Nama Sasih: "Kapat", "Katiga", dst. */
  sasih: string;

  /** Fase peredaran bulan harian: "Panglong 14", "Penanggal 1", "Purnama", "Tilem" */
  pengalantaka: string;

  /** Urutan hari dalam wuku (1-7): "Dina ka-7" untuk Redite s.d. Saniscara */
  dinaKa: number;

  /** Angka Urip gabungan Saptawara + Pancawara (contoh: Redite 5 + Umanis 5 = 10) */
  urip: number;

  /** Arah mata angin pengider-ider berdasarkan Pancawara (contoh: "Arah timur") */
  arah: string;

  /** Kutipan / ringkasan petunjuk hari baik ringkas hari ini */
  quoteHariIni: string;
}

import type { HariRayaItem } from '@/features/kalender/types/kalender.types';

// ---------------------------------------------------------------------------
// 2. Kontrak Mini Kalender Bulanan
// ---------------------------------------------------------------------------

/**
 * Model satu sel tanggal pada matriks Mini Kalender (Senin s.d. Minggu).
 */
export interface DashboardMiniCalendarDay {
  /** Tanggal lengkap "YYYY-MM-DD" */
  dateString: string;

  /** Angka tanggal (1 s.d. 31) */
  dayNumber: number;

  /** Menandakan apakah tanggal ini berada dalam bulan aktif */
  isCurrentMonth: boolean;

  /** Menandakan apakah tanggal ini adalah hari ini (WITA) */
  isToday: boolean;

  /** Menandakan apakah tanggal ini sedang diklik/dipilih oleh pengguna */
  isSelected: boolean;

  /** Daftar hari raya pada tanggal ini dari backend Go (untuk pill bertumpuk) */
  holidays: HariRayaItem[];
}

// ---------------------------------------------------------------------------
// 3. Kontrak Hari Raya Berikutnya (List Vertikal di Kanan Mini Kalender)
// ---------------------------------------------------------------------------

/**
 * Model satu item hari raya terdekat yang ditampilkan pada daftar vertikal.
 */
export interface UpcomingHariRayaItem {
  /** Identifier unik item untuk key react */
  id: string;

  /** ID master hari raya jika tersedia */
  holidayId?: string;

  /** Nama hari raya (contoh: "Tilem Sasih Katiga", "Sugihan Jawa", "Galungan") */
  nama: string;

  /** Tanggal jatuh hari raya dalam format ISO "YYYY-MM-DD" */
  tanggalISO: string;

  /** Angka tanggal numerik (contoh: 22, 25, 30) untuk kotak tanggal sisi kiri */
  dayNumber: number;

  /** Singkatan 3 huruf nama bulan (contoh: "SEP", "OKT") */
  monthShort: string;

  /** Keterangan pelengkap (contoh: "Pura Dalem · 18.00" atau "Persiapan Galungan") */
  keterangan: string;

  /** Varian warna kotak tanggal sesuai standar AGENTS.md */
  badgeVariant: 'gold' | 'mint' | 'rose';

  /** Hitungan jumlah hari tersisa dari hari ini (angka untuk perhitungan urutan) */
  daysRemaining: number;

  /** Label teks hitung mundur (contoh: "5 HARI LAGI") */
  daysRemainingText: string;
}

// ---------------------------------------------------------------------------
// 4. Kontrak Dewasa Ayu Hari Ini (Card Hijau Teal Kiri Bawah)
// ---------------------------------------------------------------------------

export interface DewasaAyuItem {
  /** Identifier unik */
  id: string;
  /** Nama padewasan / hari baik (contoh: "Dewa Ngelayang", "Subacara", "Amerta Dadi") */
  nama: string;
  /** Keterangan ringkas petunjuk / fungsi hari baik */
  keterangan: string;
  /** Label kategori tag aktivitas (contoh: "SEMBAHYANG", "BELAJAR", "MELUKAT") */
  tag: string;
}

/**
 * Model ringkasan Ala Ayuning Dewasa harian.
 * Didesain modular agar dapat langsung dihubungkan ke endpoint Backend Go saat siap.
 */
export interface DewasaAyuDashboard {
  /** Kategori status hari: "BAIK" | "KURANG_BAIK" */
  status: 'BAIK' | 'KURANG_BAIK';

  /** Label status yang ditampilkan pada pill badge: "BAIK" */
  statusLabel: string;

  /** Narasi inspirasi / petunjuk utama dewasa ayu hari ini */
  headline: string;

  /**
   * Menampilkan 3 rekomendasi padewasan / hari baik teratas hari ini.
   */
  items: DewasaAyuItem[];

  /** Menampilkan maksimal 3 rekomendasi aktivitas teratas (opsional untuk backward compatibility) */
  topActivities?: string[];

  /** Tautan tujuan tombol "Lihat selengkapnya →" (/ala-ayuning-dewasa) */
  actionUrl: string;
}

// ---------------------------------------------------------------------------
// 5. Kontrak Piodalan Terdekat (Card Putih Kanan Bawah)
// ---------------------------------------------------------------------------

/**
 * Model ringkasan satu jadwal Piodalan terdekat.
 * Didesain modular agar dapat langsung dihubungkan ke endpoint Backend Go saat siap.
 */
export interface PiodalanDashboardItem {
  /** Identifier unik */
  id: string;

  /** Nama hari suci jatuhnya piodalan (contoh: "Buda Kliwon Ugu") */
  rahina: string;

  /** Hitungan mundur sisa hari (contoh: 10) */
  daysRemaining: number;

  /** Teks label hitung mundur (contoh: "10 HARI LAGI") */
  daysRemainingText: string;

  /**
   * Menampilkan maksimal 3 nama pura teratas yang menyelenggarakan piodalan.
   * Contoh: ["Pura Agung Gunung Raung", "Pura Dalem Tarukan", "Pura Desa Kayangan Tiga, Buleleng"]
   */
  topTemples: string[];

  /** Tanggal jatuhnya piodalan dalam format ISO "YYYY-MM-DD" */
  tanggalISO: string;

  /** Format tanggal masehi lengkap (contoh: "30 September 2026") */
  tanggalFormatted: string;

  /** Tautan tujuan tombol "Lihat selengkapnya →" (/piodalan) */
  actionUrl: string;
}
