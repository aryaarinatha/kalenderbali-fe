import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';

/**
 * ==============================================================================
 * PROPS: PiodalanDeleteConfirmModal
 * ==============================================================================
 */
export interface PiodalanDeleteConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName?: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanDeleteConfirmModal (Modal Personalisasi Hapus Piodalan/Acara)
 * ==============================================================================
 * Menggantikan alert bawaan browser dengan dialog konfirmasi kustom bertema Kalender Bali.
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
}) => {
  // Listener tombol Escape keyboard
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

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="piodalan-delete-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Kontainer Kartu Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-rose-50/70 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100/90 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="piodalan-delete-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                {title}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Tindakan tidak dapat dibatalkan
              </p>
            </div>
          </div>

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

        {/* Isi Pesan */}
        <div className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
            {message}
          </p>

          {itemName && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
              <p className="text-xs font-bold text-slate-800 break-words line-clamp-2">
                "{itemName}"
              </p>
            </div>
          )}

          {/* Tombol Aksi Bawah */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
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
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

