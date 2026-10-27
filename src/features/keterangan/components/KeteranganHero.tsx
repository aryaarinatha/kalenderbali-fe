import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: KeteranganHero (Header Halaman Keterangan)
 * ============================================================================
 * Komponen ini menyajikan bagian navigasi dan header atas halaman katalog Keterangan:
 *  1. Breadcrumb navigasi hierarkis: Wargabali / Layanan / Keterangan
 *  2. Header H1: "Keterangan"
 *  3. Deskripsi ringkas fungsi halaman
 *
 * Mengikuti Pola Desain Seragam HariRayaHero:
 *  - Tata letak terbuka borderless tanpa amplop card pembungkus luar
 *  - Skala H1: text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight
 *  - Breadcrumb: text-xs font-semibold text-slate-400 dengan segmen aktif text-teal-700 font-bold
 * ============================================================================
 */

export interface KeteranganHeroProps {
  /** Jumlah kategori aktif (opsional untuk kompatibilitas) */
  activeCategoryCount?: number;
  /** Estimasi total entri (opsional untuk kompatibilitas) */
  totalEntryCount?: number;
  /** Status loading (opsional untuk kompatibilitas) */
  isLoading?: boolean;
}

export const KeteranganHero: React.FC<KeteranganHeroProps> = () => {
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
          <span className="text-teal-700 font-bold">Keterangan</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Keterangan
        </h1>

        {/* Deskripsi ringkas fungsi halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Katalog referensi lengkap wewaran, pantangan mingguan, hari baik, hari raya, dan elemen penanggalan Bali.
        </p>
      </div>
    </div>
  );
};
