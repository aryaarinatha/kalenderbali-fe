/**
 * ==============================================================================
 * UTILITAS FITUR PIODALAN (Kalender Bali)
 * ==============================================================================
 * Berkas fungsi murni (pure functions) pendukung:
 * 1. Normalisasi tanggal absolut WITA (Asia/Makassar / UTC+8)
 * 2. Formatter tanggal bahasa Indonesia dan nama hari
 * 3. Ekstraksi badge tanggal visual kartu (angka + singkatan bulan kapital)
 * 4. Penentuan varian warna aksen semantik badge tanggal (Teal, Emerald, Indigo, Amber)
 * ==============================================================================
 */

/** Nama bulan panjang dalam bahasa Indonesia */
export const INDO_MONTHS_LONG = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/** Singkatan bulan kapital 3 huruf untuk kotak badge tanggal kartu */
export const MONTHS_BADGE_SHORT = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MEI',
  'JUN',
  'JUL',
  'AGU',
  'SEP',
  'OKT',
  'NOV',
  'DES',
];

/** Nama hari Masehi dalam bahasa Indonesia (0 = Minggu s.d. 6 = Sabtu) */
export const INDO_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

// ==============================================================================
// 1. NORMALISASI ZONA WAKTU WITA (UTC+8)
// ==============================================================================

/**
 * getTodayWITA mengembalikan tanggal hari ini terkunci ke zona waktu WITA (UTC+8).
 * Menjamin konsistensi tanggal bagi pengguna yang mengakses dari WIB, WIT, maupun luar negeri.
 *
 * @returns String tanggal format "YYYY-MM-DD"
 */
export function getTodayWITA(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Menghasilkan "YYYY-MM-DD"
  } catch {
    const now = new Date();
    // Fallback manual offset UTC+8
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const witaDate = new Date(utcTime + 3600000 * 8);
    const y = witaDate.getFullYear();
    const m = String(witaDate.getMonth() + 1).padStart(2, '0');
    const d = String(witaDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

// ==============================================================================
// 2. PARSER & FORMATTER TANGGAL
// ==============================================================================

/**
 * parseISODate mengurai string "YYYY-MM-DD" menjadi bagian numerik { year, month, day }
 * tanpa terkena dampak pergeseran timezone Date JavaScript bawaan.
 */
export function parseISODate(isoDate: string): { year: number; month: number; day: number } {
  if (!isoDate || typeof isoDate !== 'string') {
    const today = getTodayWITA().split('-');
    return {
      year: parseInt(today[0], 10),
      month: parseInt(today[1], 10),
      day: parseInt(today[2], 10),
    };
  }

  const parts = isoDate.split('-');
  return {
    year: parseInt(parts[0], 10) || 2026,
    month: parseInt(parts[1], 10) || 1,
    day: parseInt(parts[2], 10) || 1,
  };
}

/**
 * getIndoDayName mengembalikan nama hari bahasa Indonesia (contoh: 'Rabu', 'Jumat')
 */
export function getIndoDayName(isoDate: string): string {
  const { year, month, day } = parseISODate(isoDate);
  // Gunakan jam 12 siang untuk mencegah pergeseran jam lokal
  const d = new Date(year, month - 1, day, 12, 0, 0);
  return INDO_DAYS[d.getDay()] || 'Minggu';
}

/**
 * formatIndoDate memformat tanggal menjadi teks yang mudah dibaca:
 * contoh: "18 Maret 2026" atau "Rabu, 18 Maret 2026"
 */
export function formatIndoDate(
  isoDate: string,
  options: { withDayName?: boolean } = {}
): string {
  const { year, month, day } = parseISODate(isoDate);
  const monthName = INDO_MONTHS_LONG[month - 1] || 'Januari';
  const formatted = `${day} ${monthName} ${year}`;

  if (options.withDayName) {
    const dayName = getIndoDayName(isoDate);
    return `${dayName}, ${formatted}`;
  }

  return formatted;
}

// ==============================================================================
// 3. BADGE TANGGAL VISUAL & AKSEN WARNA
// ==============================================================================

export type BadgeColorVariant = 'teal' | 'emerald' | 'indigo' | 'amber';

const COLOR_VARIANTS: BadgeColorVariant[] = ['teal', 'emerald', 'indigo', 'amber'];

/**
 * createDateBadge menghasilkan objek tanggal visual untuk kartu piodalan:
 * - day: string angka 2 digit (misal: '25', '06')
 * - month: singkatan kapital 3 huruf (misal: 'SEP', 'NOV')
 * - colorVariant: rotasi warna aksen sesuai urutan indeks baris kartu
 */
export function createDateBadge(
  isoDate: string,
  index: number = 0
): {
  day: string;
  month: string;
  colorVariant: BadgeColorVariant;
} {
  const { day, month } = parseISODate(isoDate);
  const dayStr = String(day).padStart(2, '0');
  const monthStr = MONTHS_BADGE_SHORT[month - 1] || 'JAN';
  const colorVariant = COLOR_VARIANTS[index % COLOR_VARIANTS.length];

  return {
    day: dayStr,
    month: monthStr,
    colorVariant,
  };
}

// ==============================================================================
// 4. SEMANTIC PILL BADGE KATEGORI PURA (AGENTS.md)
// ==============================================================================

/**
 * getPuraTypeBadgeStyle menentukan gaya pill badge kategori pura sesuai AGENTS.md:
 * - Kawitan: Mint Teal (bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60)
 * - Swagina: Emerald Green (bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60)
 * - Kahyangan Jagat / Kahyangan Tiga / Lainnya: Violet Purple (bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60)
 */
export function getPuraTypeBadgeStyle(puraType?: string): string {
  const clean = (puraType || '').toLowerCase().trim();
  if (clean.includes('kawitan') || clean.includes('paibon') || clean.includes('dadia')) {
    return 'bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60';
  }
  if (clean.includes('swagina') || clean.includes('subak') || clean.includes('pasar') || clean.includes('segara')) {
    return 'bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60';
  }
  // Default untuk Kahyangan Jagat, Kahyangan Tiga, Dang Kahyangan, Sad Kahyangan
  return 'bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60';
}

