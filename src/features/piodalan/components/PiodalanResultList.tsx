import React, { useState } from 'react';
import { Calendar, Landmark, CalendarDays, Sparkles } from 'lucide-react';
import type { PiodalanDayGroup } from '../types/piodalan.types';

/**
 * ==============================================================================
 * PROPS: PiodalanResultList
 * ==============================================================================
 * Antarmuka properti untuk komponen daftar hasil pencarian agenda piodalan.
 */
interface PiodalanResultListProps {
  /** Kelompok perayaan piodalan per hari/tanggal (Level 1 dalam hierarki) */
  dayGroups: PiodalanDayGroup[];

  /** Jumlah total pura yang merayakan piodalan */
  totalCount: number;

  /** Status pemuatan data dari backend */
  isLoading?: boolean;

  /**
   * Callback ketika tombol 'List Pura' pada kartu piodalan diklik (Level 2)
   * Membuka modal daftar pura yang merayakan piodalan pada tanggal tersebut
   */
  onOpenPuraList: (dayGroup: PiodalanDayGroup) => void;

  /**
   * Callback ketika tombol 'Detail Tanggal' pada kartu piodalan diklik
   * Membuka rincian 15 dimensi penanggalan wariga hari tersebut
   */
  onOpenDayWariga: (dateStr: string) => void;

  /** Callback untuk mereset filter jika hasil pencarian kosong */
  onResetFilter?: () => void;

  /** Judul dinamis ringkasan pencarian (contoh: "Data Piodalan Bulan Oktober 2026") */
  resultTitle?: string;
}

/** Jumlah kartu awal yang ditampilkan sebelum tombol 'Tampilkan lainnya' diklik */
const INITIAL_DISPLAY_LIMIT = 6;
/** Penambahan jumlah kartu tiap kali tombol ditekan */
const LOAD_MORE_STEP = 6;

/**
 * ==============================================================================
 * KOMPONEN: PiodalanResultList (Daftar Kartu Piodalan Utama - Level 1)
 * ==============================================================================
 * Mengimplementasikan hierarki 3-level dengan kepatuhan penuh pada Design System:
 * 1. Setiap kartu merepresentasikan SATU AGENDA PIODALAN / TANGGAL (Level 1)
 * 2. Visual selaras 100% dengan AGENTS.md dan modul resmi (Kalender Bali & Cari Otonan):
 *    - Kartu putih elegan (bg-white rounded-2xl border border-slate-200/90 shadow-xs)
 *    - Aksen Brand Resmi: Teal Tirta Bali (#0e9f90) & Mint Subtle (#e6f7f5)
 *    - Watermark arsitektur siluet Candi Bentar di pojok kanan bawah
 *    - Angka dan penanggalan menggunakan tabular-nums
 * 3. Dua tombol aksi baku:
 *    - 'List Pura (X Pura)': Tombol Utama Teal (#0e9f90) -> Membuka Level 2 (Modal Daftar Pura)
 *    - 'Detail Tanggal': Tombol Sekunder Outline -> Membuka Rincian Wariga 15 Dimensi
 * ==============================================================================
 */
export const PiodalanResultList: React.FC<PiodalanResultListProps> = ({
  dayGroups,
  totalCount,
  isLoading = false,
  onOpenPuraList,
  onOpenDayWariga,
  onResetFilter,
  resultTitle = 'Hasil Pencarian Piodalan',
}) => {
  // Paginasi bertahap untuk kenyamanan scroll dan performa rendering instan
  const [displayLimit, setDisplayLimit] = useState<number>(INITIAL_DISPLAY_LIMIT);

  const visibleDayGroups = dayGroups.slice(0, displayLimit);
  const remainingCount = dayGroups.length - visibleDayGroups.length;

  const handleLoadMore = () => {
    setDisplayLimit((prev) => prev + LOAD_MORE_STEP);
  };

  // ============================================================================
  // 1. STATE PEMUATAN DATA (SKELETON SCREEN - CLS = 0)
  // ============================================================================
  // Menggunakan dimensi presisi menyamai layout data asli agar CLS = 0 (AGENTS.md 4.8)
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-2">
          <div className="h-6 w-48 bg-slate-200/80 rounded-md animate-pulse" />
          <div className="h-6 w-24 bg-slate-200/80 rounded-full animate-pulse" />
        </div>

        {/* 4 Kartu Skeleton Berdimensi Presisi */}
        <div className="space-y-4">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-36 sm:h-40 rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-3 w-28 bg-slate-200 rounded-md" />
                <div className="h-6 w-56 bg-slate-200 rounded-md" />
                <div className="h-4 w-40 bg-slate-200 rounded-md" />
              </div>
              <div className="flex gap-3 pt-2">
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
                <div className="h-10 w-32 bg-slate-200 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. STATE KOSONG (EMPTY STATE JIKA TIDAK ADA HASIL)
  // ============================================================================
  // Menampilkan pesan panduan santun dengan palet resmi Teal & Slate
  if (!dayGroups || dayGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center mx-auto text-[#0d9488]">
          <Calendar className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
            Tidak ada piodalan yang cocok
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            Kombinasi wewaran, bulan, atau nama pura yang Anda masukkan tidak menghasilkan jadwal pada tahun ini. Silakan sesuaikan kembali filter pencarian Anda.
          </p>
        </div>
        {onResetFilter && (
          <button
            type="button"
            onClick={onResetFilter}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
          >
            <span>Atur ulang filter pencarian</span>
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // 3. TAMPILAN UTAMA: KARTU PIODALAN PER TANGGAL (LEVEL 1)
  // ============================================================================
  return (
    <div className="space-y-5">
      {/* ==================================================================== */}
      {/* A. HEADER DAFTAR HASIL PENCARIAN                                     */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            {resultTitle}
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pilih <span className="font-bold text-slate-700">List Pura</span> untuk melihat daftar pura atau{' '}
            <span className="font-bold text-slate-700">Detail Tanggal</span> untuk melihat wariga lengkap.
          </p>
        </div>

        {/* Badge Jumlah Agenda & Total Pura (Format Semantik Mint Subtle) */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-[#e6f7f5] border border-teal-200/60 text-teal-800 text-xs font-black tabular-nums">
            {dayGroups.length} Agenda
          </span>
          <span className="hidden sm:inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold tabular-nums">
            {totalCount} Pura
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* B. DAFTAR KARTU PIODALAN (LEVEL 1 - SESUAI PAKEM RESMI DESIGN SYSTEM) */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        {visibleDayGroups.map((day) => (
          <div
            key={day.dateStr}
            className="group relative rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-teal-500/40 hover:shadow-sm transition-all overflow-hidden"
          >
            {/* Siluet Vektor Arsitektur Candi Bentar / Pura Bali sebagai Watermark Halus */}
            <svg
              className="w-28 h-28 sm:w-36 sm:h-36 text-slate-100/90 group-hover:text-teal-900/[0.04] absolute -right-3 -bottom-4 pointer-events-none select-none transition-transform group-hover:scale-105 duration-300"
              viewBox="0 0 64 64"
              fill="currentColor"
              aria-hidden="true"
            >
              {/* Tingkat atap dan candi */}
              <path d="M12 56h40v3H12z" />
              <path d="M16 50h32v4H16z" />
              <path d="M20 42h24v6H20z" />
              <path d="M24 34h16v6H24z" />
              <path d="M27 26h10v6H27z" />
              <path d="M29 18h6v6h-6z" />
              <path d="M31 10h2v6h-2z" />
              <path d="M32 4l-2 4h4z" />
              {/* Sayap candi bentar kiri & kanan */}
              <path d="M8 56V38l6-6v24H8z" />
              <path d="M56 56V38l-6-6v24h6z" />
            </svg>

            {/* Konten Kartu Piodalan */}
            <div className="relative z-10 flex flex-col justify-between min-h-[110px] sm:min-h-[120px] space-y-4">
              {/* Baris Atas: Tanggal, Wewaran, Hari Raya, dan Kotak Counter */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-1">
                  {/* Eyebrow Label Sesuai Standar AGENTS.md */}
                  <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest block">
                    AGENDA PIODALAN
                  </span>

                  {/* Judul Tanggal Utama Masehi */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
                      {day.formattedDate}
                    </h4>

                    {/* Pill Hari Raya (Purnama/Tilem/Rahinan) */}
                    {day.hariRaya && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold tracking-wide">
                        {day.hariRaya}
                      </span>
                    )}
                  </div>

                  {/* Subtitle Wewaran & Sasih Penanggalan Bali */}
                  <p className="text-xs sm:text-sm font-semibold text-slate-600 flex items-center gap-2 flex-wrap">
                    <span className="text-teal-800 font-bold">{day.wewaran}</span>
                    {day.sasih && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Sasih {day.sasih}
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* Kotak Metrik Jumlah Pura Kanan (Stat Counter Box AGENTS.md 4.3) */}
                <div className="hidden sm:flex bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl px-4 py-2 text-center min-w-[110px] shrink-0 flex-col justify-center">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    TOTAL PURA
                  </span>
                  <span className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                    {day.totalPura}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    lokasi perayaan
                  </span>
                </div>
              </div>

              {/* Baris Bawah: Dua Tombol Aksi Baku (List Pura & Detail Tanggal) */}
              <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap pt-1">
                {/* Tombol 1: List Pura (Membuka Level 2 - Primary Button AGENTS.md 4.4) */}
                <button
                  type="button"
                  onClick={() => onOpenPuraList(day)}
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
                >
                  <Landmark className="w-4 h-4 text-white shrink-0" />
                  <span>List Pura ({day.totalPura})</span>
                </button>

                {/* Tombol 2: Detail Tanggal (Membuka Wariga 15 Dimensi - Secondary Button AGENTS.md 4.4) */}
                <button
                  type="button"
                  onClick={() => onOpenDayWariga(day.dateStr)}
                  className="h-10 sm:h-11 px-4 sm:px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
                >
                  <CalendarDays className="w-4 h-4 text-[#0e9f90] shrink-0" />
                  <span>Detail Tanggal</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* C. TOMBOL PAGINASI BERTAHAP ('TAMPILKAN LAINNYA')                     */}
      {/* ==================================================================== */}
      {remainingCount > 0 && (
        <div className="pt-2 text-center">
          <button
            type="button"
            onClick={handleLoadMore}
            className="w-full sm:w-auto h-11 px-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer shadow-2xs inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
          >
            <Sparkles className="w-4 h-4 text-[#0e9f90]" />
            <span>Tampilkan {Math.min(remainingCount, LOAD_MORE_STEP)} agenda lainnya</span>
            <span className="text-slate-400 text-xs font-semibold tabular-nums">
              ({remainingCount} tersisa)
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
