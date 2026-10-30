import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  ExternalLink,
  Phone,
  Calendar,
  Clock,
  User,
  Info,
  Search,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  CalendarDays,
} from 'lucide-react';
import type {
  PiodalanDayGroup,
  PiodalanDayPuraItem,
  PiodalanAcaraItem,
} from '../types/piodalan.types';
import { usePuraCeremonies } from '../hooks/usePiodalan';
import { getPuraTypeBadgeStyle } from '../utils/piodalanUtils';

/**
 * ==============================================================================
 * PROPS: PiodalanPuraListModal
 * ==============================================================================
 * Antarmuka properti untuk modal dialog pop-up daftar pura & detail susunan acara.
 */
interface PiodalanPuraListModalProps {
  /** Status keterbukaan modal dialog */
  isOpen: boolean;

  /** Callback ketika modal ditutup */
  onClose: () => void;

  /** Data kelompok piodalan hari terpilih (Level 1) */
  dayGroup: PiodalanDayGroup | null;

  /** ID pura yang ingin langsung dibuka pada Level 3 (opsional, misal dari widget piodalan terdekat) */
  initialSelectedPuraId?: number | null;

  /** Callback jika pengguna ingin membuka Detail Wariga tanggal ini */
  onOpenDayWariga?: (dateStr: string) => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanPuraListModal (Modal Daftar Pura & Rincian Susunan Acara)
 * ==============================================================================
 * Mengakomodasi alur hierarki 3-level dengan kepatuhan penuh pada Design System:
 * 1. Level 1 (Kartu Utama di Halaman): Agenda piodalan per tanggal & wewaran
 * 2. Level 2 (Modal Layar 1): Daftar seluruh pura yang melaksanakan piodalan pada hari itu
 * 3. Level 3 (Modal Layar 2): Rincian piodalan pura tersebut beserta susunan tahapan acaranya
 *    (persis seperti pada bagian Jadwal Piodalan & Acara di fitur Kelola Pura).
 *
 * Catatan Navigasi (Sesuai Permintaan Pengguna):
 * - Tombol "Kembali ke Daftar Pura" hanya tersedia 1 di bagian FOOTER (bawah).
 * - Tombol di bagian header atas ditiadakan agar header tetap bersih dan konsisten.
 *
 * Standar Desain AGENTS.md (Section 4.7):
 * - createPortal ke document.body (z-[100])
 * - Backdrop: bg-slate-900/40 backdrop-blur-xs
 * - Header gradien lembut: from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100
 * - Palet Resmi: Teal Tirta Bali (#0e9f90), Mint Subtle (#e6f7f5), Slate (#0f172a, slate-600)
 * ==============================================================================
 */
export const PiodalanPuraListModal: React.FC<PiodalanPuraListModalProps> = ({
  isOpen,
  onClose,
  dayGroup,
  initialSelectedPuraId = null,
  onOpenDayWariga,
}) => {
  // Pura yang sedang dipilih untuk melihat rincian piodalan & susunan acaranya (Level 3)
  const [selectedPura, setSelectedPura] = useState<PiodalanDayPuraItem | null>(() => {
    if (initialSelectedPuraId && dayGroup?.puras) {
      return dayGroup.puras.find((p) => p.id === initialSelectedPuraId) || null;
    }
    return null;
  });

  // Kata kunci pencarian cepat dalam daftar pura pada hari tersebut
  const [searchPuraQuery, setSearchPuraQuery] = useState<string>('');

  // Sinkronisasi pilihan pura saat hari atau target awal pura berganti (pola resmi React tanpa cascading renders)
  const trackingKey = `${dayGroup?.dateStr}-${initialSelectedPuraId}`;
  const [prevTrackingKey, setPrevTrackingKey] = useState(trackingKey);
  if (prevTrackingKey !== trackingKey) {
    setPrevTrackingKey(trackingKey);
    if (initialSelectedPuraId && dayGroup?.puras) {
      const found = dayGroup.puras.find((p) => p.id === initialSelectedPuraId);
      setSelectedPura(found || null);
    } else {
      setSelectedPura(null);
    }
    setSearchPuraQuery('');
  }

  // Dukungan tombol keyboard Escape untuk menutup modal atau kembali ke Level 2
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedPura) {
          // Jika sedang di Level 3 (Detail Pura), Escape mengembalikan ke Level 2 (List Pura)
          setSelectedPura(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedPura, onClose]);

  // Kunci scrolling latar belakang saat modal aktif (AGENTS.md 4.7)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Filter daftar pura berdasarkan kata kunci pencarian (nama pura, tipe, atau kabupaten)
  const filteredPuras = useMemo(() => {
    if (!dayGroup || !Array.isArray(dayGroup.puras)) return [];
    const q = searchPuraQuery.trim().toLowerCase();
    if (!q) return dayGroup.puras;

    return dayGroup.puras.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
    );
  }, [dayGroup, searchPuraQuery]);

  // Ambil data pelaksanaan piodalan riil dan tahapan acara untuk pura yang dipilih di Level 3
  const { data: ceremoniesData, isLoading: isLoadingCeremonies } = usePuraCeremonies(
    selectedPura ? selectedPura.id : null,
    dayGroup?.dateStr
  );

  if (!isOpen || !dayGroup) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="piodalan-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overscroll-contain animate-in fade-in duration-150"
    >
      {/* 1. Backdrop Gelap Transparan dengan Efek Blur Halus (AGENTS.md 4.7) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Panel Modal Dialog */}
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 zoom-in-95 duration-150">
        {/* ================================================================== */}
        {/* HEADER MODAL: NAVIGASI HIERARKI (LEVEL 2 VS LEVEL 3)                */}
        {/* Sesuai Permintaan Pengguna: Tombol 'Kembali' di Header Ditiadakan  */}
        {/* Navigasi 'Kembali ke Daftar Pura' Ditempatkan Bersih di Footer     */}
        {/* ================================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0 text-[#0f172a]">
          <div className="space-y-1.5 min-w-0">
            {/* Eyebrow Label Konsisten */}
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#0e9f90] rounded-full inline-block" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                {selectedPura ? 'Rincian Pura & Susunan Acara' : 'Jadwal Piodalan Pura'}
              </span>
            </div>

            {/* Judul Utama Header */}
            <h3
              id="piodalan-modal-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight truncate"
            >
              {selectedPura
                ? selectedPura.name
                : 'Daftar Pura Melaksanakan Piodalan'}
            </h3>

            {/* Sub-deskripsi Tanggal & Penanggalan Wariga */}
            <p className="text-xs sm:text-sm text-slate-500 font-medium flex items-center gap-2 flex-wrap">
              <span className="text-slate-700 font-semibold">{dayGroup.formattedDate}</span>
              <span className="text-slate-300">·</span>
              <span className="font-bold text-teal-700">{dayGroup.wewaran}</span>
              {dayGroup.hariRaya && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
                    {dayGroup.hariRaya}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Tombol Aksi Kanan: Detail Wariga & Tombol Tutup (X) */}
          <div className="flex items-center gap-2 shrink-0">
            {onOpenDayWariga && (
              <button
                type="button"
                onClick={() => onOpenDayWariga(dayGroup.dateStr)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors cursor-pointer [touch-action:manipulation]"
                title="Lihat 15 dimensi penanggalan wariga hari ini"
              >
                <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
                <span>Detail Tanggal</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup jendela modal"
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ================================================================== */}
        {/* BODY MODAL: LEVEL 2 (LIST PURA) ATAU LEVEL 3 (DETAIL PURA & ACARA) */}
        {/* ================================================================== */}
        <div className="overflow-y-auto p-5 sm:p-7 flex-1 space-y-6">
          {/* ---------------------------------------------------------------- */}
          {/* LEVEL 2: DAFTAR PURA YANG MELAKSANAKAN PIODALAN PADA TANGGAL INI */}
          {/* ---------------------------------------------------------------- */}
          {!selectedPura && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Baris Pencarian & Rekapitulasi Jumlah Pura */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-[#0f172a]">
                    Pura Penyelenggara
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e6f7f5] border border-teal-200/60 text-teal-800 text-xs font-bold tabular-nums">
                    {dayGroup.totalPura} Pura
                  </span>
                </div>

                {/* Input Filter Cepat Nama Pura / Wilayah */}
                <div className="relative w-full sm:w-72">
                  <input
                    type="text"
                    value={searchPuraQuery}
                    onChange={(e) => setSearchPuraQuery(e.target.value)}
                    placeholder="Cari pura atau kabupaten..."
                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Grid Kartu Pura */}
              {filteredPuras.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Info className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Pura tidak ditemukan</p>
                  <p className="text-xs text-slate-400">
                    Tidak ada pura pada tanggal ini yang cocok dengan pencarian "{searchPuraQuery}".
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  {filteredPuras.map((pura) => {
                    const hasAcaras = Boolean(
                      pura.pelaksanaan_aktual?.acaras &&
                        pura.pelaksanaan_aktual.acaras.length > 0
                    );

                    return (
                      <div
                        key={pura.id}
                        onClick={() => setSelectedPura(pura)}
                        className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-white hover:bg-slate-50/80 hover:border-teal-500/40 transition-all cursor-pointer shadow-2xs group flex flex-col justify-between space-y-3 [touch-action:manipulation]"
                      >
                        <div className="space-y-2">
                          {/* Baris Badge Tipe & Indikator Rangkaian Acara */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${getPuraTypeBadgeStyle(
                                pura.type
                              )}`}
                            >
                              {pura.type || 'Kahyangan Jagat'}
                            </span>

                            {hasAcaras && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-emerald-600" />
                                <span>Ada Susunan Acara</span>
                              </span>
                            )}
                          </div>

                          {/* Nama Pura */}
                          <h4 className="text-sm sm:text-base font-extrabold text-[#0f172a] group-hover:text-teal-700 transition-colors line-clamp-1">
                            {pura.name}
                          </h4>

                          {/* Alamat & Wilayah */}
                          <div className="flex items-start gap-1.5 text-xs text-slate-500 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">
                              {pura.address ? `${pura.address}, ${pura.city}` : pura.city}
                            </span>
                          </div>
                        </div>

                        {/* Tombol Aksi Menuju Detail Pura & Acara (Level 3) */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-teal-700 group-hover:text-teal-800 transition-colors">
                            Lihat Rincian & Susunan Acara
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-700 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ---------------------------------------------------------------- */}
          {/* LEVEL 3: DETAIL PIODALAN DI PURA ITU DAN SUSUNAN RANGKAIAN ACARA */}
          {/* (PERSIS SEPERTI FITUR KELOLA PURA BAGIAN JADWAL PIODALAN & ACARA)  */}
          {/* ---------------------------------------------------------------- */}
          {selectedPura && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* 1. KARTU PROFIL PURA (HEADER IDENTITAS) */}
              <div className="bg-[#f8fafc] rounded-2xl border border-slate-200/70 p-5 sm:p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1.5">
                    {/* Badge Klasifikasi Pura */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold inline-block ${getPuraTypeBadgeStyle(
                        selectedPura.type
                      )}`}
                    >
                      {selectedPura.type || 'Kahyangan Jagat'}
                    </span>

                    {/* Nama Pura */}
                    <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
                      {selectedPura.name}
                    </h3>

                    {/* Alamat Fisik */}
                    <div className="flex items-start gap-1.5 text-xs sm:text-sm text-slate-600 font-medium">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>
                        {selectedPura.address
                          ? `${selectedPura.address}, ${selectedPura.city}, ${selectedPura.province}`
                          : `${selectedPura.city}, ${selectedPura.province}`}
                      </span>
                    </div>

                    {/* Nomor Telepon Pengurus jika ada */}
                    {selectedPura.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold pt-1">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>Kontak Pengelola: {selectedPura.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Tombol Tautan Google Maps */}
                  {selectedPura.location_url && (
                    <a
                      href={selectedPura.location_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200/90 hover:border-teal-500/40 text-xs sm:text-sm font-bold text-slate-700 hover:text-teal-700 transition-all shadow-xs shrink-0"
                    >
                      <span>Buka di Peta</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Kotak Dasar Penanggalan Pura (Pawukon / Sasih) */}
                <div className="bg-white rounded-xl border border-slate-200/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                      Sistem Acuan Piodalan
                    </span>
                    <span className="font-bold text-slate-800">
                      {selectedPura.benchmark === 'Sasih' || selectedPura.sasih
                        ? 'Penanggalan Sasih Candra'
                        : 'Siklus Pawukon (210 Hari)'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-0.5">
                      Kombinasi Penanggalan
                    </span>
                    <span className="font-bold text-teal-700">
                      {selectedPura.benchmark === 'Sasih' || selectedPura.sasih
                        ? `${selectedPura.sasih || ''} ${selectedPura.purnama_tilem || ''}`.trim() || dayGroup.wewaran
                        : `${selectedPura.saptawara || ''} ${selectedPura.pancawara || ''} ${selectedPura.wuku || ''}`.trim() || dayGroup.wewaran}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. KARTU INFORMASI PELAKSANAAN PIODALAN */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0e9f90]" />
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0f172a]">
                      Informasi Pelaksanaan Upacara
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 tabular-nums">
                    {dayGroup.formattedDate}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Hari Pelaksanaan
                    </span>
                    <p className="font-bold text-slate-800">
                      {dayGroup.formattedDate} ({dayGroup.wewaran})
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                      Tingkat Upacara
                    </span>
                    <p className="font-bold text-slate-800">
                      {selectedPura.pelaksanaan_aktual?.tingkat_upacara ||
                        ceremoniesData?.records?.[0]?.ceremony_level_name ||
                        'Piodalan Ageng Pura'}
                    </p>
                  </div>

                  {Boolean(selectedPura.pelaksanaan_aktual?.deskripsi || ceremoniesData?.records?.[0]?.description) && (
                    <div className="sm:col-span-2 space-y-1 pt-1">
                      <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                        Deskripsi Upacara
                      </span>
                      <p className="font-medium text-slate-600 leading-relaxed">
                        {selectedPura.pelaksanaan_aktual?.deskripsi ||
                          ceremoniesData?.records?.[0]?.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* 3. SUSUNAN RANGKAIAN ACARA PIODALAN (PERSIS SEPERTI KELOLA PURA) */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#0e9f90]" />
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0f172a]">
                      Susunan Rangkaian Acara Piodalan
                    </h4>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    Data Kontributor
                  </span>
                </div>

                {/* State Loading Acara */}
                {isLoadingCeremonies ? (
                  <div className="space-y-3 py-4 animate-pulse">
                    <div className="h-16 bg-slate-100 rounded-xl" />
                    <div className="h-16 bg-slate-100 rounded-xl" />
                  </div>
                ) : (
                  /* Evaluasi Daftar Acara: Prioritaskan dari query ceremonies atau dari data pencarian */
                  (() => {
                    const acaraList =
                      ceremoniesData?.acaras && ceremoniesData.acaras.length > 0
                        ? ceremoniesData.acaras
                        : selectedPura.pelaksanaan_aktual?.acaras || [];

                    if (acaraList.length > 0) {
                      return (
                        <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50/50">
                          {acaraList.map((acara, idx) => {
                            const isPiodalanAcara = 'name' in acara;
                            const namaAcara = isPiodalanAcara ? (acara as PiodalanAcaraItem).name : (acara as { nama: string }).nama;
                            const waktuAcara = isPiodalanAcara ? (acara as PiodalanAcaraItem).event_at : (acara as { waktu: string }).waktu;
                            const picName = isPiodalanAcara ? (acara as PiodalanAcaraItem).pic_name : (acara as { pic_nama?: string }).pic_nama;
                            const picPhone = acara.pic_phone;
                            const ceremonyLevel = isPiodalanAcara ? (acara as PiodalanAcaraItem).ceremony_level : undefined;

                            return (
                              <div
                                key={acara.id || idx}
                                className="p-4 sm:p-4.5 bg-white hover:bg-slate-50/80 transition-colors space-y-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <h5 className="text-sm font-extrabold text-slate-900">
                                    {namaAcara}
                                  </h5>
                                  {ceremonyLevel && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 shrink-0">
                                      {ceremonyLevel}
                                    </span>
                                  )}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-medium">
                                  {waktuAcara && (
                                    <span className="inline-flex items-center gap-1.5 text-teal-700 font-bold">
                                      <Clock className="w-3.5 h-3.5" />
                                      <span>{waktuAcara}</span>
                                    </span>
                                  )}

                                  {picName && (
                                    <span className="inline-flex items-center gap-1.5 text-slate-600">
                                      <User className="w-3.5 h-3.5 text-slate-400" />
                                      <span>
                                        PIC: {picName} {picPhone ? `(${picPhone})` : ''}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    }

                    // Empty State jika belum ada acara terdaftar
                    return (
                      <div className="p-6 bg-slate-50/80 border border-dashed border-slate-200 rounded-2xl text-center space-y-2">
                        <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                        <h5 className="text-xs sm:text-sm font-bold text-slate-700">
                          Rangkaian acara belum tersedia
                        </h5>
                        <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                          Waktu pelaksanaan spesifik dan susunan tahapan upacara belum diunggah oleh pengelola atau kontributor pura ini.
                        </p>
                        <div className="pt-1">
                          <span className="text-[11px] text-slate-400 font-medium block">
                            Pelaksanaan puncak piodalan umumnya berlangsung pukul 08.00 s.d. 22.00 WITA mengikuti dresta desa adat setempat.
                          </span>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* FOOTER MODAL: STANDAR AGENTS.md                                    */}
        {/* Sesuai Permintaan Pengguna: Tombol Kembali ke Daftar Pura          */}
        {/* HANYA DITEMPATKAN DI SINI (BAGIAN BAWAH)                           */}
        {/* ================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          {selectedPura ? (
            <button
              type="button"
              onClick={() => setSelectedPura(null)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer [touch-action:manipulation]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Pura</span>
            </button>
          ) : (
            <span className="text-xs text-slate-400 font-medium">
              Pilih pura untuk melihat rincian susunan acara.
            </span>
          )}

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
