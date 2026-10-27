import React from 'react';

/**
 * ============================================================================
 * KOMPONEN: DashboardSkeleton (Tahap 9 — Loading State Presisi Dimensi)
 * ============================================================================
 * Menampilkan placeholder rangka (skeleton) saat aplikasi pertama kali dibuka
 * (cold start) sebelum data kalender 1 tahun selesai ditarik dari backend Go.
 *
 * Prinsip Arsitektur (fe_strategy.md Bab 8.3 & AGENTS.md Bab 4.8):
 *  1. ZERO LAYOUT SHIFT (CLS = 0):
 *     Dimensi lebar, tinggi, margin, dan padding skeleton dibuat 100% presisi
 *     sama dengan tata letak komponen asli (Hero, Mini Kalender, Hari Raya,
 *     Dewasa Ayu, dan Piodalan).
 *  2. GENTLE SHIMMER: Menggunakan animate-pulse lembut pada tone slate-100/slate-200
 *     tanpa spinner memutar yang mengganggu konsentrasi pengguna.
 * ============================================================================
 */

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse" aria-label="Memuat data dashboard...">
      {/* =================================================================== */}
      {/* 1. SKELETON BARIS 1: HERO BANNER "HARI INI"                         */}
      {/* =================================================================== */}
      <div className="bg-[#eaf7f5]/50 border border-[#cbebe5]/60 rounded-2xl p-6 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Sisi Kiri: Eyebrow, Tanggal Besar, Wewaran, & Pill Rekomendasi */}
          <div className="space-y-3 flex-1">
            <div className="h-3 w-20 bg-teal-200/60 rounded-full" />
            <div className="h-9 w-64 sm:w-80 bg-slate-200/80 rounded-xl" />
            <div className="h-4 w-52 sm:w-64 bg-slate-200/60 rounded-lg" />
            <div className="pt-2">
              <div className="h-7 w-72 bg-white/80 rounded-full border border-teal-100" />
            </div>
          </div>

          {/* Sisi Kanan: 3 Kotak Metrik Stat Box (Sasih, Pawukon, Urip) */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 shrink-0">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-slate-200/60 p-3 sm:p-4 min-w-[95px] sm:min-w-[115px] space-y-2 shadow-2xs"
              >
                <div className="h-2.5 w-12 bg-slate-200 rounded-full" />
                <div className="h-6 w-16 bg-slate-200/80 rounded-lg" />
                <div className="h-2.5 w-14 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 2. SKELETON BARIS 2: MINI KALENDER & HARI RAYA BERIKUTNYA           */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Kolom Kiri: Mini Kalender Bulanan (lg:col-span-7) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          {/* Header Kalender */}
          <div className="flex items-center justify-between mb-5">
            <div className="space-y-1.5">
              <div className="h-5 w-36 bg-slate-200 rounded-lg" />
              <div className="h-3 w-28 bg-slate-100 rounded-full" />
            </div>
            <div className="flex gap-1.5">
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
              <div className="w-8 h-8 rounded-xl bg-slate-100" />
            </div>
          </div>

          {/* Baris Label 7 Kolom Hari */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="h-3 w-6 mx-auto bg-slate-200/60 rounded-full" />
            ))}
          </div>

          {/* Matriks 35 Sel Kotak Tanggal */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {Array.from({ length: 35 }).map((_, idx) => (
              <div
                key={idx}
                className="min-h-[50px] sm:min-h-[56px] rounded-xl bg-[#fbfcfc] border border-slate-100 p-2 flex flex-col justify-between"
              >
                <div className="h-3 w-4 bg-slate-200/70 rounded" />
                <div className="h-2 w-8 bg-slate-100 rounded-full mt-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Hari Raya Berikutnya List (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Header List */}
            <div className="mb-4 space-y-1">
              <div className="h-5 w-44 bg-slate-200 rounded-lg" />
              <div className="h-3 w-36 bg-slate-100 rounded-full" />
            </div>

            {/* 7 Baris Item List Skeleton */}
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <div
                  key={i}
                  className="p-2.5 sm:p-3 rounded-xl bg-[#f8fafc] border border-slate-200/70 flex items-center gap-3"
                >
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 sm:h-4 w-32 bg-slate-200/80 rounded" />
                    <div className="h-3 w-24 bg-slate-100 rounded-full" />
                  </div>
                  <div className="w-16 h-5 rounded-full bg-slate-100 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Tombol Bawah Skeleton */}
          <div className="mt-4 pt-2">
            <div className="h-10 w-full rounded-xl bg-[#f0fbf9] border border-[#ccf0ea]" />
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. SKELETON BARIS 3: DEWASA AYU & PIODALAN TERDEKAT                  */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Kolom Kiri: Dewasa Ayu Hari Ini (3 Item Skeleton) */}
        <div className="bg-gradient-to-br from-[#0e9f90]/40 to-[#0a756a]/40 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="h-5 w-36 bg-white/20 rounded-full" />
              <div className="h-5 w-14 bg-white/20 rounded-full" />
            </div>
            <div className="h-4 w-3/4 bg-white/20 rounded-lg mb-3" />

            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-white/10 border border-white/10 flex items-center justify-between"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-28 bg-white/25 rounded" />
                    <div className="h-3 w-44 bg-white/15 rounded-full" />
                  </div>
                  <div className="h-4 w-16 bg-white/20 rounded-md shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 mt-4 border-t border-white/10">
            <div className="h-3.5 w-24 bg-white/20 rounded-full" />
            <div className="h-4 w-28 bg-white/20 rounded-full" />
          </div>
        </div>

        {/* Kolom Kanan: Piodalan Terdekat (3 Item Skeleton) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="h-5 w-36 bg-slate-200 rounded-lg" />
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-3.5 w-48 bg-slate-100 rounded-full mb-3" />

            <div className="space-y-2.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-[#f8fafc] border border-slate-200/70 flex items-center gap-3.5"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200/80 rounded" />
                    <div className="h-3 w-48 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-3 mt-4 border-t border-slate-100">
            <div className="h-3.5 w-28 bg-slate-100 rounded-full" />
            <div className="h-4 w-28 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
