import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DashboardMiniCalendarDay } from '../types/dashboard.types';
import { MINI_CALENDAR_HEADERS } from '../utils/dashboardUtils';

/**
 * ============================================================================
 * KOMPONEN: DashboardMiniCalendar (Baris 2 Kiri — Widget Mini Kalender Bulanan)
 * ============================================================================
 * Menampilkan matriks kalender bulanan interaktif yang bersih dan elegan:
 *  - Header: Nama Bulan & Tahun aktif, subteks rentang sasih, dan tombol navigasi < >
 *  - Grid 7 Kolom: Dimulai dari SEN (Senin) hingga MIN (Minggu)
 *  - Sel Tanggal:
 *    - Angka tanggal tabular (tabular-nums)
 *    - Dot penanda dan label singkat hari raya (Kajeng Kliwon, Purnama, Tilem, Sugihan)
 *    - Active Ring & Dot Teal untuk tanggal hari ini / tanggal aktif
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Target sentuh ergonomis min 44x44px dengan utilitas touch-action: manipulation
 *  - Zero layout shift dan transisi hover yang halus
 * ============================================================================
 */

import { getHariRayaBadgeStyle } from '@/features/kalender/utils/calendarUtils';

interface DashboardMiniCalendarProps {
  /** Judul bulan dan tahun (contoh: "September 2026") */
  title: string;

  /** Subjudul rentang sasih (contoh: "Sasih Katiga - Kapat") */
  sasihSubtitle: string;

  /** Array sel-sel tanggal kalender (Senin s.d. Minggu) */
  days: DashboardMiniCalendarDay[];

  /** Fungsi navigasi ke bulan sebelumnya */
  onPrevMonth: () => void;

  /** Fungsi navigasi ke bulan berikutnya */
  onNextMonth: () => void;

  /** Handler ketika pengguna mengklik salah satu sel tanggal */
  onSelectDate: (dateString: string) => void;
}

export const DashboardMiniCalendar: React.FC<DashboardMiniCalendarProps> = ({
  title,
  sasihSubtitle,
  days,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* =================================================================== */}
      {/* 1. HEADER KALENDER: NAMA BULAN, SASIH, & TOMBOL NAVIGASI < >        */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#0f172a] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {sasihSubtitle}
          </p>
        </div>

        {/* Tombol Navigasi Bulan Sebelumnnya dan Berikutnya */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer [touch-action:manipulation]"
            title="Bulan sebelumnya"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 hover:bg-slate-100 active:bg-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer [touch-action:manipulation]"
            title="Bulan berikutnya"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. HEADER 7 KOLOM HARI: SEN, SEL, RAB, KAM, JUM, SAB, MIN           */}
      {/* =================================================================== */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center select-none">
        {MINI_CALENDAR_HEADERS.map((dayName) => (
          <div
            key={dayName}
            className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase py-1"
          >
            {dayName}
          </div>
        ))}
      </div>

      {/* =================================================================== */}
      {/* 3. MATRIKS SEL TANGGAL BULANAN                                      */}
      {/* =================================================================== */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 flex-1">
        {days.map((day) => {
          const holidayList = day.holidays || [];

          return (
            <button
              key={day.dateString}
              type="button"
              onClick={() => onSelectDate(day.dateString)}
              className={`min-h-[64px] sm:min-h-[72px] lg:min-h-[76px] p-1.5 sm:p-2 rounded-xl text-left flex flex-col justify-between transition-all cursor-pointer [touch-action:manipulation] relative ${
                day.isToday || day.isSelected
                  ? 'border-2 border-[#0e9f90] bg-[#e6f7f5]/40 ring-2 ring-[#0e9f90]/15'
                  : day.isCurrentMonth
                  ? 'bg-[#fbfcfc] border border-slate-100 hover:border-teal-300 hover:bg-white shadow-2xs'
                  : 'bg-slate-50/40 border border-slate-100/50 opacity-40 hover:opacity-75'
              }`}
            >
              {/* Baris Atas Sel: Angka Tanggal & Dot Hari Ini */}
              <div className="flex items-center justify-between w-full">
                <span
                  className={`text-xs sm:text-sm tabular-nums font-bold ${
                    day.isToday || day.isSelected
                      ? 'text-[#0f766e]'
                      : day.isCurrentMonth
                      ? 'text-[#0f172a]'
                      : 'text-slate-400'
                  }`}
                >
                  {day.dayNumber}
                </span>

                {/* Dot penanda khusus jika ini adalah hari ini */}
                {day.isToday && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#0e9f90] shrink-0"
                    title="Hari ini"
                  />
                )}
              </div>

              {/* Baris Bawah Sel: Badge Hari Raya Bertumpuk Vertikal (Murni Simbol Singkatan) */}
              {holidayList.length > 0 && (
                <div className="flex flex-col gap-1 w-full mt-1.5 overflow-hidden">
                  {holidayList.slice(0, 2).map((hr) => {
                    const badgeStyle = getHariRayaBadgeStyle(hr.nama);
                    // Murni menggunakan simbol singkatan dari Backend Go tanpa teks nama lengkap
                    const displayText = hr.simbol ? hr.simbol.toUpperCase() : hr.nama;

                    return (
                      <div
                        key={hr.id || hr.nama}
                        title={hr.nama}
                        className={`inline-flex items-center self-start gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider transition-colors ${badgeStyle.bg} ${badgeStyle.text}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`}
                        />
                        <span className="leading-tight">{displayText}</span>
                      </div>
                    );
                  })}

                  {/* Indikator Jika Lebih Dari 2 Hari Raya */}
                  {holidayList.length > 2 && (
                    <span className="text-[8px] text-slate-400 font-bold block pl-1 tabular-nums">
                      +{holidayList.length - 2} lagi
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
