import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Receipt,
  PlusCircle,
  Pencil,
  Trash2,
  Crown,
  Sparkles,
  MapPin,
  Send,
  Eye,
} from 'lucide-react';
import type { PuraBackendItem, PuraFinanceEntry } from '../types/kelolaPura.types';
import {
  usePuraFinanceData,
  useFinanceCategoriesData,
  useFinanceMutations,
  useFinanceSubmissions,
} from '../hooks/useKelolaPura';
import {
  formatRupiah,
  formatDateWITA,
  getPuraTypeBadgeStyle,
  formatPuraLocation,
} from '../utils/kelolaPuraUtils';
import { FinanceEntryModal } from './FinanceEntryModal';
import { FinanceSubmissionModal } from './FinanceSubmissionModal';
import { FinanceDeleteConfirmModal } from './FinanceDeleteConfirmModal';
import { PremiumUpgradeModal } from './PremiumUpgradeModal';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: PuraKeuanganView
 * ==============================================================================
 * Menerima data master pura terpilih dan fungsi navigasi kembali ke katalog:
 * - puraId: ID database pura yang sedang ditinjau transparansi keuangannya
 * - pura: Objek profil pura (atau null jika sedang dimuat)
 * - onBack: Callback untuk kembali ke tampilan katalog daftar pura (?view=list)
 */
interface PuraKeuanganViewProps {
  puraId: number;
  pura: PuraBackendItem | null;
  /** Callback untuk kembali ke tampilan katalog daftar pura (opsional, kini tersedia di header utama) */
  onBack?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PuraKeuanganView (Sub-Halaman Transparansi Kas Pura)
 * ==============================================================================
 * Memodernisasi tampilan laporan kas pura (sesuai Gambar 4) dengan arsitektur peran:
 * 1. Hak Akses Sesuai Peran (Role-Based Access Control):
 *    - Guest / Member Non-Premium: Dapat melihat seluruh data mutasi kas & ringkasan
 *      secara publik. Tombol 'Ajukan Usulan' menampilkan petunjuk upgrade Premium.
 *    - Member (Premium): Dapat melihat data + tombol aktif 'Ajukan Usulan / Koreksi Kas'.
 *    - Admin: Full Control dapat menambah (+), mengubah, dan menghapus catatan kas
 *      secara langsung, serta memverifikasi (Approve/Reject) usulan dari member.
 * 2. 4 Kartu Metrik Ringkasan Kas (Saldo Bersih, Total Punia, Total Pengeluaran, Jumlah Transaksi).
 * 3. Filter Interaktif: Filter tahun anggaran, filter kategori, dan tab jenis arus kas.
 * 4. Tabel Mutasi Kas Terstruktur: Tanggal WITA, kategori, uraian, debit/kredit, dan tombol aksi.
 * 5. Drawer Review Usulan Komunitas: Khusus Admin untuk meninjau usulan yang diajukan member.
 * ==============================================================================
 */
export const PuraKeuanganView: React.FC<PuraKeuanganViewProps> = ({
  puraId,
  pura,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();

  // ============================================================================
  // 1. EVALUASI PERAN & HAK AKSES PENGGUNA AKTIF
  // ============================================================================
  // Role Admin memiliki hak penuh untuk menambah, mengubah, dan menghapus transaksi
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const roleLower = (user.role || '').toLowerCase();
    return roleLower === 'admin' || user.tier === 'Admin';
  }, [user]);

  // Role Member Premium memiliki hak mengajukan draf usulan catatan kas baru
  const isPremium = useMemo(() => {
    if (!user) return false;
    return Boolean(user.isPremium || user.tier === 'Premium');
  }, [user]);

  // ============================================================================
  // 2. STATE FILTER KEUANGAN (TAHUN, KATEGORI, JENIS KAS)
  // ============================================================================
  const [selectedYear, setSelectedYear] = useState<string>('Semua');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [entryTypeFilter, setEntryTypeFilter] = useState<'all' | 'debit' | 'kredit'>('all');

  // State Modal Aksi Keuangan
  const [isEntryModalOpen, setIsEntryModalOpen] = useState<boolean>(false);
  const [entryToEdit, setEntryToEdit] = useState<PuraFinanceEntry | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<PuraFinanceEntry | null>(null);
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState<boolean>(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [showSubmissionsDrawer, setShowSubmissionsDrawer] = useState<boolean>(false);

  // ============================================================================
  // 3. PENGAMBILAN DATA KAS ASINKRON (BACKEND GO VIA TANSTACK QUERY)
  // ============================================================================
  // Ambil daftar mutasi kas dan kalkulasi ringkasan kas (Saldo, Total Debit, Total Kredit)
  const { entries, summary, isLoading, refetch } = usePuraFinanceData(
    puraId,
    selectedYear === 'Semua' ? undefined : selectedYear,
    selectedCategory === 'Semua' ? undefined : selectedCategory,
    entryTypeFilter === 'all' ? undefined : entryTypeFilter
  );

  // Ambil master kategori kas untuk dropdown filter dan form modal
  const { data: categories = [] } = useFinanceCategoriesData();

  // Hook aksi mutasi untuk Admin
  const { deleteEntry, isDeleting } = useFinanceMutations(puraId);

  // Hook antrean usulan kas dari member
  const { submissions, pendingCount, markApproved, markRejected } = useFinanceSubmissions(puraId);

  // Daftar opsi tahun yang tersedia dari data riil transaksi kas
  const availableYears = useMemo(() => {
    const yearsSet = new Set<string>();
    entries.forEach((e) => {
      if (e.transaction_date) {
        const y = e.transaction_date.slice(0, 4);
        if (y) yearsSet.add(y);
      }
    });
    const arr = Array.from(yearsSet).sort().reverse();
    return arr.length > 0 ? arr : [String(new Date().getFullYear())];
  }, [entries]);

  // Ambil gaya visual badge tipe pura
  const badgeStyle = getPuraTypeBadgeStyle(pura?.type);

  // Handler: Buka modal konfirmasi hapus transaksi kas (Personalisasi UI)
  const handleOpenDeleteModal = (entry: PuraFinanceEntry) => {
    setEntryToDelete(entry);
  };

  // Handler: Tutup modal konfirmasi hapus transaksi kas
  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setEntryToDelete(null);
    }
  };

  // Handler: Eksekusi konfirmasi hapus transaksi kas oleh Admin
  const handleConfirmDelete = async () => {
    if (!entryToDelete) return;
    try {
      await deleteEntry(entryToDelete.id);
      setEntryToDelete(null);
    } catch {
      // Error sudah ditangani di dalam useFinanceMutations
    }
  };

  // Handler: Klik tombol pengajuan usulan kas berdasarkan tingkatan akun
  const handleOpenSubmission = () => {
    if (isAdmin || isPremium) {
      setIsSubmissionModalOpen(true);
    } else {
      setIsUpgradeModalOpen(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================================================================== */}
      {/* 4. KARTU INFORMASI UTAMA: IDENTITAS PURA & KONTROL TRANSAKSI         */}
      {/* ==================================================================== */}
      <section
        aria-label="Header Transparansi Keuangan Pura"
        className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs"
      >
        {/* Identitas Pura & Tombol Aksi Sesuai Peran Pengguna */}
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

            {/* Judul Utama Identitas Pura */}
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Transparansi Kas {pura?.name || 'Pura'}
            </h2>

            {/* Lokasi Pura */}
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 font-medium">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
              <span>
                {formatPuraLocation(pura)}
              </span>
            </div>
          </div>

          {/* Baris Tombol Aksi Pengguna */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            {/* Aksi 1: Tombol Tambah Transaksi (Hanya untuk Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setEntryToEdit(null);
                  setIsEntryModalOpen(true);
                }}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e9f90] text-white hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                <span>Catat Transaksi Baru</span>
              </button>
            )}

            {/* Aksi 2: Drawer Review Usulan Komunitas (Khusus Admin) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => setShowSubmissionsDrawer((prev) => !prev)}
                className={`min-h-[44px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  pendingCount > 0
                    ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Eye className="w-4 h-4 text-amber-600" aria-hidden="true" />
                <span>Usulan Member</span>
                {pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white tabular-nums">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}

            {/* Aksi 3: Tombol Ajukan Usulan / Koreksi Kas (Untuk Member / Guest) */}
            {!isAdmin && (
              <button
                type="button"
                onClick={handleOpenSubmission}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-white text-slate-800 border border-slate-300 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                <Send className="w-4 h-4 text-[#0e9f90]" aria-hidden="true" />
                <span>Ajukan Usulan / Koreksi Kas</span>
                {isPremium && (
                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. EMPAT KARTU METRIK RINGKASAN KAS (TABULAR-NUMS PRESISI)           */}
      {/* ==================================================================== */}
      <section
        aria-label="Ringkasan Arus Kas Pura"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Kartu 1: Saldo Kas Pura */}
        <div className="bg-gradient-to-br from-teal-500/10 via-white to-emerald-500/5 rounded-2xl border border-teal-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Saldo Kas Pura</span>
            <span className="text-xl sm:text-2xl font-extrabold text-teal-950 tabular-nums block">
              {formatRupiah(summary?.saldo ?? 0)}
            </span>
            <span className="text-[11px] text-teal-700 font-medium">Saldo kas mutasi berjalan</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0e9f90] shrink-0">
            <Wallet className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 2: Total Kas Masuk (Punia) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Kas Masuk (Punia)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 tabular-nums block">
              {formatRupiah(summary?.total_debit ?? 0)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Total dana punia diterima</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 3: Total Kas Keluar (Pengeluaran / Belanja) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Total Kas Keluar (Belanja)</span>
            <span className="text-xl sm:text-2xl font-extrabold text-rose-600 tabular-nums block">
              {formatRupiah(summary?.total_kredit ?? 0)}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Banten, upacara & operasional</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
            <TrendingDown className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>

        {/* Kartu 4: Jumlah Baris Transaksi Terdata */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-500">Jumlah Transaksi</span>
            <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums block">
              {entries.length} Catatan
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Sesuai filter aktif</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-center text-slate-500 shrink-0">
            <Receipt className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. DRAWER TINJAUAN USULAN MEMBER (KHUSUS ROLE ADMINISTRATOR)         */}
      {/* ==================================================================== */}
      {isAdmin && showSubmissionsDrawer && (
        <section
          aria-label="Tinjauan Usulan Catatan Kas Member"
          className="bg-amber-50/60 rounded-2xl border border-amber-200/80 p-5 shadow-xs space-y-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
              <h2 className="text-sm font-bold text-amber-950">
                Usulan Catatan Kas dari Member Komunitas ({submissions.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setShowSubmissionsDrawer(false)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950"
            >
              Tutup Panel
            </button>
          </div>

          {submissions.length === 0 ? (
            <p className="text-xs text-amber-800/80 font-medium">
              Belum ada usulan catatan kas yang diajukan oleh member untuk pura ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl border border-amber-200 p-4 space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                        sub.entry_type === 'debit'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {sub.entry_type === 'debit' ? 'Usulan Kas Masuk' : 'Usulan Kas Keluar'}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs space-y-0.5">
                    <p className="font-extrabold text-slate-900 tabular-nums">
                      {formatRupiah(sub.amount)} · {sub.category_name}
                    </p>
                    <p className="text-slate-600 italic">&ldquo;{sub.note}&rdquo;</p>
                    <p className="text-[11px] text-slate-400">
                      Diajukan oleh: <span className="font-semibold">{sub.user_name}</span> (
                      {sub.user_email}) · {formatDateWITA(sub.transaction_date)}
                    </p>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => markRejected(sub.id)}
                        className="min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          markApproved(sub.id);
                          showAlert('Usulan kas disetujui!');
                        }}
                        className="min-h-[32px] px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs transition-all cursor-pointer"
                      >
                        Setujui Usulan
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ==================================================================== */}
      {/* 7. BILAH KONTROL FILTER (TAHUN, KATEGORI, JENIS KAS)                 */}
      {/* ==================================================================== */}
      <section
        aria-label="Panel Filter Transaksi Kas"
        className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tab Pilihan Aliran Kas (Semua vs Masuk vs Keluar) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl self-start">
            <button
              type="button"
              onClick={() => setEntryTypeFilter('all')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Mutasi
            </button>
            <button
              type="button"
              onClick={() => setEntryTypeFilter('debit')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'debit'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Kas Masuk (Punia)
            </button>
            <button
              type="button"
              onClick={() => setEntryTypeFilter('kredit')}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                entryTypeFilter === 'kredit'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Kas Keluar (Belanja)
            </button>
          </div>

          {/* Dropdown Filter Tahun Anggaran & Kategori */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Tahun */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Tahun:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                aria-label="Pilih tahun anggaran kas"
                className="min-h-[38px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] cursor-pointer"
              >
                <option value="Semua">Semua Tahun</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Kategori */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Kategori:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Pilih kategori transaksi kas"
                className="min-h-[38px] px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] cursor-pointer"
              >
                <option value="Semua">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. TABEL MUTASI KAS PURA (RESPONSIF DENGAN HORIZONTAL SCROLL)        */}
      {/* ==================================================================== */}
      <section
        aria-label="Tabel Catatan Mutasi Kas"
        className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden"
      >
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="p-6 space-y-3" aria-busy="true">
            <div className="h-10 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
          </div>
        )}

        {/* Tabel Data Mutasi Kas */}
        {!isLoading && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th scope="col" className="py-3.5 px-4 w-12 text-center">
                    #
                  </th>
                  <th scope="col" className="py-3.5 px-4 whitespace-nowrap">
                    Tanggal
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Aliran
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Kategori
                  </th>
                  <th scope="col" className="py-3.5 px-4">
                    Uraian / Keterangan
                  </th>
                  <th scope="col" className="py-3.5 px-4 text-right whitespace-nowrap">
                    Nominal (Rp)
                  </th>
                  {isAdmin && (
                    <th scope="col" className="py-3.5 px-4 text-center w-28">
                      Aksi
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {entries.map((entry, index) => {
                  const isDebit = entry.entry_type === 'debit';
                  return (
                    <tr
                      key={entry.id}
                      className="hover:bg-teal-50/20 transition-colors group"
                    >
                      {/* Nomor Baris */}
                      <td className="py-3 px-4 text-center text-slate-400 font-mono tabular-nums">
                        {index + 1}
                      </td>

                      {/* Tanggal Transaksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-700">
                        {formatDateWITA(entry.transaction_date)}
                      </td>

                      {/* Badge Aliran Kas */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isDebit
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isDebit ? (
                            <>
                              <TrendingUp className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                              <span>Kas Masuk</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="w-3 h-3 text-rose-600" aria-hidden="true" />
                              <span>Kas Keluar</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Kategori Transaksi */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-900 font-semibold">
                        {entry.category_name}
                      </td>

                      {/* Uraian Keterangan */}
                      <td className="py-3 px-4 text-slate-600 max-w-xs sm:max-w-md">
                        <p className="line-clamp-2">{entry.note || '—'}</p>
                      </td>

                      {/* Nominal Transaksi (Tabular Numbers) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap font-bold tabular-nums">
                        <span className={isDebit ? 'text-emerald-700' : 'text-rose-700'}>
                          {isDebit ? '+' : '-'}
                          {formatRupiah(entry.amount)}
                        </span>
                      </td>

                      {/* Tombol Aksi Khusus Admin */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Edit */}
                            <button
                              type="button"
                              onClick={() => {
                                setEntryToEdit(entry);
                                setIsEntryModalOpen(true);
                              }}
                              aria-label={`Ubah catatan ${entry.note}`}
                              title="Ubah catatan kas"
                              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteModal(entry)}
                              disabled={isDeleting}
                              aria-label={`Hapus catatan ${entry.note}`}
                              title="Hapus catatan kas"
                              className="min-h-[32px] min-w-[32px] inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State: Tidak Ada Transaksi Kas yang Cocok */}
        {!isLoading && entries.length === 0 && (
          <div className="p-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-200/70 flex items-center justify-center mx-auto text-slate-400">
              <Receipt className="w-7 h-7" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Belum Ada Catatan Transaksi Kas
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tidak ada entri mutasi kas yang ditemukan untuk kriteria filter yang Anda pilih.
                {isAdmin && ' Anda dapat menambahkan catatan kas baru melalui tombol di atas.'}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* ==================================================================== */}
      {/* 9. MODAL FORMULIR TRANSAKSI KAS (KHUSUS ADMINISTRATOR)               */}
      {/* ==================================================================== */}
      <FinanceEntryModal
        isOpen={isEntryModalOpen}
        onClose={() => {
          setIsEntryModalOpen(false);
          setEntryToEdit(null);
        }}
        puraId={puraId}
        puraName={pura?.name || 'Pura'}
        entryToEdit={entryToEdit}
        categories={categories}
        onSubmitSuccess={() => refetch()}
      />

      {/* ==================================================================== */}
      {/* 10. MODAL FORMULIR PENGUSULAN KAS (KHUSUS MEMBER PREMIUM)            */}
      {/* ==================================================================== */}
      <FinanceSubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        puraId={puraId}
        puraName={pura?.name || 'Pura'}
        categories={categories}
      />

      {/* ==================================================================== */}
      {/* 11. MODAL KONFIRMASI HAPUS TRANSAKSI KAS (KHUSUS ADMINISTRATOR)      */}
      {/* ==================================================================== */}
      <FinanceDeleteConfirmModal
        isOpen={Boolean(entryToDelete)}
        entry={entryToDelete}
        isLoading={isDeleting}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />

      {/* ==================================================================== */}
      {/* 12. MODAL DIALOG UPGRADE PREMIUM (UNTUK GUEST / MEMBER FREE)         */}
      {/* ==================================================================== */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Fitur Khusus Member Premium"
        description={
          <>
            Pengajuan koreksi dan usulan catatan kas pura adalah hak istimewa bagi{' '}
            <strong className="text-amber-800 font-bold">Member Premium</strong> untuk menjaga
            keabsahan data transparansi komunitas.
          </>
        }
        benefits={[
          'Mengajukan usulan mutasi kas pura',
          'Mendapatkan notifikasi piodalan pura keluarga',
          'Akses penuh perhitungan wariga terperinci',
        ]}
      />
    </div>
  );
};
