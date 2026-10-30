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
  formatFullIndoDate,
  getTodayWITA,
  toISODateString,
} from '@/features/kalender/utils/calendarUtils';
import type {
  DashboardMiniCalendarDay,
  PiodalanDashboardItem,
  UpcomingHariRayaItem,
} from '../types/dashboard.types';
import type { PuraBackendItem } from '@/features/piodalan/types/piodalan.types';
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
// 6. Penarik Maksimal 7 Hari Raya Terdekat (Lintas Bulan jika Diperlukan)
// ---------------------------------------------------------------------------

/**
 * Menyaring dan mengekstrak maksimal 7 hari raya terdekat kedepan.
 *
 * Aturan Filter:
 *  1. Jika berada pada bulan berjalan (current month):
 *     Mulai dari tanggal hari ini (todayDateISO) kedepan.
 *  2. Jika kalender berpindah ke bulan lain (masa depan atau lampau):
 *     Mulai dari tanggal 1 bulan tersebut kedepan.
 *  3. Mengambil hingga `limit` hari raya (default: 7) secara berurutan,
 *     meskipun melewati batas bulan aktif (misal dari akhir Oktober berlanjut ke November).
 *
 * @param allDays Array hari kalender dari backend Go
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
  const [todayYear, todayMonth] = todayDateISO.split('-').map(Number);

  // Evaluasi apakah bulan yang sedang dilihat adalah bulan hari ini
  const isCurrentMonth = targetYear === todayYear && targetMonth === todayMonth;

  // Tentukan tanggal awal pencarian:
  // - Jika berada pada bulan berjalan: mulai dari tanggal hari ini (todayDateISO)
  // - Jika melihat bulan lain: mulai dari tanggal 1 bulan tersebut
  const startDateISO = isCurrentMonth
    ? todayDateISO
    : `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;

  // Hilangkan duplikasi dan urutkan hari kalender secara kronologis menaik
  const uniqueDaysMap = new Map<string, KalenderHarian>();
  for (const day of allDays) {
    if (day?.tanggal && !uniqueDaysMap.has(day.tanggal)) {
      uniqueDaysMap.set(day.tanggal, day);
    }
  }
  const sortedDays = Array.from(uniqueDaysMap.values()).sort((a, b) =>
    a.tanggal.localeCompare(b.tanggal)
  );

  for (const day of sortedDays) {
    // Lewati tanggal sebelum tanggal awal pencarian
    if (day.tanggal < startDateISO) {
      continue;
    }

    // Periksa apakah hari tersebut memiliki data hari raya
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

// ---------------------------------------------------------------------------
// 7. Penarik Maksimal 3 Piodalan Terdekat dari Hari Ini (Data Real BE/FE)
// ---------------------------------------------------------------------------

/**
 * Normalisasi string wewaran/sasih agar toleran terhadap variasi kapitalisasi dan penulisan.
 */
const normString = (s?: string | null): string => {
  if (!s) return '';
  const lower = s.toLowerCase().trim();
  if (lower === 'kedasa') return 'kadasa';
  if (lower === 'kenam') return 'kanem';
  return lower;
};

/**
 * Kapitalisasi huruf pertama string (contoh: "buda" -> "Buda").
 */
const capFirstLetter = (text?: string | null): string => {
  if (!text) return '';
  const trimmed = text.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
};

/**
 * Bobot prioritas kategori pura untuk penentuan urutan nama pura terkemuka:
 * Kahyangan Jagat / Sad Kahyangan (1) > Dang Kahyangan (2) > Kahyangan Tiga (3) > Swagina (4) > Kawitan (5) > Lainnya (6).
 */
const getPuraPriorityScore = (type?: string | null): number => {
  const t = (type || '').toLowerCase();
  if (t.includes('kahyangan jagat') || t.includes('sad kahyangan')) return 1;
  if (t.includes('dang kahyangan')) return 2;
  if (t.includes('kahyangan tiga')) return 3;
  if (t.includes('swagina')) return 4;
  if (t.includes('kawitan')) return 5;
  return 6;
};

/**
 * Mengekstrak jadwal piodalan pura terdekat setelah hari ini (todayDateISO)
 * dari data real penanggalan kalender dan master 461 pura backend Go.
 *
 * Logika Pencocokan:
 *  1. Berbasis Pawukon (210 Hari): Mencocokkan Wuku + Saptawara + Pancawara pura dengan wewaran hari kalender.
 *  2. Berbasis Sasih (Candra): Mencocokkan Sasih + Purnama/Tilem pura dengan pengalantaka hari kalender.
 *  3. Mengelompokkan pura yang memiliki piodalan pada hari yang sama.
 *  4. Memilih maksimal 3 pura terkemuka berdasarkan bobot kategori pura (Kahyangan Jagat dsb).
 *  5. Menghitung countdown sisa hari (HARI INI, BESOK, X HARI LAGI).
 *
 * @param allDays Daftar hari kalender dari backend Go
 * @param puras Daftar master pura resmi dari backend Go
 * @param todayDateISO Tanggal hari ini zona WITA ("YYYY-MM-DD")
 * @param limit Jumlah maksimal agenda piodalan terdekat (default: 3)
 */
export function extractTopUpcomingPiodalan(
  allDays: KalenderHarian[],
  puras: PuraBackendItem[],
  todayDateISO: string,
  limit: number = 3
): PiodalanDashboardItem[] {
  if (
    !Array.isArray(puras) ||
    puras.length === 0 ||
    !Array.isArray(allDays) ||
    allDays.length === 0
  ) {
    return [];
  }

  // 1. Indeks pura ke dalam hash map untuk pencarian O(1)
  const pawukonMap = new Map<string, PuraBackendItem[]>();
  const sasihMap = new Map<string, PuraBackendItem[]>();

  for (const p of puras) {
    const pWuku = normString(p.wuku);
    const pSapta = normString(p.saptawara);
    const pPanca = normString(p.pancawara);
    if (pWuku && pSapta && pPanca) {
      const key = `${pWuku}|${pSapta}|${pPanca}`;
      const list = pawukonMap.get(key) || [];
      list.push(p);
      pawukonMap.set(key, list);
    }

    const pSasih = normString(p.sasih);
    const pPT = normString(p.purnama_tilem);
    if (pSasih && pPT) {
      const key = `${pSasih}|${pPT}`;
      const list = sasihMap.get(key) || [];
      list.push(p);
      sasihMap.set(key, list);
    }
  }

  // 2. Urutkan hari kalender secara kronologis
  const sortedDays = [...allDays].sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  const results: PiodalanDashboardItem[] = [];

  for (const day of sortedDays) {
    // Lewati tanggal-tanggal lampau (hanya ambil hari ini dan masa depan)
    if (day.tanggal < todayDateISO) {
      continue;
    }

    const dWuku = normString(day.wewaran?.wuku?.nama);
    const dSapta = normString(day.wewaran?.saptawara?.nama);
    const dPanca = normString(day.wewaran?.pancawara?.nama);
    const dSasih = normString(day.sasih?.nama_sasih);
    const dPT = normString(day.pengalantaka?.purnama_tilem);

    const pawukonPuras =
      dWuku && dSapta && dPanca
        ? pawukonMap.get(`${dWuku}|${dSapta}|${dPanca}`) || []
        : [];

    const sasihPuras =
      dSasih && (dPT === 'purnama' || dPT === 'tilem')
        ? sasihMap.get(`${dSasih}|${dPT}`) || []
        : [];

    // Gabungkan pura yang piodalannya jatuh pada tanggal ini (dedup by id)
    const combinedMap = new Map<number, PuraBackendItem>();
    for (const p of pawukonPuras) combinedMap.set(p.id, p);
    for (const p of sasihPuras) combinedMap.set(p.id, p);

    const matchedPuras = Array.from(combinedMap.values());
    if (matchedPuras.length === 0) {
      continue;
    }

    // Urutkan pura berdasarkan prioritas kesakralan pura terkemuka
    matchedPuras.sort((a, b) => {
      const prioA = getPuraPriorityScore(a.type);
      const prioB = getPuraPriorityScore(b.type);
      if (prioA !== prioB) return prioA - prioB;
      return a.name.localeCompare(b.name, 'id');
    });

    const topTemples = matchedPuras.slice(0, 3).map((p) => p.name);

    // Tentukan label Rahina yang representatif
    let rahina: string;
    if (
      pawukonPuras.length > 0 &&
      day.wewaran?.saptawara?.nama &&
      day.wewaran?.pancawara?.nama &&
      day.wewaran?.wuku?.nama
    ) {
      rahina = `${capFirstLetter(day.wewaran.saptawara.nama)} ${capFirstLetter(day.wewaran.pancawara.nama)} ${capFirstLetter(day.wewaran.wuku.nama)}`;
    } else if (sasihPuras.length > 0) {
      const ptName =
        dPT === 'purnama'
          ? 'Purnama'
          : dPT === 'tilem'
            ? 'Tilem'
            : capFirstLetter(day.pengalantaka?.purnama_tilem);
      rahina = `${ptName} Sasih ${capFirstLetter(day.sasih?.nama_sasih)}`;
    } else {
      rahina = `${capFirstLetter(day.wewaran?.saptawara?.nama)} ${capFirstLetter(day.wewaran?.pancawara?.nama)} ${capFirstLetter(day.wewaran?.wuku?.nama)}`;
    }

    const daysRemaining = computeDaysDifference(day.tanggal, todayDateISO);
    const daysRemainingText = formatDaysRemainingText(daysRemaining);
    const tanggalFormatted = formatFullIndoDate(day.tanggal);

    // URL Aksi: Jika piodalan Pawukon, arahkan ke pencarian wewaran spesifik di /piodalan
    let actionUrl = '/piodalan';
    const targetYear = day.tanggal.split('-')[0];
    if (
      pawukonPuras.length > 0 &&
      day.wewaran?.saptawara?.nama &&
      day.wewaran?.pancawara?.nama &&
      day.wewaran?.wuku?.nama
    ) {
      const sapta = capFirstLetter(day.wewaran.saptawara.nama);
      const panca = capFirstLetter(day.wewaran.pancawara.nama);
      const wuku = capFirstLetter(day.wewaran.wuku.nama);
      actionUrl = `/piodalan?tab=wewaran&saptawara=${encodeURIComponent(sapta)}&pancawara=${encodeURIComponent(panca)}&wuku=${encodeURIComponent(wuku)}&tahun=${targetYear}&searched=true`;
    } else if (sasihPuras.length > 0) {
      const targetMonth = parseInt(day.tanggal.split('-')[1], 10);
      actionUrl = `/piodalan?tab=bulan&bulan=${targetMonth}&tahun=${targetYear}&searched=true`;
    }

    results.push({
      id: `pio-${day.tanggal}`,
      rahina,
      daysRemaining,
      daysRemainingText,
      topTemples,
      tanggalISO: day.tanggal,
      tanggalFormatted,
      actionUrl,
    });

    if (results.length >= limit) {
      break;
    }
  }

  return results;
}
