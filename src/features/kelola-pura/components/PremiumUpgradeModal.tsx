import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Crown, Sparkles } from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: PremiumUpgradeModal
 * ==============================================================================
 */
export interface PremiumUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: React.ReactNode;
  benefits?: string[];
}

/**
 * ==============================================================================
 * KOMPONEN: PremiumUpgradeModal (Modal Konsisten Hak Istimewa Member Premium)
 * ==============================================================================
 * Digunakan secara konsisten pada seluruh sub-halaman Kelola Pura (Piodalan & Keuangan):
 * 1. Desain seragam: Ikon mahkota amber, badge box benefit teal, dan tombol aksi ganda.
 * 2. Tombol Aksi: "Tutup" (abu-abu) dan "Tingkatkan ke Premium" (oranye amber).
 * 3. Aksesibilitas: createPortal ke document.body, escape key listener, backdrop blur.
 * ==============================================================================
 */
export const PremiumUpgradeModal: React.FC<PremiumUpgradeModalProps> = ({
  isOpen,
  onClose,
  title = 'Fitur Khusus Member Premium',
  description = (
    <>
      Pengajuan usulan data pura adalah hak istimewa bagi{' '}
      <strong className="text-amber-800 font-bold">Member Premium</strong> untuk
      menjaga keabsahan data komunitas.
    </>
  ),
  benefits = [
    'Mengusulkan jadwal piodalan pura keluarga/kawitan',
    'Mengusulkan tahapan acara (melasti, puncak, nyineb)',
    'Mendapatkan notifikasi piodalan pura secara presisi',
    'Akses penuh perhitungan wariga terperinci',
  ],
}) => {
  const { showAlert } = useAlertStore();

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

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="premium-upgrade-title"
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Modal */}
      <div className="relative bg-white rounded-3xl border border-slate-200/90 shadow-2xl w-full max-w-md sm:max-w-[490px] overflow-hidden z-10 p-6 sm:p-7 text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600 shadow-2xs">
          <Crown className="w-7 h-7" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <h3
            id="premium-upgrade-title"
            className="text-lg font-extrabold text-slate-900 tracking-tight"
          >
            {title}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-xl text-xs text-teal-900 font-medium text-left space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-teal-950">
            <Sparkles className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
            <span>Keuntungan Akun Premium:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-teal-800">
            {benefits.map((b, idx) => (
              <li key={idx}>{b}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 active:scale-95 transition-all cursor-pointer"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              showAlert('Fitur upgrade akun akan dialihkan ke halaman langganan.');
            }}
            className="min-h-[44px] inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <Crown className="w-4 h-4" aria-hidden="true" />
            <span>Tingkatkan ke Premium</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
