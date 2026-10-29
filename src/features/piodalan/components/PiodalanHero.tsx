import React from 'react';

/**
 * ==============================================================================
 * KOMPONEN: PiodalanHero (Banner Header Halaman Piodalan)
 * ==============================================================================
 * Banner visual di bagian atas halaman fitur Piodalan yang menampilkan:
 * 1. Eyebrow label 'PENCARIAN PIODALAN' berwarna aksen Teal Tirta Bali
 * 2. Judul utama halaman (H2) dan deskripsi fungsi fitur
 * 3. Dua kotak counter metrik ringkas: '3 metode pencarian' dan '210 hari satu siklus Pawukon'
 * 4. Ilustrasi ornamen vektor candi bentar / pura Bali inline (zero-flicker SVG)
 *
 * Menerapkan standar UI/UX dari AGENTS.md:
 * - Tabular numbers (tabular-nums) pada angka metrik
 * - Palet resmi: Mint Subtle (#e6f7f5), Mint Border (#ccf0ea), Primary Text (#0f172a)
 * ==============================================================================
 */

export const PiodalanHero: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-teal-50/60 via-white to-emerald-50/40 rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
      {/* ==================================================================== */}
      {/* 1. TATA LETAK UTAMA: FLEKSIBEL (TEKS KIRI VS STATISTIK KANAN)        */}
      {/* ==================================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        {/* Kolom Kiri: Judul dan Deskripsi Hero */}
        <div className="space-y-2 max-w-2xl">
          {/* Eyebrow Label */}
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-4 bg-[#0e9f90] rounded-full inline-block" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
              Pencarian Piodalan
            </span>
          </div>

          {/* Judul Hero (H2) */}
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight leading-tight">
            Temukan jadwal piodalan dengan lebih terarah.
          </h2>

          {/* Paragraf Keterangan */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Pilih metode yang paling Anda kenal—wewaran, bulan, atau nama pura.
          </p>
        </div>

        {/* ================================================================== */}
        {/* 2. KOLOM KANAN: STAT COUNTER BOXES & ILUSTRASI CANDI               */}
        {/* ================================================================== */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {/* Metrik 1: Jumlah Metode Pencarian */}
          <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl px-4 py-3 sm:py-3.5 text-center min-w-[110px] sm:min-w-[125px] shadow-2xs">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block">
              3
            </span>
            <span className="text-[11px] text-slate-500 font-semibold block leading-tight mt-0.5">
              metode pencarian
            </span>
          </div>

          {/* Metrik 2: Siklus Hari Pawukon */}
          <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl px-4 py-3 sm:py-3.5 text-center min-w-[125px] sm:min-w-[145px] shadow-2xs">
            <span className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block">
              210
            </span>
            <span className="text-[11px] text-slate-500 font-semibold block leading-tight mt-0.5">
              hari siklus Pawukon
            </span>
          </div>

          {/* Ornamen Vektor Siluet Pura / Candi Bentar (Inline SVG untuk Zero-Flicker) */}
          <div className="hidden sm:flex items-center justify-center w-16 h-16 text-[#0e9f90]/30 shrink-0 ml-1">
            <svg
              className="w-14 h-14"
              viewBox="0 0 64 64"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {/* Garis atap dan tingkat candi bentar */}
              <path d="M12 56h40" />
              <path d="M16 56V40h32v16" />
              <path d="M20 40V28h24v12" />
              <path d="M24 28V18h16v10" />
              <path d="M28 18V10h8v8" />
              <path d="M32 6v4" />
              {/* Gapura tengah */}
              <path d="M28 56v-8a4 4 0 0 1 8 0v8" />
              {/* Garis ornamen pilar */}
              <path d="M12 48h4" />
              <path d="M48 48h4" />
              <path d="M16 34h4" />
              <path d="M44 34h4" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
