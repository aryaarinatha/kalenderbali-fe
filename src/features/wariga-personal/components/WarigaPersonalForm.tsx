import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';
import { WarigaDatePicker } from './WarigaDatePicker';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalForm
 * ============================================================================
 * Form input interaktif untuk pencarian Wariga Personal:
 *  1. Tanggal Lahir (Format Indonesia dd/mm/yyyy dengan placeholder eksplisit "dd/mm/yyyy").
 *  2. Dropdown Waktu Lahir (Setelah 06.00 WITA vs Sebelum 06.00 WITA) - seragam dengan modul Otonan.
 *  3. Bulan Target Pencarian (Januari s.d. Desember).
 *  4. Tahun Target Pencarian (input numerik dengan validasi).
 *  5. Tombol aksi "Cari Wariga Personal" dengan animasi loading.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Kontainer kartu: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Input tinggi 44px (h-11) ergonomis sentuhan mobile [touch-action:manipulation]
 *  - Dropdown wajar dengan ChevronDown di sisi kanan
 *  - Tombol primer: bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-98
 * ============================================================================
 */

interface WarigaPersonalFormProps {
  initialBirthDate: string; // Format ISO: YYYY-MM-DD
  initialSebelumJam6: boolean;
  initialMonth: number;
  initialYear: number;
  onSubmit: (
    birthDate: string,
    sebelumJam6: boolean,
    month: number,
    year: number
  ) => void;
  isLoading?: boolean;
}

const BULAN_OPTIONS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' },
];

/**
 * Helper: Mengonversi format ISO (YYYY-MM-DD) ke tampilan lokal Indonesia (DD/MM/YYYY)
 */
function toDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return isoDate;
}

/**
 * Helper: Mengonversi masukan teks (DD/MM/YYYY atau DD-MM-YYYY) ke format ISO (YYYY-MM-DD)
 */
function toIsoDate(displayDate: string): string {
  if (!displayDate) return '';
  const trimmed = displayDate.trim();

  // Pola 1: DD/MM/YYYY atau DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Pola 2: YYYY-MM-DD
  const ymdMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  return '';
}

export const WarigaPersonalForm: React.FC<WarigaPersonalFormProps> = ({
  initialBirthDate,
  initialSebelumJam6,
  initialMonth,
  initialYear,
  onSubmit,
  isLoading = false,
}) => {
  // -------------------------------------------------------------------------
  // BLOK 1: LOCAL FORM STATE
  // -------------------------------------------------------------------------
  const [displayDate, setDisplayDate] = useState<string>(toDisplayDate(initialBirthDate));
  const [sebelumJam6, setSebelumJam6] = useState<boolean>(initialSebelumJam6);
  const [month, setMonth] = useState<number>(initialMonth);
  const [year, setYear] = useState<number>(initialYear);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sinkronisasi saat initial props berubah (misal dari navigasi URL)
  useEffect(() => {
    setDisplayDate(toDisplayDate(initialBirthDate));
  }, [initialBirthDate]);

  useEffect(() => {
    setSebelumJam6(initialSebelumJam6);
  }, [initialSebelumJam6]);

  useEffect(() => {
    setMonth(initialMonth);
  }, [initialMonth]);

  useEffect(() => {
    setYear(initialYear);
  }, [initialYear]);

  // -------------------------------------------------------------------------
  // BLOK 2: HANDLER SUBMIT DENGAN VALIDASI INPUT LENGKAP
  // -------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!displayDate.trim()) {
      setValidationError('Silakan isi tanggal lahir Anda terlebih dahulu.');
      return;
    }

    const isoDate = toIsoDate(displayDate);
    if (!isoDate) {
      setValidationError('Format tanggal lahir harus dd/mm/yyyy (contoh: 24/05/2005).');
      return;
    }

    // Validasi keabsahan tanggal kalender (mencegah tanggal fiktif seperti 31 Februari)
    const [y, m, d] = isoDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    if (
      dateObj.getFullYear() !== y ||
      dateObj.getMonth() !== m - 1 ||
      dateObj.getDate() !== d
    ) {
      setValidationError('Tanggal lahir yang dimasukkan tidak valid kalender.');
      return;
    }

    if (y < 1970) {
      setValidationError('Tahun kelahiran yang didukung mulai dari tahun 1970.');
      return;
    }

    const todayWITA = getTodayWITA();
    if (isoDate > todayWITA) {
      setValidationError('Tanggal lahir tidak boleh berada di masa depan.');
      return;
    }

    if (year < 1970 || year > 2100) {
      setValidationError('Tahun target pencarian harus berada di antara 1970 hingga 2100.');
      return;
    }

    onSubmit(isoDate, sebelumJam6, month, year);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* =============================================================== */}
        {/* BARIS UTAMA FORM: INPUT & TOMBOL SEJAJAR DALAM 1 BARIS GRID     */}
        {/* =============================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Kolom 1: Tanggal Lahir (lg:col-span-3) dengan Date Picker Estetik */}
          <div className="lg:col-span-3 space-y-1.5">
            <label
              htmlFor="wariga-birth-date"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
            >
              Tanggal Lahir
            </label>
            <WarigaDatePicker
              id="wariga-birth-date"
              value={displayDate}
              onChange={(_iso, display) => {
                setDisplayDate(display);
                setValidationError(null);
              }}
              placeholder="dd/mm/yyyy"
              required
            />
          </div>

          {/* Kolom 2: Dropdown Waktu Lahir (lg:col-span-2) - Seragam dengan modul Otonan */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="wariga-birth-time"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
            >
              Waktu Lahir
            </label>
            <div className="relative">
              <select
                id="wariga-birth-time"
                value={sebelumJam6 ? 'before_06' : 'after_06'}
                onChange={(e) => setSebelumJam6(e.target.value === 'before_06')}
                className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] appearance-none transition-all cursor-pointer [touch-action:manipulation]"
              >
                <option value="after_06">Setelah 06.00</option>
                <option value="before_06">Sebelum 06.00</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kolom 3: Bulan Target (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="wariga-month-target"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
            >
              Bulan Target
            </label>
            <div className="relative">
              <select
                id="wariga-month-target"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="w-full h-11 pl-3.5 pr-8 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] appearance-none transition-all cursor-pointer [touch-action:manipulation]"
              >
                {BULAN_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kolom 4: Tahun Target (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-1.5">
            <label
              htmlFor="wariga-year-target"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
            >
              Tahun Target
            </label>
            <div className="relative">
              <input
                id="wariga-year-target"
                type="number"
                min={1970}
                max={2100}
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all [touch-action:manipulation]"
              />
            </div>
          </div>

          {/* Kolom 5: Tombol Submit Sejajar (lg:col-span-3 sm:col-span-2) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 [touch-action:manipulation]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengevaluasi...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Cari Wariga Personal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Pesan Kesalahan Validasi Input */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl animate-in fade-in">
            {validationError}
          </div>
        )}
      </form>
    </div>
  );
};
