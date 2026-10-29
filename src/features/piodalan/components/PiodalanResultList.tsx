import React, { useState } from 'react';
import { Calendar, MapPin, ChevronRight, Sparkles } from 'lucide-react';
import type { PiodalanScheduleItem, PiodalanModalActiveSection } from '../types/piodalan.types';
import { getPuraTypeBadgeStyle } from '../utils/piodalanUtils';

/**
 * ==============================================================================
 * KOMPONEN: PiodalanResultList (Daftar Hasil Pencarian Piodalan Kolom Kiri)
 * ==============================================================================
 * Komponen utama penyaji hasil pencarian piodalan di kolom kiri (~2/3 layar).
 *
 * Fitur & Tata Letak:
 * 1. Header kartu: Judul 'Hasil pencarian', sub-deskripsi, dan badge jumlah jadwal
 * 2. Header tabel: TANGGAL, PURA & LOKASI, PENANGGALAN, AKSI
 * 3. Baris kartu piodalan:
 *    - Kotak tanggal ber-badge tebal (angka tanggal + singkatan bulan kapital)
 *    - Nama pura tebal + pill kategori pura + alamat lokasi
 *    - Penanggalan wewaran (contoh: Buda · Wage · Klawu / Pawukon 210 hari)
 *    - Tombol aksi terpadu:
 *      * 'Detail': Membuka modal pop-up 2-section (Section 1: Detail Wariga & Section 2: Detail Pura)
 *      * Tautan pintas 'Detail Wariga' langsung untuk kenyamanan krama
 * 4. Paginasi bertahap: Tombol 'Tampilkan X jadwal lainnya' (menghindari scroll tak terhingga)
 * 5. State kosong (Empty State) & Skeleton loading berdimensi presisi (CLS = 0)
 * ==============================================================================
 */

interface PiodalanResultListProps {
  /** Daftar seluruh jadwal piodalan yang cocok dengan filter */
  scheduleList: PiodalanScheduleItem[];

  /** Jumlah total jadwal yang ditemukan */
  totalCount: number;

  /** Status pemuatan data dari backend */
  isLoading?: boolean;

  /**
   * Callback untuk membuka modal dialog 2 section
   * @param item Objek jadwal piodalan yang dipilih
   * @param initialSection Section awal yang ingin dibuka ('wariga' atau 'pura')
   */
  onOpenScheduleDetail: (item: PiodalanScheduleItem, initialSection: PiodalanModalActiveSection) => void;

  /** Callback untuk mereset filter jika hasil pencarian kosong */
  onResetFilter?: () => void;
}

/** Jumlah item awal yang ditampilkan sebelum tombol 'Tampilkan lainnya' diklik */
const INITIAL_DISPLAY_LIMIT = 6;
/** Jumlah penambahan item setiap kali tombol diklik */
const LOAD_MORE_STEP = 6;

export const PiodalanResultList: React.FC<PiodalanResultListProps> = ({
  scheduleList,
  totalCount,
  isLoading = false,
  onOpenScheduleDetail,
  onResetFilter,
}) => {
  // State pembatasan jumlah item yang ditampilkan (paginasi bertahap)
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_DISPLAY_LIMIT);

  // Item yang sedang aktif dirender pada tampilan saat ini
  const visibleSchedules = scheduleList.slice(0, displayLimit);
  const remainingCount = totalCount - visibleSchedules.length;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + LOAD_MORE_STEP);
  };

  // Helper pemilih aksen warna garis tepi badge tanggal
  const getBadgeBorderClass = (variant: 'teal' | 'emerald' | 'indigo' | 'amber') => {
    switch (variant) {
      case 'teal':
        return 'border-l-teal-600 text-teal-700';
      case 'emerald':
        return 'border-l-emerald-600 text-emerald-700';
      case 'indigo':
        return 'border-l-indigo-600 text-indigo-700';
      case 'amber':
        return 'border-l-amber-600 text-amber-700';
      default:
        return 'border-l-teal-600 text-teal-700';
    }
  };

  // ============================================================================
  // 1. STATE PEMUATAN DATA (SKELETON SCREEN - CLS = 0)
  // ============================================================================
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-36 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-4 w-64 bg-slate-100 rounded-md animate-pulse" />
          </div>
          <div className="h-7 w-20 bg-slate-100 rounded-full animate-pulse" />
        </div>

        {/* 6 Baris Skeleton Presisi Dimensi */}
        <div className="divide-y divide-slate-100">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="py-4.5 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-xl" />
                <div className="space-y-2">
                  <div className="h-4.5 w-44 bg-slate-100 rounded-md" />
                  <div className="h-3.5 w-32 bg-slate-100 rounded-md" />
                </div>
              </div>
              <div className="hidden sm:block space-y-2">
                <div className="h-4 w-36 bg-slate-100 rounded-md" />
                <div className="h-3 w-24 bg-slate-100 rounded-md" />
              </div>
              <div className="h-9 w-20 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. STATE KOSONG (EMPTY STATE JIKA TIDAK ADA HASIL)
  // ============================================================================
  if (!scheduleList || scheduleList.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center mx-auto text-[#0e9f90]">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
            Tidak ada piodalan yang cocok
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Kombinasi wewaran, bulan, atau nama pura yang Anda masukkan tidak menghasilkan jadwal pada tahun ini. Silakan atur ulang filter pencarian Anda.
          </p>
        </div>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="h-10 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>Atur ulang filter pencarian</span>
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // 3. TAMPILAN UTAMA TABEL HASIL PENCARIAN
  // ============================================================================
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-5">
      {/* ==================================================================== */}
      {/* A. HEADER KARTU: JUDUL & BADGE JUMLAH JADWAL                         */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Hasil pencarian
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Jadwal dan pura yang sesuai dengan kombinasi terpilih.
          </p>
        </div>

        {/* Badge Jumlah Jadwal Ditemukan */}
        <span className="px-3.5 py-1.5 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs tabular-nums shrink-0">
          {totalCount} jadwal
        </span>
      </div>

      {/* ==================================================================== */}
      {/* B. HEADER KOLOM TABEL                                                */}
      {/* ==================================================================== */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-3 py-2 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 select-none">
        <div className="sm:col-span-2">Tanggal</div>
        <div className="sm:col-span-5">Pura & Lokasi</div>
        <div className="sm:col-span-3">Penanggalan</div>
        <div className="sm:col-span-2 text-right">Aksi</div>
      </div>

      {/* ==================================================================== */}
      {/* C. DAFTAR BARIS HASIL PIODALAN                                       */}
      {/* ==================================================================== */}
      <div className="divide-y divide-slate-100">
        {visibleSchedules.map((schedule) => {
          const badgeColorClass = getBadgeBorderClass(schedule.dateBadge.colorVariant);

          return (
            <div
              key={schedule.id}
              className="py-4 sm:py-4.5 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center hover:bg-slate-50/70 rounded-xl px-2 sm:px-3 transition-colors group"
            >
              {/* Kolom 1: Tanggal Badge Visual (Angka Besar + Singkatan Bulan) */}
              <div className="sm:col-span-2 flex items-center gap-3">
                <div
                  className={`border-l-4 ${badgeColorClass} pl-3 py-0.5 select-none`}
                  title={schedule.formattedDate}
                >
                  <span className="text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight leading-none block">
                    {schedule.dateBadge.day}
                  </span>
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 block mt-0.5">
                    {schedule.dateBadge.month}
                  </span>
                </div>
              </div>

              {/* Kolom 2: Nama Pura, Kategori, & Lokasi */}
              <div className="sm:col-span-5 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm sm:text-base font-extrabold text-[#0f172a] group-hover:text-teal-800 transition-colors">
                    {schedule.puraName}
                  </h4>
                  {schedule.puraType && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold inline-block shrink-0 ${getPuraTypeBadgeStyle(
                        schedule.puraType
                      )}`}
                    >
                      {schedule.puraType}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="line-clamp-1">{schedule.location}</span>
                </div>
              </div>

              {/* Kolom 3: Penanggalan Wewaran & Siklus Pawukon */}
              <div className="sm:col-span-3 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onOpenScheduleDetail(schedule, 'wariga')}
                  className="text-xs sm:text-sm font-bold text-slate-800 hover:text-teal-700 text-left transition-colors cursor-pointer block"
                  title="Klik untuk melihat Detail Wariga lengkap"
                >
                  {schedule.penanggalan}
                </button>
                <span className="text-[11px] text-slate-400 font-medium block">
                  {schedule.cycleInfo}
                </span>
              </div>

              {/* Kolom 4: Tombol Aksi (Membuka Modal Detail 2 Section) */}
              <div className="sm:col-span-2 flex items-center justify-start sm:justify-end gap-2 pt-2 sm:pt-0">
                {/* Tombol Pintas: Detail Wariga (Section 1) */}
                <button
                  type="button"
                  onClick={() => onOpenScheduleDetail(schedule, 'wariga')}
                  title="Lihat Detail Wariga (Gambar 1 & 2)"
                  className="p-2 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50/80 transition-colors cursor-pointer hidden lg:inline-flex"
                >
                  <Sparkles className="w-4 h-4" />
                </button>

                {/* Tombol Primer: Detail (Membuka Modal Terpadu) */}
                <button
                  type="button"
                  onClick={() => onOpenScheduleDetail(schedule, 'pura')}
                  className="h-9 px-4 rounded-xl border border-slate-200 hover:border-teal-500/40 bg-white hover:bg-teal-50/50 active:bg-teal-100/50 text-teal-800 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 shadow-2xs [touch-action:manipulation]"
                >
                  <span>Detail</span>
                  <ChevronRight className="w-3.5 h-3.5 text-teal-600" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================================================================== */}
      {/* D. PAGINASI BERTAHAP: TOMBOL TAMPILKAN LAINNYA                        */}
      {/* ==================================================================== */}
      {remainingCount > 0 && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLoadMore}
            className="w-full py-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200/80 border border-slate-200/80 text-xs sm:text-sm font-bold text-slate-700 hover:text-[#0f172a] transition-all cursor-pointer flex items-center justify-center gap-2 [touch-action:manipulation]"
          >
            <span>Tampilkan {remainingCount} jadwal lainnya</span>
          </button>
        </div>
      )}
    </div>
  );
};
