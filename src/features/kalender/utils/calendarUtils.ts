import type { CalendarGridDay, KalenderHarian } from '../types/kalender.types';

/**
 * ============================================================================
 * UTILITAS KALENDER BALI & PENANGGALAN
 * ============================================================================
 * Berkas ini menyediakan fungsi-fungsi esensial yang murni, ringan, dan efisien:
 *  1. Normalisasi tanggal ke zona waktu WITA (UTC+8) agar bebas dari bug off-by-one.
 *  2. Kamus lookup Urip, Arah Mata Angin (Pangider-ider), dan Dina Ka-.
 *  3. Generator matriks grid 7 kolom untuk tampilan kalender bulanan.
 *  4. Penentu varian warna badge hari raya sesuai estetika desain mockup.
 *  5. Generator berkas iCalendar (.ics) untuk ekspor agenda ke Google/Apple Calendar.
 * ============================================================================
 */

// ---------------------------------------------------------------------------
// 1. Kamus Nilai Wariga (Urip, Arah Pengider-ider, dan Urutan Dina)
// ---------------------------------------------------------------------------

/**
 * Nilai Urip (Neptu) resmi untuk tiap siklus Pancawara.
 */
export const URIP_PANCAWARA: Record<string, number> = {
  Umanis: 5,
  Paing: 9,
  Pon: 7,
  Wage: 4,
  Kliwon: 8,
};

/**
 * Nilai Urip (Neptu) resmi untuk tiap siklus Saptawara.
 */
export const URIP_SAPTAWARA: Record<string, number> = {
  Redite: 5,
  Soma: 4,
  Anggara: 3,
  Buda: 7,
  Wraspati: 8,
  Sukra: 6,
  Saniscara: 9,
};

/**
 * Arah mata angin pengider-ider berdasarkan Pancawara.
 */
export const ARAH_PANCAWARA: Record<string, string> = {
  Umanis: 'Timur',
  Paing: 'Selatan',
  Pon: 'Barat',
  Wage: 'Utara',
  Kliwon: 'Tengah',
};

/**
 * Urutan Dina (hari dalam satu wuku) dari Redite (hari ke-1) s.d. Saniscara (hari ke-7).
 */
export const DINA_SAPTAWARA: Record<string, number> = {
  Redite: 1,
  Soma: 2,
  Anggara: 3,
  Buda: 4,
  Wraspati: 5,
  Sukra: 6,
  Saniscara: 7,
};

/**
 * Menghitung total Urip, Arah Mata Angin, dan Dina Wuku dari nama Saptawara & Pancawara.
 */
export function getWarigaSummary(saptawaraName: string, pancawaraName: string) {
  const uripSapta = URIP_SAPTAWARA[saptawaraName] || 0;
  const uripPanca = URIP_PANCAWARA[pancawaraName] || 0;
  const totalUrip = uripSapta + uripPanca;
  const arah = ARAH_PANCAWARA[pancawaraName] || 'Pusat';
  const dinaKa = DINA_SAPTAWARA[saptawaraName] || 1;

  return { totalUrip, arah, dinaKa };
}

// ---------------------------------------------------------------------------
// 2. Normalisasi Zona Waktu WITA (UTC+8 / Asia/Makassar) & Pemformatan Tanggal
// ---------------------------------------------------------------------------

const NAMA_BULAN_INDO = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const NAMA_HARI_INDO = [
  'Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu',
];

/**
 * Mengembalikan tanggal hari ini dalam format "YYYY-MM-DD" yang dikunci
 * secara mutlak ke zona waktu WITA (UTC+8), mencegah bug pergeseran tanggal
 * bagi pengguna di wilayah WIB, WIT, maupun luar negeri.
 */
export function getTodayWITA(): string {
  const now = new Date();
  // Format tanggal dalam zona waktu Asia/Makassar (WITA)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Menghasilkan "YYYY-MM-DD"
}

/**
 * Mengonversi tanggal "YYYY-MM-DD" menjadi teks lengkap Indonesia.
 * Contoh: "2026-09-22" -> "22 September 2026"
 */
export function formatFullIndoDate(dateString: string): string {
  const [yearStr, monthStr, dayStr] = dateString.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);

  if (!year || !month || !day) return dateString;
  return `${day} ${NAMA_BULAN_INDO[month - 1]} ${year}`;
}

/**
 * Mengambil nama bulan Indonesia (1-12).
 */
export function getIndoMonthName(month: number): string {
  return NAMA_BULAN_INDO[month - 1] || '';
}

/**
 * Mengambil nama hari Masehi Indonesia dari tanggal "YYYY-MM-DD".
 * Contoh: "2026-09-22" -> "Selasa"
 */
export function getIndoDayName(dateString: string): string {
  const [y, m, d] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return NAMA_HARI_INDO[date.getUTCDay()];
}

/**
 * Memecah string tanggal "YYYY-MM-DD" menjadi angka numerik.
 */
export function parseISODate(dateString: string): { year: number; month: number; day: number } {
  const parts = dateString.split('-').map(Number);
  return {
    year: parts[0] || 2026,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Menggabungkan angka year, month, day menjadi string format "YYYY-MM-DD".
 */
export function toISODateString(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// ---------------------------------------------------------------------------
// 3. Generator Matriks Grid Kalender Bulanan (7 Kolom: Min s.d. Sab)
// ---------------------------------------------------------------------------

/**
 * Menghasilkan susunan 35 atau 42 sel tanggal untuk satu bulan kalender,
 * lengkap dengan sel tanggal sebelum (overlap bulan lalu) dan sesudah (overlap bulan depan).
 *
 * @param year Tahun Masehi (misal: 2026)
 * @param month Bulan Masehi 1-12 (misal: 9 untuk September)
 * @param selectedDate Tanggal yang sedang aktif/dipilih ("YYYY-MM-DD")
 * @param daysMap Map data KalenderHarian dari backend dengan key "YYYY-MM-DD"
 */
export function generateMonthGrid(
  year: number,
  month: number,
  selectedDate: string,
  daysMap: Map<string, KalenderHarian>
): CalendarGridDay[] {
  const todayWITA = getTodayWITA();
  const gridCells: CalendarGridDay[] = [];

  // Hari pertama di bulan aktif (0 = Minggu, 1 = Senin, ..., 6 = Sabtu)
  const firstDayOfMonth = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();

  // Jumlah hari di bulan aktif
  const daysInCurrentMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  // Jumlah hari di bulan sebelumnya
  const daysInPrevMonth = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();

  // 1. Sel dari Bulan Sebelumnya (Trailing days)
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i;
    const dateStr = toISODateString(prevYear, prevMonth, dayNumber);
    gridCells.push({
      dateString: dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
  }

  // 2. Sel dari Bulan Aktif (Current month days)
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = toISODateString(year, month, day);
    gridCells.push({
      dateString: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
  }

  // 3. Sel dari Bulan Berikutnya (Leading days untuk melengkapi kelipatan 7 baris)
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const remainingCells = (7 - (gridCells.length % 7)) % 7;
  // Jika barisnya baru 4 atau 5 baris (total < 35), tambahkan 7 sel lagi agar layout konsisten
  const targetTotal = gridCells.length + remainingCells < 35 ? 35 : gridCells.length + remainingCells;

  let nextDayCounter = 1;
  while (gridCells.length < targetTotal) {
    const dateStr = toISODateString(nextYear, nextMonth, nextDayCounter);
    gridCells.push({
      dateString: dateStr,
      dayNumber: nextDayCounter,
      isCurrentMonth: false,
      isToday: dateStr === todayWITA,
      isSelected: dateStr === selectedDate,
      data: daysMap.get(dateStr),
    });
    nextDayCounter++;
  }

  return gridCells;
}

// ---------------------------------------------------------------------------
// 4. Styling Semantik Badge Hari Raya
// ---------------------------------------------------------------------------

export interface BadgeColorStyle {
  bg: string;
  text: string;
  border: string;
  dot: string;
}

/**
 * Menentukan skema warna badge hari raya berdasarkan kelompok tradisi Hindu Bali:
 * 1. Siklus Sasih (Pengalantaka):
 *    - Purnama -> Merah (#e11d48) sesuai simbol lingkaran merah kalender Bali
 *    - Tilem -> Hitam (#000000) sesuai simbol lingkaran hitam kalender Bali
 * 2. Kelompok Kliwonan:
 *    - Kajeng Kliwon -> Oranye / Terracotta (berbeda dengan Purnama saat bertepatan)
 * 3. Kelompok Tumpek (Saniscara Kliwon):
 *    - 6 Tumpek -> Kuning Emas (Amber)
 * 4. Kelompok Hari Raya Besar Utama (Dharma & Pustaka):
 *    - Galungan, Kuningan, Saraswati, Pagerwesi, Nyepi, Siwaratri -> Hijau Zamrud (Emerald)
 * 5. Kelompok Rahinan Rutin Wewaran:
 *    - Anggara Kasih -> Ungu Lembut (Purple)
 *    - Buda Cemeng / Sri Sedana -> Biru Langit (Sky)
 *    - Buda Kliwon -> Tosca (Teal)
 * 6. Lainnya -> Netral Teal
 */
export function getHariRayaBadgeStyle(nama: string): BadgeColorStyle {
  const lower = nama.toLowerCase();

  // 1. Purnama -> Lingkaran Merah khas Kalender Bali (Simbol Candra Purwa / Bulan Purnama)
  if (lower.includes('purnama')) {
    return {
      bg: 'bg-[#ffe4e6]',
      text: 'text-[#be123c]',
      border: 'border-rose-200/70',
      dot: 'bg-[#e11d48]',
    };
  }

  // 2. Tilem -> Lingkaran Hitam Pekat khas Kalender Bali (Simbol Candra Surya / Bulan Mati)
  if (lower.includes('tilem')) {
    return {
      bg: 'bg-[#f1f5f9]',
      text: 'text-[#0f172a]',
      border: 'border-slate-300/80',
      dot: 'bg-[#000000]',
    };
  }

  // 3. Kajeng Kliwon -> Oranye / Terracotta (Pertemuan Triwara & Pancawara Kliwon)
  // Dibedakan dari merah Purnama agar saat tanggal bertepatan keduanya tidak rancu
  if (lower.includes('kajeng kliwon')) {
    return {
      bg: 'bg-[#ffedd5]',
      text: 'text-[#9a3412]',
      border: 'border-orange-200/70',
      dot: 'bg-[#ea580c]',
    };
  }

  // 4. Kelompok Tumpek (Saniscara Kliwon - Landep, Wariga, Kuningan, Krulut, Uye, Wayang) -> Kuning Emas
  if (lower.includes('tumpek')) {
    return {
      bg: 'bg-[#fef3c7]',
      text: 'text-[#92400e]',
      border: 'border-amber-200/70',
      dot: 'bg-[#d97706]',
    };
  }

  // 5. Kelompok Hari Raya Besar Utama (Kemenangan Dharma, Pustaka Suci & Sasih Akbar)
  if (
    lower.includes('galungan') ||
    lower.includes('kuningan') ||
    lower.includes('saraswati') ||
    lower.includes('pagerwesi') ||
    lower.includes('nyepi') ||
    lower.includes('siwalatri') ||
    lower.includes('banyu pinaruh')
  ) {
    return {
      bg: 'bg-[#d1fae5]',
      text: 'text-[#065f46]',
      border: 'border-emerald-200/70',
      dot: 'bg-[#10b981]',
    };
  }

  // 6. Kelompok Rahinan Rutin Wewaran (Anggara Kasih, Buda Cemeng, Buda Kliwon)
  if (lower.includes('anggara kasih')) {
    return {
      bg: 'bg-[#ede9fe]',
      text: 'text-[#5b21b6]',
      border: 'border-purple-200/70',
      dot: 'bg-[#7c3aed]',
    };
  }

  if (lower.includes('buda cemeng') || lower.includes('rambut sadhana') || lower.includes('bhatari sri')) {
    return {
      bg: 'bg-[#e0f2fe]',
      text: 'text-[#0369a1]',
      border: 'border-sky-200/70',
      dot: 'bg-[#0284c7]',
    };
  }

  if (lower.includes('buda kliwon')) {
    return {
      bg: 'bg-[#ccfbf1]',
      text: 'text-[#0f766e]',
      border: 'border-teal-200/70',
      dot: 'bg-[#14b8a6]',
    };
  }

  // 7. Default Hari Raya Lainnya
  return {
    bg: 'bg-[#e6f7f5]',
    text: 'text-[#0f766e]',
    border: 'border-transparent',
    dot: 'bg-[#0d9488]',
  };
}

// ---------------------------------------------------------------------------
// 5. Generator Berkas iCalendar (.ics) Client-Side
// ---------------------------------------------------------------------------

/**
 * Menghasilkan dan memicu unduhan berkas .ics kalender untuk seluruh hari raya
 * di bulan atau tahun tertentu tanpa ketergantungan library luar.
 */
export function exportHariRayaToICS(
  year: number,
  month: number,
  calendarDays: KalenderHarian[]
) {
  const events: string[] = [];
  const monthName = getIndoMonthName(month);

  calendarDays.forEach((day) => {
    if (day.hari_raya && day.hari_raya.length > 0) {
      const [y, m, d] = day.tanggal.split('-');
      const dtStart = `${y}${m}${d}`;
      // Akhir tanggal all-day event adalah hari berikutnya (RFC 5545)
      const nextDay = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d) + 1));
      const dtEnd = nextDay.toISOString().slice(0, 10).replace(/-/g, '');

      day.hari_raya.forEach((hr) => {
        const uid = `kalender-bali-${hr.id || ''}-${day.tanggal}@kalenderbali.app`;
        const summary = hr.nama;
        const description = `Perayaan Rahina Hindu Bali: ${hr.nama}. Wuku: ${day.wewaran?.wuku?.nama || '-'}, Sasih: ${day.sasih?.nama_sasih || '-'}.`;

        events.push(
          [
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
          ].join('\r\n')
        );
      });
    }
  });

  if (events.length === 0) {
    alert('Tidak ada agenda hari raya pada bulan ini untuk diunduh.');
    return;
  }

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kalender Bali Digital//ID',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Kalender Bali ${monthName} ${year}`,
    'X-WR-TIMEZONE:Asia/Makassar',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Kalender-Bali-${monthName}-${year}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
