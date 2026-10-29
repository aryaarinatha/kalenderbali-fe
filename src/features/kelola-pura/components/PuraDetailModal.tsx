import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Phone,
  ExternalLink,
  Calendar,
  Compass,
  CalendarDays,
  Coins,
  Globe,
  Info,
} from 'lucide-react';
import type { PuraBackendItem } from '../types/kelolaPura.types';
import {
  getPuraTypeBadgeStyle,
  getObservationSummary,
  getPuraBenchmarkDisplay,
  getPuraBenchmarkBadgeStyle,
} from '../utils/kelolaPuraUtils';

/**
 * ==============================================================================
 * PROPS: PuraDetailModal
 * ==============================================================================
 * Mengendalikan status dialog pop-up modal dan data pura yang sedang ditinjau:
 * - isOpen: boolean penanda apakah modal sedang ditampilkan
 * - pura: objek data master pura dari PostgreSQL (atau null jika belum dipilih)
 * - onClose: callback ketika modal ditutup (melalui klik backdrop, tombol X, atau tombol Tutup)
 * - onViewPiodalan: navigasi cepat ke tampilan piodalan & susunan acara pura tersebut
 * - onViewKeuangan: navigasi cepat ke tampilan laporan keuangan kas pura tersebut
 */
interface PuraDetailModalProps {
  isOpen: boolean;
  pura: PuraBackendItem | null;
  onClose: () => void;
  onViewPiodalan: (puraId: number) => void;
  onViewKeuangan: (puraId: number) => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PuraDetailModal (Dialog Pop-up Rincian Profil Pura)
 * ==============================================================================
 * Memodernisasi modal rincian pura dari sistem warisan lama dengan standar AGENTS.md:
 * 1. createPortal ke document.body (z-[100]) untuk menjamin modal selalu berada di atas.
 * 2. Backdrop blur halus dengan penguncian scroll layar (body scroll lock).
 * 3. Penutupan ramah pengguna melalui tombol ESC keyboard dan klik area luar.
 * 4. Header bergradien dengan badge tipe semantik dan chip ID resmi database.
 * 5. Dua section utama:
 *    - Section 1: Lokasi, Alamat, Wilayah Administratif, dan Kontak Penanggungjawab.
 *    - Section 2: Dasar Penanggalan Piodalan (Observasi Pawukon & Sasih) dan Urip.
 * 6. Quick Action Footer: Akses 1-klik menuju tab Piodalan atau tab Keuangan.
 * ==============================================================================
 */
export const PuraDetailModal: React.FC<PuraDetailModalProps> = ({
  isOpen,
  pura,
  onClose,
  onViewPiodalan,
  onViewKeuangan,
}) => {
  // ============================================================================
  // 1. MANAJEMEN EVENT KEYBOARD (ESC) & PENGUNCIAN SCROLL BODY
  // ============================================================================
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  // Jika modal ditutup atau data pura belum ada, render null (tidak ada node DOM)
  if (!isOpen || !pura) return null;

  // Dapatkan konfigurasi warna tipe pura semantik
  const badgeStyle = getPuraTypeBadgeStyle(pura.type);
  const observationSummary = getObservationSummary(pura);

  // Status dan sistem acuan penanggalan piodalan pura
  const hasPiodalan = Boolean(pura.wuku || pura.sasih || pura.purnama_tilem);
  const benchmarkDisplay = getPuraBenchmarkDisplay(pura);
  const benchmarkStyle = getPuraBenchmarkBadgeStyle(pura);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-pura-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* ==================================================================== */}
      {/* BACKDROP GELAP DENGAN EFEK BLUR HALUS                                 */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* ==================================================================== */}
      {/* KARTU DIALOG UTAMA MODAL                                              */}
      {/* ==================================================================== */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* ================================================================== */}
        {/* HEADER MODAL: GRADIEN TEAL & TOMBOL TUTUP                          */}
        {/* ================================================================== */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-emerald-50/50 p-5 sm:p-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              {/* Lencana Tipe Pura */}
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle.container}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`}
                    aria-hidden="true"
                  />
                  <span>{pura.type || 'Pura Umum'}</span>
                </span>
              </div>

              {/* Judul Nama Pura */}
              <h2
                id="modal-pura-title"
                className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight"
              >
                {pura.name}
              </h2>

              {/* Ringkasan Penanggalan Piodalan Pura */}
              <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                <span>{observationSummary}</span>
              </div>
            </div>

            {/* Tombol Tutup X */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup dialog rincian pura"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* KONTEN BODY MODAL (SCROLLABLE JIKA KONTEN PANJANG)                  */}
        {/* ================================================================== */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* ---------------------------------------------------------------- */}
          {/* SECTION 1: LOKASI & KONTAK ADMINISTRATIF                         */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <MapPin className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
              <span>Lokasi & Kontak Wilayah</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              {/* Alamat Fisik / Banjar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-slate-500 font-medium">Alamat Fisik / Banjar:</span>
                <span className="text-slate-900 font-semibold sm:text-right">
                  {pura.address || 'Belum diatur'}
                </span>
              </div>

              {/* Kabupaten / Kota */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                <span className="text-slate-500 font-medium">Kabupaten / Kota:</span>
                <span className="text-slate-900 font-semibold sm:text-right">
                  {pura.city || '—'}
                </span>
              </div>

              {/* Provinsi & Negara */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                <span className="text-slate-500 font-medium">Provinsi & Negara:</span>
                <span className="text-slate-900 font-semibold sm:text-right">
                  {pura.province
                    ? `${pura.province}, ${pura.country || 'Indonesia'}`
                    : pura.country && pura.country.toLowerCase() !== 'indonesia'
                      ? pura.country
                      : 'Bali, Indonesia'}
                </span>
              </div>

              {/* Kontak Telepon Penanggung Jawab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                <span className="text-slate-500 font-medium">Nomor Telepon Kontak:</span>
                {pura.phone ? (
                  <a
                    href={`tel:${pura.phone}`}
                    className="inline-flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold"
                  >
                    <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{pura.phone}</span>
                  </a>
                ) : (
                  <span className="text-slate-400 font-medium">Belum tersedia</span>
                )}
              </div>

              {/* Tautan Lokasi Peta Google Maps */}
              {pura.location_url && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-200/60 pt-3">
                  <span className="text-slate-500 font-medium text-xs">Peta Digital:</span>
                  <a
                    href={pura.location_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-teal-800 border border-teal-200 hover:bg-teal-50 transition-colors shadow-2xs"
                  >
                    <Globe className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                    <span>Buka Titik di Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* SECTION 2: DASAR PENANGGALAN PIODALAN (WARIGA BALI)              */}
          {/* ---------------------------------------------------------------- */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <Calendar className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
              <span>Dasar Penanggalan Piodalan</span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3">
              {/* Sistem Acuan Penentuan Piodalan (Pawukon 210 Hari vs Sasih Candra) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <span className="text-slate-500 font-medium">Sistem Penanggalan Piodalan:</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${benchmarkStyle.container}`}
                >
                  <Compass className={`w-3.5 h-3.5 ${benchmarkStyle.iconColor}`} aria-hidden="true" />
                  <span>{benchmarkDisplay}</span>
                </span>
              </div>

              {/* Rincian Elemen Pawukon: Wuku, Saptawara, Pancawara */}
              {pura.wuku && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                    <span className="text-slate-500 font-medium">Siklus Wuku:</span>
                    <span className="text-slate-900 font-semibold">Wuku {pura.wuku}</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                    <span className="text-slate-500 font-medium">Saptawara & Pancawara:</span>
                    <span className="text-slate-900 font-semibold">
                      {[pura.saptawara, pura.pancawara].filter(Boolean).join(' ') || '—'}
                    </span>
                  </div>
                </>
              )}

              {/* Rincian Elemen Sasih: Sasih, Purnama/Tilem */}
              {(pura.sasih || pura.purnama_tilem) && (
                <>
                  {pura.sasih && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                      <span className="text-slate-500 font-medium">Bulan Sasih:</span>
                      <span className="text-slate-900 font-semibold">{pura.sasih}</span>
                    </div>
                  )}

                  {pura.purnama_tilem && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs border-t border-slate-200/60 pt-2.5">
                      <span className="text-slate-500 font-medium">Fase Candra:</span>
                      <span className="text-slate-900 font-semibold">
                        {pura.purnama_tilem}
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Kotak Informasi Ramah jika Piodalan Belum Dikonfigurasi */}
              {!hasPiodalan && (
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-800">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-amber-900">Jadwal Piodalan Belum Tercatat</p>
                    <p className="text-amber-700/90 leading-relaxed">
                      Pengurus pura belum mencatat penanggalan piodalan resmi (Pawukon maupun Sasih) untuk pura ini.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER MODAL: AKSI TERPADU (TUTUP, PIODALAN, KEUANGAN)             */}
        {/* ================================================================== */}
        <div className="bg-slate-50/80 p-4 sm:p-5 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Tombol Tutup Sisi Kiri */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            Tutup
          </button>

          {/* Tombol Cepat Aksi Sisi Kanan: Piodalan & Keuangan */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
            {/* Navigasi Cepat: Buka Piodalan */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewPiodalan(pura.id);
              }}
              aria-label={`Buka jadwal piodalan ${pura.name}`}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/80 hover:bg-teal-100 hover:border-teal-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <CalendarDays className="w-4 h-4 text-teal-600 shrink-0" aria-hidden="true" />
              <span>Jadwal Piodalan & Acara</span>
            </button>

            {/* Navigasi Cepat: Buka Keuangan */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewKeuangan(pura.id);
              }}
              aria-label={`Buka transparansi kas ${pura.name}`}
              className="w-full sm:w-auto min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 hover:border-amber-300 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <Coins className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
              <span>Transparansi Kas Pura</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
