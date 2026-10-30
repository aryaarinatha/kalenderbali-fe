import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { PiodalanScheduleItem } from '../types/piodalan.types';
import { useDayWariga } from '../hooks/usePiodalan';
import {
  calculateIngkel,
  calculateNeptu,
  calculateZodiak,
  WARIGA_FALLBACK_VALUES,
} from '@/features/otonan/utils/warigaUtils';
import { WarigaExplanationModal } from '@/features/otonan/components/WarigaExplanationModal';

/**
 * ==============================================================================
 * PROPS: PiodalanDetailModal
 * ==============================================================================
 * Antarmuka properti untuk modal dialog rincian Wariga penanggalan Bali.
 */
interface PiodalanDetailModalProps {
  /** Status apakah modal sedang terbuka */
  isOpen: boolean;

  /** Callback ketika modal ditutup */
  onClose: () => void;

  /** Data jadwal piodalan / tanggal yang dipilih */
  schedule: PiodalanScheduleItem | null;
}

/** Tipe data baris tabel wariga */
interface WarigaRowData {
  label: string;
  value: string | number;
  hasArrow?: boolean;
  categoryCode?: string;
  categoryName?: string;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanDetailModal (Modal Dialog Rincian Wariga 15 Dimensi)
 * ==============================================================================
 * Sesuai Permintaan Pengguna:
 * - Bagian tab "Detail Pura & Acara" telah DIHAPUS dari modal ini karena sudah dipusatkan
 *   secara menyeluruh dan terpadu pada PiodalanPuraListModal (Level 3).
 * - Modal ini secara eksklusif berfokus menyajikan 15 dimensi penanggalan Wariga Bali
 *   lengkap (Wewaran Ekawara s.d. Dasawara, Pengalantaka, Elemen Lainnya, Neptu, Zodiak,
 *   Pratiti, dan Tahun Saka/Sasih).
 * - Baris bertanda panah (→) dapat diklik untuk membuka sub-modal penjelasan makna filosofisnya.
 *
 * Standar Desain AGENTS.md (Section 4.7):
 * - createPortal ke document.body (z-[100])
 * - Backdrop blur dengan tombol Escape listener
 * - Header gradient halus (from-teal-50/70 via-slate-50/40 to-emerald-50/40)
 * ==============================================================================
 */
export const PiodalanDetailModal: React.FC<PiodalanDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
}) => {
  // State sub-modal penjelasan makna wariga (saat panah → diklik)
  const [explanationTarget, setExplanationTarget] = useState<{
    categoryCode: string;
    categoryName: string;
    itemName: string;
  } | null>(null);

  // Listener tombol Escape untuk menutup modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (explanationTarget) return; // Jika sub-modal sedang terbuka, biarkan sub-modal yang menangani
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, explanationTarget]);

  // Query data penanggalan harian kalender Go untuk Detail Wariga 15 Dimensi
  const { data: dayWariga } = useDayWariga(schedule?.dateStr);

  if (!isOpen || !schedule) return null;

  // Ekstraksi nilai wewaran harian kalender
  const w = dayWariga?.wewaran;
  const s = dayWariga?.sasih;
  const p = dayWariga?.pengalantaka;

  const saptawaraName = w?.saptawara?.nama || schedule.rawPura?.saptawara || 'Redite';
  const pancawaraName = w?.pancawara?.nama || schedule.rawPura?.pancawara || 'Umanis';
  const wukuName = w?.wuku?.nama || schedule.rawPura?.wuku || 'Sinta';

  const calculatedIngkel = calculateIngkel(wukuName);
  const calculatedNeptu = calculateNeptu(saptawaraName, pancawaraName);
  const calculatedZodiak = calculateZodiak(schedule.dateStr);

  // --------------------------------------------------------------------------
  // DAFTAR BARIS TABEL WARIGA (SESUAI POLA STANDAR OTONAN & KALENDER BALI)
  // --------------------------------------------------------------------------
  const wewaranRows: WarigaRowData[] = [
    { label: 'Ekawara', value: w?.ekawara?.nama && w.ekawara.nama !== '-' ? w.ekawara.nama : 'Luang' },
    { label: 'Dwiwara', value: w?.dwiwara?.nama || 'Pepet' },
    { label: 'Triwara', value: w?.triwara?.nama || 'Beteng' },
    { label: 'Caturwara', value: w?.caturwara?.nama || 'Sri' },
    {
      label: 'Pancawara',
      value: pancawaraName,
      hasArrow: true,
      categoryCode: 'pancawara',
      categoryName: 'Pancawara',
    },
    { label: 'Sadwara', value: w?.sadwara?.nama || 'Was' },
    {
      label: 'Saptawara',
      value: saptawaraName,
      hasArrow: true,
      categoryCode: 'saptawara',
      categoryName: 'Saptawara',
    },
    { label: 'Astawara', value: w?.astawara?.nama || 'Sri' },
    { label: 'Sangawara', value: w?.sangawara?.nama || 'Jangur' },
    { label: 'Dasawara', value: w?.dasawara?.nama || 'Duka' },
  ];

  const elemenLainnyaRows: WarigaRowData[] = [
    {
      label: 'Wuku',
      value: wukuName,
      hasArrow: true,
      categoryCode: 'wuku',
      categoryName: 'Wuku',
    },
    {
      label: 'Ingkel',
      value: calculatedIngkel,
      hasArrow: true,
      categoryCode: 'ingkel',
      categoryName: 'Ingkel',
    },
    {
      label: 'Jejepan',
      value: WARIGA_FALLBACK_VALUES.jejepan,
      hasArrow: true,
      categoryCode: 'jejepan',
      categoryName: 'Jejepan',
    },
    {
      label: 'Lintang',
      value: WARIGA_FALLBACK_VALUES.lintang,
      hasArrow: true,
      categoryCode: 'lintang',
      categoryName: 'Lintang',
    },
    {
      label: 'Panca Sudha',
      value: WARIGA_FALLBACK_VALUES.panca_sudha,
      hasArrow: true,
      categoryCode: 'panca_sudha',
      categoryName: 'Panca Sudha',
    },
    {
      label: 'Pangarasan',
      value: WARIGA_FALLBACK_VALUES.pangarasan,
      hasArrow: true,
      categoryCode: 'pangarasan',
      categoryName: 'Pangarasan',
    },
    {
      label: 'Rakam',
      value: WARIGA_FALLBACK_VALUES.rakam,
      hasArrow: true,
      categoryCode: 'rakam',
      categoryName: 'Rakam',
    },
    {
      label: 'Watek Madya',
      value: WARIGA_FALLBACK_VALUES.watek_madya,
      hasArrow: true,
      categoryCode: 'watek_madya',
      categoryName: 'Watek Madya',
    },
    {
      label: 'Watek Alit',
      value: WARIGA_FALLBACK_VALUES.watek_alit,
      hasArrow: true,
      categoryCode: 'watek_alit',
      categoryName: 'Watek Alit',
    },
    { label: 'Neptu', value: calculatedNeptu },
    {
      label: 'Eka Jala Rsi',
      value: WARIGA_FALLBACK_VALUES.eka_jala_rsi,
      hasArrow: true,
      categoryCode: 'eka_jala_rsi',
      categoryName: 'Eka Jala Rsi',
    },
    {
      label: 'Zodiak',
      value: calculatedZodiak,
      hasArrow: true,
      categoryCode: 'zodiak',
      categoryName: 'Zodiak',
    },
    {
      label: 'Pratiti',
      value: WARIGA_FALLBACK_VALUES.pratiti,
      hasArrow: true,
      categoryCode: 'pratiti',
      categoryName: 'Pratiti',
    },
  ];

  const pengalantakaRows: WarigaRowData[] = [
    { label: 'Pengalantaka', value: p?.pengalantaka || 'Pangelong' },
    { label: 'Angka Pengalantaka', value: p?.penanggal_1 ?? 9 },
  ];

  const tahunSakaSasihRows: WarigaRowData[] = [
    { label: 'Tahun Saka', value: s?.tahun_saka || 1948 },
    {
      label: 'Sasih',
      value: s?.nama_sasih
        ? s.nama_sasih.charAt(0).toUpperCase() + s.nama_sasih.slice(1)
        : 'Kapat',
    },
  ];

  const renderSectionHeader = (title: string) => (
    <div className="bg-slate-100/80 px-5 py-2.5 border-y border-slate-200/70">
      <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
        {title}
      </span>
    </div>
  );

  const renderRow = (item: WarigaRowData) => {
    const isClickable = Boolean(item.hasArrow && item.categoryCode);

    return (
      <div
        key={item.label}
        onClick={() => {
          if (isClickable && item.categoryCode && item.categoryName) {
            setExplanationTarget({
              categoryCode: item.categoryCode,
              categoryName: item.categoryName,
              itemName: String(item.value),
            });
          }
        }}
        className={`flex items-center justify-between px-5 py-2.5 border-b border-slate-100 transition-colors ${
          isClickable
            ? 'cursor-pointer hover:bg-slate-50/90 group select-none'
            : 'hover:bg-white'
        }`}
      >
        <span className="text-xs text-slate-500 font-medium">{item.label}</span>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs sm:text-sm font-semibold tabular-nums ${
              isClickable
                ? 'text-[#0f172a] group-hover:text-[#0d9488] transition-colors'
                : 'text-slate-800'
            }`}
          >
            {item.value}
          </span>
          {item.hasArrow && (
            <div
              className="p-1 rounded-md text-[#0d9488] group-hover:bg-teal-50 transition-colors"
              title={`Buka penjelasan ${item.label}`}
            >
              <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </div>
          )}
        </div>
      </div>
    );
  };

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Blur Halus */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Wadah Dialog Modal Utama */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 max-h-[92vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================================================================== */}
        {/* HEADER MODAL: JUDUL TANGGAL, WEWARAN & TOMBOL TUTUP X             */}
        {/* ================================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#0e9f90] rounded-full inline-block" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                Detail Wariga & Penanggalan
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
              {schedule.formattedDate}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              {schedule.dayName} ·{' '}
              <span className="text-teal-700 font-bold">{schedule.penanggalan}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela modal"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================================== */}
        {/* BODY MODAL: TABEL 15 DIMENSI PENANGGALAN WARIGA LENGKAP            */}
        {/* ================================================================== */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Petunjuk Interaktif Baris Panah */}
          <div className="p-3 bg-teal-50/60 border border-teal-200/50 rounded-xl flex items-center gap-2.5 text-xs text-teal-800">
            <Info className="w-4 h-4 shrink-0 text-teal-600" />
            <span>
              Klik baris dengan tanda panah (<span className="font-bold">→</span>) untuk
              melihat penjelasan filosofis serta maknanya.
            </span>
          </div>

          {/* Kotak Kontainer Tabel Wariga */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 overflow-hidden shadow-2xs divide-y divide-slate-100">
            {/* 1. Kelompok Wewaran */}
            {renderSectionHeader('Wewaran (Siklus Hari)')}
            <div className="bg-white">{wewaranRows.map(renderRow)}</div>

            {/* 2. Kelompok Pengalantaka */}
            {renderSectionHeader('Pengalantaka (Siklus Bulan)')}
            <div className="bg-white">{pengalantakaRows.map(renderRow)}</div>

            {/* 3. Kelompok Elemen Lainnya */}
            {renderSectionHeader('Elemen Penanggalan Lainnya')}
            <div className="bg-white">{elemenLainnyaRows.map(renderRow)}</div>

            {/* 4. Kelompok Tahun Saka & Sasih */}
            {renderSectionHeader('Tahun Saka & Sasih')}
            <div className="bg-white">{tahunSakaSasihRows.map(renderRow)}</div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER MODAL: TOMBOL TUTUP UTAMA TEAL                             */}
        {/* ================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* SUB-MODAL PENJELASAN MAKNA ELEMEN WARIGA (SAAT BARIS PANAH DIKLIK)   */}
      {/* ==================================================================== */}
      {explanationTarget && (
        <WarigaExplanationModal
          isOpen={Boolean(explanationTarget)}
          onClose={() => setExplanationTarget(null)}
          categoryCode={explanationTarget.categoryCode}
          categoryName={explanationTarget.categoryName}
          itemName={explanationTarget.itemName}
        />
      )}
    </div>
  );

  return createPortal(modalNode, document.body);
};
