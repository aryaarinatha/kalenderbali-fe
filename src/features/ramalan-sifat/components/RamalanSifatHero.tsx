import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: RamalanSifatHero (Header Halaman Ramalan Sifat)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman Ramalan Sifat.
 *
 * Mengikuti Pola Seragam Aplikasi (Otonan, Keterangan, Hari Raya, Wariga Personal):
 *  1. Tata letak terbuka borderless tanpa amplop card pembungkus ganda.
 *  2. Breadcrumb navigasi hierarkis: Wargabali / Layanan / Ramalan Sifat.
 *  3. Judul H1 Halaman: "Ramalan Sifat" (text-2xl sm:text-3xl lg:text-4xl font-extrabold).
 *  4. Deskripsi ringkas fungsi halaman yang rapi dan konsisten.
 *
 * Menerapkan Standar AGENTS.md Bagian 4 Poin 1 & fe_strategy.md.
 * ============================================================================
 */

export const RamalanSifatHero: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
      {/* ===================================================================== */}
      {/* BLOK 1: BREADCRUMB NAVIGASI & JUDUL H1 HALAMAN                        */}
      {/* ===================================================================== */}
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
          <span className="text-teal-700 font-bold">Ramalan Sifat</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Ramalan Sifat
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Kenali kecenderungan watak dan potensi diri melalui penanggalan Bali
          sebagai bahan refleksi pribadi yang dihitung dari 4 pilar wariga otentik.
        </p>
      </div>
    </div>
  );
};
