import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Trash2,
  X,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import type { PuraFinanceEntry } from '../types/kelolaPura.types';
import { formatRupiah, formatDateWITA } from '../utils/kelolaPuraUtils';

/**
 * ==============================================================================
 * PROPS: FinanceDeleteConfirmModal
 * ==============================================================================
 * Mengendalikan dialog modal konfirmasi hapus transaksi keuangan:
 * - isOpen: status apakah modal sedang aktif
 * - entry: objek transaksi kas yang akan dihapus
 * - isLoading: status mutasi penghapusan sedang berlangsung di server
 * - onClose: callback untuk membatalkan / menutup modal
 * - onConfirm: callback untuk mengeksekusi penghapusan data
 * ==============================================================================
 */
interface FinanceDeleteConfirmModalProps {
  isOpen: boolean;
  entry: PuraFinanceEntry | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * ==============================================================================
 * KOMPONEN: FinanceDeleteConfirmModal (Modal Personalisasi Hapus Kas)
 * ==============================================================================
 * Menggantikan alert bawaan browser (window.confirm) dengan modal dialog kustom:
 * 1. Menggunakan tema visual sistem Kalender Bali (Tailwind CSS, rounded-3xl).
 * 2. Menampilkan rincian transaksi yang hendak dihapus (nominal, tipe arus kas,
 *    kategori, tanggal, dan uraian) sehingga aman dari salah hapus.
 * 3. Indikator loading interaktif pada tombol konfirmasi saat proses penghapusan.
 * 4. Aksesibilitas penuh: escape key listener, backdrop click, dan body scroll lock.
 * ==============================================================================
 */
export const FinanceDeleteConfirmModal: React.FC<FinanceDeleteConfirmModalProps> = ({
  isOpen,
  entry,
  isLoading,
  onClose,
  onConfirm,
}) => {
  // Listener tombol Escape keyboard untuk membatalkan dialog
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Kunci scrolling halaman saat modal terbuka
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

  if (!isOpen || !entry) return null;

  const isDebit = entry.entry_type === 'debit';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-confirm-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* ==================================================================== */}
      {/* BACKDROP GELAP DENGAN EFEK BLUR HALUS                                 */}
      {/* ==================================================================== */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => {
          if (!isLoading) onClose();
        }}
        aria-hidden="true"
      />

      {/* ==================================================================== */}
      {/* KARTU DIALOG KONFIRMASI                                               */}
      {/* ==================================================================== */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md overflow-hidden z-10 flex flex-col p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Tombol Tutup X di sudut kanan atas */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          aria-label="Tutup dialog"
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* ================================================================== */}
        {/* HEADER: IKON PERINGATAN MERAH & JUDUL                              */}
        {/* ================================================================== */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0 shadow-2xs">
            <Trash2 className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1 pr-6">
            <h2 id="delete-confirm-title" className="text-lg font-bold text-slate-900 tracking-tight">
              Hapus Catatan Kas?
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan dan akan langsung memperbarui saldo kas pura.
            </p>
          </div>
        </div>

        {/* ================================================================== */}
        {/* RINGKASAN DATA TRANSAKSI YANG AKAN DIHAPUS                         */}
        {/* ================================================================== */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
          {/* Nominal & Tipe Arus Kas */}
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                isDebit
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isDebit ? (
                <>
                  <ArrowDownLeft className="w-3 h-3" aria-hidden="true" />
                  <span>Kas Masuk (Punia)</span>
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
                  <span>Kas Keluar (Belanja)</span>
                </>
              )}
            </span>

            <span
              className={`text-sm font-extrabold tabular-nums ${
                isDebit ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {isDebit ? '+' : '-'}
              {formatRupiah(entry.amount)}
            </span>
          </div>

          {/* Uraian Keterangan Transaksi */}
          <div className="text-xs space-y-0.5 border-t border-slate-200/60 pt-2.5">
            <span className="text-slate-400 font-medium block">Uraian / Keterangan:</span>
            <p className="text-slate-900 font-semibold line-clamp-2">
              &quot;{entry.note || 'Tanpa keterangan'}&quot;
            </p>
          </div>

          {/* Kategori Kas & Tanggal Transaksi */}
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-200/60 pt-2.5">
            <div>
              <span className="text-slate-400 font-medium block">Kategori:</span>
              <span className="text-slate-800 font-semibold truncate block">
                {entry.category_name || 'Umum'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-medium block">Tanggal:</span>
              <span className="text-slate-800 font-semibold truncate block">
                {formatDateWITA(entry.transaction_date)}
              </span>
            </div>
          </div>
        </div>

        {/* ================================================================== */}
        {/* FOOTER: TOMBOL BATAL & KONFIRMASI HAPUS                            */}
        {/* ================================================================== */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          {/* Tombol Batal */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>

          {/* Tombol Konfirmasi Hapus */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Menghapus...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" aria-hidden="true" />
                <span>Hapus Catatan Kas</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

