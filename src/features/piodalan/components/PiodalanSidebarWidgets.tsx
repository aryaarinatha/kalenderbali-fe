import React from 'react';
import { Calendar } from 'lucide-react';
import type { PiodalanScheduleItem } from '../types/piodalan.types';

/**
 * ==============================================================================
 * PROPS: PiodalanSidebarWidgets
 * ==============================================================================
 * Antarmuka properti untuk widget samping fitur piodalan.
 */
interface PiodalanSidebarWidgetsProps {
  /** Jadwal piodalan paling dekat dari hari ini (zona waktu WITA) */
  upcomingPiodalan: PiodalanScheduleItem | null;

  /** Callback untuk membuka rincian piodalan pura & susunan acara (Level 3 - Modal Pura) */
  onOpenUpcomingDetail: (item: PiodalanScheduleItem) => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanSidebarWidgets (Widget Samping Piodalan Terdekat)
 * ==============================================================================
 * Menyajikan widget ringkas 'Piodalan terdekat' di sisi samping:
 * - Menampilkan kotak tanggal mint subtle, nama pura, lokasi, dan baris waktu WITA.
 * - Tombol aksi primer Teal Tirta Bali (#0e9f90): 'Lihat detail piodalan'
 *   yang langsung membuka rincian pura & susunan rangkaian acara pada modal utama.
 *
 * Catatan Pembaruan (Sesuai Permintaan Pengguna):
 * - Kartu 'Ringkasan pencarian' dan 'Memahami hasil' telah DIHAPUS agar tampilan
 *   halaman lebih bersih, proporsional, dan terfokus pada konten inti piodalan.
 * ==============================================================================
 */
export const PiodalanSidebarWidgets: React.FC<PiodalanSidebarWidgetsProps> = ({
  upcomingPiodalan,
  onOpenUpcomingDetail,
}) => {
  return (
    <div className="space-y-6 sticky top-24">
      {/* ==================================================================== */}
      {/* WIDGET: PIODALAN TERDEKAT                                            */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Widget */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight">
            Piodalan terdekat
          </h3>
          {upcomingPiodalan && (
            <span className="text-xs font-bold text-[#0d9488] uppercase tracking-wider tabular-nums">
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

            {/* Tombol Primer Sesuai Standar AGENTS.md 4.4 */}
            <button
              type="button"
              onClick={() => onOpenUpcomingDetail(upcomingPiodalan)}
              className="w-full h-11 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center gap-2 [touch-action:manipulation]"
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
    </div>
  );
};
