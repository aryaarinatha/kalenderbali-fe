import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Info,
} from 'lucide-react';
import type {
  HariRayaCardItem,
  HariRayaMasterItem,
} from '../types/hariRaya.types';
import {
  capitalize,
  getCategoryPillStyles,
} from '../utils/hariRayaUtils';
import { getHariRayaBadgeStyle } from '../../kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: HariRayaSearchResults (Tampilan Hasil Pencarian Hari Raya)
 * ============================================================================
 * Komponen ini menyajikan tata letak khusus saat pengguna mencari hari raya
 * tertentu (holiday !== 'all'), selaras dengan referensi aplikasi Wargabal:
 *
 * 1. Kolom Kiri:
 *    - Kartu "Hasil Pencarian: [Nama Hari Raya]"
 *    - Daftar seluruh tanggal kejadian perayaan hari raya tersebut sepanjang
 *      tahun yang dipilih (misal: 19 Maret 2024 & 15 Oktober 2024)
 *    - Tombol "Detail" per kartu untuk membuka modal rincian pop-up
 *    - Tombol "Kembali" di bawah kartu untuk reset filter ke semua hari raya
 *
 * 2. Kolom Kanan:
 *    - Kartu "Informasi Hari Raya"
 *    - Subheader "TAHUN [Tahun]"
 *    - Highlight box bergradien lembut berisi uraian makna filosofis resmi
 *      dari lontar Sundarigama / data master Go backend, kategori perayaan,
 *      dan ornamen kultural khas Bali
 * ============================================================================
 */

interface HariRayaSearchResultsProps {
  holidayName: string;
  year: number;
  results: HariRayaCardItem[];
  masterItem?: HariRayaMasterItem | null;
  onSelectCard: (card: HariRayaCardItem) => void;
  onBack: () => void;
}

export const HariRayaSearchResults: React.FC<HariRayaSearchResultsProps> = ({
  holidayName,
  year,
  results,
  masterItem,
  onSelectCard,
  onBack,
}) => {
  // Ambil deskripsi dan kategori resmi dari master atau hasil kartu pertama
  const primaryCard = results[0];
  const displayName = masterItem?.nama || primaryCard?.nama || holidayName;
  const jenis = masterItem?.jenis || primaryCard?.jenis || 'hari_raya';
  const categoryTag = primaryCard?.categoryTag || 'Rahina';
  const categoryPillStyles = getCategoryPillStyles(categoryTag);

  const deskripsi =
    masterItem?.keterangan ||
    primaryCard?.keterangan ||
    'Hari suci ini dirayakan oleh umat Hindu di Bali untuk memohon kerahayuan, penyucian lahir dan batin, serta keharmonisan jagat raya sekala dan niskala.';


  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================= */}
        {/* KOLOM KIRI (7/12): Kartu Hasil Pencarian & Daftar Tanggal         */}
        {/* ================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header Kartu Kiri */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight truncate">
                  Hasil Pencarian: {displayName}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                  Daftar tanggal pelaksanaan pada tahun {year}
                </p>
              </div>

              {/* Badge Jumlah Kejadian */}
              <span className="bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60 font-extrabold text-[11px] sm:text-xs px-3 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
                {results.length} PERAYAAN
              </span>
            </div>

            {/* Daftar Kejadian Hari Raya (Grid/List) */}
            {results.length === 0 ? (
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-8 text-center space-y-2">
                <Info className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  Perayaan Tidak Ditemukan
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Tidak ada jadwal perayaan "{displayName}" yang tercatat pada tahun {year}.
                  Silakan periksa kembali nama perayaan atau coba tahun yang lain.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.map((card) => {
                  const badge = getHariRayaBadgeStyle(card.nama);
                  const borderClass =
                    badge.border === 'border-transparent'
                      ? 'border-teal-200/70'
                      : badge.border;

                  return (
                    <div
                      key={card.id}
                      onClick={() => onSelectCard(card)}
                      className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 hover:border-teal-500/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-4 group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Kotak Tanggal Semantik Konsisten */}
                        <div
                          className={`rounded-xl p-2.5 text-center min-w-[56px] shrink-0 select-none border ${badge.bg} ${borderClass}`}
                        >
                          <span
                            className={`text-xl font-extrabold tabular-nums block leading-none ${badge.text}`}
                          >
                            {card.dayNumber}
                          </span>
                          <span
                            className={`text-[10px] font-extrabold uppercase tracking-wider block mt-1 ${badge.text} opacity-80`}
                          >
                            {card.monthShort}
                          </span>
                        </div>

                        {/* Rincian Tengah: Hari dan Nama Hari Raya */}
                        <div className="min-w-0 space-y-1">
                          {card.dayName && (
                            <span className="text-xs font-semibold text-slate-500 block leading-tight">
                              {capitalize(card.dayName)}
                            </span>
                          )}
                          <h3
                            className="text-base font-bold text-[#0f172a] truncate group-hover:text-teal-700 transition-colors"
                            title={card.nama}
                          >
                            {card.nama}
                          </h3>
                        </div>
                      </div>

                      {/* Tombol Detail Ergonomis */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCard(card);
                        }}
                        className="h-9 px-3.5 rounded-xl border border-teal-200 bg-[#e6f7f5] hover:bg-[#d4f2ed] active:bg-[#c3ece5] text-[#0f766e] font-bold text-xs transition-all inline-flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs [touch-action:manipulation]"
                        title="Lihat detail lengkap perayaan ini"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tombol Kembali di Bawah Kartu Kiri Sesuai Referensi */}
          <div>
            <button
              type="button"
              onClick={onBack}
              className="h-11 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-sm shadow-2xs transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 select-none [touch-action:manipulation]"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500" />
              <span>Kembali</span>
            </button>
          </div>
        </div>

        {/* ================================================================= */}
        {/* KOLOM KANAN (5/12): Kartu Informasi Hari Raya (Makna Filosofis)  */}
        {/* ================================================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Header Kartu Kanan */}
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
                Informasi Hari Raya
              </h2>
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mt-0.5">
                TAHUN {year}
              </span>
            </div>

            {/* Highlight Box Bergradien Lembut dengan Motif Seni Kultural */}
            <div className="bg-gradient-to-br from-teal-50/90 via-[#f0fdf9] to-emerald-50/70 border border-teal-200/80 rounded-2xl p-5 sm:p-6 relative overflow-hidden space-y-3.5">
              {/* Ornamen Motif Bali Halus di Latar Belakang */}
              <div className="absolute -top-4 -right-4 w-32 h-32 pointer-events-none opacity-15">
                <svg viewBox="0 0 100 100" fill="none" className="w-full h-full text-teal-800">
                  <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="3" />
                  <circle
                    cx="50"
                    cy="50"
                    r="30"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <path
                    d="M50 8 C73 8 92 27 92 50 C92 73 73 92 50 92 C38 92 28 87 20 80 C34 77 44 65 44 50 C44 35 34 23 20 20 C28 13 38 8 50 8 Z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              {/* Pill Kategori dan Jenis */}
              <div className="flex items-center gap-2 flex-wrap relative z-10">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none ${categoryPillStyles}`}
                >
                  {categoryTag}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 capitalize">
                  {jenis.replace('_', ' ')}
                </span>
              </div>

              {/* Judul Besar Hari Raya */}
              <div className="relative z-10">
                <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                  {displayName}
                </h3>
              </div>

              {/* Uraian Makna Filosofis Lengkap */}
              <div className="pt-2 border-t border-teal-200/60 space-y-2 relative z-10">
                <span className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                  Makna Filosofis
                </span>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                  {deskripsi}
                </p>
              </div>

              {/* Ringkasan Frekuensi & Siklus */}
              <div className="pt-3 border-t border-teal-200/60 grid grid-cols-2 gap-2 text-xs relative z-10">
                <div className="bg-white/70 rounded-xl p-2.5 border border-teal-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Frekuensi
                  </span>
                  <span className="font-extrabold text-[#0f172a] text-sm tabular-nums">
                    {results.length}x setahun
                  </span>
                </div>
                <div className="bg-white/70 rounded-xl p-2.5 border border-teal-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                    Tahun Kalender
                  </span>
                  <span className="font-extrabold text-[#0f172a] text-sm tabular-nums">
                    {year} Masehi
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
