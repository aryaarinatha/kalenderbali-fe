import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Sparkles,
  ArrowRight,
  Landmark,
  MapPin,
  ExternalLink,
  Phone,
  Calendar,
  Clock,
  User,
  Info,
} from 'lucide-react';
import type {
  PiodalanScheduleItem,
  PiodalanModalActiveSection,
} from '../types/piodalan.types';
import { useDayWariga, usePuraCeremonies } from '../hooks/usePiodalan';
import {
  calculateIngkel,
  calculateNeptu,
  calculateZodiak,
  WARIGA_FALLBACK_VALUES,
} from '@/features/otonan/utils/warigaUtils';
import { WarigaExplanationModal } from '@/features/otonan/components/WarigaExplanationModal';
import { getPuraTypeBadgeStyle } from '../utils/piodalanUtils';


/**
 * ==============================================================================
 * KOMPONEN: PiodalanDetailModal (Modal Dialog Pop-up 2 Section)
 * ==============================================================================
 * Modal dialog terpadu yang memiliki 2 Section utama:
 *
 * 1. SECTION 1: 'Detail Wariga' (Sesuai Gambar 1 & 2):
 *    - Menampilkan tabel 15 dimensi penanggalan Wariga Bali lengkap:
 *      * Tahun Saka dan Sasih (Ekawara & Dwiwara)
 *      * Pengalantaka (Triwara & Caturwara)
 *      * Wewaran (Pancawara s.d. Dasawara, Wuku, Ingkel, Jejepan, Lintang)
 *      * Elemen Lainnya (Panca Sudha, Pangarasan, Rakam, Neptu, Zodiak, Pratiti)
 *    - Baris bertanda panah (→) dapat diklik untuk membuka penjelasan filosofisnya.
 *
 * 2. SECTION 2: 'Detail Pura & Acara':
 *    - Profil Pura (Kategori, Alamat, Tombol Google Maps, Telepon)
 *    - Rangkaian Acara & Jam:
 *      * Jika kontributor sudah mengisi: menampilkan susunan acara (Melasti, Puncak, dll).
 *      * Jika belum diisi kontributor: menampilkan Empty State santun & informatif.
 *
 * Menerapkan standar AGENTS.md:
 * - createPortal ke document.body (z-[100])
 * - Backdrop blur dengan tombol Escape listener
 * - Header gradient halus dengan tombol tutup X
 * ==============================================================================
 */

interface PiodalanDetailModalProps {
  /** Status apakah modal sedang terbuka */
  isOpen: boolean;

  /** Callback ketika modal ditutup */
  onClose: () => void;

  /** Data jadwal piodalan yang dipilih */
  schedule: PiodalanScheduleItem | null;

  /** Section awal yang ingin dibuka ('wariga' atau 'pura') */
  initialSection?: PiodalanModalActiveSection;
}

interface WarigaRowData {
  label: string;
  value: string | number;
  hasArrow?: boolean;
  categoryCode?: string;
  categoryName?: string;
}

export const PiodalanDetailModal: React.FC<PiodalanDetailModalProps> = ({
  isOpen,
  onClose,
  schedule,
  initialSection = 'pura',
}) => {
  // State Section yang sedang aktif di dalam modal (Tab 1: Wariga vs Tab 2: Pura)
  const [activeSection, setActiveSection] = useState<PiodalanModalActiveSection>(initialSection);

  // State sub-modal penjelasan makna wariga (saat panah → diklik)
  const [explanationTarget, setExplanationTarget] = useState<{
    categoryCode: string;
    categoryName: string;
    itemName: string;
  } | null>(null);

  // Selaraskan activeSection ketika initialSection dari luar berganti
  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection, isOpen]);

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

  // 1. Query data penanggalan harian kalender Go untuk Section 1 (Detail Wariga)
  const { data: dayWariga } = useDayWariga(schedule?.dateStr);

  // 2. Query susunan acara kontributor untuk Section 2 (Detail Pura & Acara)
  const { data: ceremoniesData } = usePuraCeremonies(schedule?.puraId);

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
    { label: 'Pengalantaka', value: p?.pengalantaka || p?.status || 'Pangelong' },
    { label: 'Angka Pengalantaka', value: p?.penanggal_1 ?? p?.angka ?? 9 },
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
        {/* HEADER MODAL: JUDUL, TANGGAL & TOMBOL TUTUP X                     */}
        {/* ================================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#0e9f90] rounded-full inline-block" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                Informasi Piodalan
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              {schedule.puraName}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-semibold">
              {schedule.dayName}, {schedule.formattedDate} ·{' '}
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
        {/* SWITCHER SECTION: TAB 1 (DETAIL WARIGA) VS TAB 2 (DETAIL PURA)     */}
        {/* ================================================================== */}
        <div className="px-5 sm:px-6 pt-3 pb-2 border-b border-slate-100 bg-white shrink-0">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1">
            {/* Tab Section 1: Detail Wariga */}
            <button
              type="button"
              onClick={() => setActiveSection('wariga')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                activeSection === 'wariga'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-[#0e9f90]" />
              <span>Detail Wariga</span>
            </button>

            {/* Tab Section 2: Detail Pura & Rangkaian Acara */}
            <button
              type="button"
              onClick={() => setActiveSection('pura')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer inline-flex items-center justify-center gap-2 ${
                activeSection === 'pura'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4 text-[#0e9f90]" />
              <span>Detail Pura & Acara</span>
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* BODY MODAL: KONTEN BERGANTIAN SESUAI SECTION AKTIF                 */}
        {/* ================================================================== */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1: DETAIL WARIGA LENGKAP (PERSIS STANDAR KALENDER BALI)  */}
          {/* ---------------------------------------------------------------- */}
          {activeSection === 'wariga' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Petunjuk Interaktif Baris Panah */}
              <div className="p-3 bg-teal-50/60 border border-teal-200/50 rounded-xl flex items-center gap-2.5 text-xs text-teal-800">
                <Info className="w-4 h-4 shrink-0 text-teal-600" />
                <p>
                  Klik baris bertanda panah (<span className="font-bold text-teal-700">→</span>) untuk
                  membaca penjelasan filosofis dan makna watak elemen wariga.
                </p>
              </div>

              {/* Kotak Kontainer Tabel Wariga Terpadu (Standar Otonan & Kalender Bali) */}
              <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl overflow-hidden text-left shadow-2xs">
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
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2: DETAIL PURA & RANGKAIAN ACARA (KONTRIBUSI KONTRIBUTOR) */}
          {/* ---------------------------------------------------------------- */}
          {activeSection === 'pura' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Kartu Profil Pura */}
              <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                      Kategori Pura
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-md font-bold text-xs inline-block ${getPuraTypeBadgeStyle(
                        schedule.puraType
                      )}`}
                    >
                      {schedule.puraType || 'Kahyangan Jagat'}
                    </span>
                  </div>

                  {/* Tautan Google Maps jika tersedia */}
                  {schedule.mapUrl && (
                    <a
                      href={schedule.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-teal-500/40 text-xs font-bold text-slate-700 hover:text-teal-700 transition-all shadow-2xs"
                    >
                      <span>Buka di Peta</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Alamat Lengkap */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Alamat Lengkap
                  </span>
                  <div className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{schedule.fullAddress}</span>
                  </div>
                </div>

                {/* Kontak Pengempon jika ada */}
                {schedule.phone && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Kontak Pengelola
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{schedule.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Rangkaian Acara Piodalan & Jam Pelaksanaan */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                    Rangkaian Acara Piodalan
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Data Kontributor
                  </span>
                </div>

                {/* KONDISI A: Kontributor SUDAH menginput rangkaian acara */}
                {ceremoniesData?.hasContributedData && ceremoniesData.acaras.length > 0 ? (
                  <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 divide-y divide-slate-100 overflow-hidden">
                    {ceremoniesData.acaras.map((acara, idx) => (
                      <div key={acara.id || idx} className="p-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-bold text-[#0f172a]">{acara.name}</h5>
                          {acara.ceremony_level && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200/70 text-slate-700">
                              {acara.ceremony_level}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                          <span className="flex items-center gap-1 text-teal-700 font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {acara.event_at}
                          </span>
                          {acara.pic_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              PIC: {acara.pic_name} {acara.pic_phone ? `(${acara.pic_phone})` : ''}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* KONDISI B: Kontributor BELUM menginput (Empty State Jujur & Santun) */
                  <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <h5 className="text-xs sm:text-sm font-bold text-slate-700">
                      Rangkaian acara belum tersedia
                    </h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                      Waktu pelaksanaan spesifik dan susunan tahapan upacara belum diunggah oleh pengelola atau kontributor pura ini.
                    </p>
                    <div className="pt-1">
                      <span className="text-[11px] text-slate-400 font-medium block">
                        Pelaksanaan puncak piodalan umumnya berlangsung pukul 08.00 s.d. 22.00 WITA mengikuti dresta desa setempat.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER MODAL: TOMBOL TUTUP                                         */}
        {/* ================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer [touch-action:manipulation]"
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
