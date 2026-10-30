import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: KontakSkeleton (Loading State Presisi Dimensi)
 * ============================================================================
 * Mengikuti fe_strategy.md Bab 8.3 & AGENTS.md Bagian 4.8:
 *  1. ZERO LAYOUT SHIFT (CLS = 0): Dimensi lebar dan tinggi 100% presisi
 *     menyerupai komponen asli halaman kontak saat lazy-loading berlangsung.
 *  2. GENTLE SHIMMER: Menggunakan animate-pulse pada tone slate-100 / slate-200.
 * ============================================================================
 */
export const KontakSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 sm:space-y-8 animate-pulse" aria-label="Memuat info kontak...">
      {/* 1. SKELETON HEADER */}
      <div className="space-y-2">
        <div className="h-3 w-32 bg-slate-200 rounded-full" />
        <div className="h-9 w-48 sm:w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full max-w-2xl bg-slate-200/80 rounded-lg" />
      </div>

      {/* 2. SKELETON KARTU PROFIL PENGEMBANG & PILL EMAIL TERPADU */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-5 flex-1">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="h-3 w-28 bg-slate-200 rounded-full" />
              <div className="h-7 w-64 bg-slate-200 rounded-xl" />
              <div className="h-4 w-full max-w-xl bg-slate-200/80 rounded-lg" />
            </div>
          </div>
          <div className="h-11 w-64 bg-slate-100 rounded-xl shrink-0" />
        </div>
      </div>

      {/* 3. SKELETON FORMULIR KONTAK */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 space-y-5 shadow-xs">
        <div className="h-6 w-52 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-11 bg-slate-100 rounded-xl" />
          <div className="h-11 bg-slate-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-11 bg-slate-100 rounded-xl" />
          <div className="h-11 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-28 bg-slate-100 rounded-xl" />
        <div className="h-11 w-36 bg-slate-200 rounded-xl ml-auto" />
      </div>
    </div>
  );
};
