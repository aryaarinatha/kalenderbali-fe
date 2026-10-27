/**
 * ============================================================================
 * UTILITAS & LOGIKA MATEMATIS: DASHBOARD KALENDER BALI
 * ============================================================================
 * Berkas ini menyediakan fungsi-fungsi perhitungan, penataan matriks mini kalender,
 * penentuan dot indikator hari raya, dan kalkulasi hitung mundur (countdown).
 *
 * Menerapkan Prinsip Efisiensi:
 *  - Menggunakan kembali utilitas inti dari @/features/kalender/utils/calendarUtils.
 *  - Menata sel Mini Kalender dengan standar Senin-Pertama (SEN s.d. MIN) agar
 *    persis menyamai tata letak desain visual mockup.
 * ============================================================================
 */

import type { KalenderHarian } from '@/features/kalender/types/kalender.types';
import {
  getTodayWITA,
  toISODateString,
} from '@/features/kalender/utils/calendarUtils';
import type {
  DashboardMiniCalendarDay,
  UpcomingHariRayaItem,
} from '../types/dashboard.types';
import { getHariRayaSubtext } from '../data/dashboardMockData';

// ---------------------------------------------------------------------------
// 1. Konstanta Header Nama Hari (Senin-Pertama: SEN s.d. MIN)
// ---------------------------------------------------------------------------

/**
 * Label 7 kolom hari mini kalender sesuai dengan desain mockup Dashboard:
 * Dimulai dari SEN (Senin) hingga MIN (Minggu).
 */
export const MINI_CALENDAR_HEADERS = [
  'SEN',
  'SEL',
  'RAB',
  'KAM',
  'JUM',
  'SAB',
  'MIN',
] as const;

/** Singkatan 3 huruf nama bulan Indonesia */
const BULAN_SHORT = [
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

// ---------------------------------------------------------------------------
// 2. Evaluator Label Singkat & Warna Dot Hari Raya pada Sel Kalender
// ---------------------------------------------------------------------------

/**
 * Menganalisis daftar hari raya pada suatu tanggal untuk mengambil
 * nama label mini (maksimal 7 karakter) dan warna dot penanda visual.
 *
 * Prioritas Kultural:
 *  1. Purnama & Tilem (Fase candra utama) -> Dot Kuning Surya (gold)
 *  2. Galungan & Kuningan (Hari raya agung) -> Dot Merah (rose)
 *  3. Kajeng Kliwon (Pertemuan sakral wewaran) -> Dot Merah (rose)
 *  4. Sugihan (Sugihan Jawa / Bali) -> Dot Hijau (emerald)
 *  5. Hari Raya Lainnya -> Dot Mint (teal)
 */
export function extractMiniHolidayIndicator(
  dayData?: KalenderHarian
): { label?: string; fullName?: string; dotColor?: 'gold' | 'rose' | 'emerald' | 'teal' } {
  if (!dayData || !dayData.hari_raya || dayData.hari_raya.length === 0) {
    return {};
  }

  const holidays = dayData.hari_raya;

  // 1. Ekstrak simbol resmi dari backend Go (contoh: "KK", "PN", "TM", "TW", "SA", dll.)
  const symbols = holidays
    .map((h) => h.simbol?.trim())
    .filter((s): s is string => Boolean(s));

  // Gabungkan simbol jika ada lebih dari 1 perayaan pada hari tersebut (contoh: "TW · KK" atau "KK · PN")
  const label =
    symbols.length > 0
      ? symbols.slice(0, 2).join(' · ')
      : holidays[0]?.nama.slice(0, 3).toUpperCase() || '';

  const fullName = holidays.map((h) => h.nama).join(', ');

  // 2. Evaluasi varian warna dot semantik (AGENTS.md)
  let dotColor: 'gold' | 'rose' | 'emerald' | 'teal' = 'teal';

  const isPurnama = holidays.some((h) => h.nama.toLowerCase().includes('purnama'));
  const isTilem = holidays.some((h) => h.nama.toLowerCase().includes('tilem'));
  const isSacred = holidays.some((h) => {
    const l = h.nama.toLowerCase();
    return (
      l.includes('galungan') ||
      l.includes('kuningan') ||
      l.includes('kajeng') ||
      l.includes('tumpek') ||
      l.includes('nyepi') ||
      l.includes('siwaratri')
    );
  });
  const isSugihan = holidays.some((h) => h.nama.toLowerCase().includes('sugihan'));

  if (isPurnama) {
    dotColor = 'gold';
  } else if (isTilem || isSacred) {
    dotColor = 'rose';
  } else if (isSugihan) {
    dotColor = 'emerald';
  }

  return {
    label,
    fullName,
    dotColor,
  };
}

// ---------------------------------------------------------------------------
// 3. Generator Matriks Mini Kalender (Senin-Pertama: SEN s.d. MIN)
// ---------------------------------------------------------------------------

/**
 * Menghasilkan susunan sel tanggal untuk satu bulan kalender (35 atau 42 sel),
 * dengan urutan hari dimulai dari hari SENIN (index 0) hingga MINGGU (index 6).
 *
 * @param year Tahun Masehi aktif (contoh: 2026)
 * @param month Bulan Masehi aktif (1 - 12)
 * @param selectedDate Tanggal yang sedang dipilih ("YYYY-MM-DD")
 * @param daysMap Peta data KalenderHarian dari backend Go (O(1) Map lookup)
 */
export function generateMiniCalendarGrid(
  year: number,
  month: number,
  selectedDate: string,
  daysMap: Map<string, KalenderHarian>
): DashboardMiniCalendarDay[] {
  const todayWITA = getTodayWITA();
  const cells: DashboardMiniCalendarDay[] = [];

  // Konversi hari pertama ke standar Senin-pertama:
  // JS getUTCDay: 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  // Formula: (day + 6) % 7 -> Senin jadi 0, Minggu jadi 6
  const rawFirstDay = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const mondayFirstDayIndex = (rawFirstDay + 6) % 7;

  // Jumlah hari bulan ini & bulan sebelumnya
  const daysInCurrentMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  // 1. Sel sisa dari bulan sebelumnya (Trailing Days)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  for (let i = mondayFirstDayIndex - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const dateStr = toISODateString(prevYear, prevMonth, dayNumber);
    const dayData = daysMap.get(dateStr);

    cells.push({
      dateString: dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      holidays: dayData?.hari_raya || [],
    });
  }

  // 2. Sel bulan aktif (Current Month Days)
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = toISODateString(year, month, day);
    const dayData = daysMap.get(dateStr);

    cells.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      holidays: dayData?.hari_raya || [],
    });
  }

  // 3. Sel pelengkap bulan berikutnya (Leading Days hingga kelipatan 7)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const remainingCells = (7 - (cells.length % 7)) % 7;
  const targetTotal = cells.length + remainingCells < 35 ? 35 : cells.length + remainingCells;

  let nextDayCounter = 1;
  while (cells.length < targetTotal) {
    const dateStr = toISODateString(nextYear, nextMonth, nextDayCounter);
    const dayData = daysMap.get(dateStr);

    cells.push({
      dateString: dateStr,
      dayNumber: nextDayCounter,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      holidays: dayData?.hari_raya || [],
    });
    nextDayCounter++;
  }

  return cells;
}

// ---------------------------------------------------------------------------
// 4. Kalkulator Hitung Mundur & Selisih Hari (Countdown)
// ---------------------------------------------------------------------------

/**
 * Menghitung selisih hari antara tanggal target dengan tanggal acuan (todayWITA).
 * Menggunakan perbandingan absolut berbasis UTC untuk mencegah off-by-one karena daylight saving.
 */
export function computeDaysDifference(targetDateISO: string, baseDateISO: string): number {
  const [tY, tM, tD] = targetDateISO.split('-').map(Number);
  const [bY, bM, bD] = baseDateISO.split('-').map(Number);

  const targetUTC = Date.UTC(tY, tM - 1, tD);
  const baseUTC = Date.UTC(bY, bM - 1, bD);

  const diffMs = targetUTC - baseUTC;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Menghasilkan teks label hitung mundur yang manusiawi (human-friendly).
 * Contoh: "HARI INI", "BESOK", "5 HARI LAGI".
 */
export function formatDaysRemainingText(daysDiff: number): string {
  if (daysDiff === 0) return 'HARI INI';
  if (daysDiff === 1) return 'BESOK';
  if (daysDiff > 1) return `${daysDiff} HARI LAGI`;
  return `${Math.abs(daysDiff)} HARI LALU`;
}

// ---------------------------------------------------------------------------
// 5. Penentu Varian Warna Kotak Tanggal (AGENTS.md)
// ---------------------------------------------------------------------------

/**
 * Menentukan warna latar dan teks untuk kotak tanggal pada list Hari Raya:
 *  - Gold Amber  : Purnama & Tilem
 *  - Rose Crimson: Hari Raya Besar (Galungan, Kuningan, Nyepi, Siwaratri)
 *  - Mint Teal   : Rahina Wewaran Suci & Perayaan Budaya
 */
export function determineHolidayBadgeVariant(namaHariRaya: string): 'gold' | 'mint' | 'rose' {
  const lower = namaHariRaya.toLowerCase();

  if (lower.includes('purnama') || lower.includes('tilem') || lower.includes('sabuh mas')) {
    return 'gold';
  }

  if (
    lower.includes('galungan') ||
    lower.includes('kuningan') ||
    lower.includes('nyepi') ||
    lower.includes('siwaratri') ||
    lower.includes('saraswati') ||
    lower.includes('pagerwesi')
  ) {
    return 'rose';
  }

  return 'mint';
}

// ---------------------------------------------------------------------------
// 6. Penarik Maksimal 7 Hari Raya pada Bulan yang Sedang Aktif di Kalender
// ---------------------------------------------------------------------------

/**
 * Menyaring dan mengekstrak maksimal 7 hari raya terdekat yang berada pada
 * BULAN YANG AKTIF di Mini Kalender.
 *
 * Aturan Filter (Sesuai Arahan Pengguna):
 *  1. Tanggal hari raya HARUS berada pada bulan & tahun aktif kalender (targetYear & targetMonth).
 *     Hari raya di bulan berikutnya TIDAK AKAN ditampilkan jika kalender belum berganti bulan.
 *  2. Jika kalender berada pada bulan berjalan (current month):
 *     Hanya menampilkan hari raya yang belum lewat (tanggal >= todayDateISO).
 *  3. Jika kalender berpindah ke bulan masa depan (future month):
 *     Menampilkan hari raya mulai dari awal bulan tersebut.
 *  4. Jika kalender berpindah ke bulan lampau (past month):
 *     Menampilkan hari raya pada bulan lampau tersebut.
 *  5. Maksimal mengambil hingga `limit` hari raya (default: 7).
 *
 * @param allDays Array 365/366 hari kalender dari backend Go
 * @param todayDateISO Tanggal hari ini zona WITA ("YYYY-MM-DD")
 * @param targetYear Tahun kalender yang sedang aktif ditampilkan
 * @param targetMonth Bulan kalender yang sedang aktif ditampilkan (1 - 12)
 * @param limit Jumlah maksimal yang ingin diambil (default: 7)
 */
export function extractTopUpcomingHariRaya(
  allDays: KalenderHarian[],
  todayDateISO: string,
  targetYear: number,
  targetMonth: number,
  limit: number = 7
): UpcomingHariRayaItem[] {
  const upcomingItems: UpcomingHariRayaItem[] = [];
  const targetMonthPrefix = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;
  const [todayYear, todayMonth] = todayDateISO.split('-').map(Number);

  // Evaluasi apakah bulan yang sedang dilihat adalah bulan hari ini
  const isCurrentMonth = targetYear === todayYear && targetMonth === todayMonth;

  for (const day of allDays) {
    // 1. KUNCI BULAN AKTIF: Hari raya wajib berada di dalam bulan aktif kalender
    if (!day.tanggal.startsWith(targetMonthPrefix)) {
      continue;
    }

    // 2. KUNCI HARI INI: Jika di bulan berjalan, hanya tampilkan agenda hari ini dan kedepan
    if (isCurrentMonth && day.tanggal < todayDateISO) {
      continue;
    }

    // 3. Periksa apakah hari tersebut memiliki data hari raya
    if (day.hari_raya && day.hari_raya.length > 0) {
      const daysDiff = computeDaysDifference(day.tanggal, todayDateISO);
      const [, monthStr, dayStr] = day.tanggal.split('-');
      const monthNum = parseInt(monthStr, 10);
      const dayNum = parseInt(dayStr, 10);
      const monthShort = BULAN_SHORT[monthNum - 1] || 'HR';

      for (const holiday of day.hari_raya) {
        const variant = determineHolidayBadgeVariant(holiday.nama);
        const subtext = getHariRayaSubtext(holiday.nama);

        upcomingItems.push({
          id: `${day.tanggal}-${holiday.id || holiday.nama}`,
          holidayId: holiday.id,
          nama: holiday.nama,
          tanggalISO: day.tanggal,
          dayNumber: dayNum,
          monthShort,
          keterangan: subtext,
          badgeVariant: variant,
          daysRemaining: daysDiff,
          daysRemainingText: formatDaysRemainingText(daysDiff),
        });

        // Hentikan jika kuota limit sudah terpenuhi (maksimal 7 item)
        if (upcomingItems.length >= limit) {
          return upcomingItems;
        }
      }
    }
  }

  return upcomingItems;
}
