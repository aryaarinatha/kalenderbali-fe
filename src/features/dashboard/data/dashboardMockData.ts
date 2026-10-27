/**
 * ============================================================================
 * DATA MOCK & FALLBACK TERPUSAT: DASHBOARD KALENDER BALI
 * ============================================================================
 * Berkas ini menyediakan data mock terstruktur dan terisolasi untuk fitur-fitur
 * yang endpoint Backend Go-nya belum selesai dibangun (Dewasa Ayu & Piodalan),
 * serta metadata pelengkap untuk agenda hari raya (jam/lokasi pura).
 *
 * Prinsip Arsitektur:
 *  - DECOUPLED: Memisahkan data mock dari kode tampilan JSX komponen.
 *  - ZERO POLLUTION: Saat backend Go siap nanti, pengembang cukup menghubungkan
 *    fetcher di hook tanpa perlu membongkar struktur antarmuka UI.
 * ============================================================================
 */

import type {
  DewasaAyuDashboard,
  PiodalanDashboardItem,
} from '../types/dashboard.types';

// ---------------------------------------------------------------------------
// 1. Mock Data: Dewasa Ayu Hari Ini
// ---------------------------------------------------------------------------

/**
 * NOTE: Siap digantikan fungsi fetcher ketika endpoint
 * GET /api/v1/ala-ayuning/hari-ini selesai dibangun di Backend Go.
 *
 * Menampilkan rekomendasi petunjuk hari baik dan 3 aktivitas teratas:
 * "BELAJAR", "MELUKAT", "SEMBAHYANG".
 */
export const DEFAULT_DEWASA_AYU: DewasaAyuDashboard = {
  status: 'BAIK',
  statusLabel: 'BAIK',
  headline: 'Baik untuk memulai ilmu dan kegiatan rohani.',
  topActivities: ['BELAJAR', 'MELUKAT', 'SEMBAHYANG'],
  actionUrl: '/ala-ayuning-dewasa',
};

// ---------------------------------------------------------------------------
// 2. Mock Data: Piodalan Terdekat
// ---------------------------------------------------------------------------

/**
 * NOTE: Siap digantikan fungsi fetcher ketika endpoint
 * GET /api/v1/piodalan/terdekat selesai dibangun di Backend Go.
 *
 * Menampilkan jadwal piodalan terdekat dengan 3 pura teratas yang menyelenggarakan:
 * 1. Pura Agung Gunung Raung
 * 2. Pura Dalem Tarukan
 * 3. Pura Desa Kayangan Tiga, Buleleng
 */
export const DEFAULT_PIODALAN: PiodalanDashboardItem = {
  rahina: 'Buda Kliwon Ugu',
  daysRemaining: 10,
  daysRemainingText: '10 HARI LAGI',
  topTemples: [
    'Pura Agung Gunung Raung',
    'Pura Dalem Tarukan',
    'Pura Desa Kayangan Tiga, Buleleng',
  ],
  tanggalISO: '2026-09-30',
  tanggalFormatted: '30 September 2026',
  actionUrl: '/piodalan',
};

// ---------------------------------------------------------------------------
// 3. Fallback Metadata: Keterangan Pelengkap Hari Raya
// ---------------------------------------------------------------------------

/**
 * Kamus pelengkap subteks acara/upacara untuk hari-hari suci populer.
 * Digunakan jika backend Go hanya mengirim nama hari raya tanpa keterangan jam/lokasi.
 */
export const HARI_RAYA_SUBTEXT_FALLBACK: Record<string, string> = {
  'tilem': 'Pura Dalem · 18.00',
  'sugihan jawa': 'Persiapan Galungan',
  'sugihan bali': 'Penyucian diri menyambut Galungan',
  'galungan': 'Hari kemenangan dharma melawan adharma',
  'kuningan': 'Pemberkatan para leluhur',
  'purnama': 'Pemujaan Hyang Candra',
  'kajeng kliwon': 'Penyucian bhuana alit & bhuana agung',
  'buda kliwon': 'Pemujaan Sang Hyang Ayu',
  'saraswati': 'Turunnya ilmu pengetahuan suci',
  'pagerwesi': 'Memagari diri dengan keteguhan iman',
  'tumpek landep': 'Penyucian ketajaman pikiran dan pusaka',
  'tumpek wariga': 'Pemujaan manifestasi Ida Sang Hyang Widhi pemelihara tumbuhan',
  'tumpek kandang': 'Upacara perlindungan satwa dan fauna',
  'tumpek wayang': 'Penyucian kesenian & peleburan kala',
  'tumpek krulut': 'Hari kasih sayang & keindahan seni gamelan',
  'siwaratri': 'Malam perenungan dosa & penebusan jiwa',
  'nyepi': 'Penyucian alam semesta (Tahun Baru Saka)',
};

/**
 * Helper untuk mengambil subteks pelengkap hari raya secara cerdas
 * berdasarkan pencocokan kata kunci pada nama hari raya.
 */
export function getHariRayaSubtext(namaHariRaya: string): string {
  const lower = namaHariRaya.toLowerCase();

  for (const [key, subtext] of Object.entries(HARI_RAYA_SUBTEXT_FALLBACK)) {
    if (lower.includes(key)) {
      return subtext;
    }
  }

  return 'Rahina dan upacara terdekat';
}
