import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PlusCircle,
  Pencil,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Receipt,
  FileText,
  Loader2,
} from 'lucide-react';
import type {
  PuraFinanceEntry,
  PuraFinanceCategory,
  CreateFinanceEntryPayload,
  UpdateFinanceEntryPayload,
} from '../types/kelolaPura.types';
import { useFinanceMutations } from '../hooks/useKelolaPura';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: FinanceEntryModal
 * ==============================================================================
 * Mengendalikan dialog formulir pencatatan transaksi kas oleh Administrator:
 * - isOpen: Status apakah modal sedang aktif
 * - onClose: Callback ketika modal ditutup
 * - puraId: ID database pura yang dicatat mutasi kasnya
 * - puraName: Nama pura untuk judul header modal
 * - entryToEdit: Objek mutasi kas yang sedang diedit (null jika mode tambah baru)
 * - categories: Daftar master kategori kas (Punia, Banten, Renovasi, dll)
 * - onSubmitSuccess: Callback saat mutasi berhasil dieksekusi ke backend
 */
interface FinanceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puraId: number;
  puraName: string;
  entryToEdit: PuraFinanceEntry | null;
  categories: PuraFinanceCategory[];
  onSubmitSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: FinanceEntryModal (Formulir Transaksi Kas Khusus Administrator)
 * ==============================================================================
 * Modal dialog eksklusif Role Admin untuk melakukan Create / Update mutasi kas:
 * 1. Pilihan Tipe Arus Kas: Kas Masuk / Punia (Debit) atau Kas Keluar / Pengeluaran (Kredit).
 * 2. Pemilihan Kategori Kas: Dropdown master dari backend Go (/api/v1/finance/categories).
 * 3. Tanggal Transaksi: Input kalender format YYYY-MM-DD.
 * 4. Jumlah Nominal: Format angka numerik Rupiah dengan validasi ketat.
 * 5. Uraian Keterangan: Catatan rincian keperluan mutasi.
 * 6. Keamanan & Aksesibilitas: createPortal ke document.body (z-[100]), backdrop blur,
 *    dan penguncian scroll layar.
 * ==============================================================================
 */
export const FinanceEntryModal: React.FC<FinanceEntryModalProps> = ({
  isOpen,
  onClose,
  puraId,
  puraName,
  entryToEdit,
  categories,
  onSubmitSuccess,
}) => {
  const { showAlert } = useAlertStore();
  const { createEntry, updateEntry, isCreating, isUpdating } = useFinanceMutations(puraId);

  // ============================================================================
  // 1. STATE FORMULIR & SINKRONISASI EDIT/TAMBAH (POLA RESMI REACT)
  // ============================================================================
  const [entryType, setEntryType] = useState<'debit' | 'kredit'>(
    entryToEdit ? entryToEdit.entry_type : 'debit'
  );
  const [categoryId, setCategoryId] = useState<number | string>(
    entryToEdit ? entryToEdit.category_id : categories[0]?.id || ''
  );
  const [transactionDate, setTransactionDate] = useState<string>(
    entryToEdit
      ? entryToEdit.transaction_date.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState<string>(
    entryToEdit ? String(entryToEdit.amount) : ''
  );
  const [note, setNote] = useState<string>(entryToEdit ? entryToEdit.note : '');

  // Selaraskan nilai form saat entryToEdit berubah dari luar (tanpa useEffect yang memicu cascading render)
  const [prevEntry, setPrevEntry] = useState<PuraFinanceEntry | null>(entryToEdit);
  if (prevEntry !== entryToEdit) {
    setPrevEntry(entryToEdit);
    setEntryType(entryToEdit ? entryToEdit.entry_type : 'debit');
    setCategoryId(entryToEdit ? entryToEdit.category_id : categories[0]?.id || '');
    setTransactionDate(
      entryToEdit
        ? entryToEdit.transaction_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10)
    );
    setAmount(entryToEdit ? String(entryToEdit.amount) : '');
    setNote(entryToEdit ? entryToEdit.note : '');
  }

  // ============================================================================
  // 2. LISTENER KEYBOARD ESCAPE & PENGUNCIAN SCROLL BODY
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

  if (!isOpen) return null;

  const isEditing = Boolean(entryToEdit);
  const isSubmitting = isCreating || isUpdating;

  // ============================================================================
  // 3. SUBMIT FORMULIR KE BACKEND GO (POST / PUT)
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert('Nominal transaksi harus berupa angka lebih dari 0.');
      return;
    }

    if (!categoryId) {
      showAlert('Silakan pilih kategori transaksi.');
      return;
    }

    if (!note.trim()) {
      showAlert('Silakan isi uraian keterangan transaksi.');
      return;
    }

    try {
      if (isEditing && entryToEdit) {
        // Mode Ubah Transaksi (PUT /api/v1/finance/:id)
        const payload: UpdateFinanceEntryPayload = {
          category_id: Number(categoryId),
          transaction_date: transactionDate,
          entry_type: entryType,
          amount: parsedAmount,
          note: note.trim(),
        };
        await updateEntry({ id: entryToEdit.id, payload });
      } else {
        // Mode Tambah Transaksi Baru (POST /api/v1/puras/:id/finance)
        const payload: CreateFinanceEntryPayload = {
          pura_id: puraId,
          category_id: Number(categoryId),
          transaction_date: transactionDate,
          entry_type: entryType,
          amount: parsedAmount,
          note: note.trim(),
        };
        await createEntry(payload);
      }

      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    } catch {
      // Error sudah ditangani dan ditampilkan oleh alert store di dalam hook
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="finance-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Gelap dengan Efek Blur */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Kartu Modal */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-teal-50 via-white to-emerald-50/50 p-5 sm:p-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#0e9f90] rounded-full inline-block" />
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                  Administrasi Kas Pura
                </span>
              </div>
              <h2
                id="finance-modal-title"
                className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
              >
                {isEditing ? 'Ubah Catatan Kas' : 'Catat Transaksi Kas Baru'}
              </h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{puraName}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup formulir keuangan"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Konten Formulir Input */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Pilihan Jenis Arus Kas (Debit vs Kredit) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Jenis Aliran Kas <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Opsi Debit (Kas Masuk / Punia) */}
              <button
                type="button"
                onClick={() => setEntryType('debit')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'debit'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Kas Masuk (Punia)</span>
              </button>

              {/* Opsi Kredit (Kas Keluar / Pengeluaran) */}
              <button
                type="button"
                onClick={() => setEntryType('kredit')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'kredit'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Kas Keluar (Belanja)</span>
              </button>
            </div>
          </div>

          {/* Pemilihan Kategori Kas */}
          <div className="space-y-1.5">
            <label htmlFor="finance-category" className="block text-xs font-bold text-slate-700">
              Kategori Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" aria-hidden="true" />
              </div>
              <select
                id="finance-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full min-h-[44px] pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="" disabled>
                  Pilih Kategori Kas
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Baris Tanggal & Jumlah Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Tanggal Transaksi */}
            <div className="space-y-1.5">
              <label htmlFor="finance-date" className="block text-xs font-bold text-slate-700">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="finance-date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Jumlah Nominal (Rupiah) */}
            <div className="space-y-1.5">
              <label htmlFor="finance-amount" className="block text-xs font-bold text-slate-700">
                Nominal (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Receipt className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="finance-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Catatan Keterangan / Uraian Keperluan */}
          <div className="space-y-1.5">
            <label htmlFor="finance-note" className="block text-xs font-bold text-slate-700">
              Keterangan / Uraian Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <textarea
                id="finance-note"
                rows={3}
                placeholder="Rincian peruntukan dana (contoh: Punia dari krama banjar, pembelian banten pejati piodalan)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all resize-none"
              />
            </div>
          </div>

          {/* Footer Tombol Aksi */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e9f90] text-white hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : isEditing ? (
                <>
                  <Pencil className="w-4 h-4" aria-hidden="true" />
                  <span>Simpan Perubahan</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" aria-hidden="true" />
                  <span>Catat Transaksi</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

