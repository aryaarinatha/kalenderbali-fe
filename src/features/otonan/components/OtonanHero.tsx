import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: OtonanHero (Header Halaman Otonan)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman Otonan:
 *  1. Breadcrumb navigasi: Wargabali / Layanan / Otonan
 *  2. Header H1 & deskripsi ringkas fungsi halaman
 *
 * Mengikuti Aturan AGENTS.md:
 *  - H1: text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a]
 * ============================================================================
 */

export const OtonanHero: React.FC = () => {
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
          <span className="text-teal-700 font-bold">Otonan</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Otonan
        </h1>

        {/* Deskripsi ringkas halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Hitung jadwal perayaan otonan berikutnya dan telusuri rincian wariga hari kelahiran Anda.
        </p>
      </div>
    </div>
  );
};
