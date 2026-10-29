import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CalendarDays,
  Clock,
  User,
  Phone,
  MapPin,
  Sparkles,
  Info,
  ChevronRight,
  PlusCircle,
  Trash2,
  Send,
  Eye,
  Crown,
} from 'lucide-react';
import type {
  PuraBackendItem,
  PuraPiodalanRecord,
  PuraAcaraItem,
  PiodalanSubmission,
  AcaraSubmission,
} from '../types/kelolaPura.types';
import {
  usePuraPiodalansData,
  usePiodalanAcarasData,
  usePiodalanMutations,
  useAcaraMutations,
  usePiodalanSubmissions,
} from '../hooks/useKelolaPura';
import {
  formatDateWITA,
  formatTimeWITA,
  getPuraTypeBadgeStyle,
  getObservationSummary,
  formatPuraLocation,
  getPuraBenchmarkDisplay,
} from '../utils/kelolaPuraUtils';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { PiodalanEntryModal } from './PiodalanEntryModal';
import { AcaraEntryModal } from './AcaraEntryModal';
import { PiodalanSubmissionModal } from './PiodalanSubmissionModal';
import { AcaraSubmissionModal } from './AcaraSubmissionModal';
import { PiodalanSubmissionsDrawer } from './PiodalanSubmissionsDrawer';
import { PiodalanDeleteConfirmModal } from './PiodalanDeleteConfirmModal';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';

/**
 * ==============================================================================
 * PROPS: PuraPiodalanView
 * ==============================================================================
 */
interface PuraPiodalanViewProps {
  puraId: number;
  pura: PuraBackendItem | null;
  /** Callback untuk kembali ke tampilan katalog daftar pura (opsional, kini tersedia di header utama) */
  onBack?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PuraPiodalanView (Sub-Halaman Jadwal Piodalan & Susunan Acara)
 * ==============================================================================
 * Mengakomodasi partisipasi umat & kontrol penuh Administrator:
 * 1. Admin:
 *    - Tambah Siklus Piodalan & Tambah Acara langsung ke database backend Go.
 *    - Tinjau & Setujui / Tolak usulan odalan dan susunan acara dari warga.
 * 2. Member:
 *    - Mengajukan Usulan Odalan Baru (PiodalanSubmissionModal).
 *    - Mengajukan Usulan Tahapan Acara (AcaraSubmissionModal).
 * ==============================================================================
 */
export const PuraPiodalanView: React.FC<PuraPiodalanViewProps> = ({
  puraId,
  pura,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();

  // Evaluasi hak akses Role Admin & Member Premium
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || '').toLowerCase();
    return roleLower === 'admin' || user.tier === 'Admin';
  }, [user]);

  const isPremium = useMemo(() => {
    if (!user) return false;
    return Boolean(user.isPremium || user.tier === 'Premium');
  }, [user]);

  // ============================================================================
  // 1. PENGAMBILAN DATA ASINKRON (SERVER STATE DENGAN TANSTACK QUERY)
  // ============================================================================
  // Ambil daftar riwayat & jadwal piodalan resmi pura ini dari database Go
  const { data: piodalans = [], isLoading: isLoadingPiodalan } = usePuraPiodalansData(puraId);

  // State ID piodalan yang dipilih (default ke piodalan pertama/terkini jika ada)
  const [selectedPiodalanId, setSelectedPiodalanId] = useState<number | null>(null);

  // Tentukan piodalan aktif: gunakan pilihan pengguna atau piodalan pertama yang tersedia
  const activePiodalan: PuraPiodalanRecord | null = useMemo(() => {
    if (piodalans.length === 0) return null;
    if (selectedPiodalanId) {
      const found = piodalans.find((p) => p.id === selectedPiodalanId);
      if (found) return found;
    }
    return piodalans[0];
  }, [piodalans, selectedPiodalanId]);

  // Ambil rincian tahapan susunan acara untuk piodalan yang sedang aktif
  const { data: acaras = [], isLoading: isLoadingAcara } = usePiodalanAcarasData(
    activePiodalan ? activePiodalan.id : null
  );

  // Mutasi Piodalan & Acara untuk Admin
  const { createPiodalan, deletePiodalan, isDeleting: isDeletingPiodalan } = usePiodalanMutations(puraId);
  const { createAcara, deleteAcara, isDeleting: isDeletingAcara } = useAcaraMutations(
    activePiodalan ? activePiodalan.id : null
  );

  // Hook Antrean Usulan Piodalan & Acara
  const {
    piodalanSubmissions,
    acaraSubmissions,
    totalPendingCount,
    markPiodalanApproved,
    markPiodalanRejected,
    markAcaraApproved,
    markAcaraRejected,
  } = usePiodalanSubmissions(puraId);

  // State Dialog Modal & Drawer
  const [isPiodalanModalOpen, setIsPiodalanModalOpen] = useState<boolean>(false);
  const [isAcaraModalOpen, setIsAcaraModalOpen] = useState<boolean>(false);
  const [isPiodalanSubmissionModalOpen, setIsPiodalanSubmissionModalOpen] = useState<boolean>(false);
  const [isAcaraSubmissionModalOpen, setIsAcaraSubmissionModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [showSubmissionsDrawer, setShowSubmissionsDrawer] = useState<boolean>(false);

  const [piodalanToDelete, setPiodalanToDelete] = useState<PuraPiodalanRecord | null>(null);
  const [acaraToDelete, setAcaraToDelete] = useState<PuraAcaraItem | null>(null);

  // Konfigurasi gaya badge tipe pura dan ringkasan penanggalan wariga
  const badgeStyle = getPuraTypeBadgeStyle(pura?.type);
  const observationSummary = pura ? getObservationSummary(pura) : 'Dasar penanggalan';

  // Handler Usulan Odalan
  const handleOpenPiodalanSubmission = () => {
    if (isAdmin || isPremium) {
      setIsPiodalanSubmissionModalOpen(true);
    } else {
      setIsUpgradeModalOpen(true);
    }
  };

  // Handler Usulan Acara
  const handleOpenAcaraSubmission = () => {
    if (!activePiodalan) {
      showAlert('Pilih siklus piodalan terlebih dahulu untuk mengusulkan susunan acara.');
      return;
    }
    if (isAdmin || isPremium) {
      setIsAcaraSubmissionModalOpen(true);
    } else {
      setIsUpgradeModalOpen(true);
    }
  };

  // Handler Hapus Siklus Piodalan
  const handleConfirmDeletePiodalan = async () => {
    if (!piodalanToDelete) return;
    try {
      await deletePiodalan(piodalanToDelete.id);
      if (selectedPiodalanId === piodalanToDelete.id) {
        setSelectedPiodalanId(null);
      }
      setPiodalanToDelete(null);
    } catch {
      // Error ditangani di hook
    }
  };

  // Handler Hapus Tahapan Acara
  const handleConfirmDeleteAcara = async () => {
    if (!acaraToDelete) return;
    try {
      await deleteAcara(acaraToDelete.id);
      setAcaraToDelete(null);
    } catch {
      // Error ditangani di hook
    }
  };

  // Handler Admin: Setujui Usulan Piodalan (Membuat Piodalan Riil ke Database Go)
  const handleApprovePiodalan = async (sub: PiodalanSubmission) => {
    try {
      await createPiodalan({
        date: sub.ceremony_date,
        description: `[Usulan ${sub.user_name}] ${sub.description}`,
        level_id: sub.level_id,
      });
      markPiodalanApproved(sub.id);
      showAlert(`Usulan piodalan dari ${sub.user_name} berhasil disetujui & dicatat!`);
    } catch (e) {
      console.error(e);
      showAlert('Gagal menyetujui usulan piodalan.');
    }
  };

  // Handler Admin: Setujui Usulan Acara (Membuat Acara Riil ke Database Go)
  const handleApproveAcara = async (sub: AcaraSubmission) => {
    try {
      await createAcara({
        name: `[Usulan ${sub.user_name}] ${sub.name}`,
        event_at: sub.event_at,
        level_id: sub.level_id,
        pic_name: sub.pic_name,
        pic_phone: sub.pic_phone,
      });
      markAcaraApproved(sub.id);
      showAlert(`Usulan tahapan acara dari ${sub.user_name} berhasil disetujui & ditambahkan!`);
    } catch (e) {
      console.error(e);
      showAlert('Gagal menyetujui usulan acara.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 2. KARTU INFORMASI UTAMA: IDENTITAS PURA & RINGKASAN PENANGGALAN     */}
      {/* ==================================================================== */}
      <section
        aria-label="Header Rincian Piodalan"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
      >
        {/* Identitas Pura Terpilih */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            {/* Lencana Klasifikasi Tipe Pura */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle.container}`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`}
                  aria-hidden="true"
                />
                <span>{pura?.type || 'Pura Umum'}</span>
              </span>
            </div>

            {/* Nama Pura */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {pura?.name || 'Memuat Data Pura...'}
            </h2>

            {/* Alamat Fisik & Kabupaten */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                {formatPuraLocation(pura)}
              </span>
            </div>
          </div>

          {/* Kotak Ringkasan Penanggalan Wariga (Wuku / Sasih) */}
          <div className="bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4 sm:p-5 shrink-0 max-w-sm space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-800">
              <Calendar className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
              <span>Dasar Piodalan</span>
            </div>
            <p className="text-sm font-bold text-teal-950">{observationSummary}</p>
            <p className="text-xs text-teal-700/80 font-medium">
              Sistem Acuan:{' '}
              <span className="font-semibold">
                {getPuraBenchmarkDisplay(pura)}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. DRAWER REVIEW USULAN MEMBER (KHUSUS ROLE ADMIN)                  */}
      {/* ==================================================================== */}
      {isAdmin && showSubmissionsDrawer && (
        <PiodalanSubmissionsDrawer
          isOpen={showSubmissionsDrawer}
          onClose={() => setShowSubmissionsDrawer(false)}
          piodalanSubmissions={piodalanSubmissions}
          acaraSubmissions={acaraSubmissions}
          onApprovePiodalan={handleApprovePiodalan}
          onRejectPiodalan={markPiodalanRejected}
          onApproveAcara={handleApproveAcara}
          onRejectAcara={markAcaraRejected}
        />
      )}

      {/* ==================================================================== */}
      {/* 4. SECTION UTAMA: SIKLUS PIODALAN & TAHAPAN SUSUNAN ACARA            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ================================================================== */}
        {/* KOLOM KIRI: DAFTAR PIODALAN RESMI + TOMBOL SIKLUS & USULAN         */}
        {/* ================================================================== */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            {/* Header Kartu Piodalan dengan Tombol Tambah Siklus & Usulan */}
            <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2 shrink-0">
                <CalendarDays className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
                <h3 className="text-sm font-bold text-slate-900">Daftar Piodalan Resmi</h3>
                <span className="text-xs font-semibold text-slate-400 tabular-nums">
                  ({piodalans.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {/* Tombol Aksi Tambah Siklus Piodalan (Khusus Admin) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsPiodalanModalOpen(true)}
                    className="min-h-[34px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Tambah Siklus</span>
                  </button>
                )}

                {/* Tombol Tinjau Usulan Member (Khusus Admin) */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setShowSubmissionsDrawer((prev) => !prev)}
                    className={`min-h-[34px] inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      totalPendingCount > 0
                        ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                    <span>Usulan</span>
                    {totalPendingCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white tabular-nums">
                        {totalPendingCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Tombol Ajukan Usulan Odalan (Khusus Member / Guest) */}
                {!isAdmin && (
                  <button
                    type="button"
                    onClick={handleOpenPiodalanSubmission}
                    className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                    <span>Usulkan Odalan</span>
                    {isPremium && (
                      <Crown className="w-3 h-3 text-amber-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Loading State Riwayat Piodalan */}
            {isLoadingPiodalan && (
              <div className="space-y-2 py-2" aria-busy="true">
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            )}

            {/* Daftar Piodalan */}
            {!isLoadingPiodalan && piodalans.length > 0 && (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {piodalans.map((piodalan) => {
                  const isSelected = activePiodalan?.id === piodalan.id;
                  return (
                    <div
                      key={piodalan.id}
                      className={`group relative rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-teal-50 border-teal-300 text-teal-950 shadow-xs'
                          : 'bg-slate-50 border-slate-200/70 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedPiodalanId(piodalan.id)}
                        className="w-full text-left p-4 cursor-pointer focus:outline-hidden"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {formatDateWITA(piodalan.ceremony_date || piodalan.date || '')}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {/* Tombol Hapus Piodalan Khusus Admin */}
                            {isAdmin && (
                              <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPiodalanToDelete(piodalan);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.stopPropagation();
                                    setPiodalanToDelete(piodalan);
                                  }
                                }}
                                title="Hapus jadwal piodalan"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                              </span>
                            )}
                            <ChevronRight
                              className={`w-4 h-4 shrink-0 transition-transform ${
                                isSelected ? 'text-[#0e9f90] translate-x-0.5' : 'text-slate-400'
                              }`}
                              aria-hidden="true"
                            />
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-1">
                          {piodalan.description || 'Piodalan Ageng Pura'}
                        </p>
                        {Boolean(piodalan.ceremony_level_name || piodalan.level) && (
                          <span className="inline-block mt-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                            {piodalan.ceremony_level_name || piodalan.level}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State Jika Belum Ada Data Piodalan */}
            {!isLoadingPiodalan && piodalans.length === 0 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/70 text-center space-y-1.5">
                <Info className="w-5 h-5 text-slate-400 mx-auto" aria-hidden="true" />
                <p className="text-xs font-bold text-slate-700">Belum ada riwayat piodalan</p>
                <p className="text-[11px] text-slate-500">
                  Data piodalan spesifik belum dicatat pengurus pura.
                </p>
              </div>
            )}
          </div>
        </aside>

        {/* ================================================================== */}
        {/* KOLOM KANAN: SUSUNAN ACARA + TOMBOL ACARA & USULAN                */}
        {/* ================================================================== */}
        <main className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-5">
            {/* Header Bagian Rangkaian Acara dengan Tombol Aksi & Usulan */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0e9f90]" aria-hidden="true" />
                  <span>Susunan Rangkaian Acara Piodalan</span>
                </h3>
                {activePiodalan && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Pelaksanaan:{' '}
                    <strong className="text-slate-800">
                      {formatDateWITA(activePiodalan.ceremony_date || activePiodalan.date || '')}
                    </strong>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {Boolean(activePiodalan?.ceremony_level_name || activePiodalan?.level) && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    <span>Tingkatan: {activePiodalan?.ceremony_level_name || activePiodalan?.level}</span>
                  </span>
                )}

                {/* Tombol Tambah Susunan Acara (Khusus Admin saat piodalan aktif) */}
                {isAdmin && activePiodalan && (
                  <button
                    type="button"
                    onClick={() => setIsAcaraModalOpen(true)}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Tambah Acara</span>
                  </button>
                )}

                {/* Tombol Usulkan Acara (Khusus Member / Guest saat piodalan aktif) */}
                {!isAdmin && activePiodalan && (
                  <button
                    type="button"
                    onClick={handleOpenAcaraSubmission}
                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
                  >
                    <Send className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
                    <span>Usulkan Acara</span>
                    {isPremium && (
                      <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Loading State Susunan Acara */}
            {isLoadingAcara && (
              <div className="space-y-4 py-4" aria-busy="true">
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
                <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
              </div>
            )}

            {/* Tampilan Garis Waktu (Timeline) Acara */}
            {!isLoadingAcara && acaras.length > 0 && (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200/80">
                {acaras.map((acara, index) => (
                  <div
                    key={acara.id || index}
                    className="relative flex items-start gap-4 pl-8 group"
                  >
                    {/* Titik Indikator Garis Waktu */}
                    <div
                      className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-white border-2 border-[#0e9f90] group-hover:scale-125 transition-transform"
                      aria-hidden="true"
                    />

                    {/* Kartu Detail Satu Tahapan Acara */}
                    <div className="w-full bg-slate-50/80 hover:bg-teal-50/30 border border-slate-200/80 hover:border-teal-200/80 rounded-xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {/* Nama Tahapan Upacara */}
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition-colors">
                            {acara.name}
                          </h4>
                          {Boolean(acara.ceremony_level_name || acara.level) && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                              {acara.ceremony_level_name || acara.level}
                            </span>
                          )}
                        </div>

                        {/* Waktu Pelaksanaan WITA & Aksi Hapus */}
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200/70 px-2.5 py-1 rounded-md tabular-nums shrink-0">
                            <Clock className="w-3 h-3 text-[#0e9f90]" aria-hidden="true" />
                            <span>
                              {formatDateWITA(acara.event_at)}{' '}
                              {formatTimeWITA(acara.event_at) && `· ${formatTimeWITA(acara.event_at)}`}
                            </span>
                          </div>

                          {/* Tombol Hapus Tahapan Acara Khusus Admin */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => setAcaraToDelete(acara)}
                              title="Hapus tahapan acara ini"
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Penanggung Jawab Acara (PIC) & Kontak */}
                      {(acara.pic_name || acara.pic_phone) && (
                        <div className="flex flex-wrap items-center gap-4 mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-slate-600 font-medium">
                          {acara.pic_name && (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                              <span>Koordinator: {acara.pic_name}</span>
                            </div>
                          )}

                          {acara.pic_phone && (
                            <a
                              href={`tel:${acara.pic_phone}`}
                              className="flex items-center gap-1.5 text-teal-700 hover:text-teal-800 font-semibold"
                            >
                              <Phone className="w-3.5 h-3.5 text-teal-500" aria-hidden="true" />
                              <span>{acara.pic_phone}</span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State: Belum Ada Susunan Acara Terperinci */}
            {!isLoadingAcara && acaras.length === 0 && (
              <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-[#0e9f90]">
                  <CalendarDays className="w-6 h-6" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-slate-900">
                    Susunan Acara Belum Dipublikasikan
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                    Pengurus pura belum mengunggah susunan jam rangkaian upacara (Melasti, Puncak,
                    Nyineb) untuk siklus ini. Piodalan tetap berpedoman pada siklus penanggalan{' '}
                    <strong className="text-slate-700">{observationSummary}</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 5. MODAL DIALOG ENTRY & DELETE CONFIRMATION                         */}
      {/* ==================================================================== */}
      {/* Modal Tambah Siklus Piodalan Baru (Admin) */}
      <PiodalanEntryModal
        isOpen={isPiodalanModalOpen}
        puraId={puraId}
        puraName={pura?.name}
        onClose={() => setIsPiodalanModalOpen(false)}
      />

      {/* Modal Tambah Tahapan Susunan Acara (Admin) */}
      {activePiodalan && (
        <AcaraEntryModal
          isOpen={isAcaraModalOpen}
          piodalanId={activePiodalan.id}
          piodalanDate={activePiodalan.ceremony_date || activePiodalan.date}
          onClose={() => setIsAcaraModalOpen(false)}
        />
      )}

      {/* Modal Pengajuan Usulan Piodalan (Member) */}
      <PiodalanSubmissionModal
        isOpen={isPiodalanSubmissionModalOpen}
        puraId={puraId}
        puraName={pura?.name || 'Pura'}
        onClose={() => setIsPiodalanSubmissionModalOpen(false)}
      />

      {/* Modal Pengajuan Usulan Acara (Member) */}
      {activePiodalan && (
        <AcaraSubmissionModal
          isOpen={isAcaraSubmissionModalOpen}
          piodalanId={activePiodalan.id}
          puraId={puraId}
          puraName={pura?.name || 'Pura'}
          piodalanDate={activePiodalan.ceremony_date || activePiodalan.date}
          onClose={() => setIsAcaraSubmissionModalOpen(false)}
        />
      )}

      {/* Modal Konfirmasi Hapus Siklus Piodalan */}
      <PiodalanDeleteConfirmModal
        isOpen={Boolean(piodalanToDelete)}
        title="Hapus Siklus Piodalan"
        message="Apakah Anda yakin ingin menghapus data jadwal piodalan resmi ini? Seluruh tahapan susunan acara terkait siklus ini juga akan terhapus secara permanen."
        itemName={piodalanToDelete ? `${formatDateWITA(piodalanToDelete.ceremony_date || piodalanToDelete.date || '')} - ${piodalanToDelete.description || 'Piodalan'}` : ''}
        isLoading={isDeletingPiodalan}
        onClose={() => setPiodalanToDelete(null)}
        onConfirm={handleConfirmDeletePiodalan}
      />

      {/* Modal Konfirmasi Hapus Tahapan Acara */}
      <PiodalanDeleteConfirmModal
        isOpen={Boolean(acaraToDelete)}
        title="Hapus Tahapan Acara"
        message="Apakah Anda yakin ingin menghapus tahapan susunan acara ini dari rangkaian piodalan pura?"
        itemName={acaraToDelete ? `${acaraToDelete.name} (${formatDateWITA(acaraToDelete.event_at)})` : ''}
        isLoading={isDeletingAcara}
        onClose={() => setAcaraToDelete(null)}
        onConfirm={handleConfirmDeleteAcara}
      />

      {/* Modal Upgrade Member Premium jika Guest / Free mencoba mengusulkan */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Fitur Khusus Member Premium"
        description={
          <>
            Pengajuan usulan jadwal piodalan dan tahapan acara pura adalah hak istimewa bagi{' '}
            <strong className="text-amber-800 font-bold">Member Premium</strong> untuk menjaga
            keabsahan data piodalan komunitas.
          </>
        }
        benefits={[
          'Mengusulkan jadwal piodalan pura keluarga/kawitan',
          'Mengusulkan tahapan acara (melasti, puncak, nyineb)',
          'Mendapatkan notifikasi piodalan pura secara presisi',
          'Akses penuh perhitungan wariga terperinci',
        ]}
      />
    </div>
  );
};
