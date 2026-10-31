import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalSkeleton
 * ============================================================================
 * Loading skeleton screen presisi dimensi untuk mencegah pergeseran tata letak
 * (Cumulative Layout Shift / CLS = 0) saat data Wariga Personal pertama kali ditarik:
 *  1. Skeleton Header & Breadcrumb.
 *  2. Skeleton Form Card.
 *  3. Skeleton Sidebar Kiri (Weton, Tombol Aksi, & Legenda).
 *  4. Skeleton Grid Kalender 7 Kolom.
 *
 * Mengikuti Panduan fe_strategy.md Bagian 8.3 & AGENTS.md Bagian 4.8.
 * ============================================================================
 */

export const WarigaPersonalSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Memuat data kalender...">
      {/* 1. Header Skeleton */}
      <div className="space-y-2">
        <div className="h-4 w-48 bg-slate-200/70 rounded-md" />
        <div className="h-9 w-64 bg-slate-200/80 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-slate-200/60 rounded-md" />
      </div>

      {/* 2. Form Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 h-11 bg-slate-100 rounded-xl" />
          <div className="md:col-span-4 h-11 bg-slate-100 rounded-xl" />
          <div className="md:col-span-3 h-11 bg-slate-100 rounded-xl" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-4 w-44 bg-slate-100 rounded-md" />
          <div className="h-11 w-44 bg-slate-200/70 rounded-xl" />
        </div>
      </div>

      {/* 3. Main Split Area Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar Kiri (4 dari 12 kolom) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card Weton */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="h-4 w-28 bg-slate-200/70 rounded-md" />
            <div className="h-20 bg-slate-100 rounded-xl" />
            <div className="h-11 bg-slate-100 rounded-xl" />
            <div className="h-11 bg-slate-100 rounded-xl" />
          </div>

          {/* Card Filter */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
            <div className="h-4 w-24 bg-slate-200/70 rounded-md" />
            <div className="h-11 bg-slate-100 rounded-xl" />
          </div>

          {/* Card Legenda */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
            <div className="h-4 w-36 bg-slate-200/70 rounded-md" />
            <div className="space-y-2">
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
              <div className="h-16 bg-slate-100 rounded-xl" />
            </div>
          </div>
        </div>

        {/* Panel Kanan Kalender (8 dari 12 kolom) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Banner Rekomendasi Skeleton */}
          <div className="h-24 bg-slate-100 rounded-2xl border border-slate-200/70" />

          {/* Matriks Kalender Skeleton */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="h-6 w-40 bg-slate-200/70 rounded-lg" />
              <div className="h-9 w-20 bg-slate-100 rounded-xl" />
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-5 bg-slate-100 rounded mx-2" />
              ))}
            </div>

            <div className="grid grid-cols-7 border-t border-l border-slate-200 mt-2">
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="min-h-[105px] border-r border-b border-slate-200 p-2 space-y-2"
                >
                  <div className="h-4 w-5 bg-slate-100 rounded" />
                  <div className="h-5 w-full bg-slate-100/70 rounded-md" />
                  <div className="h-3 w-12 bg-slate-100/60 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

