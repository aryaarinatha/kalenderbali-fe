import React from 'react';
import type { DashboardHeroData } from '../types/dashboard.types';

/**
 * ============================================================================
 * KOMPONEN: DashboardHero (Baris 1 — Banner Hero HARI INI)
 * ============================================================================
 * Menampilkan ringkasan komprehensif hari ini yang meliputi:
 *  - Sisi Kiri:
 *    1. Kicker / Eyebrow "HARI INI"
 *    2. Tanggal Masehi besar (tabular-nums)
 *    3. Baris wewaran: Hari Masehi · Saptawara Pancawara · Wuku
 *    4. Pill rekomendasi: "Hari baik untuk belajar dan sembahyang"
 *  - Sisi Kanan:
 *    3 Kotak Metrik Stat Box (Sasih, Pawukon, Urip & Arah)
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Latar mint lembut: bg-[#eaf7f5] dengan border border-[#cbebe5]
 *  - Tipografi tabular-nums untuk angka tanggal dan urip
 * ============================================================================
 */

interface DashboardHeroProps {
  heroData: DashboardHeroData;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({ heroData }) => {
  return (
    <div className="bg-[#eaf7f5] border border-[#cbebe5] rounded-2xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* ================================================================= */}
        {/* BLOK 1: SISI KIRI — IDENTITAS TANGGAL & WEWARAN HARI INI          */}
        {/* ================================================================= */}
        <div className="space-y-2">
          {/* 1A. Kicker / Eyebrow Modul */}
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0e9f90] block">
            HARI INI
          </span>

          {/* 1B. Tanggal Masehi Besar (Ukuran H1 Standar AGENTS.md) */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tabular-nums tracking-tight">
            {heroData.tanggalFormatted}
          </h1>

          {/* 1C. Subtitle Wewaran Lengkap (Hari Masehi · Saptawara Pancawara · Wuku) */}
          <p className="text-xs sm:text-sm font-semibold text-slate-600">
            {heroData.hariMasehi} · {heroData.saptawara} {heroData.pancawara} · Wuku {heroData.wuku}
          </p>

          {/* 1D. Pill Highlight Petunjuk / Rekomendasi Hari Baik */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-teal-200/70 shadow-2xs text-xs font-semibold text-slate-700">
              {/* Dot indikator hijau emerald berdenyut halus */}
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{heroData.quoteHariIni}</span>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BLOK 2: SISI KANAN — 3 KOTAK METRIK STAT (SASIH, PAWUKON, URIP)  */}
        {/* ================================================================= */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 shrink-0">
          {/* KOTAK 1: SASIH & PENGLANTAKA */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 min-w-[95px] sm:min-w-[115px] shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              SASIH
            </span>
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-[#0f172a] tracking-tight block my-0.5 truncate">
              {heroData.sasih}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
              {heroData.pengalantaka}
            </span>
          </div>

          {/* KOTAK 2: PAWUKON & DINA KE- */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 min-w-[95px] sm:min-w-[115px] shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              PAWUKON
            </span>
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-[#0f172a] tracking-tight block my-0.5 truncate">
              {heroData.wuku}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate">
              Dina ka-{heroData.dinaKa}
            </span>
          </div>

          {/* KOTAK 3: URIP & ARAH PENGIDER-IDER */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 min-w-[95px] sm:min-w-[115px] shadow-2xs">
            <span className="text-[10px] sm:text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              URIP
            </span>
            <span className="text-base sm:text-lg lg:text-xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
              {heroData.urip}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium block truncate capitalize">
              {heroData.arah}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
