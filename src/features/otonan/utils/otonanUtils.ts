import type { OtonanTimelineNode } from '../types/otonan.types';

/**
 * ============================================================================
 * UTILITAS FITUR OTONAN (KALENDER BALI)
 * ============================================================================
 * Berkas ini menyediakan fungsi-fungsi esensial murni (pure functions) untuk:
 *  1. Normalisasi & format tanggal ke bahasa Indonesia (aman dari timezone shift).
 *  2. Perhitungan selisih countdown hari ("26 hari lagi", "Hari ini", dll).
 *  3. Perhitungan 4 titik timeline stepper siklus otonan (interval 210 hari).
 *  4. Generator dan unduhan berkas iCalendar (.ics) untuk Google/Apple Calendar.
 * ============================================================================
 */

// ============================================================================
// 1. Konstanta Kalender Indonesia & Bali
// ============================================================================

/** Daftar nama bulan Masehi panjang dalam bahasa Indonesia */
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

/** Daftar nama bulan Masehi singkatan */
export const INDO_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/** Daftar nama hari Masehi dalam bahasa Indonesia (0 = Minggu s.d. 6 = Sabtu) */
export const INDO_DAYS = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

/** Jumlah hari dalam 1 siklus Pawukon Otonan */
export const SIKLUS_OTONAN_DAYS = 210;

// ============================================================================
// 2. Parser & Formatter Tanggal (Aman Timezone)
// ============================================================================

/**
 * Mengurai string tanggal "YYYY-MM-DD" menjadi komponen angka { year, month, day }
 * tanpa dipengaruhi oleh perbedaan timezone lokal perangkat.
 *
 * @param isoDate String tanggal format "YYYY-MM-DD"
 */
export function parseISODateParts(isoDate: string): { year: number; month: number; day: number } {
  if (!isoDate || typeof isoDate !== 'string') {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
  }

  const parts = isoDate.split('-');
  return {
    year: parseInt(parts[0], 10) || 2026,
    month: parseInt(parts[1], 10) || 1,
    day: parseInt(parts[2], 10) || 1,
  };
}

/**
 * Mengambil nama hari Masehi dalam bahasa Indonesia (contoh: "Minggu", "Selasa").
 *
 * @param isoDate String tanggal format "YYYY-MM-DD"
 */
export function getIndoDayName(isoDate: string): string {
  const { year, month, day } = parseISODateParts(isoDate);
  // Gunakan jam 12 siang agar terhindar dari pergeseran hari daylight saving atau timezone
  const dateObj = new Date(year, month - 1, day, 12, 0, 0);
  return INDO_DAYS[dateObj.getDay()] || 'Minggu';
}

/**
 * Memformat tanggal "YYYY-MM-DD" menjadi format bahasa Indonesia yang mudah dibaca:
 * - 'long'  -> "18 Oktober 2026"
 * - 'short' -> "22 Des 1998"
 *
 * @param isoDate String tanggal "YYYY-MM-DD"
 * @param options Opsi format bulan ('long' | 'short') dan penambahan nama hari
 */
export function formatIndoDate(
  isoDate: string,
  options: {
    format?: 'long' | 'short';
    withDayName?: boolean;
  } = {}
): string {
  const { format = 'long', withDayName = false } = options;
  const { year, month, day } = parseISODateParts(isoDate);

  const monthName =
    format === 'short'
      ? INDO_MONTHS_SHORT[month - 1] || ''
      : INDO_MONTHS_LONG[month - 1] || '';

  const formattedDate = `${day} ${monthName} ${year}`;

  if (withDayName) {
    const dayName = getIndoDayName(isoDate);
    return `${dayName}, ${formattedDate}`;
  }

  return formattedDate;
}

/**
 * Mengambil tanggal hari ini terkunci ke zona waktu WITA (UTC+8 / Asia/Makassar).
 * Menghindari bug selisih 1 hari ketika pengguna mengakses dari WIB atau luar negeri.
 *
 * @returns Tanggal hari ini format "YYYY-MM-DD"
 */
export function getTodayWITA(): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Makassar',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    // Fallback jika browser lawas tidak mendukung timezone IANA
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wita = new Date(utc + 3600000 * 8);
    const y = wita.getFullYear();
    const m = String(wita.getMonth() + 1).padStart(2, '0');
    const d = String(wita.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}

// ============================================================================
// 3. Perhitungan Countdown Hari
// ============================================================================

/**
 * Menghitung selisih hari antara tanggal target otonan dengan tanggal hari ini:
 * - > 0 -> "26 hari lagi"
 * - = 0 -> "Hari ini"
 * - < 0 -> "X hari lalu"
 *
 * @param targetDateStr Tanggal target format "YYYY-MM-DD"
 * @param fromDateStr Tanggal pembanding (default: hari ini WITA)
 */
export function getCountdownDays(
  targetDateStr: string,
  fromDateStr?: string
): { days: number; text: string } {
  const from = fromDateStr || getTodayWITA();

  const { year: ty, month: tm, day: td } = parseISODateParts(targetDateStr);
  const { year: fy, month: fm, day: fd } = parseISODateParts(from);

  const targetUtc = Date.UTC(ty, tm - 1, td);
  const fromUtc = Date.UTC(fy, fm - 1, fd);

  const diffMs = targetUtc - fromUtc;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { days: 0, text: 'Hari ini' };
  } else if (diffDays > 0) {
    return { days: diffDays, text: `${diffDays} hari lagi` };
  } else {
    return { days: diffDays, text: `${Math.abs(diffDays)} hari lalu` };
  }
}

// ============================================================================
// 4. Perhitungan Stepper 4 Titik Siklus Otonan (Interval 210 Hari)
// ============================================================================

/**
 * Menambahkan atau mengurangkan N hari dari sebuah string tanggal "YYYY-MM-DD".
 *
 * @param isoDate Tanggal dasar format "YYYY-MM-DD"
 * @param days Jumlah hari yang ditambahkan (bisa positif atau negatif)
 * @returns Tanggal baru format "YYYY-MM-DD"
 */
export function addDaysToISODate(isoDate: string, days: number): string {
  const { year, month, day } = parseISODateParts(isoDate);
  const dateObj = new Date(year, month - 1, day);
  dateObj.setDate(dateObj.getDate() + days);

  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Menghitung 4 node horizontal stepper untuk ditampilkan pada Card "Siklus Otonan":
 *  1. Node 0: Siklus N - 2 (-420 hari dari otonan aktif)
 *  2. Node 1: Siklus N - 1 (-210 hari dari otonan aktif)
 *  3. Node 2: Siklus N (Aktif - "Berikutnya")
 *  4. Node 3: Siklus N + 1 (+210 hari dari otonan aktif)
 *
 * Perhitungan ini instan (0 ms), murni di memori, dan bebas kesalahan perulangan.
 *
 * @param activeDate Tanggal otonan aktif format "YYYY-MM-DD"
 * @param activeCycle Nomor siklus aktif (contoh: 48)
 * @returns Array berisi 4 objek OtonanTimelineNode
 */
export function calculateCycleTimelineNodes(
  activeDate: string,
  activeCycle: number
): OtonanTimelineNode[] {
  // Hitung tanggal untuk masing-masing titik
  const dateCycleMinus2 = addDaysToISODate(activeDate, -SIKLUS_OTONAN_DAYS * 2);
  const dateCycleMinus1 = addDaysToISODate(activeDate, -SIKLUS_OTONAN_DAYS);
  const dateCycleCurrent = activeDate;
  const dateCyclePlus1 = addDaysToISODate(activeDate, SIKLUS_OTONAN_DAYS);

  return [
    {
      cycleNumber: activeCycle - 2,
      date: dateCycleMinus2,
      formattedDate: formatIndoDate(dateCycleMinus2, { format: 'short' }),
      isCurrent: false,
      label: `Siklus ${activeCycle - 2}`,
    },
    {
      cycleNumber: activeCycle - 1,
      date: dateCycleMinus1,
      formattedDate: formatIndoDate(dateCycleMinus1, { format: 'short' }),
      isCurrent: false,
      label: `Siklus ${activeCycle - 1}`,
    },
    {
      cycleNumber: activeCycle,
      date: dateCycleCurrent,
      formattedDate: formatIndoDate(dateCycleCurrent, { format: 'short' }),
      isCurrent: true,
      label: 'Berikutnya',
    },
    {
      cycleNumber: activeCycle + 1,
      date: dateCyclePlus1,
      formattedDate: formatIndoDate(dateCyclePlus1, { format: 'short' }),
      isCurrent: false,
      label: `Siklus ${activeCycle + 1}`,
    },
  ];
}

// ============================================================================
// 5. Generator Berkas iCalendar (.ics) untuk Ekspor Jadwal Otonan
// ============================================================================

export interface OtonanICSEventData {
  tanggal: string; // "YYYY-MM-DD"
  perayaanKe: number;
  saptawara: string;
  pancawara: string;
  wuku: string;
  sasih?: string;
}

/**
 * Menghasilkan dan memicu unduhan berkas .ics (RFC 5545) untuk acara Otonan.
 * Memungkinkan pengguna menambahkan jadwal otonan ke Google Calendar atau Apple Calendar.
 *
 * @param eventData Rincian acara otonan yang akan diekspor
 */
export function downloadOtonanICS(eventData: OtonanICSEventData): void {
  const { tanggal, perayaanKe, saptawara, pancawara, wuku, sasih } = eventData;
  const { year, month, day } = parseISODateParts(tanggal);

  const yStr = String(year);
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');

  const dtStart = `${yStr}${mStr}${dStr}`;

  // Akhir tanggal all-day event adalah hari berikutnya (RFC 5545)
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const ny = nextDay.getUTCFullYear();
  const nm = String(nextDay.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(nextDay.getUTCDate()).padStart(2, '0');
  const dtEnd = `${ny}${nm}${nd}`;

  const uid = `otonan-${dtStart}-${perayaanKe}@kalenderbali.app`;
  const summary = `Otonan ke-${perayaanKe} (${saptawara} ${pancawara} ${wuku})`;
  const description = `Hari kelahiran dalam penanggalan Bali: ${saptawara} ${pancawara} ${wuku}. Siklus ke-${perayaanKe}. Sasih: ${
    sasih || '-'
  }. Dihitung otomatis oleh Kalender Bali Digital.`;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kalender Bali Digital//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Otonan ${saptawara} ${pancawara} ${wuku}`,
    'X-WR-TIMEZONE:Asia/Makassar',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStart}T000000Z`,
    `DTSTART;VALUE=DATE:${dtStart}`,
    `DTEND;VALUE=DATE:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    'STATUS:CONFIRMED',
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsContent = icsLines.join('\r\n');
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = url;
  downloadLink.setAttribute('download', `Otonan-${saptawara}-${pancawara}-${wuku}-${tanggal}.ics`);
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(url);
}
