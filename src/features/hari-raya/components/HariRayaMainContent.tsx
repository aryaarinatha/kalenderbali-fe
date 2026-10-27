import React from 'react';
import { ChevronRight, Calendar } from 'lucide-react';
import type {
  HariRayaCardItem,
  HariRayaViewMode,
} from '../types/hariRaya.types';
import {
  capitalize,
  NAMA_BULAN_INDO,
} from '../utils/hariRayaUtils';
import { getHariRayaBadgeStyle } from '../../kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: HariRayaMainContent (Kolom Kiri Utama)
 * ============================================================================
 * Komponen ini menyajikan dua blok utama pada kolom kiri (65-70% lebar layar):
 *  1. Grid Kartu Hari Raya Bulan Ini (atau Tahunan jika viewMode = 'tahunan')
 *     - Header seksi: Judul, subteks jumlah perayaan, dan pill badge jumlah (8 RAHINA).
 *     - Matriks kartu 2 kolom dengan kotak tanggal berwarna semantik konsisten
 *       dengan halaman Kalender Bali (getHariRayaBadgeStyle), nama hari Masehi,
 *       dan nama perayaan hari raya tanpa label kategori maupun penanda border oranye.
 *  2. Seksi Edukasi "Makna & Panduan"
 *     - 3 kartu edukatif ringkas (Purnama, Tilem, Kajeng Kliwon) dengan tombol
 *       "Pelajari selengkapnya →" yang memicu modal dialog rincian filosofis.
 * ============================================================================
 */

interface HariRayaMainContentProps {
  cards: HariRayaCardItem[];
  viewMode: HariRayaViewMode;
  activeMonth: number;
  activeYear: number;
  onSelectCard: (card: HariRayaCardItem) => void;
  yearGroupedCards?: Map<number, HariRayaCardItem[]>;
}

export const HariRayaMainContent: React.FC<HariRayaMainContentProps> = ({
  cards,
  viewMode,
  activeMonth,
  activeYear,
  onSelectCard,
}) => {
  const monthName = NAMA_BULAN_INDO[activeMonth - 1] || 'Bulan';

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* SEKSI 1: Grid Kartu Hari Raya                                     */}
      {/* ================================================================= */}
      <section aria-labelledby="section-hari-raya-title">
        {/* Header Seksi: Judul, Subteks, dan Pill Badge Jumlah */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2
              id="section-hari-raya-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight"
            >
              Hari Raya Bulan Ini
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>
                <strong className="font-bold text-slate-900 tabular-nums">{cards.length}</strong>{' '}
                <span className="font-medium text-slate-700">Rahina</span>{' '}
                <span className="text-slate-400">pada</span>{' '}
                <strong className="font-semibold text-slate-800">{monthName} {activeYear}</strong>
              </span>
            </p>
          </div>

          {/* Pill Badge Jumlah Rahina di Sudut Kanan Atas */}
          <span className="bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60 font-extrabold text-[11px] sm:text-xs px-3 sm:px-3.5 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
            {cards.length} RAHINA
          </span>
        </div>

        {/* =============================================================== */}
        {/* KONTEN KARTU: GRID 2 KOLOM (KONSISTEN BULANAN & TAHUNAN)        */}
        {/* =============================================================== */}
        {cards.length === 0 ? (
          // Keadaan Kosong (Empty State) yang Ramah
          <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Tidak ada perayaan hari raya pada{' '}
              {viewMode === 'bulanan'
                ? `bulan ${monthName} ${activeYear}`
                : `tahun ${activeYear}`}
            </p>
            <p className="text-xs text-slate-400">
              Gunakan form pencarian di atas untuk berpindah ke periode lain atau mencari hari raya tertentu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cards.map((card) => {
              const badge = getHariRayaBadgeStyle(card.nama);
              const borderClass =
                badge.border === 'border-transparent'
                  ? 'border-teal-200/70'
                  : badge.border;

              return (
                <div
                  key={card.id}
                  onClick={() => onSelectCard(card)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 hover:border-teal-500/40 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99] [touch-action:manipulation]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Kotak Tanggal Kiri (Date Badge) Konsisten dengan Kalender Bali */}
                    <div
                      className={`rounded-xl p-2.5 text-center min-w-[56px] shrink-0 select-none border ${badge.bg} ${borderClass}`}
                    >
                      <span
                        className={`text-xl sm:text-2xl font-extrabold tabular-nums block leading-none ${badge.text}`}
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
                      <span className="text-xs font-semibold text-slate-500 block leading-tight">
                        {capitalize(card.dayName)}
                      </span>
                      <h3
                        className="text-sm sm:text-base font-bold text-[#0f172a] leading-snug truncate group-hover:text-teal-700 transition-colors"
                        title={card.nama}
                      >
                        {card.nama}
                      </h3>
                    </div>
                  </div>

                  {/* Icon Chevron Kanan */}
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
