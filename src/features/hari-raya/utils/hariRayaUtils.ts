/**
 * ============================================================================
 * UTILITAS & LOGIKA BISNIS: HARI RAYA BALI
 * ============================================================================
 * Berkas ini menyediakan fungsi-fungsi perhitungan, pemformatan tanggal,
 * penentuan kategori badge warna semantik, kalkulator hari raya terdekat,
 * serta helper kurasi edukasi budaya.
 *
 * Selaras dengan:
 *  - Normalisasi zona waktu absolut WITA (UTC+8 / Asia/Makassar)
 *  - Palet warna resmi dan hierarki tipografi AGENTS.md
 *  - Format RFC 5545 iCalendar (.ics) untuk ekspor agenda kalender
 * ============================================================================
 */

import type { KalenderHarian } from '@/features/kalender/types/kalender.types';
import { getTodayWITA, exportHariRayaToICS } from '@/features/kalender/utils/calendarUtils';
import type {
  HariRayaBadgeVariant,
  HariRayaCardItem,
  HariRayaCategoryTag,
  HariRayaHeroMetrics,
  HariRayaMasterItem,
  HariRayaUpcomingInfo,
} from '../types/hariRaya.types';

// ---------------------------------------------------------------------------
// 1. Konstanta Nama Bulan & Hari Bahasa Indonesia
// ---------------------------------------------------------------------------

export const NAMA_BULAN_INDO = [
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

export const NAMA_BULAN_SHORT = [
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

export const NAMA_HARI_INDO = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

// ---------------------------------------------------------------------------
// 2. Penentuan Kategori Tag & Varian Warna Badge Semantik (AGENTS.md)
// ---------------------------------------------------------------------------

/**
 * BLOK 2A: Menentukan Kategori Kultural Hari Raya
 * ---------------------------------------------------------------------------
 * Mengklasifikasikan nama perayaan ke dalam salah satu dari 5 kategori budaya:
 *  - 'Tumpek'   : Perayaan siklus 210 hari Saniscara Kliwon
 *  - 'Kajeng'   : Pertemuan sakral Kajeng Kliwon
 *  - 'Bulan'    : Purnama dan Tilem (fase astronomis candra)
 *  - 'Wewaran'  : Pertemuan wewaran sakral (Buda Kliwon, Anggara Kasih, Buda Cemeng)
 *  - 'Rahina'   : Hari suci lainnya (Saraswati, Pagerwesi, Hari Bhatari Sri)
 *
 * @param nama Nama hari raya
 * @returns HariRayaCategoryTag
 */
export function getHariRayaCategoryTag(nama: string): HariRayaCategoryTag {
  const lower = nama.toLowerCase();

  if (lower.includes('tumpek')) {
    return 'Tumpek';
  }
  if (lower.includes('kajeng kliwon') || lower.includes('kajeng')) {
    return 'Kajeng';
  }
  if (lower.includes('purnama') || lower.includes('tilem')) {
    return 'Bulan';
  }
  if (
    lower.includes('buda kliwon') ||
    lower.includes('anggara kasih') ||
    lower.includes('buda cemeng')
  ) {
    return 'Wewaran';
  }

  return 'Rahina';
}

/**
 * BLOK 2B: Menentukan Palet Warna Badge Sesuai Panduan AGENTS.md
 * ---------------------------------------------------------------------------
 * Memberikan aksen warna semantik yang harmonis dan seragam antar-halaman:
 *  - 'gold'   : Purnama, Galungan, Kuningan, Nyepi
 *  - 'rose'   : Tilem, Kajeng Kliwon
 *  - 'mint'   : Tumpek, Buda Kliwon
 *  - 'purple' : Hari Bhatari Sri, Saraswati, Pagerwesi
 *  - 'emerald': Perayaan wewaran lainnya
 *
 * @param nama Nama perayaan
 * @param tag Kategori hari raya
 * @returns HariRayaBadgeVariant
 */
export function getHariRayaBadgeVariant(
  nama: string,
  tag: HariRayaCategoryTag
): HariRayaBadgeVariant {
  const lower = nama.toLowerCase();

  // 1. Hari Raya Utama Bernuansa Surya Gold
  if (
    lower.includes('purnama') ||
    lower.includes('galungan') ||
    lower.includes('kuningan') ||
    lower.includes('nyepi')
  ) {
    return 'gold';
  }

  // 2. Tilem & Kajeng Kliwon Bernuansa Rose / Red Crimson
  if (lower.includes('tilem') || tag === 'Kajeng') {
    return 'rose';
  }

  // 3. Tumpek Bernuansa Mint Teal Tirta
  if (tag === 'Tumpek') {
    return 'mint';
  }

  // 4. Hari Bhatari Sri & Saraswati Bernuansa Violet Purple
  if (
    lower.includes('bhatari sri') ||
    lower.includes('saraswati') ||
    lower.includes('pagerwesi')
  ) {
    return 'purple';
  }

  // 5. Default Wewaran Berkebajikan Bernuansa Emerald Green
  return 'emerald';
}

/**
 * BLOK 2C: Kelas CSS Utility Tailwind untuk Date Badge Kotak Tanggal Kiri
 * ---------------------------------------------------------------------------
 * Mengembalikan styling kotak tanggal di sisi kiri kartu berdasarkan varian warnanya.
 */
export function getDateBadgeStyles(variant: HariRayaBadgeVariant): {
  container: string;
  dayText: string;
  monthText: string;
} {
  switch (variant) {
    case 'gold':
      return {
        container: 'bg-[#fffbeb] border border-amber-300 text-amber-900',
        dayText: 'text-amber-900 font-extrabold',
        monthText: 'text-amber-700 font-bold',
      };
    case 'rose':
      return {
        container: 'bg-rose-50 border border-rose-200 text-rose-900',
        dayText: 'text-rose-900 font-extrabold',
        monthText: 'text-rose-600 font-bold',
      };
    case 'mint':
      return {
        container: 'bg-[#e6f7f5] border border-teal-200/80 text-[#0f766e]',
        dayText: 'text-[#0f766e] font-extrabold',
        monthText: 'text-teal-600 font-bold',
      };
    case 'purple':
      return {
        container: 'bg-[#ede9fe] border border-violet-200 text-[#6d28d9]',
        dayText: 'text-[#6d28d9] font-extrabold',
        monthText: 'text-violet-600 font-bold',
      };
    case 'emerald':
    default:
      return {
        container: 'bg-[#f0fdf4] border border-emerald-200 text-[#15803d]',
        dayText: 'text-[#15803d] font-extrabold',
        monthText: 'text-emerald-600 font-bold',
      };
  }
}

/**
 * BLOK 2D: Kelas CSS Utility Tailwind untuk Pill Badge Kategori Kultural
 * ---------------------------------------------------------------------------
 * Mengembalikan styling chip label kategori kecil di bawah judul hari raya.
 */
export function getCategoryPillStyles(tag: HariRayaCategoryTag): string {
  switch (tag) {
    case 'Bulan':
      return 'bg-amber-50 text-amber-800 border border-amber-200/60';
    case 'Kajeng':
      return 'bg-rose-50 text-rose-800 border border-rose-200/60';
    case 'Tumpek':
      return 'bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60';
    case 'Wewaran':
      return 'bg-emerald-50 text-emerald-800 border border-emerald-200/60';
    case 'Rahina':
    default:
      return 'bg-violet-50 text-violet-800 border border-violet-200/60';
  }
}

// ---------------------------------------------------------------------------
// 3. Transformasi Data Kalender Harian ke Model Presentasi Kartu
// ---------------------------------------------------------------------------

/**
 * BLOK 3: Konversi Hari Kalender Menjadi Daftar Kartu Hari Raya
 * ---------------------------------------------------------------------------
 * Mengekstrak seluruh kejadian hari raya dari array KalenderHarian menjadi
 * daftar `HariRayaCardItem` yang siap dirender di grid UI.
 *
 * @param calendarDays Array KalenderHarian (misal: seluruh hari dalam 1 bulan atau 1 tahun)
 * @param masterMap Map data master untuk melengkapi teks deskripsi
 * @returns Array HariRayaCardItem terurut secara kronologis
 */
export function extractHariRayaCards(
  calendarDays: KalenderHarian[],
  masterMap?: Map<string, HariRayaMasterItem>
): HariRayaCardItem[] {
  const cards: HariRayaCardItem[] = [];

  for (const day of calendarDays) {
    if (!day.hari_raya || day.hari_raya.length === 0) continue;

    // Uraikan bagian tanggal YYYY-MM-DD
    const parts = day.tanggal.split('-');
    if (parts.length !== 3) continue;

    const [yearStr, monthStr, dayStr] = parts;
    const yearNum = parseInt(yearStr, 10);
    const monthNum = parseInt(monthStr, 10); // 1-indexed
    const dayNum = parseInt(dayStr, 10);

    // Tanggal JavaScript berbasis UTC untuk menentukan nama hari Masehi
    const dateObj = new Date(Date.UTC(yearNum, monthNum - 1, dayNum));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Minggu, 6 = Sabtu
    const dayName = NAMA_HARI_INDO[dayOfWeek]; // Format huruf depan kapital: "Sabtu", "Minggu", dsb.
    const monthShort = NAMA_BULAN_SHORT[monthNum - 1] || 'BLN';

    // Loop setiap perayaan yang jatuh di tanggal tersebut (bisa lebih dari 1)
    for (const hr of day.hari_raya) {
      const tag = getHariRayaCategoryTag(hr.nama);
      const variant = getHariRayaBadgeVariant(hr.nama, tag);

      // Cari uraian filosofis dari masterMap (GET /api/v1/hari-raya/master)
      const masterInfo =
        masterMap?.get(hr.id) ||
        masterMap?.get(hr.nama.toLowerCase().trim());
      const deskripsi = masterInfo?.keterangan || '';

      cards.push({
        id: `${day.tanggal}-${hr.id || hr.nama}`,
        tanggal: day.tanggal,
        nama: hr.nama,
        simbol: hr.simbol,
        jenis: hr.jenis,
        keterangan: deskripsi,
        dayName,
        dayNumber: String(dayNum).padStart(2, '0'),
        monthShort,
        categoryTag: tag,
        badgeVariant: variant,
        wuku: day.wewaran?.wuku?.nama ? capitalize(day.wewaran.wuku.nama) : undefined,
        sasih: day.sasih?.nama_sasih ? capitalize(day.sasih.nama_sasih) : undefined,
        tahunSaka: day.sasih?.tahun_saka,
      });
    }
  }

  return cards;
}

// ---------------------------------------------------------------------------
// 4. Perhitungan Hari Raya Terdekat & Hitung Mundur (Countdown)
// ---------------------------------------------------------------------------

/**
 * BLOK 4A: Menghitung Selisih Hari Kalender
 * ---------------------------------------------------------------------------
 * Menghitung selisih hari integer antara dua tanggal "YYYY-MM-DD".
 */
export function calculateDaysDifference(fromDateStr: string, toDateStr: string): number {
  const fromParts = fromDateStr.split('-').map(Number);
  const toParts = toDateStr.split('-').map(Number);

  const fromUtc = Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2]);
  const toUtc = Date.UTC(toParts[0], toParts[1] - 1, toParts[2]);

  const diffMs = toUtc - fromUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * BLOK 4B: Menemukan Hari Raya Terdekat dari Hari Ini
 * ---------------------------------------------------------------------------
 * Mencari kejadian hari raya pertama yang jatuh pada atau setelah hari ini (`todayWITA`),
 * lalu menyusun objek `HariRayaUpcomingInfo` lengkap dengan wuku dan sasih.
 *
 * @param allCards Daftar seluruh perayaan yang telah diekstrak
 * @param todayDate Tanggal hari ini dalam format "YYYY-MM-DD" WITA
 * @returns HariRayaUpcomingInfo atau null jika tidak ada
 */
export function findUpcomingHariRaya(
  allCards: HariRayaCardItem[],
  todayDate: string = getTodayWITA()
): HariRayaUpcomingInfo | null {
  if (allCards.length === 0) return null;

  // Filter perayaan yang jatuh hari ini atau di masa mendatang
  const upcomingCandidates = allCards.filter(
    (card) => card.tanggal >= todayDate
  );

  // Ambil kandidat pertama (paling terdekat secara tanggal)
  const candidate = upcomingCandidates[0] || allCards[0];
  if (!candidate) return null;

  const diffDays = calculateDaysDifference(todayDate, candidate.tanggal);

  // Susun teks hitung mundur yang manusiawi
  let countdownText: string;
  if (diffDays === 0) {
    countdownText = `Hari ini perayaan ${candidate.nama}`;
  } else if (diffDays === 1) {
    countdownText = `Besok menuju ${candidate.nama}`;
  } else if (diffDays > 0) {
    countdownText = `${diffDays} hari menuju ${candidate.nama}`;
  } else {
    countdownText = `Perayaan ${candidate.nama}`;
  }

  // Teks subtitle fase bulan khusus untuk Purnama atau Tilem
  let moonPhaseText: string | undefined = undefined;
  if (candidate.nama.toLowerCase().includes('purnama')) {
    moonPhaseText = 'Sukla Paksa • Bulan penuh';
  } else if (candidate.nama.toLowerCase().includes('tilem')) {
    moonPhaseText = 'Krsna Paksa • Bulan mati';
  }

  return {
    item: candidate,
    daysRemaining: Math.max(0, diffDays),
    countdownText,
    moonPhaseText,
    wuku: candidate.wuku ? capitalize(candidate.wuku) : 'Sinta',
    sasih: candidate.sasih ? capitalize(candidate.sasih) : 'Kapat',
  };
}

// ---------------------------------------------------------------------------
// 5. Perhitungan Metrik Hero Atas
// ---------------------------------------------------------------------------

/**
 * BLOK 5: Menghitung 3 Nilai Statistik untuk Banner Hero
 * ---------------------------------------------------------------------------
 * 1. Total rahina pada bulan aktif (contoh: 8 rahina)
 * 2. Hitung mundur hari raya terdekat (contoh: 4 hari menuju Purnama)
 * 3. Status perayaan hari ini (ada perayaan atau tidak ada hari raya)
 *
 * @param monthCards Kartu hari raya pada bulan aktif
 * @param upcomingInfo Informasi hari raya terdekat
 * @param todayDate Tanggal hari ini "YYYY-MM-DD"
 * @param activeYear Tahun aktif
 * @param activeMonth Bulan aktif (1-12)
 * @returns HariRayaHeroMetrics
 */
export function computeHeroMetrics(
  monthCards: HariRayaCardItem[],
  upcomingInfo: HariRayaUpcomingInfo | null,
  todayDate: string = getTodayWITA(),
  activeYear: number = 2026,
  activeMonth: number = 9
): HariRayaHeroMetrics {
  const monthName = `${NAMA_BULAN_SHORT[activeMonth - 1] || 'BULAN'} ${activeYear}`;
  const totalRahina = monthCards.length;

  // Cek apakah ada hari raya yang jatuh tepat pada hari ini
  const todayCards = monthCards.filter((card) => card.tanggal === todayDate);
  const todayHolidays: HariRayaMasterItem[] = todayCards.map((card) => ({
    id: card.id,
    nama: card.nama,
    jenis: card.jenis,
    simbol: card.simbol,
    keterangan: card.keterangan,
  }));

  return {
    monthName,
    totalRahina,
    upcomingDays: upcomingInfo?.daysRemaining ?? 0,
    upcomingHolidayName: upcomingInfo?.item.nama ?? 'Hari Raya',
    todayHolidays,
  };
}


// ---------------------------------------------------------------------------
// 7. Re-export Utilitas Ekspor Kalender iCal (.ics)
// ---------------------------------------------------------------------------

/**
 * BLOK 7: Memicu Download Berkas Kalender iCal (.ics)
 * ---------------------------------------------------------------------------
 * Membungkus fungsi exportHariRayaToICS yang sudah teruji di calendarUtils
 * agar dapat dipanggil langsung dari komponen Hari Raya.
 */
export { exportHariRayaToICS, getTodayWITA };

// ---------------------------------------------------------------------------
// 8. Helper Internal
// ---------------------------------------------------------------------------

export function capitalize(text?: string): string {
  if (!text) return '';
  return text.trim().replace(/\b\w+/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

