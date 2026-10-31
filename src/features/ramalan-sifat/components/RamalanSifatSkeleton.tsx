import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: RamalanSifatSkeleton
 * ============================================================================
 * Loading skeleton screen berdimensi presisi untuk mencegah pergeseran tata letak
 * (Cumulative Layout Shift / CLS = 0) saat data Ramalan Sifat dimuat dari server:
 *  1. Blok 1: RamalanSifatResultSectionSkeleton — Placeholder hasil perhitungan:
 *     - Baris Atas: Full-Width Banner Weton & Identitas (Opsi 2).
 *     - Baris Tengah: 4 kotak grid 2x2 pilar karakter wariga.
 *     - Baris Bawah: Kotak disclaimer interpretasi.
 *  2. Blok 2: RamalanSifatSkeleton — Placeholder penuh saat Suspense rute aktif:
 *     - Header & Breadcrumb.
 *     - Hero Banner Card.
 *     - Form Card Input.
 *     - Result Section Placeholder.
 *
 * Mengikuti Standar fe_strategy.md Bagian 8.3 & AGENTS.md Bagian 4 Poin 8.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: SKELETON HASIL PERHITUNGAN (RESULT SECTION SKELETON)
// ----------------------------------------------------------------------------
/**
 * RamalanSifatResultSkeleton digunakan saat pengguna telah menekan tombol pencarian
 * dan query TanStack sedang mengambil data dari backend Go.
 */
export const RamalanSifatResultSectionSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Sedang menghitung watak kelahiran..."
    >
      {/* 1. Baris Atas: Full-Width Banner Weton & Identitas (Opsi 2) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sisi Kiri: Identitas Penanggalan & Weton (lg:col-span-5) */}
          <div className="lg:col-span-5 space-y-3.5 lg:border-r lg:border-slate-100 lg:pr-6">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-slate-200/70 rounded-md" />
              <div className="h-4 w-20 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <div className="h-8 w-4/5 bg-slate-200/80 rounded-lg" />
              <div className="h-4 w-3/5 bg-slate-200/60 rounded-md" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="h-7 w-44 bg-slate-100 rounded-lg" />
            </div>
          </div>

          {/* Sisi Kanan: Kesimpulan 4 Pilar Karakter (lg:col-span-7) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex justify-between items-center">
              <div className="h-5 w-52 bg-slate-200/70 rounded-md" />
              <div className="h-4 w-24 bg-slate-100 rounded-md" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="h-4 w-full bg-slate-100 rounded-md" />
              <div className="h-4 w-11/12 bg-slate-100 rounded-md" />
              <div className="h-4 w-4/5 bg-slate-100 rounded-md" />
            </div>
            <div className="h-3 w-3/4 bg-slate-100 rounded-md pt-1" />
          </div>
        </div>
      </div>

      {/* 2. Baris Tengah: 4 Kotak Pilar Karakter (Grid 2x2) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-56 bg-slate-200/80 rounded-md" />
          <div className="h-4 w-40 bg-slate-100 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3.5"
            >
              <div className="flex justify-between items-center">
                <div className="h-5 w-36 bg-slate-200/70 rounded-md" />
                <div className="h-4 w-16 bg-slate-100 rounded-md" />
              </div>
              <div className="h-6 w-44 bg-slate-200/80 rounded-md" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-full bg-slate-100 rounded-md" />
                <div className="h-4 w-11/12 bg-slate-100 rounded-md" />
                <div className="h-4 w-3/4 bg-slate-100 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Baris Bawah: Footer Disclaimer */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          <div className="md:col-span-5 space-y-2 md:border-r md:border-slate-100 md:pr-5">
            <div className="h-4 w-32 bg-slate-200/70 rounded-md" />
            <div className="h-4 w-full bg-slate-100 rounded-md" />
          </div>
          <div className="md:col-span-7 space-y-2">
            <div className="h-4 w-32 bg-slate-200/70 rounded-md" />
            <div className="h-4 w-full bg-slate-100 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// BLOK 2: SKELETON HALAMAN LENGKAP (FULL PAGE SUSPENSE FALLBACK)
// ----------------------------------------------------------------------------
/**
 * RamalanSifatSkeleton digunakan sebagai fallback Suspense saat modul halaman
 * sedang diunduh di latar belakang melalui React.lazy().
 */
export const RamalanSifatSkeleton: React.FC = () => {
  return (
    <div
      className="space-y-6 animate-pulse"
      aria-busy="true"
      aria-label="Memuat modul Ramalan Sifat..."
    >
      {/* 1. Header & Breadcrumb Skeleton */}
      <div className="space-y-1.5">
        <div className="h-4 w-44 bg-slate-200/70 rounded-md" />
        <div className="h-9 w-60 bg-slate-200/80 rounded-xl" />
        <div className="h-4 w-96 max-w-full bg-slate-200/60 rounded-md" />
      </div>

      {/* 2. Form Card Skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        <div className="h-5 w-32 bg-slate-200/80 rounded-md" />
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-5 h-11 bg-slate-100 rounded-xl" />
          <div className="md:col-span-4 h-11 bg-slate-100 rounded-xl" />
          <div className="md:col-span-3 h-11 bg-slate-200/80 rounded-xl" />
        </div>
        <div className="h-3 w-72 bg-slate-100 rounded-md" />
      </div>
    </div>
  );
};

