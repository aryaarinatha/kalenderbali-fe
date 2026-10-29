import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  Receipt,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { PuraFinanceCategory } from '../types/kelolaPura.types';
import { useFinanceSubmissions } from '../hooks/useKelolaPura';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: FinanceSubmissionModal
 * ==============================================================================
 * Mengendalikan dialog pengajuan koreksi atau usulan catatan kas oleh Member Premium:
 * - isOpen: Status keterbukaan modal dialog
 * - onClose: Callback ketika modal ditutup
 * - puraId: ID database pura yang diusulkan
 * - puraName: Nama pura untuk judul header modal
 * - categories: Master kategori transaksi kas
 * - onSuccess: Callback saat usulan berhasil ditambahkan ke antrean
 */
interface FinanceSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  puraId: number;
  puraName: string;
  categories: PuraFinanceCategory[];
  onSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: FinanceSubmissionModal (Dialog Pengajuan Usulan Kas Member Premium)
 * ==============================================================================
 * Mengakomodasi hak istimewa Member (Premium) untuk berpartisipasi dalam transparansi
 * kas pura melalui sistem usulan terstruktur (Proposal Submission):
 * 1. Form pengajuan: Jenis kas (Punia/Belanja), kategori, tanggal, nominal, dan alasan koreksi.
 * 2. Identitas Pengusul: Otomatis mencantumkan identitas Member dari auth store.
 * 3. Alur Verifikasi: Usulan masuk ke antrean 'pending' untuk diverifikasi dan disetujui (Approve)
 *    oleh Administrator pura.
 * ==============================================================================
 */
export const FinanceSubmissionModal: React.FC<FinanceSubmissionModalProps> = ({
  isOpen,
  onClose,
  puraId,
  puraName,
  categories,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const { addSubmission } = useFinanceSubmissions(puraId);

  // ============================================================================
  // 1. STATE FORMULIR USULAN KAS
  // ============================================================================
  const [entryType, setEntryType] = useState<'debit' | 'kredit'>('debit');
  const [categoryId, setCategoryId] = useState<number | string>(categories[0]?.id || '');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // ============================================================================
  // 2. MANAJEMEN KEYBOARD ESCAPE & PENGUNCIAN SCROLL BODY
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

  // ============================================================================
  // 3. SUBMIT USULAN KAS MEMBER KE SISTEM
  // ============================================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      showAlert('Nominal usulan harus berupa angka lebih dari 0.');
      return;
    }

    if (!categoryId) {
      showAlert('Silakan pilih kategori transaksi.');
      return;
    }

    if (!note.trim()) {
      showAlert('Silakan isi rincian atau alasan pengajuan usulan kas ini.');
      return;
    }

    const matchedCategory = categories.find((c) => String(c.id) === String(categoryId));
    const categoryName = matchedCategory ? matchedCategory.name : 'Umum';

    // Simpan usulan ke antrean persetujuan
    addSubmission({
      pura_id: puraId,
      pura_name: puraName,
      user_id: user?.id || 'guest',
      user_name: user?.name || 'Member Komunitas',
      user_email: user?.email || '',
      entry_type: entryType,
      amount: parsedAmount,
      category_id: Number(categoryId),
      category_name: categoryName,
      transaction_date: transactionDate,
      note: note.trim(),
    });

    showAlert('Usulan catatan kas berhasil dikirimkan! Pengurus akan meninjau dan memverifikasinya.');
    if (onSuccess) onSuccess();
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="submission-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Gelap */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Dialog */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-lg overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-amber-50/70 via-white to-teal-50/50 p-5 sm:p-6 border-b border-slate-200/80 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-amber-700 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                <span>Hak Istimewa Member Premium</span>
              </div>
              <h2
                id="submission-modal-title"
                className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight"
              >
                Ajukan Usulan / Koreksi Kas
              </h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">{puraName}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup formulir usulan kas"
              className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-hidden cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Isi Formulir */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4">
          {/* Banner Pemberitahuan Prosedur Verifikasi */}
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 space-y-1">
            <p className="font-semibold">Catatan Transparansi Komunitas:</p>
            <p className="text-amber-800/90">
              Usulan yang Anda kirimkan akan ditinjau oleh Administrator pura sebelum resmi masuk ke
              dalam laporan kas mutasi publik.
            </p>
          </div>

          {/* Opsi Jenis Aliran Kas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Jenis Usulan <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setEntryType('debit')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'debit'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                <span>Usulan Punia (Masuk)</span>
              </button>

              <button
                type="button"
                onClick={() => setEntryType('kredit')}
                className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  entryType === 'kredit'
                    ? 'bg-rose-50 border-rose-400 text-rose-800 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <TrendingDown className="w-4 h-4 text-rose-600" aria-hidden="true" />
                <span>Usulan Belanja (Keluar)</span>
              </button>
            </div>
          </div>

          {/* Kategori Transaksi */}
          <div className="space-y-1.5">
            <label htmlFor="sub-category" className="block text-xs font-bold text-slate-700">
              Kategori Transaksi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Tag className="w-4 h-4" aria-hidden="true" />
              </div>
              <select
                id="sub-category"
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

          {/* Baris Tanggal & Nominal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="sub-date" className="block text-xs font-bold text-slate-700">
                Tanggal Terkait <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="sub-date"
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="sub-amount" className="block text-xs font-bold text-slate-700">
                Nominal Usulan (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Receipt className="w-4 h-4" aria-hidden="true" />
                </div>
                <input
                  id="sub-amount"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Contoh: 250000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full min-h-[44px] pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Rincian Keterangan / Alasan Usulan */}
          <div className="space-y-1.5">
            <label htmlFor="sub-note" className="block text-xs font-bold text-slate-700">
              Rincian Keterangan / Bukti Koreksi <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                <FileText className="w-4 h-4" aria-hidden="true" />
              </div>
              <textarea
                id="sub-note"
                rows={3}
                placeholder="Jelaskan alasan atau detail transaksi (misal: Koreksi punia krama banjar yang belum tercatat)..."
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
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Batal
            </button>

            <button
              type="submit"
              className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e9f90] text-white hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Kirimkan Usulan</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

