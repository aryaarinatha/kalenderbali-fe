import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, ArrowRight } from 'lucide-react';
import { fetchDayWariga } from '../api/warigaPersonalApi';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';
import { WarigaExplanationModal } from '@/features/otonan/components/WarigaExplanationModal';
import type { IdentitasKelahiran } from '../types/warigaPersonal.types';

/**
 * ============================================================================
 * KOMPONEN: WarigaTanggalLahirModal
 * ============================================================================
 * Modal dialog pop-up yang menyajikan rincian lengkap 18 dimensi penanggalan
 * Wariga Bali untuk tanggal kelahiran pengguna (Paritas 100% sistem lama):
 *  1. Tahun Saka dan Sasih
 *  2. Pengalantaka & Angka Pengalantaka
 *  3. Wewaran (1-10 siklus, Wuku, Ingkel, Jejepan, Lintang)
 *  4. Elemen Lainnya (Panca Sudha, Pangarasan, Rakam, Watek Madya/Alit, Neptu,
 *     Eka Jala Rsi, Zodiak, Pratiti)
 *
 * Setiap baris yang memiliki ikon panah (→) dapat diklik untuk membuka sub-modal
 * penjelasan makna filosofis budaya (WarigaExplanationModal).
 * ============================================================================
 */

interface WarigaTanggalLahirModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthDate: string; // "YYYY-MM-DD"
  identitasKelahiran?: IdentitasKelahiran | null;
}

interface WarigaRowItem {
  label: string;
  value: string | number;
  hasArrow?: boolean;
  categoryCode?: string;
  categoryName?: string;
}

export const WarigaTanggalLahirModal: React.FC<WarigaTanggalLahirModalProps> = ({
  isOpen,
  onClose,
  birthDate,
  identitasKelahiran,
}) => {
  // State sub-modal uraian makna nilai elemen yang diklik (Gambar 2 & 3)
  const [selectedExplanation, setSelectedExplanation] = useState<{
    categoryCode: string;
    categoryName: string;
    itemName: string;
  } | null>(null);

  // Aksesibilitas: listener tombol Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedExplanation) return; // Jika sub-modal buka, biarkan sub-modal menangani Escape
      if (e.key === 'Escape') onClose();
    },
    [onClose, selectedExplanation]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Fetch 18 dimensi wariga kalender untuk tanggal kelahiran dari endpoint /api/v1/kalender
  const { data: dayData, isLoading: isDayLoading, refetch } = useQuery({
    queryKey: ['kalender', 'day-wariga-lengkap', birthDate],
    queryFn: () => fetchDayWariga(birthDate),
    enabled: isOpen && Boolean(birthDate),
    staleTime: 0, // Selalu ambil data teranyar saat modal dibuka
    refetchOnMount: 'always',
  });

  // Re-fetch saat modal dibuka untuk memastikan data 12 elemen terisi segar
  useEffect(() => {
    if (isOpen && birthDate) {
      refetch();
    }
  }, [isOpen, birthDate, refetch]);

  if (!isOpen) return null;

  // Resolusi data wewaran, sasih, & pengalantaka dari respons backend Go
  const w = dayData?.wewaran;
  const sasih = dayData?.sasih;
  const pengalantaka = dayData?.pengalantaka;
  const wl = identitasKelahiran?.wariga_lengkap;

  // Format kapitalisasi nama sasih (contoh: "sadha" -> "Sadha")
  const rawSasih = sasih?.nama_sasih || sasih?.nama;
  const namaSasihFormatted = rawSasih
    ? rawSasih.charAt(0).toUpperCase() + rawSasih.slice(1)
    : '-';

  // 1. Seksi Tahun Saka dan Sasih (Paritas baris 1-2 sistem lama)
  const sectionTahunSakaSasih: WarigaRowItem[] = [
    { label: 'Tahun Saka', value: sasih?.tahun_saka || '-' },
    { label: 'Sasih', value: namaSasihFormatted },
  ];

  // 2. Seksi Pengalantaka (Paritas baris 3-4 sistem lama)
  const sectionPengalantaka: WarigaRowItem[] = [
    { label: 'Pengalantaka', value: pengalantaka?.pengalantaka || '-' },
    { label: 'Angka Pengalantaka', value: pengalantaka?.penanggal_1 ?? (pengalantaka?.angka_pengalantaka ?? '-') },
  ];

  // 3. Seksi Wewaran (Paritas baris 5-18 sistem lama)
  const sectionWewaran: WarigaRowItem[] = [
    { label: 'Ekawara', value: w?.ekawara?.nama || '-' },
    { label: 'Dwiwara', value: w?.dwiwara?.nama || '-' },
    { label: 'Triwara', value: w?.triwara?.nama || '-' },
    { label: 'Caturwara', value: w?.caturwara?.nama || '-' },
    {
      label: 'Pancawara',
      value: w?.pancawara?.nama || identitasKelahiran?.wewaran?.pancawara || '-',
      hasArrow: true,
      categoryCode: 'pancawara',
      categoryName: 'Pancawara',
    },
    { label: 'Sadwara', value: w?.sadwara?.nama || '-' },
    {
      label: 'Saptawara',
      value: w?.saptawara?.nama || identitasKelahiran?.wewaran?.saptawara || '-',
      hasArrow: true,
      categoryCode: 'saptawara',
      categoryName: 'Saptawara',
    },
    { label: 'Astawara', value: w?.astawara?.nama || '-' },
    { label: 'Sangawara', value: w?.sangawara?.nama || '-' },
    { label: 'Dasawara', value: w?.dasawara?.nama || '-' },
    {
      label: 'Wuku',
      value: w?.wuku?.nama || identitasKelahiran?.wewaran?.wuku || '-',
      hasArrow: true,
      categoryCode: 'wuku',
      categoryName: 'Wuku',
    },
    {
      label: 'Ingkel',
      value: w?.ingkel?.nama || wl?.ingkel?.nama || '-',
      hasArrow: true,
      categoryCode: 'ingkel',
      categoryName: 'Ingkel',
    },
    {
      label: 'Jejepan',
      value: w?.jejepan?.nama || wl?.jejepan?.nama || '-',
      hasArrow: true,
      categoryCode: 'jejepan',
      categoryName: 'Jejepan',
    },
    {
      label: 'Lintang',
      value: w?.lintang?.nama || wl?.lintang?.nama || '-',
      hasArrow: true,
      categoryCode: 'lintang',
      categoryName: 'Lintang',
    },
  ];

  // 4. Seksi Elemen Lainnya (Paritas baris 19-27 sistem lama)
  const sectionElemenLainnya: WarigaRowItem[] = [
    {
      label: 'Panca Sudha',
      value: w?.panca_sudha?.nama || wl?.panca_sudha?.nama || '-',
      hasArrow: true,
      categoryCode: 'panca_sudha',
      categoryName: 'Panca Sudha',
    },
    {
      label: 'Pangarasan',
      value: w?.pangarasan?.nama || wl?.pangarasan?.nama || '-',
      hasArrow: true,
      categoryCode: 'pangarasan',
      categoryName: 'Pangarasan',
    },
    {
      label: 'Rakam',
      value: w?.rakam?.nama || wl?.rakam?.nama || '-',
      hasArrow: true,
      categoryCode: 'rakam',
      categoryName: 'Rakam',
    },
    {
      label: 'Watek Madya',
      value: w?.watek_madya?.nama || wl?.watek_madya?.nama || '-',
      hasArrow: true,
      categoryCode: 'watek_madya',
      categoryName: 'Watek Madya',
    },
    {
      label: 'Watek Alit',
      value: w?.watek_alit?.nama || wl?.watek_alit?.nama || '-',
      hasArrow: true,
      categoryCode: 'watek_alit',
      categoryName: 'Watek Alit',
    },
    {
      label: 'Neptu',
      value: w?.neptu ?? wl?.neptu ?? ((w?.saptawara?.urip || 0) + (w?.pancawara?.urip || 0) || identitasKelahiran?.total_urip_kelahiran || '-'),
    },
    {
      label: 'Eka Jala Rsi',
      value: w?.eka_jala_rsi?.nama || wl?.eka_jala_rsi?.nama || '-',
      hasArrow: true,
      categoryCode: 'eka_jala_rsi',
      categoryName: 'Eka Jala Rsi',
    },
    {
      label: 'Zodiak',
      value: w?.zodiak?.nama || wl?.zodiak?.nama || dayData?.zodiak?.nama || '-',
      hasArrow: true,
      categoryCode: 'zodiak',
      categoryName: 'Zodiak',
    },
    {
      label: 'Pratiti',
      value: w?.pratiti?.nama || wl?.pratiti?.nama || '-',
      hasArrow: true,
      categoryCode: 'pratiti',
      categoryName: 'Pratiti',
    },
  ];

  const isLoading = isDayLoading && !identitasKelahiran?.wariga_lengkap;

  const renderSectionTable = (title: string, rows: WarigaRowItem[]) => (
    <div className="space-y-1.5">
      <div className="px-3.5 py-1.5 bg-sky-50 text-sky-800 font-extrabold text-xs rounded-lg select-none">
        {title}
      </div>
      <div className="divide-y divide-slate-100 bg-white">
        {rows.map((row, idx) => (
          <div
            key={idx}
            onClick={() => {
              if (row.hasArrow && row.categoryCode && row.value && row.value !== '-') {
                setSelectedExplanation({
                  categoryCode: row.categoryCode,
                  categoryName: row.categoryName || row.label,
                  itemName: String(row.value),
                });
              }
            }}
            className={`flex items-center justify-between px-3.5 py-2 text-xs transition-colors ${
              row.hasArrow && row.value !== '-'
                ? 'hover:bg-slate-50 cursor-pointer group'
                : ''
            }`}
          >
            <span className="text-slate-500 font-medium">{row.label}</span>
            <div className="flex items-center gap-2">
              <span className="text-[#0f172a] font-semibold">{row.value}</span>
              {row.hasArrow && row.value !== '-' && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest block">
              15 Dimensi Penanggalan
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
              Wariga Tanggal Lahir
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {formatFullIndoDate(birthDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela wariga kelahiran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-24 bg-slate-100 rounded-xl" />
              <div className="h-32 bg-slate-100 rounded-xl" />
              <div className="h-40 bg-slate-100 rounded-xl" />
            </div>
          ) : (
            <>
              {renderSectionTable('Tahun Saka dan Sasih', sectionTahunSakaSasih)}
              {renderSectionTable('Pengalantaka', sectionPengalantaka)}
              {renderSectionTable('Wewaran', sectionWewaran)}
              {renderSectionTable('Elemen Lainnya', sectionElemenLainnya)}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Sub-Modal Penjelasan Makna Filosofis Wariga Saat Panah (→) Diklik */}
      {selectedExplanation && (
        <WarigaExplanationModal
          isOpen={Boolean(selectedExplanation)}
          onClose={() => setSelectedExplanation(null)}
          categoryCode={selectedExplanation.categoryCode}
          categoryName={selectedExplanation.categoryName}
          itemName={selectedExplanation.itemName}
        />
      )}
    </div>,
    document.body
  );
};

