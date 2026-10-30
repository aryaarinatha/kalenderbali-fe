import type { DewasaAyuItem, PiodalanItem, PiodalanTerdekatItem } from '../types/kalender.types';

/**
 * ============================================================================
 * DATA SEMENTARA: DEWASA AYU & ARSIP DUMMY PIODALAN (TERDEPREKASI)
 * ============================================================================
 * CATATAN STATUS INTEGRASI PIODALAN:
 * Seluruh fitur Piodalan di semua halaman (PiodalanPage, KelolaPuraPage,
 * CalendarPage, CalendarInspector, CalendarHero, CalendarBottomSection,
 * dan DashboardPage) kini TELAH 100% TERHUBUNG KE DATA RIIL BACKEND GO
 * melalui useDayPiodalan, useMonthlyPiodalan, dan searchPiodalan.
 * Konstanta dummy piodalan di bawah ini sudah TIDAK LAGI DIKONSUMSI oleh UI mana pun.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Data Dummy: Piodalan Pura Hari Ini (Inspector Panel Kanan)
// ---------------------------------------------------------------------------

/**
 * Daftar pura dummy yang sedang melangsungkan piodalan pada tanggal aktif.
 */
export const DUMMY_TODAY_PIODALAN: PiodalanItem[] = [
  {
    id: 'pio-1',
    puraName: 'Pura Desa Taman',
    location: 'Denpasar',
    distance: '3,2 km',
    accentColor: 'teal',
  },
  {
    id: 'pio-2',
    puraName: 'Pura Puseh Kayangan Tiga',
    location: 'Badung',
    distance: '8,6 km',
    accentColor: 'amber',
  },
];

/**
 * Mengambil daftar piodalan hari ini berdasarkan tanggal.
 * (Saat ini mengembalikan data dummy realistis yang serasi dengan desain mockup).
 */
export function getPiodalanForDate(): { items: PiodalanItem[]; totalCount: number } {
  return {
    items: DUMMY_TODAY_PIODALAN,
    totalCount: DUMMY_TODAY_PIODALAN.length,
  };
}

// ---------------------------------------------------------------------------
// 2. Data Dummy: Piodalan Terdekat Bulan Ini (Panel Bawah Kanan)
// ---------------------------------------------------------------------------

/**
 * Daftar 3 piodalan terdekat dalam satu bulan kalender.
 * Menampilkan nomor tanggal, nama wuku/rahinan, dan jumlah pura yang merayakan.
 */
export const DUMMY_UPCOMING_PIODALAN: PiodalanTerdekatItem[] = [
  {
    id: 'up-1',
    dayNumber: '05',
    wukuTitle: 'Saniscara Kliwon Uye',
    puraCountText: '3 pura',
  },
  {
    id: 'up-2',
    dayNumber: '10',
    wukuTitle: 'Buda Wage Menail',
    puraCountText: '7 pura',
  },
  {
    id: 'up-3',
    dayNumber: '30',
    wukuTitle: 'Buda Kliwon Ugu',
    puraCountText: '5 pura',
  },
];

/**
 * Estimasi total lokasi piodalan di bulan aktif untuk ditampilkan pada Hero Bar.
 */
export const DUMMY_MONTHLY_PIODALAN_TOTAL = 15;

// ---------------------------------------------------------------------------
// 3. Data Dummy: Panduan Dewasa Ayu (Inspector Panel Kanan)
// ---------------------------------------------------------------------------

const DEWASA_AYU_COLLECTION: DewasaAyuItem[] = [
  {
    title: 'DEWASA AYU',
    advice: 'Baik untuk memulai ilmu dan kegiatan rohani.',
  },
  {
    title: 'DEWASA AYU',
    advice: 'Baik untuk melangsungkan upacara Dewa Yadnya dan Manusa Yadnya.',
  },
  {
    title: 'DEWASA AYU',
    advice: 'Baik untuk menanam padi, bercocok tanam, dan memelihara ternak.',
  },
  {
    title: 'DEWASA AYU',
    advice: 'Baik untuk membuka usaha baru dan transaksi niaga.',
  },
  {
    title: 'DEWASA AYU',
    advice: 'Baik untuk memulai pembangunan rumah dan pembersihan pekarangan.',
  },
];

/**
 * Mengembalikan deskripsi Dewasa Ayu yang kontekstual dan bervariasi
 * berdasarkan tanggal kalender agar kartu antarmuka terasa hidup.
 */
export function getDewasaAyuForDate(dateString: string): DewasaAyuItem {
  // Hitung hash deterministik dari string tanggal agar tanggal yang sama menghasilkan teks yang konsisten
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash << 5) - hash + dateString.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DEWASA_AYU_COLLECTION.length;
  return DEWASA_AYU_COLLECTION[index];
}
