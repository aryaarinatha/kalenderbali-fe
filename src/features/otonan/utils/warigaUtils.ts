/**
 * ============================================================================
 * UTILITAS PERHITUNGAN & DUMMY WARIGA (MODAL DETAIL WARIGA)
 * ============================================================================
 * Berkas ini menyediakan data dan fungsi pendukung untuk modal "Detail Wariga":
 *  1. Perhitungan matematis akurat untuk elemen kalender tradisional:
 *     - Ingkel (siklus 6 berdasarkan nomor wuku 1-30)
 *     - Neptu (penjumlahan urip Saptawara + Pancawara)
 *     - Zodiak (berdasarkan posisi tanggal & bulan Masehi)
 *  2. Data dummy / fallback untuk elemen budaya yang belum dihitung di backend Go:
 *     - Jejepan, Lintang, Panca Sudha, Pangarasan, Rakam, Watek Madya, Watek Alit,
 *       Eka Jala Rsi, Pratiti.
 * ============================================================================
 */

/** Daftar 30 Wuku dalam urutan resmi kalender Bali (1 s.d. 30) */
export const WUKU_LIST = [
  'Sinta',
  'Landep',
  'Ukir',
  'Kulantir',
  'Tolu',
  'Gumbreg',
  'Wariga',
  'Warigadean',
  'Julungwangi',
  'Sungsang',
  'Dungulan',
  'Kuningan',
  'Langkir',
  'Medangsia',
  'Pujut',
  'Pahang',
  'Krulut',
  'Merakih',
  'Tambir',
  'Medangkungan',
  'Matal',
  'Uye',
  'Menail',
  'Prangbakat',
  'Bala',
  'Ugu',
  'Wayang',
  'Kelawu',
  'Dukut',
  'Watugunung',
];

/**
 * Menghitung Ingkel berdasarkan nama Wuku.
 * Rumus budaya: (nomor_wuku % 6):
 *  1 -> Wong, 2 -> Sato, 3 -> Mina, 4 -> Manuk, 5 -> Taru, 0 -> Buku
 */
export function calculateIngkel(wukuName?: string): string {
  if (!wukuName) return 'Taru';
  const index = WUKU_LIST.findIndex(
    (w) => w.toLowerCase() === wukuName.trim().toLowerCase()
  );
  if (index === -1) return 'Taru';

  const wukuNo = index + 1;
  const mod = wukuNo % 6;
  switch (mod) {
    case 1:
      return 'Wong';
    case 2:
      return 'Sato';
    case 3:
      return 'Mina';
    case 4:
      return 'Manuk';
    case 5:
      return 'Taru';
    default:
      return 'Buku';
  }
}

/** Tabel bobot urip Saptawara (7 hari) */
const SAPTAWARA_URIP: Record<string, number> = {
  redite: 5,
  minggu: 5,
  soma: 4,
  senin: 4,
  anggara: 3,
  selasa: 3,
  buda: 7,
  rabu: 7,
  wrespati: 8,
  kamis: 8,
  sukra: 6,
  jumat: 6,
  saniscara: 9,
  sabtu: 9,
};

/** Tabel bobot urip Pancawara (5 hari) */
const PANCAWARA_URIP: Record<string, number> = {
  umanis: 5,
  paing: 9,
  pon: 7,
  wage: 4,
  kliwon: 8,
};

/**
 * Menghitung total nilai Neptu hari (urip Saptawara + urip Pancawara)
 */
export function calculateNeptu(
  saptawaraName?: string,
  pancawaraName?: string
): number {
  const uripSapta =
    (saptawaraName && SAPTAWARA_URIP[saptawaraName.toLowerCase().trim()]) || 5;
  const uripPanca =
    (pancawaraName && PANCAWARA_URIP[pancawaraName.toLowerCase().trim()]) || 8;
  return uripSapta + uripPanca;
}

/**
 * Menghitung rasi Zodiak berdasarkan tanggal Masehi (format YYYY-MM-DD)
 */
export function calculateZodiak(dateStr?: string): string {
  if (!dateStr || !dateStr.includes('-')) return 'Cancer';
  const parts = dateStr.split('-');
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (month === 1) return day <= 20 ? 'Capricorn' : 'Aquarius';
  if (month === 2) return day <= 19 ? 'Aquarius' : 'Pisces';
  if (month === 3) return day <= 20 ? 'Pisces' : 'Aries';
  if (month === 4) return day <= 19 ? 'Aries' : 'Taurus';
  if (month === 5) return day <= 20 ? 'Taurus' : 'Gemini';
  if (month === 6) return day <= 20 ? 'Gemini' : 'Cancer';
  if (month === 7) return day <= 21 ? 'Cancer' : 'Leo';
  if (month === 8) return day <= 21 ? 'Leo' : 'Virgo';
  if (month === 9) return day <= 22 ? 'Virgo' : 'Libra';
  if (month === 10) return day <= 22 ? 'Libra' : 'Scorpio';
  if (month === 11) return day <= 21 ? 'Scorpio' : 'Sagitarius';
  if (month === 12) return day <= 21 ? 'Sagitarius' : 'Capricorn';

  return 'Cancer';
}

/**
 * Nilai dummy / simulasi referensi budaya untuk elemen wariga
 * yang belum tersedia di backend Go (kalenderbali-be) tetapi ada di backend Laravel lama.
 */
export const WARIGA_FALLBACK_VALUES = {
  ingkel: 'Taru',
  jejepan: 'Wong',
  lintang: 'Puwuh Atarung',
  panca_sudha: 'Satria Wirang',
  pangarasan: 'Laku Bintang',
  rakam: 'Kala Tinantang',
  watek_madya: 'Buta',
  watek_alit: 'Uler',
  neptu: 13,
  eka_jala_rsi: 'Sidha Kasobagian',
  zodiak: 'Cancer',
  pratiti: 'Jaramarana',
};

