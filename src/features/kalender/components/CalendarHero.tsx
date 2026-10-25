import React, { useMemo, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { KalenderHarian } from '../types/kalender.types';
import { getIndoMonthName, getTodayWITA, parseISODate } from '../utils/calendarUtils';
import { DUMMY_MONTHLY_PIODALAN_TOTAL } from '../data/dummyCalendarData';
import { useMonthlyZodiac } from '@/features/keterangan';
import { ZodiacDetailModal } from './ZodiacDetailModal';

/**
 * ============================================================================
 * KOMPONEN: CalendarHero (Banner Ringkasan Bulan Aktif / Monthly Overview)
 * ============================================================================
 * Banner horisontal ringkasan di bagian atas kalender dengan alur hierarki logis (3 Kolom):
 *  1. Kolom 1 (Kiri): Bulan Kalender & Tahun Saka (Oktober 2026 · Saka 1948).
 *  2. Kolom 2 (Tengah): Agenda Bulan Ini (Dinamis sesuai data bulan aktif real-time:
 *     jumlah total rahina, piodalan, serta nama & tanggal rahinan terdekat bulan tersebut.
 *     Interaktif: Mengklik kolom ini akan melakukan smooth-scroll ke daftar agenda di bawah).
 *  3. Kolom 3 (Kanan): Widget Zodiak Bulan Ini (Ikon SVG, Nama Zodiak, Rentang Tanggal,
 *     dan interaktif klik untuk membuka pop-up karakter lengkap).
 * ============================================================================
 */

interface CalendarHeroProps {
  year: number;
  month: number;
  sakaYearText: string;
  monthlyHolidays: KalenderHarian[];
  todayDateString?: string;
  monthlyPiodalanCount?: number;
  isLoading?: boolean;
}

export const CalendarHero: React.FC<CalendarHeroProps> = ({
  year,
  month,
  sakaYearText,
  monthlyHolidays,
  todayDateString,
  monthlyPiodalanCount = DUMMY_MONTHLY_PIODALAN_TOTAL,
  isLoading = false,
}) => {
  // State untuk mengontrol visibilitas modal pop-up detail zodiak
  const [isZodiacModalOpen, setIsZodiacModalOpen] = useState(false);

  // Ambil data zodiak bulan aktif dari domain Keterangan (0ms latency / TanStack Cache)
  const { activeZodiac } = useMonthlyZodiac(month);

  const monthName = getIndoMonthName(month);
  const shortMonthName = monthName.slice(0, 3);

  // Hitung jumlah rahinan & subteks terdekat yang kontekstual terhadap tanggal berjalan
  const { upcomingRahinaText, totalHolidays } = useMemo(() => {
    const total = monthlyHolidays ? monthlyHolidays.length : 0;
    if (total === 0) {
      return {
        upcomingRahinaText: 'Tidak ada agenda rahinan',
        totalHolidays: 0,
      };
    }

    const today = todayDateString || getTodayWITA();
    const { year: curYear, month: curMonth } = parseISODate(today);

    // Evaluasi relasi bulan kalender yang sedang dilihat terhadap bulan hari ini
    const isPastMonth = year < curYear || (year === curYear && month < curMonth);
    const isCurrentMonth = year === curYear && month === curMonth;

    // Kasus 1: Bulan yang dipilih sudah lewat
    if (isPastMonth) {
      return {
        upcomingRahinaText: 'Hari raya pada bulan ini sudah berlalu',
        totalHolidays: total,
      };
    }

    // Kasus 2: Bulan yang dipilih sedang berjalan (sesuaikan dengan tanggal yang sudah lewat)
    if (isCurrentMonth) {
      // Cari hari raya yang tanggalnya hari ini atau ke depan (>= today)
      const upcomingDay = monthlyHolidays.find((d) => d.tanggal >= today);
      if (!upcomingDay) {
        return {
          upcomingRahinaText: 'Hari raya pada bulan ini sudah berlalu',
          totalHolidays: total,
        };
      }

      const holidayName = upcomingDay.hari_raya?.[0]?.nama || 'Rahinan';
      const dayNum = parseISODate(upcomingDay.tanggal).day;

      return {
        upcomingRahinaText: `Terdekat: ${holidayName} (${dayNum} ${shortMonthName})`,
        totalHolidays: total,
      };
    }

    // Kasus 3: Bulan di masa depan (belum berjalan, tampilkan acara paling awal)
    const firstDay = monthlyHolidays[0];
    const firstHolidayName = firstDay.hari_raya?.[0]?.nama || 'Rahinan';
    const dayNum = parseISODate(firstDay.tanggal).day;

    return {
      upcomingRahinaText: `Terdekat: ${firstHolidayName} (${dayNum} ${shortMonthName})`,
      totalHolidays: total,
    };
  }, [monthlyHolidays, shortMonthName, year, month, todayDateString]);

  /**
   * Mengarahkan pandangan layar secara halus (smooth scroll) ke panel agenda di bawah
   */
  const handleScrollToAgenda = () => {
    const el = document.getElementById('agenda-bulan-ini');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs transition-all">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-center">
          {/* ========================================================= */}
          {/* 1. KOLOM KIRI: IDENTITAS BULAN & TAHUN SAKA (lg:col-span-4) */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 flex flex-col justify-center space-y-1.5 lg:border-r lg:border-slate-100 lg:pr-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
              {isLoading ? 'Memuat...' : `${monthName} ${year}`}
            </h2>

            <p className="text-sm sm:text-base text-slate-500 font-medium truncate tabular-nums">
              {isLoading ? '...' : sakaYearText}
            </p>
          </div>

          {/* ========================================================= */}
          {/* 2. KOLOM TENGAH: AGENDA BULAN INI (DINAMIS) (lg:col-span-4)*/}
          {/* ========================================================= */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleScrollToAgenda}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleScrollToAgenda();
              }
            }}
            className="lg:col-span-4 flex flex-col justify-center space-y-1.5 lg:border-r lg:border-slate-100 lg:pr-8 cursor-pointer group transition-all [touch-action:manipulation]"
            title="Klik untuk melihat rincian agenda di bawah"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-[#0d9488] transition-colors block">
                Agenda Bulan Ini
              </span>
              <span className="text-[11px] font-bold text-[#0d9488] opacity-0 group-hover:opacity-100 transition-opacity">
                · Rincian ↓
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#e6f7f5] text-[#0d9488] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-lg sm:text-xl font-extrabold text-[#0f172a] group-hover:text-[#0d9488] transition-colors tracking-tight block truncate tabular-nums">
                {isLoading ? '...' : `${totalHolidays} Rahina · ${monthlyPiodalanCount} Piodalan`}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium block truncate">
              {isLoading ? '...' : upcomingRahinaText}
            </p>
          </div>

          {/* ========================================================= */}
          {/* 3. KOLOM KANAN: ZODIAK BULAN INI (DINAMIS) (lg:col-span-4) */}
          {/* ========================================================= */}
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsZodiacModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsZodiacModalOpen(true);
              }
            }}
            className="lg:col-span-4 flex flex-col justify-center space-y-1.5 cursor-pointer group transition-all [touch-action:manipulation]"
            title="Klik untuk melihat karakter watak lengkap"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest group-hover:text-[#0d9488] transition-colors block">
                Zodiak
              </span>
              <span className="text-[11px] font-bold text-[#0d9488] opacity-0 group-hover:opacity-100 transition-opacity">
                · Detail ↗
              </span>
            </div>

            <div className="flex items-center gap-3">
              {activeZodiac ? (
                <img
                  src={activeZodiac.imagePath}
                  alt={activeZodiac.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 object-contain shrink-0 group-hover:scale-105 transition-transform filter drop-shadow-2xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse shrink-0" />
              )}
              <span className="text-xl sm:text-2xl font-extrabold text-[#0f172a] group-hover:text-[#0d9488] transition-colors tracking-tight block truncate">
                {activeZodiac?.name || '-'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium block truncate tabular-nums">
              {activeZodiac?.dateRange || '-'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. MODAL POP-UP DETAIL ZODIAK                             */}
      {/* ========================================================= */}
      {activeZodiac && (
        <ZodiacDetailModal
          isOpen={isZodiacModalOpen}
          onClose={() => setIsZodiacModalOpen(false)}
          zodiac={activeZodiac}
          month={month}
        />
      )}
    </>
  );
};
