import React from 'react';
import { CalendarPlus, Info } from 'lucide-react';
import type { OtonanResponseData, OtonanHasilItem } from '../types/otonan.types';
import {
  formatIndoDate,
  getCountdownDays,
  downloadOtonanICS,
  getIndoDayName,
} from '../utils/otonanUtils';

/**
 * ============================================================================
 * KOMPONEN: OtonanResultSection (Daftar Kartu Detail Otonan Full-Width)
 * ============================================================================
 * Komponen ini menyajikan hasil perhitungan otonan secara memanjang (full-width)
 * dan menampilkan 2 kartu detail otonan (misal: otonan pertama dan kedua):
 *  - Setiap kartu memuat tanggal Masehi besar, countdown hari, nomor siklus otonan,
 *    4 elemen wewaran (Saptawara, Pancawara, Wuku, Sasih), tombol tambah kalender (.ics),
 *    dan tombol "Detail" pembuka modal rincian Wariga.
 * ============================================================================
 */

interface OtonanResultSectionProps {
  /** Data hasil perhitungan otonan dari backend Go */
  data: OtonanResponseData;

  /** Callback untuk membuka modal dialog detail wariga dengan tanggal spesifik */
  onOpenDetailModal: (dateStr: string) => void;
}

export const OtonanResultSection: React.FC<OtonanResultSectionProps> = ({
  data,
  onOpenDetailModal,
}) => {
  const normalized = data.input_dinormalisasi;
  const birthElements = normalized?.elemen;
  const otonanList: OtonanHasilItem[] = data.hasil || [];

  /** Menangani unduhan berkas .ics untuk jadwal otonan spesifik */
  const handleAddToCalendar = (item: OtonanHasilItem) => {
    const saptawara = item.detail_elemen?.saptawara || birthElements?.saptawara || 'Redite';
    const pancawara = item.detail_elemen?.pancawara || birthElements?.pancawara || 'Umanis';
    const wuku = item.detail_elemen?.wuku || birthElements?.wuku || 'Sinta';
    const sasih = item.detail_elemen?.sasih || 'Kalima';

    downloadOtonanICS({
      tanggal: item.tanggal,
      perayaanKe: item.perayaan_ke,
      saptawara,
      pancawara,
      wuku,
      sasih,
    });
  };

  return (
    <div className="space-y-6 w-full">
      {otonanList.map((item, index) => {
        const isFirst = index === 0;

        // Label Eyebrow kartu otonan
        const eyebrowLabel =
          otonanList.length === 1
            ? `TANGGAL OTONAN`
            : isFirst
              ? `TANGGAL OTONAN PERTAMA`
              : `TANGGAL OTONAN KEDUA`;

        const dayName = getIndoDayName(item.tanggal);
        const countdown = getCountdownDays(item.tanggal);
        const formattedDate = formatIndoDate(item.tanggal, { format: 'long' });

        const saptawaraName =
          item.detail_elemen?.saptawara || birthElements?.saptawara || 'Redite';
        const pancawaraName =
          item.detail_elemen?.pancawara || birthElements?.pancawara || 'Umanis';
        const wukuName =
          item.detail_elemen?.wuku || birthElements?.wuku || 'Sinta';
        const sasihName = item.detail_elemen?.sasih || 'Kalima';

        return (
          <div
            key={`${item.tanggal}-${item.perayaan_ke}`}
            className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden transition-all w-full"
          >
            {/* Baris Atas: Heading Tanggal Besar & Badge Siklus ke-N */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Sisi Kiri: Tanggal Besar */}
              <div>
                <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest block mb-1.5">
                  {eyebrowLabel}
                </span>
                <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
                  {formattedDate}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 tabular-nums">
                  {dayName} · {countdown.text}
                </p>
              </div>

              {/* Sisi Kanan: Stat Counter Box Siklus ke-N (Sesuai AGENTS.md Bab 4.3) */}
              <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-4 text-center min-w-[125px] shrink-0 self-start sm:self-auto">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  SIKLUS KE
                </span>
                <span className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                  {item.perayaan_ke}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  sejak tanggal lahir
                </span>
              </div>
            </div>

            {/* Baris Tengah: 4 Pilar Wariga Semantik (Sesuai AGENTS.md Bab 3.C) */}
            <div className="border-t border-slate-100 pt-5 mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Kolom 1: Saptawara (Mint Teal) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  SAPTAWARA
                </span>
                <span className="inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60">
                  {saptawaraName}
                </span>
              </div>

              {/* Kolom 2: Pancawara (Emerald Green) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  PANCAWARA
                </span>
                <span className="inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60">
                  {pancawaraName}
                </span>
              </div>

              {/* Kolom 3: Wuku (Violet Purple) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  WUKU
                </span>
                <span className="inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60">
                  {wukuName}
                </span>
              </div>

              {/* Kolom 4: Sasih (Amber Gold) */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  SASIH
                </span>
                <span className="inline-flex items-center text-xs sm:text-sm font-bold px-3 py-1.5 rounded-lg bg-[#fffbeb] text-[#b45309] border border-amber-200/60">
                  {sasihName}
                </span>
              </div>
            </div>

            {/* Baris Bawah: Tombol Aksi (Sesuai AGENTS.md Bab 4.4) */}
            <div className="border-t border-slate-100 pt-5 mt-6 flex flex-wrap items-center gap-3">
              {/* Tombol 1: Tambahkan ke Kalender (.ics) */}
              <button
                type="button"
                onClick={() => handleAddToCalendar(item)}
                className="h-11 px-5 rounded-xl bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Tambahkan ke kalender</span>
              </button>

              {/* Tombol 2: Detail Wariga (Secondary Button Standar) */}
              <button
                type="button"
                onClick={() => onOpenDetailModal(item.tanggal)}
                className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 shadow-2xs active:scale-98 [touch-action:manipulation]"
              >
                <Info className="w-4 h-4 text-slate-500" />
                <span>Detail</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
