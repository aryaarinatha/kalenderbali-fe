import React from 'react';
import { Download } from 'lucide-react';

/**
 * ============================================================================
 * KOMPONEN: CalendarHeader
 * ============================================================================
 * Komponen header utama halaman Kalender Bali:
 *  - Sisi Kiri: Judul besar dan deskripsi halaman.
 *  - Sisi Kanan: Tombol unduh file kalender iCal (.ics).
 * ============================================================================
 */

interface CalendarHeaderProps {
  onDownloadICS: () => void;
  isLoading?: boolean;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  onDownloadICS,
  isLoading = false,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* 1. Breadcrumb Navigasi & Judul H1 Halaman */}
      <div className="space-y-1.5">
        {/* Breadcrumb navigasi hierarkis (Menu Utama Wargabali) */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Kalender Bali</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Kalender Bali
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Pawukon, rahina, piodalan, dan hari suci dalam satu tampilan.
        </p>
      </div>

      {/* 2. Tombol Aksi di Sudut Kanan */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Tombol Unduh Berkas .ics Kalender (Standar Primary Button AGENTS.md Bab 4.4) */}
        <button
          type="button"
          onClick={onDownloadICS}
          disabled={isLoading}
          className="h-11 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
          title="Unduh jadwal hari raya bulan ini ke format iCal (.ics)"
        >
          <Download className={`w-4 h-4 ${isLoading ? 'animate-bounce' : ''}`} />
          <span>Unduh .ics</span>
        </button>
      </div>
    </div>
  );
};
