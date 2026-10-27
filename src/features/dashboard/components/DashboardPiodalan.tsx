import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import type { PiodalanDashboardItem } from '../types/dashboard.types';

/**
 * ============================================================================
 * KOMPONEN: DashboardPiodalan (Baris 3 Kanan — Piodalan Terdekat)
 * ============================================================================
 * Menampilkan daftar 3 jadwal piodalan pura terdekat setelah hari ini:
 *  - Baris Atas: Judul "Piodalan Terdekat", subteks, dan badge countdown terdekat
 *  - Area Tengah: Menampilkan 3 kartu ringkas agenda piodalan pura terdekat
 *  - Baris Bawah:
 *    - Ringkasan status piodalan
 *    - Tautan "Lihat selengkapnya →" menuju ke /piodalan
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Tipografi tabular-nums untuk angka tanggal dan countdown
 *  - Target sentuh ergonomis min 44x44px dengan touch-action: manipulation
 * ============================================================================
 */

interface DashboardPiodalanProps {
  data?: PiodalanDashboardItem | PiodalanDashboardItem[];
  items?: PiodalanDashboardItem[];
}

export const DashboardPiodalan: React.FC<DashboardPiodalanProps> = ({
  data,
  items,
}) => {
  const navigate = useNavigate();

  // Konversi input menjadi array dan ambil maksimal 3 agenda piodalan teratas
  const piodalanList = Array.isArray(data)
    ? data
    : items || (data ? [data] : []);

  const topThreePiodalan = piodalanList.slice(0, 3);
  const actionUrl = topThreePiodalan[0]?.actionUrl || '/piodalan';
  const nearestDaysRemaining = topThreePiodalan[0]?.daysRemainingText || '10 HARI LAGI';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* =================================================================== */}
      {/* 1. BARIS ATAS: JUDUL KARTU, SUBTEKS, & BADGE COUNTDOWN              */}
      {/* =================================================================== */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-1">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Piodalan Terdekat
          </h2>

          {/* Badge Countdown Sisa Hari Terdekat (Emerald) */}
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold uppercase tabular-nums shadow-2xs">
            {nearestDaysRemaining}
          </span>
        </div>

        <p className="text-xs text-slate-500 font-medium mb-3">
          Jadwal upacara piodalan pura dalam waktu dekat
        </p>

        {/* ================================================================= */}
        {/* 2. AREA TENGAH: DAFTAR 3 AGENDA PIODALAN TERATAS                  */}
        {/* ================================================================= */}
        <div className="space-y-2.5">
          {topThreePiodalan.map((pio) => (
            <div
              key={pio.id}
              onClick={() => navigate(actionUrl)}
              className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-[#f8fafc] border border-slate-200/70 hover:border-teal-300 hover:bg-white hover:shadow-2xs transition-all cursor-pointer group"
            >
              {/* Ikon Vektor Siluet Pelinggih Pura Bali di Kotak Mint */}
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#e6f7f5] border border-[#ccf0ea] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                <svg
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-[#0e9f90]"
                  aria-label="Ikon Pelinggih Pura"
                >
                  {/* Ujung puncak / mustika pelinggih */}
                  <path d="M16 4v4" />
                  {/* Atap pelinggih */}
                  <path d="M10 12l6-4 6 4" />
                  {/* Tiang penyangga pelinggih */}
                  <path d="M12 12v11" />
                  <path d="M20 12v11" />
                  {/* Bebaturan lantai dasar pelinggih */}
                  <path d="M8 23h16" />
                  <path d="M6 27h20" />
                </svg>
              </div>

              {/* Informasi Nama Rahina, Tanggal, & Daftar Pura */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] group-hover:text-[#0e9f90] transition-colors truncate">
                    {pio.rahina}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums shrink-0">
                    {pio.tanggalFormatted}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                  {pio.topTemples.join(' · ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BARIS BAWAH: STATUS TOTAL & TAUTAN LIHAT SELENGKAPNYA            */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-4 pt-3 mt-4 border-t border-slate-100">
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          3 Piodalan Terdekat
        </span>

        {/* Tautan Navigasi ke Halaman Piodalan Lengkap */}
        <button
          type="button"
          onClick={() => navigate(actionUrl)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d9488] hover:text-[#0c8a7d] transition-colors cursor-pointer [touch-action:manipulation] py-1"
        >
          <span>Lihat selengkapnya</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
