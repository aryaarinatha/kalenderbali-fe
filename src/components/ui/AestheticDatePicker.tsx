import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN REUSABLE: AestheticDatePicker (Pemilih Tanggal Estetik & Modern)
 * ============================================================================
 * Komponen pemilih tanggal bersama (shared UI component) yang menggantikan
 * native date picker browser dengan estetika budaya Tirta Bali yang elegan:
 *  1. Popover melayang yang luas, bersih, dan berbayangan halus (shadow-2xl).
 *  2. Selektor cepat dropdown Bulan & Tahun untuk melompat ke tahun kelahiran
 *     lampau (1970 - sekarang) dalam 1 klik tanpa harus klik tombol navigasi berulang.
 *  3. Matriks kalender 7 kolom beraksen warna budaya Teal (#0e9f90) dan Minggu merah.
 *  4. Format tampilan standar Indonesia (dd/mm/yyyy) dengan sinkronisasi dua arah
 *     ke format ISO (YYYY-MM-DD) yang dibutuhkan API backend.
 *  5. Pencegahan pemilihan tanggal masa depan secara otomatis.
 * ============================================================================
 */

export interface AestheticDatePickerProps {
  id?: string;
  /** Nilai tanggal dalam format ISO "YYYY-MM-DD" atau tampilan "DD/MM/YYYY" */
  value: string;
  /** Callback saat tanggal berubah: parameter (isoDate, displayDate) */
  onChange: (isoDate: string, displayDate: string) => void;
  placeholder?: string;
  required?: boolean;
  minYear?: number;
  className?: string;
}

const NAMA_BULAN = [
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

const NAMA_HARI = [
  { short: 'Min', full: 'Minggu', isWeekend: true },
  { short: 'Sen', full: 'Senin', isWeekend: false },
  { short: 'Sel', full: 'Selasa', isWeekend: false },
  { short: 'Rab', full: 'Rabu', isWeekend: false },
  { short: 'Kam', full: 'Kamis', isWeekend: false },
  { short: 'Jum', full: 'Jumat', isWeekend: false },
  { short: 'Sab', full: 'Sabtu', isWeekend: false },
];

/**
 * Helper: Mengonversi format ISO (YYYY-MM-DD) atau variasi lainnya ke tampilan lokal Indonesia (DD/MM/YYYY)
 */
function toDisplayDate(str: string): string {
  if (!str) return '';
  const trimmed = str.trim();

  // Jika sudah DD/MM/YYYY
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(trimmed)) {
    const parts = trimmed.split(/[/-]/);
    return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
  }

  // Jika YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  return trimmed;
}

/**
 * Helper: Mengurai string tanggal menjadi { year, monthIndex, day }
 */
function parseDateParts(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  // Format DD/MM/YYYY atau DD-MM-YYYY
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return { day: parseInt(d, 10), month: parseInt(m, 10) - 1, year: parseInt(y, 10) };
  }

  // Format YYYY-MM-DD
  const ymd = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return { day: parseInt(d, 10), month: parseInt(m, 10) - 1, year: parseInt(y, 10) };
  }

  return null;
}

/**
 * Helper: Format 2 digit angka
 */
function formatTwoDigits(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export const AestheticDatePicker: React.FC<AestheticDatePickerProps> = ({
  id = 'aesthetic-date-picker',
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  required = false,
  minYear = 1970,
  className = '',
}) => {
  // Ambil tanggal hari ini dalam WITA
  const todayWITA = getTodayWITA();
  const [todayY, todayM, todayD] = todayWITA.split('-').map(Number);
  const maxYear = todayY;

  // State tampilan teks input (format DD/MM/YYYY)
  const [inputText, setInputText] = useState<string>(toDisplayDate(value));

  // Sinkronisasi inputText jika props value berubah dari luar (misal URL params / reset)
  useEffect(() => {
    setInputText(toDisplayDate(value));
  }, [value]);

  // State tampilan bulan & tahun pada kalender popover
  const initialParsed = parseDateParts(value);
  const [viewYear, setViewYear] = useState<number>(initialParsed?.year || todayY);
  const [viewMonth, setViewMonth] = useState<number>(initialParsed?.month ?? todayM - 1);

  // Status buka/tutup popover
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Referensi container untuk deteksi klik di luar (click outside)
  const containerRef = useRef<HTMLDivElement>(null);

  // Sinkronisasi viewYear & viewMonth saat nilai value berubah
  useEffect(() => {
    const parsed = parseDateParts(value);
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
    }
  }, [value]);

  // Listener klik di luar komponen untuk menutup popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Navigasi bulan (mundur / maju)
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      if (viewYear > minYear) {
        setViewYear(viewYear - 1);
        setViewMonth(11);
      }
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      if (viewYear < maxYear) {
        setViewYear(viewYear + 1);
        setViewMonth(0);
      }
    } else {
      if (viewYear === maxYear && viewMonth >= todayM - 1) return;
      setViewMonth(viewMonth + 1);
    }
  };

  // Handler memilih tanggal tertentu dari grid kalender
  const handleSelectDay = (day: number) => {
    const dStr = formatTwoDigits(day);
    const mStr = formatTwoDigits(viewMonth + 1);
    const yStr = `${viewYear}`;

    const newDisplayDate = `${dStr}/${mStr}/${yStr}`;
    const newIsoDate = `${yStr}-${mStr}-${dStr}`;

    setInputText(newDisplayDate);
    onChange(newIsoDate, newDisplayDate);
    setIsOpen(false);
  };

  // Shortcut: Pilih tanggal hari ini
  const handleSelectToday = () => {
    const dStr = formatTwoDigits(todayD);
    const mStr = formatTwoDigits(todayM);
    const yStr = `${todayY}`;

    setViewYear(todayY);
    setViewMonth(todayM - 1);

    const newDisplayDate = `${dStr}/${mStr}/${yStr}`;
    const newIsoDate = `${yStr}-${mStr}-${dStr}`;

    setInputText(newDisplayDate);
    onChange(newIsoDate, newDisplayDate);
    setIsOpen(false);
  };

  // Handler pengetikan manual di input teks
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setInputText(rawVal);

    const parsed = parseDateParts(rawVal);
    if (parsed) {
      const iso = `${parsed.year}-${formatTwoDigits(parsed.month + 1)}-${formatTwoDigits(parsed.day)}`;
      onChange(iso, rawVal);
    } else {
      // Jika input dikosongkan atau belum lengkap
      onChange('', rawVal);
    }
  };

  // -------------------------------------------------------------------------
  // PERHITUNGAN GRID HARI KALENDER
  // -------------------------------------------------------------------------
  const firstDayWeekday = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const selectedParts = parseDateParts(value || inputText);

  // Buat daftar tahun untuk dropdown selector
  const yearOptions: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearOptions.push(y);
  }

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* =================================================================== */}
      {/* FIELD INPUT TEKS DENGAN TOMBOL KALENDER                             */}
      {/* =================================================================== */}
      <div className="relative">
        <input
          id={id}
          type="text"
          value={inputText}
          onChange={handleInputChange}
          onClick={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          required={required}
          className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums cursor-pointer [touch-action:manipulation]"
        />

        {/* Tombol Kalender di Ujung Kanan Input */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer [touch-action:manipulation] ${
            isOpen
              ? 'bg-teal-50 text-teal-700'
              : 'text-slate-400 hover:text-teal-700 hover:bg-slate-100 active:bg-slate-200'
          }`}
          title="Buka kalender pemilih tanggal"
          aria-label="Buka kalender pemilih tanggal"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      </div>

      {/* =================================================================== */}
      {/* POPOVER KALENDER ESTETIK                                            */}
      {/* =================================================================== */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="absolute left-0 top-full mt-2 w-80 sm:w-88 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
        >
          {/* Header Popover: Selektor Cepat Bulan, Tahun, dan Tombol Navigasi */}
          <div className="flex items-center justify-between gap-1 pb-3 mb-3 border-b border-slate-100">
            {/* Navigasi Bulan Mundur */}
            <button
              type="button"
              onClick={handlePrevMonth}
              disabled={viewYear === minYear && viewMonth === 0}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Dropdown Pemilihan Cepat Bulan & Tahun */}
            <div className="flex items-center gap-1.5">
              {/* Dropdown Bulan */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="text-xs sm:text-sm font-bold text-[#0f172a] bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0d9488]"
              >
                {NAMA_BULAN.map((bulan, idx) => {
                  const isDisabled = viewYear === maxYear && idx > todayM - 1;
                  return (
                    <option key={bulan} value={idx} disabled={isDisabled}>
                      {bulan}
                    </option>
                  );
                })}
              </select>

              {/* Dropdown Tahun (Mendukung pemilihan cepat tahun lampau) */}
              <select
                value={viewYear}
                onChange={(e) => {
                  const newY = parseInt(e.target.value, 10);
                  setViewYear(newY);
                  if (newY === maxYear && viewMonth > todayM - 1) {
                    setViewMonth(todayM - 1);
                  }
                }}
                className="text-xs sm:text-sm font-bold text-[#0f172a] bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#0d9488] tabular-nums"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Navigasi Bulan Maju */}
            <button
              type="button"
              onClick={handleNextMonth}
              disabled={viewYear === maxYear && viewMonth >= todayM - 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-teal-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Baris Nama Hari (Min, Sen, Sel, Rab, Kam, Jum, Sab) */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {NAMA_HARI.map((h) => (
              <div
                key={h.short}
                className={`text-[11px] font-bold py-1 ${
                  h.isWeekend ? 'text-rose-500' : 'text-slate-500'
                }`}
                title={h.full}
              >
                {h.short}
              </div>
            ))}
          </div>

          {/* Matriks 7 Kolom Tanggal */}
          <div className="grid grid-cols-7 gap-1">
            {/* 1. Hari-hari sisa bulan sebelumnya */}
            {Array.from({ length: firstDayWeekday }).map((_, idx) => {
              const dayNum = daysInPrevMonth - firstDayWeekday + idx + 1;
              return (
                <div
                  key={`prev-${idx}`}
                  className="h-9 flex items-center justify-center text-xs font-medium text-slate-300 select-none tabular-nums"
                >
                  {dayNum}
                </div>
              );
            })}

            {/* 2. Hari-hari bulan aktif ini */}
            {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedParts &&
                selectedParts.year === viewYear &&
                selectedParts.month === viewMonth &&
                selectedParts.day === day;

              const isToday =
                todayY === viewYear && todayM - 1 === viewMonth && todayD === day;

              // Tanggal di masa depan (tidak boleh dipilih untuk tanggal lahir)
              const isFuture =
                viewYear > todayY ||
                (viewYear === todayY && viewMonth > todayM - 1) ||
                (viewYear === todayY && viewMonth === todayM - 1 && day > todayD);

              return (
                <button
                  key={`day-${day}`}
                  type="button"
                  disabled={isFuture}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all tabular-nums cursor-pointer [touch-action:manipulation] ${
                    isSelected
                      ? 'bg-[#0e9f90] text-white font-bold shadow-md shadow-[#0e9f90]/30 scale-105 z-10'
                      : isToday
                      ? 'ring-1.5 ring-[#0e9f90] text-[#0e9f90] font-bold hover:bg-teal-50'
                      : isFuture
                      ? 'text-slate-300 cursor-not-allowed hover:bg-transparent'
                      : 'text-slate-700 hover:bg-teal-50 hover:text-teal-800'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Footer Popover: Aksi Cepat "Hari Ini" dan "Tutup" */}
          <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-xs font-bold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer"
            >
              Pilih Hari Ini
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 px-2 py-1 rounded-md hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Tutup</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

