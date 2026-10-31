import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalHero (Header Halaman Wariga Personal)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman Wariga Personal:
 *  1. Breadcrumb navigasi: Wargabali / Layanan / Wariga Personal.
 *  2. Judul H1 utama dan deskripsi fungsi fitur.
 *  3. Badge aksen budaya "Evaluasi Weton Mandiri" di sisi kanan.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - H1: text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a]
 *  - Breadcrumb hierarkis dengan highlight teal-700
 * ============================================================================
 */

export const WarigaPersonalHero: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ================================================================= */}
      {/* BLOK 1: BREADCRUMB NAVIGASI & JUDUL H1 HALAMAN                    */}
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
          <span className="text-teal-700 font-bold">Wariga Personal</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Wariga Personal
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Hitung kecocokan energi hari Kalender Bali berdasarkan weton kelahiran Anda
          untuk memilih hari terbaik dalam berkegiatan, yadnya, maupun memulai usaha.
        </p>
      </div>
    </div>
  );
};

