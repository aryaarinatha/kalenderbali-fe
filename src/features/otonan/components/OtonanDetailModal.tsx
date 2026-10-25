import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles, ArrowRight } from 'lucide-react';
import type { OtonanResponseData } from '../types/otonan.types';
import { fetchDayWariga } from '../api/otonanApi';
import { formatIndoDate, getIndoDayName } from '../utils/otonanUtils';
import {
  calculateIngkel,
  calculateNeptu,
  calculateZodiak,
  WARIGA_FALLBACK_VALUES,
} from '../utils/warigaUtils';
import { WarigaExplanationModal } from './WarigaExplanationModal';

/**
 * ============================================================================
 * KOMPONEN: OtonanDetailModal (Modal Dialog Detail Wariga)
 * ============================================================================
 * Modal dialog pop-up yang menyajikan rincian lengkap penanggalan Wariga Bali
 * untuk tanggal otonan yang dipilih:
 *  - Mengikuti pola desain sistem Kalender Bali (HariRayaDetailModal & ZodiacDetailModal):
 *     1. Header bergradasi lembut (teal-50 via slate-50 to emerald-50) dengan badge Sparkles
 *        dan tombol tutup (X).
 *     2. Judul tanggal besar (text-2xl sm:text-3xl font-extrabold text-[#0f172a]).
 *     3. Subtitle wewaran otonan dan nomor siklus kelahiran.
 *     4. Garis pembatas dekoratif dengan badge "RINCIAN WARIGA & PENANGGALAN".
 *     5. Kotak kontainer tabel Wariga berlatar #f8fafc.
 *     6. Baris dengan tanda panah (→) dapat diklik untuk membuka sub-modal penjelasan makna (Gambar 2).
 *     7. Footer tombol "Tutup" di pojok kanan bawah.
 *  - Efek blur menyeluruh dengan createPortal ke document.body (z-[100]).
 *  - Aksesibilitas keyboard (Escape) dan penanganan klik backdrop.
 * ============================================================================
 */

interface OtonanDetailModalProps {
  /** Menandai apakah modal dialog sedang terbuka */
  isOpen: boolean;

  /** Callback untuk menutup modal dialog */
  onClose: () => void;

  /** Tanggal otonan yang dipilih (format YYYY-MM-DD) */
  selectedDate?: string;

  /** Data hasil respon perhitungan otonan dari backend Go */
  data?: OtonanResponseData;
}

interface WarigaRowItem {
  label: string;
  value: string | number;
  hasArrow?: boolean;
  categoryCode?: string;
  categoryName?: string;
}

export const OtonanDetailModal: React.FC<OtonanDetailModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  data,
}) => {
  // State sub-modal uraian makna nilai elemen yang diklik (Gambar 2)
  const [selectedExplanation, setSelectedExplanation] = useState<{
    categoryCode: string;
    categoryName: string;
    itemName: string;
  } | null>(null);

  // -------------------------------------------------------------------------
  // 1. AKSESIBILITAS: LISTENER TOMBOL ESCAPE & KUNCI SCROLL
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jika sub-modal sedang terbuka, biarkan sub-modal yang menangani Escape
      if (selectedExplanation) return;

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
  }, [isOpen, onClose, selectedExplanation]);

  // -------------------------------------------------------------------------
  // 2. QUERY DATA KALENDER HARIAN DARI BACKEND GO
  // -------------------------------------------------------------------------
  const { data: dayData, isLoading } = useQuery({
    queryKey: ['kalender', 'day', selectedDate],
    queryFn: async () => {
      if (!selectedDate) return null;
      return await fetchDayWariga(selectedDate);
    },
    enabled: isOpen && Boolean(selectedDate),
    staleTime: 1000 * 60 * 60, // Cache fresh selama 1 jam
  });

  if (!isOpen) return null;

  // -------------------------------------------------------------------------
  // 3. RESOLUSI ELEMEN KALENDER & METADATA
  // -------------------------------------------------------------------------
  const birthElements = data?.input_dinormalisasi?.elemen;
  const currentOtonan = data?.hasil?.find((item) => item.tanggal === selectedDate);
  const w = dayData?.wewaran;
  const sasih = dayData?.sasih;
  const pengalantaka = dayData?.pengalantaka;

  const saptawaraName = w?.saptawara?.nama || birthElements?.saptawara || 'Redite';
  const pancawaraName = w?.pancawara?.nama || birthElements?.pancawara || 'Umanis';
  const wukuName = w?.wuku?.nama || birthElements?.wuku || 'Sinta';

  // Perhitungan dinamis / fallback budaya
  const calculatedIngkel = calculateIngkel(wukuName) || WARIGA_FALLBACK_VALUES.ingkel;
  const calculatedNeptu = calculateNeptu(saptawaraName, pancawaraName) || WARIGA_FALLBACK_VALUES.neptu;
  const calculatedZodiak = calculateZodiak(selectedDate) || WARIGA_FALLBACK_VALUES.zodiak;

  // Kapitalisasi nama Sasih
  const rawSasih = sasih?.nama_sasih || 'kasa';
  const formattedSasih = rawSasih.charAt(0).toUpperCase() + rawSasih.slice(1);

  // Label tanggal & hari
  const formattedDate = selectedDate
    ? formatIndoDate(selectedDate, { format: 'long' })
    : 'Tanggal Otonan';
  const dayName = selectedDate ? getIndoDayName(selectedDate) : 'Hari Otonan';

  // -------------------------------------------------------------------------
  // 4. SUSUNAN BARIS WARIGA PER SEKSI DENGAN METADATA KATEGORI
  // -------------------------------------------------------------------------
  const wewaranRows: WarigaRowItem[] = [
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

  const elemenLainnyaRows: WarigaRowItem[] = [
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

  const pengalantakaRows: WarigaRowItem[] = [
    { label: 'Tahun Saka', value: sasih?.tahun_saka || 1950 },
    { label: 'Sasih', value: formattedSasih },
  ];

  const tahunSakaSasihRows: WarigaRowItem[] = [
    { label: 'Pengalantaka', value: pengalantaka?.pengalantaka || 'Pangelong' },
    { label: 'Angka Pengalantaka', value: pengalantaka?.penanggal_1 ?? 9 },
  ];

  const renderSectionHeader = (title: string) => (
    <div className="bg-slate-100/80 px-5 py-2.5 border-y border-slate-200/70">
      <span className="text-[11px] sm:text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
        {title}
      </span>
    </div>
  );

  const renderRow = (item: WarigaRowItem) => {
    const isClickable = Boolean(item.hasArrow && item.categoryCode);

    return (
      <div
        key={item.label}
        onClick={() => {
          if (isClickable && item.categoryCode && item.categoryName) {
            setSelectedExplanation({
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

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur Menyeluruh ke Seluruh Halaman */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Modal Dialog (Melebar proporsional max-w-2xl) */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut Sesuai Hari Raya & Zodiac Modal */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 px-6 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-100/80 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              Detail Wariga
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela detail wariga"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          {/* Judul & Subtitle */}
          <div className="text-center space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
              {formattedDate}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              {dayName} · Otonan {saptawaraName} {pancawaraName} {wukuName}
              {currentOtonan ? ` (Siklus ke-${currentOtonan.perayaan_ke})` : ''}
            </p>
          </div>

          {/* Garis Pembatas Dekoratif */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Rincian Wariga & Penanggalan
            </span>
          </div>

          {/* Kotak Kontainer Tabel Wariga */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl overflow-hidden text-left shadow-2xs">
            {isLoading ? (
              <div className="p-6 space-y-3.5 animate-pulse">
                <div className="h-5 bg-slate-200 rounded w-1/4 mb-3" />
                {[1, 2, 3, 4, 5, 6].map((idx) => (
                  <div key={idx} className="flex justify-between py-2 border-b border-slate-100">
                    <div className="h-4 bg-slate-200 rounded w-28" />
                    <div className="h-4 bg-slate-200 rounded w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y-0">
                {/* Seksi 1: Wewaran */}
                {renderSectionHeader('Wewaran')}
                {wewaranRows.map(renderRow)}

                {/* Seksi 2: Elemen Lainnya */}
                {renderSectionHeader('Elemen Lainnya')}
                {elemenLainnyaRows.map(renderRow)}

                {/* Seksi 3: Pengalantaka */}
                {renderSectionHeader('Pengalantaka')}
                {pengalantakaRows.map(renderRow)}

                {/* Seksi 4: Tahun Saka dan Sasih */}
                {renderSectionHeader('Tahun Saka dan Sasih')}
                {tahunSakaSasihRows.map(renderRow)}
              </div>
            )}
          </div>
        </div>

        {/* Footer Tombol Tutup Sesuai Hari Raya & Zodiac Modal */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* 3. SUB-MODAL TINGKAT DUA: PENJELASAN MAKNA ELEMEN (GAMBAR 2) */}
      {selectedExplanation && (
        <WarigaExplanationModal
          isOpen={Boolean(selectedExplanation)}
          onClose={() => setSelectedExplanation(null)}
          categoryCode={selectedExplanation.categoryCode}
          categoryName={selectedExplanation.categoryName}
          itemName={selectedExplanation.itemName}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};
