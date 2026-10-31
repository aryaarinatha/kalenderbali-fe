import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, AlertCircle } from 'lucide-react';
import { AestheticDatePicker } from '@/components/ui/AestheticDatePicker';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: RamalanSifatForm
 * ============================================================================
 * Form input interaktif untuk pencarian Ramalan Sifat Penanggalan Bali:
 *  1. Tanggal Lahir: Format Indonesia dd/mm/yyyy dengan placeholder "dd/mm/yyyy"
 *     menggunakan AestheticDatePicker (seragam dengan modul Otonan & Wariga Personal).
 *  2. Waktu Lahir: Dropdown opsi Sebelum 06.00 WITA vs Setelah 06.00 WITA.
 *  3. Tombol Aksi: "Lihat profil karakter" sejajar dalam 1 baris grid.
 *  4. Tanpa teks keterangan waktu lahir (dihapus sesuai permintaan pengguna).
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Wadah Kartu: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Ergonomi Sentuh: Tinggi kontrol h-11 (44px) dengan [touch-action:manipulation]
 *  - Tombol Primer: bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a]
 * ============================================================================
 */

interface RamalanSifatFormProps {
  initialBirthDate: string; // Format ISO: YYYY-MM-DD
  initialSebelumJam6: boolean;
  onSubmit: (birthDate: string, sebelumJam6: boolean) => void;
  isLoading?: boolean;
}

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

export const RamalanSifatForm: React.FC<RamalanSifatFormProps> = ({
  initialBirthDate,
  initialSebelumJam6,
  onSubmit,
  isLoading = false,
}) => {
  // -------------------------------------------------------------------------
  // BLOK 1: LOCAL FORM STATE
  // -------------------------------------------------------------------------
  // State tanggal lahir dalam format tampilan Indonesia "DD/MM/YYYY"
  const [displayDate, setDisplayDate] = useState<string>(
    toDisplayDate(initialBirthDate || '')
  );

  // State opsi apakah lahir sebelum pergantian hari wewaran (06.00 WITA)
  const [sebelumJam6, setSebelumJam6] = useState<boolean>(initialSebelumJam6 || false);

  // State pesan kesalahan validasi lokal
  const [validationError, setValidationError] = useState<string | null>(null);

  // Sinkronisasi state lokal jika props berubah (misal saat navigasi URL)
  useEffect(() => {
    setDisplayDate(toDisplayDate(initialBirthDate || ''));
    setSebelumJam6(initialSebelumJam6 || false);
    setValidationError(null);
  }, [initialBirthDate, initialSebelumJam6]);

  // -------------------------------------------------------------------------
  // BLOK 2: HANDLER VALIDASI & SUBMIT FORM
  // -------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // 1. Konversi tanggal tampilan ke format ISO (YYYY-MM-DD)
    const isoDate = toIsoDate(displayDate);

    if (!isoDate) {
      setValidationError('Silakan pilih atau masukkan tanggal lahir Anda.');
      return;
    }

    // 2. Validasi batas bawah kalender yang didukung (mulai 1 Januari 1970)
    const [year] = isoDate.split('-').map(Number);
    if (year < 1970) {
      setValidationError('Sistem hanya mendukung tanggal kelahiran mulai tahun 1970.');
      return;
    }

    // 3. Validasi guard tanggal masa depan (berdasarkan zona waktu WITA)
    const todayWITA = getTodayWITA();
    if (isoDate > todayWITA) {
      setValidationError('Tanggal lahir tidak boleh melebihi tanggal hari ini.');
      return;
    }

    // Teruskan parameter yang sudah valid ke callback onSubmit
    onSubmit(isoDate, sebelumJam6);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ================================================================= */}
        {/* BLOK 3: GRID INPUT (TANGGAL, WAKTU LAHIR, & TOMBOL SUBMIT)         */}
        {/* Mengikuti Tata Letak Seragam Otonan & Wariga Personal             */}
        {/* ================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
          {/* Kolom 1: Tanggal Lahir (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-1.5">
            <label
              htmlFor="ramalan-birth-date"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
            >
              TANGGAL LAHIR
            </label>
            <div className="relative">
              <AestheticDatePicker
                id="ramalan-birth-date"
                value={displayDate}
                onChange={(_iso, display) => {
                  setDisplayDate(display);
                  setValidationError(null);
                }}
                placeholder="dd/mm/yyyy"
                minYear={1970}
                required
              />
            </div>
          </div>

          {/* Kolom 2: Dropdown Waktu Lahir (lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-1.5">
            <label
              htmlFor="ramalan-birth-time"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
            >
              WAKTU LAHIR
            </label>
            <div className="relative">
              <select
                id="ramalan-birth-time"
                value={sebelumJam6 ? 'before_06' : 'after_06'}
                onChange={(e) => setSebelumJam6(e.target.value === 'before_06')}
                className="w-full h-11 pl-3.5 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] appearance-none transition-all cursor-pointer [touch-action:manipulation]"
              >
                <option value="after_06">Setelah 06.00</option>
                <option value="before_06">Sebelum 06.00</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Kolom 3: Tombol Aksi Submit (lg:col-span-3 sm:col-span-2) */}
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 inline-flex items-center justify-center gap-2 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 [touch-action:manipulation]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 text-white" />
                  <span>Lihat profil karakter</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BLOK 4: PESAN KESALAHAN VALIDASI (JIKA ADA)                       */}
        {/* ================================================================= */}
        {validationError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}
      </form>
    </div>
  );
};
