import React, { useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2, ArrowRight, ArrowLeft, Layers } from 'lucide-react';

/**
 * ==============================================================================
 * PROPS: PiodalanDeleteConfirmModal
 * ==============================================================================
 * Mendukung konfirmasi hapus tunggal maupun alur konfirmasi hapus 2-tahap
 * (2-step confirmation warning modal) apabila entitas yang dihapus memiliki
 * dependensi anak (misal: piodalan yang masih memiliki susunan acara).
 * ==============================================================================
 */
export interface PiodalanDeleteConfirmModalProps {
  /** Status visibilitas modal dialog */
  isOpen: boolean;
  /** Judul utama modal dialog pada tahap konfirmasi */
  title: string;
  /** Pesan konfirmasi final penghapusan */
  message: string;
  /** Label atau nama data yang akan dihapus */
  itemName?: string;
  /** Indikator loading saat proses mutasi penghapusan berjalan */
  isLoading: boolean;
  /** Callback untuk menutup modal dialog dan membatalkan aksi */
  onClose: () => void;
  /** Callback eksekusi penghapusan permanen ke backend */
  onConfirm: () => Promise<void> | void;
  /** Flag apakah entitas memiliki turunan/keterkaitan data (misal susunan acara) */
  hasChildItems?: boolean;
  /** Jumlah data turunan yang terikat dan akan ikut terhapus */
  childItemsCount?: number;
  /** Pesan peringatan tahap pertama mengenai kaskade penghapusan data anak */
  childWarningMessage?: string;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanDeleteConfirmModal (Modal Konfirmasi Hapus Bertahap)
 * ==============================================================================
 * Menampilkan dialog konfirmasi dengan dukungan proteksi 2 langkah (2-step confirmation):
 * - Langkah 1: Peringatan jika data piodalan masih memiliki susunan acara terdaftar.
 * - Langkah 2: Konfirmasi final apakah pengguna benar-benar yakin menghapus permanen.
 * ==============================================================================
 */
export const PiodalanDeleteConfirmModal: React.FC<PiodalanDeleteConfirmModalProps> = ({
  isOpen,
  title,
  message,
  itemName,
  isLoading,
  onClose,
  onConfirm,
  hasChildItems = false,
  childItemsCount = 0,
  childWarningMessage,
}) => {
  // State langkah konfirmasi aktif (1 = Peringatan Kaskade Acara, 2 = Konfirmasi Final Permanen)
  const initialStep = hasChildItems && childItemsCount > 0 ? 1 : 2;
  const [currentStep, setCurrentStep] = useState<1 | 2>(initialStep);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Penyelarasan langkah saat modal dibuka kembali dari keadaan tertutup tanpa memicu cascading renders
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setCurrentStep(initialStep);
    }
  }

  // Listener keyboard untuk menutup modal dengan tombol Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Kunci scrolling halaman latar belakang saat modal aktif
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

  // Menentukan apakah modal sedang berada di alur 2 langkah
  const isTwoStepFlow = Boolean(hasChildItems && childItemsCount > 0);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="piodalan-delete-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop Latar Belakang Redup */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Kontainer Kartu Dialog Konfirmasi */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* ==================================================================== */}
        {/* HEADER MODAL                                                         */}
        {/* ==================================================================== */}
        <div
          className={`p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between ${
            currentStep === 1
              ? 'bg-gradient-to-r from-amber-50/80 to-transparent'
              : 'bg-gradient-to-r from-rose-50/80 to-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Ikon Header Sesuai Langkah */}
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                currentStep === 1
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-600'
              }`}
            >
              {currentStep === 1 ? (
                <Layers className="w-5 h-5" aria-hidden="true" />
              ) : (
                <AlertTriangle className="w-5 h-5" aria-hidden="true" />
              )}
            </div>

            {/* Judul & Indikator Langkah */}
            <div>
              <h2
                id="piodalan-delete-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                {currentStep === 1 ? 'Peringatan Susunan Acara' : title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {isTwoStepFlow
                  ? currentStep === 1
                    ? 'Langkah 1 dari 2: Peringatan Kaskade Data'
                    : 'Langkah 2 dari 2: Konfirmasi Final Penghapusan'
                  : 'Tindakan tidak dapat dibatalkan'}
              </p>
            </div>
          </div>

          {/* Tombol Silang Batal */}
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Batal dan tutup dialog"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* ==================================================================== */}
        {/* KONTEN BODY MODAL                                                    */}
        {/* ==================================================================== */}
        <div className="p-5 sm:p-6 space-y-4">
          
          {/* LANGKAH 1: PERINGATAN KETERKAITAN DATA SUSUNAN ACARA */}
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Kotak Pesan Peringatan Kaskade */}
              <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-4 text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" aria-hidden="true" />
                  <span>Piodalan Memiliki Susunan Acara Terdaftar</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed text-amber-800 font-medium">
                  {childWarningMessage || (
                    <>
                      Jadwal piodalan ini tercatat memiliki{' '}
                      <span className="font-extrabold underline">{childItemsCount} susunan acara</span>{' '}
                      terdaftar. Menghapus piodalan ini akan sekaligus menghapus seluruh tahapan acara
                      terkait secara permanen dari basis data.
                    </>
                  )}
                </p>
              </div>

              {/* Rincian Target Piodalan */}
              {itemName && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Jadwal Piodalan Sasaran
                  </span>
                  <p className="text-xs font-bold text-slate-800 break-words line-clamp-2">
                    {itemName}
                  </p>
                </div>
              )}

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Apakah Anda ingin tetap melanjutkan ke tahap konfirmasi penghapusan?
              </p>
            </div>
          )}

          {/* LANGKAH 2: KONFIRMASI FINAL PENGHAPUSAN PERMANEN */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Pesan Konfirmasi Utama */}
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {message}
              </p>

              {/* Rincian Target Item */}
              {itemName && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                  <span className="text-[11px] font-semibold text-slate-400 block uppercase tracking-wider mb-1">
                    Data yang akan dihapus
                  </span>
                  <p className="text-xs font-bold text-slate-800 break-words line-clamp-2">
                    "{itemName}"
                  </p>
                </div>
              )}

              {/* Catatan Tegas Kerusakan Permanen */}
              <div className="bg-rose-50/60 border border-rose-200/70 rounded-xl p-3">
                <p className="text-xs text-rose-700 font-semibold leading-relaxed">
                  Perhatian: Data yang telah dihapus tidak dapat dipulihkan kembali oleh sistem.
                </p>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* TOMBOL AKSI BAWAH                                                   */}
          {/* ==================================================================== */}
          <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
            {/* Tombol Sebelah Kiri: Kembali (jika di step 2 flow bertahap) atau Batal */}
            {isTwoStepFlow && currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>Kembali</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
            )}

            {/* Tombol Sebelah Kanan: Lanjutkan (Langkah 1) atau Hapus Sekarang (Langkah 2) */}
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isLoading}
                className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                <span>Lanjutkan</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                    <span>Menghapus...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    <span>Hapus Sekarang</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
