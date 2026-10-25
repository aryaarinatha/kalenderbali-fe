import React from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { CalendarGridDay } from '../types/kalender.types';
import { getHariRayaBadgeStyle } from '../utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: CalendarGrid
 * ============================================================================
 * Komponen matriks kalender bulanan 7 kolom (Min s.d. Sab):
 *  - Header: Bar navigasi ringkas ("Hari ini" & panah < >).
 *  - 7 Kolom Header: MIN, SEN, SEL, RAB, KAM, JUM, SAB.
 *  - Kotak Tanggal (35-42 sel):
 *    - Indikasi jelas untuk sel bulan aktif vs bulan tetangga.
 *    - Highlight khusus hari ini (border teal & badge "Hari ini").
 *    - Highlight tanggal yang sedang dipilih pengguna.
 *    - Badge rahinan dengan dot warna semantik (Purnama, Kajeng Kliwon, dll).
 *  - Footer: Legend (Hari raya, Tanggal dipilih) dan tanda zona waktu WITA.
 * ============================================================================
 */

interface CalendarGridProps {
  year?: number;
  month?: number;
  sakaYearText?: string;
  gridCells: CalendarGridDay[];
  onSelectDate: (dateString: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToday: () => void;
  canResetToday?: boolean;
  isLoading?: boolean;
}

const HARI_SINGKAT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  gridCells,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onResetToday,
  canResetToday = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* ========================================================= */}
      {/* 1. BAR NAVIGASI BULAN KALENDER                            */}
      {/* ========================================================= */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 min-h-[46px]">
        {/* Sisi Kiri: Tombol Hari Ini (Hanya muncul jika tanggal/bulan tidak di hari ini) */}
        <div>
          {canResetToday && (
            <button
              type="button"
              onClick={onResetToday}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-bold text-white bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] rounded-xl shadow-xs transition-all active:scale-98 cursor-pointer animate-in fade-in duration-150 [touch-action:manipulation]"
              title="Kembali ke tanggal hari ini"
            >
              <RotateCcw className="w-3.5 h-3.5 text-white" />
              <span>Hari ini</span>
            </button>
          )}
        </div>

        {/* Sisi Kanan: Navigasi Panah < dan > */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 [touch-action:manipulation]"
            title="Bulan sebelumnya"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 [touch-action:manipulation]"
            title="Bulan berikutnya"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. HEADER NAMA HARI (MIN, SEN, SEL, RAB, KAM, JUM, SAB)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-7 text-center pt-4 pb-2">
        {HARI_SINGKAT.map((hari, idx) => (
          <div
            key={hari}
            className={`text-xs tracking-wider uppercase ${
              idx === 0 ? 'text-rose-600 font-extrabold' : 'text-slate-400 font-bold'
            }`}
          >
            {hari}
          </div>
        ))}
      </div>

      {/* ========================================================= */}
      {/* 3. MATRIKS SEL TANGGAL (GRID 7 KOLOM - TEPI TEGAS)        */}
      {/* ========================================================= */}
      <div className="grid grid-cols-7 border-t border-l border-slate-200/90 mt-1">
        {gridCells.map((cell, idx) => {
          const { dateString, dayNumber, isCurrentMonth, isToday, isSelected, data } = cell;
          const hariRayaList = data?.hari_raya || [];
          const isSunday = idx % 7 === 0;

          return (
            <div
              key={dateString}
              onClick={() => onSelectDate(dateString)}
              className={`min-h-[125px] sm:min-h-[140px] xl:min-h-[152px] p-2.5 sm:p-3 border-r border-b border-slate-200/90 flex flex-col justify-between transition-colors relative cursor-pointer select-none [touch-action:manipulation] ${
                !isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-300'
                  : 'bg-white hover:bg-slate-50/70'
              } ${
                isToday
                  ? 'bg-[#e6f7f5]/80 ring-2 ring-[#14b8a6] ring-inset z-10'
                  : ''
              } ${
                isSelected && !isToday
                  ? 'ring-2 ring-slate-800 ring-inset z-10'
                  : ''
              }`}
            >
              {/* Baris Atas: Angka Tanggal & Label "Hari ini" */}
              <div className="flex flex-col items-start">
                <span
                  className={`text-base sm:text-lg font-bold tabular-nums leading-none ${
                    !isCurrentMonth
                      ? isSunday
                        ? 'text-rose-300 font-medium'
                        : 'text-slate-300 font-medium'
                      : isSunday
                      ? 'text-rose-600 font-extrabold'
                      : isToday
                      ? 'text-[#0f766e] font-extrabold'
                      : 'text-slate-800'
                  }`}
                >
                  {dayNumber}
                </span>

                {isToday && (
                  <span className="text-[11px] font-bold text-[#0d9488] mt-1 block">
                    Hari ini
                  </span>
                )}
              </div>

              {/* Baris Bawah: Badge Daftar Hari Raya / Rerainan */}
              <div className="space-y-1.5 mt-2">
                {hariRayaList.slice(0, 2).map((hr) => {
                  const style = getHariRayaBadgeStyle(hr.nama);
                  return (
                    <div
                      key={hr.id || hr.nama}
                      title={hr.nama}
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold truncate ${style.bg} ${style.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      <span className="truncate">{hr.nama}</span>
                    </div>
                  );
                })}

                {/* Indikator Jika Lebih Dari 2 Hari Raya */}
                {hariRayaList.length > 2 && (
                  <span className="text-[10px] text-slate-500 font-bold block pl-1 tabular-nums">
                    +{hariRayaList.length - 2} lagi
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
