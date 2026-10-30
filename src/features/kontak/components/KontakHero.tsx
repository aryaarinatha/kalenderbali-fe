import React from 'react';
import { Link } from 'react-router-dom';

/**
 * ============================================================================
 * KOMPONEN: KontakHero (Header Halaman Info Kontak)
 * ============================================================================
 * Mengikuti AGENTS.md Bagian 4.1 & fe_strategy.md Bab 8.8:
 *  1. Breadcrumb navigasi hierarkis: Wargabali / Info Kontak
 *  2. Judul H1 dengan tracking-tight dan warna text-[#0f172a]
 *  3. Deskripsi ringkas peran halaman dengan lebar leluasa (max-w-4xl)
 * ============================================================================
 */
export const KontakHero: React.FC = () => {
  return (
    <div className="space-y-1.5">
      {/* Breadcrumb navigasi hierarkis */}
      <nav
        aria-label="Breadcrumb"
        className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
      >
        <Link
          to="/"
          className="hover:text-teal-700 transition-colors cursor-pointer"
          title="Kembali ke Beranda"
        >
          Wargabali
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-teal-700 font-bold">Info Kontak</span>
      </nav>

      {/* Judul H1 Halaman */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
        Info Kontak
      </h1>

      {/* Deskripsi ringkas halaman dengan lebar diperlebar */}
      <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-4xl">
        Hubungi tim pengembang Wargabali &amp; Kalender Bali untuk pertanyaan, saran perbaikan wariga, pendaftaran piodalan pura, atau kerja sama teknis.
      </p>
    </div>
  );
};
