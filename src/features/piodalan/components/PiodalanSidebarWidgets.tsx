import React from 'react';
import { Calendar } from 'lucide-react';
import type {
  PiodalanScheduleItem,
  PiodalanFilterParams,
  PiodalanModalActiveSection,
} from '../types/piodalan.types';
import { INDO_MONTHS_LONG } from '../utils/piodalanUtils';

/**
 * ==============================================================================
 * KOMPONEN: PiodalanSidebarWidgets (Tiga Widget Sidebar Kanan)
 * ==============================================================================
 * Komponen penyatu 3 widget samping kanan (~1/3 lebar layar di desktop):
 * 1. Widget 1: 'Piodalan terdekat'
 *    - Menampilkan kotak tanggal tebal, nama pura, lokasi, dan baris jam WITA
 *    - Tombol aksi primer dark slate (#2d3e3a): 'Lihat detail piodalan'
 * 2. Widget 2: 'Ringkasan pencarian'
 *    - Menampilkan rekapitulasi nilai filter yang sedang aktif
 *    - Tombol 'Ubah' untuk memfokuskan kembali input form
 *    - Indikator hijau jumlah jadwal ditemukan
 * 3. Widget 3: 'Memahami hasil'
 *    - Tiga butir edukasi budaya bertanda nomor bulat (1, 2, !)
 *    - Tombol 'Baca panduan penanggalan'
 * ==============================================================================
 */

interface PiodalanSidebarWidgetsProps {
  /** Jadwal piodalan paling dekat dari hari ini */
  upcomingPiodalan: PiodalanScheduleItem | null;

  /** Parameter filter pencarian yang sedang aktif */
  filter: PiodalanFilterParams;

  /** Jumlah total jadwal piodalan yang ditemukan */
  totalCount: number;

  /** Callback untuk membuka modal 2-section piodalan */
  onOpenScheduleDetail: (item: PiodalanScheduleItem, section: PiodalanModalActiveSection) => void;

  /** Callback untuk menggulir/fokus kembali ke form pencarian */
  onFocusSearchForm?: () => void;

  /** Callback untuk membuka modal panduan penanggalan wariga */
  onOpenGuideModal: () => void;
}

export const PiodalanSidebarWidgets: React.FC<PiodalanSidebarWidgetsProps> = ({
  upcomingPiodalan,
  filter,
  totalCount,
  onOpenScheduleDetail,
  onFocusSearchForm,
  onOpenGuideModal,
}) => {
  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 1. WIDGET 1: PIODALAN TERDEKAT                                       */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight">
            Piodalan terdekat
          </h3>
          {upcomingPiodalan && (
            <span className="text-xs font-bold text-[#0d9488] uppercase tracking-wider">
              {upcomingPiodalan.dateBadge.day} {upcomingPiodalan.dateBadge.month}
            </span>
          )}
        </div>

        {/* Konten Kartu Piodalan Terdekat */}
        {upcomingPiodalan ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3.5">
              {/* Kotak Tanggal Mint Subtle */}
              <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 text-center min-w-[70px] sm:min-w-[76px] shrink-0 shadow-2xs">
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums leading-none block">
                  {upcomingPiodalan.dateBadge.day}
                </span>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#0d9488] block mt-1">
                  {upcomingPiodalan.dateBadge.month}
                </span>
              </div>

              {/* Rincian Pura & Lokasi */}
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-sm sm:text-base font-extrabold text-[#0f172a] truncate">
                  {upcomingPiodalan.puraName}
                </h4>
                <p className="text-xs text-slate-500 font-medium truncate">
                  {upcomingPiodalan.location}
                </p>
                {/* Waktu Pelaksanaan / Jam Upacara */}
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  {upcomingPiodalan.timeString
                    ? `${upcomingPiodalan.dayName} · ${upcomingPiodalan.timeString}`
                    : `${upcomingPiodalan.dayName} · Waktu belum ditentukan`}
                </p>
              </div>
            </div>

            {/* Tombol Primer Dark Slate (Sesuai Desain Mockup) */}
            <button
              type="button"
              onClick={() => onOpenScheduleDetail(upcomingPiodalan, 'pura')}
              className="w-full h-11 rounded-xl bg-[#2d3e3a] hover:bg-[#23322f] active:bg-[#1a2623] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 [touch-action:manipulation]"
            >
              <span>Lihat detail piodalan</span>
            </button>
          </div>
        ) : (
          /* Placeholder jika belum ada data piodalan */
          <div className="text-center py-5 space-y-2 text-slate-400">
            <Calendar className="w-8 h-8 mx-auto text-slate-300" />
            <p className="text-xs font-medium">Belum ada jadwal piodalan terdekat.</p>
          </div>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 2. WIDGET 2: RINGKASAN PENCARIAN                                    */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Widget dengan Tombol Ubah */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight">
            Ringkasan pencarian
          </h3>
          <button
            type="button"
            onClick={onFocusSearchForm}
            className="text-xs font-bold text-slate-500 hover:text-teal-700 transition-colors cursor-pointer"
          >
            Ubah
          </button>
        </div>

        {/* Tabel Pasangan Key-Value Ringkasan Filter */}
        <div className="space-y-2.5 text-xs">
          {filter.tab === 'wewaran' && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Saptawara</span>
                <span className="text-slate-800 font-bold">{filter.saptawara || 'Buda'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Pancawara</span>
                <span className="text-slate-800 font-bold">{filter.pancawara || 'Wage'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Wuku</span>
                <span className="text-slate-800 font-bold">{filter.wuku || 'Klawu'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Tahun</span>
                <span className="text-slate-800 font-bold tabular-nums">{filter.tahun}</span>
              </div>
            </>
          )}

          {filter.tab === 'bulan' && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Metode</span>
                <span className="text-slate-800 font-bold">Pencarian Bulan</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Bulan</span>
                <span className="text-slate-800 font-bold">
                  {filter.bulan ? INDO_MONTHS_LONG[Number(filter.bulan) - 1] : '-'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Tahun</span>
                <span className="text-slate-800 font-bold tabular-nums">{filter.tahun}</span>
              </div>
            </>
          )}

          {filter.tab === 'pura' && (
            <>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Metode</span>
                <span className="text-slate-800 font-bold">Nama Pura</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Kata Kunci</span>
                <span className="text-slate-800 font-bold truncate max-w-[150px]">
                  {filter.namaPura || 'Semua Pura'}
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100/80">
                <span className="text-slate-400 font-medium">Tahun</span>
                <span className="text-slate-800 font-bold tabular-nums">{filter.tahun}</span>
              </div>
            </>
          )}
        </div>

        {/* Indikator Status Hasil */}
        <p className="text-xs font-bold text-emerald-600 pt-1">
          {totalCount} jadwal ditemukan
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 3. WIDGET 3: MEMAHAMI HASIL (PANDUAN PENANGGALAN BUDAYA)              */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Widget */}
        <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight">
          Memahami hasil
        </h3>

        {/* Tiga Butir Edukasi dengan Nomor/Simbol Bulat */}
        <div className="space-y-3.5">
          {/* Poin 1: Siklus Pawukon */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200/60">
              1
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">
                Tanggal mengikuti siklus Pawukon.
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Siklus berulang setiap 210 hari.
              </p>
            </div>
          </div>

          {/* Poin 2: Tradisi Setempat */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-teal-50 text-teal-700 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-teal-200/60">
              2
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">
                Konfirmasi tradisi setempat.
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Pelaksanaan dapat berbeda antar desa pekraman.
              </p>
            </div>
          </div>

          {/* Poin 3: Panduan Awal */}
          <div className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-amber-200/60">
              !
            </span>
            <div className="space-y-0.5">
              <h4 className="text-xs sm:text-sm font-bold text-[#0f172a]">
                Gunakan sebagai panduan awal.
              </h4>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                Hubungi pengempon pura bila diperlukan.
              </p>
            </div>
          </div>
        </div>

        {/* Tombol Mint Subtle: Baca Panduan Penanggalan */}
        <button
          type="button"
          onClick={onOpenGuideModal}
          className="w-full py-2.5 rounded-xl bg-[#e6f7f5] hover:bg-[#d6f2ed] active:bg-[#ccede6] text-[#0f766e] font-bold text-xs transition-colors cursor-pointer text-center block [touch-action:manipulation]"
        >
          <span>Baca panduan penanggalan</span>
        </button>
      </div>
    </div>
  );
};
