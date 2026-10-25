import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useMonthlyZodiac } from '@/features/keterangan';
import { getIndoMonthName } from '../utils/calendarUtils';
import { ZodiacDetailModal } from './ZodiacDetailModal';

/**
 * ============================================================================
 * KOMPONEN: MonthlyZodiacCard (Zodiak Bulan Ini - Panel Kanan)
 * ============================================================================
 * Komponen ringkasan zodiak yang menaungi bulan kalender aktif.
 * Ditempatkan di kolom kanan (di bawah panel CalendarInspector).
 *
 * Fitur:
 *  1. Header kartu: "Zodiak bulan ini" dengan badge nama bulan.
 *  2. Nama zodiak (misal: "Libra") dan rentang tanggal astronomisnya.
 *  3. Ilustrasi vektor SVG zodiak yang responsif dan interaktif saat di-hover.
 *  4. Cuplikan 2-3 baris uraian watak/karakteristik.
 *  5. Tombol aksi "Selengkapnya" untuk membuka ZodiacDetailModal lengkap.
 * ============================================================================
 */

interface MonthlyZodiacCardProps {
  currentMonth: number; // 1 s/d 12
}

export const MonthlyZodiacCard: React.FC<MonthlyZodiacCardProps> = ({ currentMonth }) => {
  // Ambil data zodiak untuk bulan kalender yang sedang aktif
  const { activeZodiac, isLoading, isError } = useMonthlyZodiac(currentMonth);

  // State untuk mengontrol visibilitas modal dialog zodiak utuh
  const [isModalOpen, setIsModalOpen] = useState(false);

  const monthName = getIndoMonthName(currentMonth);

  // Tampilan loading skeleton saat data zodiak pertama kali dimuat
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-5 bg-slate-100 rounded-full w-16" />
        </div>
        <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto" />
        <div className="h-4 bg-slate-200 rounded w-1/2 mx-auto" />
        <div className="h-3 bg-slate-100 rounded w-3/4 mx-auto" />
        <div className="h-9 bg-slate-100 rounded-xl" />
      </div>
    );
  }

  // Jika terjadi kegagalan atau zodiak tidak ditemukan
  if (isError || !activeZodiac) {
    return null;
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4 transition-all">
        {/* ========================================================= */}
        {/* 1. HEADER KARTU ZODIAK BULAN INI                          */}
        {/* ========================================================= */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#e6f7f5] text-[#0d9488]">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
              Zodiak bulan ini
            </h3>
          </div>
          <span className="text-[10px] font-extrabold text-[#0d9488] bg-[#e6f7f5] px-2.5 py-1 rounded-full uppercase tracking-wider">
            {monthName}
          </span>
        </div>

        {/* ========================================================= */}
        {/* 2. TAMPILAN ILUSTRASI SVG & IDENTITAS ZODIAK             */}
        {/* ========================================================= */}
        <div className="flex flex-col items-center text-center space-y-2 pt-1">
          {/* Ikon Vektor SVG Zodiak */}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#f8fafc] border border-slate-100 flex items-center justify-center p-3 transition-transform duration-300 hover:scale-105">
            <img
              src={activeZodiac.imagePath}
              alt={activeZodiac.name}
              className="w-full h-full object-contain filter drop-shadow-xs"
            />
          </div>

          <div>
            <h4 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              {activeZodiac.name}
            </h4>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              {activeZodiac.dateRange}
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. CUPLIKAN DESKRIPSI WATAK / KARAKTER                    */}
        {/* ========================================================= */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed text-center sm:text-left bg-[#f8fafc] p-3.5 rounded-xl border border-slate-100/80">
          {activeZodiac.description}
        </p>

        {/* ========================================================= */}
        {/* 4. TOMBOL AKSI "SELENGKAPNYA"                             */}
        {/* ========================================================= */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2.5 px-4 rounded-xl border border-slate-200/90 hover:bg-[#e6f7f5] hover:border-teal-300 hover:text-[#0d9488] text-[#0f172a] text-xs sm:text-sm font-bold transition-all active:scale-98 cursor-pointer text-center"
        >
          Selengkapnya
        </button>
      </div>

      {/* ========================================================= */}
      {/* 5. MODAL DETAIL POP-UP UTUH                              */}
      {/* ========================================================= */}
      <ZodiacDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        zodiac={activeZodiac}
        month={currentMonth}
      />
    </>
  );
};
