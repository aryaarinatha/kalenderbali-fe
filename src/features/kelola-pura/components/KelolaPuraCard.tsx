import React from 'react';
import {
  MapPin,
  Calendar,
  CalendarDays,
  Coins,
  ArrowRight,
} from 'lucide-react';
import type { PuraBackendItem } from '../types/kelolaPura.types';
import { getObservationSummary, formatPuraLocation } from '../utils/kelolaPuraUtils';

/**
 * ==============================================================================
 * PROPS: KelolaPuraCard
 * ==============================================================================
 * Menampung entitas data pura dan callback navigasi interaktif:
 * - pura: objek data pura dari database PostgreSQL backend Go
 * - onOpenDetail: callback membuka modal popup rincian lengkap pura
 * - onViewPiodalan: callback beralih ke sub-halaman jadwal piodalan & susunan acara
 * - onViewKeuangan: callback beralih ke sub-halaman transparansi kas pura
 */
interface KelolaPuraCardProps {
  pura: PuraBackendItem;
  onOpenDetail: (pura: PuraBackendItem) => void;
  onViewPiodalan: (puraId: number) => void;
  onViewKeuangan: (puraId: number) => void;
}

/**
 * Memetakan klasifikasi tipe pura ke kelas Tailwind warna lencana semantik:
 * - Kahyangan Jagat: Teal Tirta Bali (#0e9f90)
 * - Kahyangan Tiga: Emerald Green
 * - Kawitan: Violet Purple
 * - Swagina: Sky Blue
 * - Suka Duka: Surya Amber Gold
 */
function getPuraBadgeClass(type?: string): string {
  const normalized = (type || '').trim().toLowerCase();

  switch (normalized) {
    case 'kahyangan jagat':
      return 'bg-[#e6f7f5] text-[#0f766e] border border-teal-200/70';
    case 'kahyangan tiga':
      return 'bg-[#f0fdf4] text-[#15803d] border border-emerald-200/70';
    case 'kawitan':
      return 'bg-[#ede9fe] text-[#6d28d9] border border-violet-200/70';
    case 'swagina':
      return 'bg-sky-50 text-sky-800 border border-sky-200/70';
    case 'suka duka':
      return 'bg-amber-50 text-amber-800 border border-amber-200/70';
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
  }
}

/**
 * ==============================================================================
 * KOMPONEN: KelolaPuraCard (Kartu Entitas Pura Sesuai Gaya Visual Gambar 2)
 * ==============================================================================
 * Mengadopsi arsitektur visual elegan dari Kartu Keterangan (Gambar 2):
 * 1. Bagian Atas:
 *    - Sisi Kiri: Ikon tematik w-11 h-11 dengan latar warna lembut semantik.
 *    - Sisi Kanan: Lencana (Pill Badge) klasifikasi tipe pura bertekstur halus.
 * 2. Bagian Tengah:
 *    - Judul H3: Nama pura tegas dengan efek hover Teal (#0d9488).
 *    - Lokasi: Alamat fisik & kabupaten dengan ikon MapPin.
 *    - Penanggalan Piodalan: Informasi wuku/sasih dengan ikon Calendar.
 * 3. Bagian Bawah:
 *    - Sisi Kiri: Teks aksi terpadu "Lihat Detail →" (memicu modal popup).
 *    - Sisi Kanan: Dua pintasan ringkas tombol aksi "Piodalan" dan "Keuangan".
 * ==============================================================================
 */
export const KelolaPuraCard: React.FC<KelolaPuraCardProps> = ({
  pura,
  onOpenDetail,
  onViewPiodalan,
  onViewKeuangan,
}) => {
  // Ambil gaya lencana klasifikasi pura sesuai tema semantik
  const badgeClass = getPuraBadgeClass(pura.type);

  // Format teks ringkasan penanggalan piodalan (Wuku / Sasih)
  const observationSummary = getObservationSummary(pura);

  // Format teks lokasi (alamat jalan, kabupaten, provinsi/negara jika di luar Bali)
  const locationText = formatPuraLocation(pura);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Kartu Pura: ${pura.name}`}
      onClick={() => onOpenDetail(pura)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenDetail(pura);
        }
      }}
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-teal-500/40 hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between select-none [touch-action:manipulation] relative overflow-hidden"
    >
      {/* ==================================================================== */}
      {/* 1. BAGIAN ATAS: NAMA PURA & LENCANA KLASIFIKASI (SEJAJAR SATU BARIS) */}
      {/* ==================================================================== */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          {/* Nama Pura (H3) */}
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight group-hover:text-[#0d9488] transition-colors line-clamp-1 flex-1">
            {pura.name}
          </h3>

          {/* Lencana (Pill Badge) Klasifikasi Tipe Pura */}
          <span
            className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs tabular-nums shrink-0 ${badgeClass}`}
          >
            {pura.type || 'Pura Umum'}
          </span>
        </div>

        {/* ================================================================== */}
        {/* 2. BAGIAN TENGAH: LOKASI & PENANGGALAN PIODALAN                   */}
        {/* ================================================================== */}
        {/* Baris Alamat Fisik & Kabupaten / Provinsi / Negara */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
          <span className="line-clamp-1" title={locationText}>
            {locationText}
          </span>
        </div>

        {/* Baris Dasar Penanggalan Piodalan */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mt-2">
          <Calendar className="w-3.5 h-3.5 text-[#0e9f90] shrink-0" aria-hidden="true" />
          <span className="line-clamp-1 text-slate-700 font-semibold" title={observationSummary}>
            {observationSummary}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. BAGIAN BAWAH: AKSI LIHAT DETAIL & PINTASAN PIODALAN/KEUANGAN       */}
      {/* ==================================================================== */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Sisi Kiri: Aksi 'Lihat Detail →' (Identik Gaya Visual Gambar 2) */}
        <div className="flex items-center gap-1 text-xs font-bold text-slate-400 group-hover:text-[#0d9488] transition-colors">
          <span>Lihat Detail</span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
            aria-hidden="true"
          />
        </div>

        {/* Sisi Kanan: Dua Tombol Pintasan Cepat (Piodalan & Keuangan) */}
        <div
          className="flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Tombol Pintasan Piodalan */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewPiodalan(pura.id);
            }}
            title={`Buka jadwal piodalan & acara ${pura.name}`}
            aria-label={`Buka piodalan ${pura.name}`}
            className="h-8 px-2.5 rounded-lg text-xs font-bold text-teal-800 bg-[#e6f7f5] hover:bg-[#ccf0ea] border border-teal-200/70 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <CalendarDays className="w-3.5 h-3.5 text-[#0e9f90] shrink-0" aria-hidden="true" />
            <span>Piodalan</span>
          </button>

          {/* Tombol Pintasan Keuangan */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewKeuangan(pura.id);
            }}
            title={`Buka laporan kas ${pura.name}`}
            aria-label={`Buka keuangan ${pura.name}`}
            className="h-8 px-2.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/70 inline-flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
            <span>Keuangan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
