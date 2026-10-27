import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: HariRayaHero (Header Halaman Hari Raya)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman Hari Raya:
 *  1. Breadcrumb navigasi: Wargabali / Layanan / Hari Raya
 *  2. Header H1 & deskripsi ringkas fungsi halaman
 *
 * Mengikuti Aturan AGENTS.md:
 *  - H1: text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a]
 * ============================================================================
 */

export const HariRayaHero: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ================================================================= */}
      {/* BLOK 1: Breadcrumb Navigasi & Judul H1 Halaman                    */}
      {/* ================================================================= */}
      <div className="space-y-1.5">
        {/* Breadcrumb navigasi hierarkis */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span>Layanan</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Hari Raya</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Hari Raya
        </h1>

        {/* Deskripsi ringkas halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Temukan rahina, hari suci, dan maknanya dengan cepat dalam satu tampilan.
        </p>
      </div>
    </div>
  );
};

