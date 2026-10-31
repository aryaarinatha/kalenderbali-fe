import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle } from 'lucide-react';
import type { PadewasanItem } from '../types/warigaPersonal.types';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: DewasaTanggalLahirModal
 * ============================================================================
 * Modal dialog pop-up yang menyajikan daftar Ala Ayuning Dewasa (Padewasan)
 * yang aktif pada tanggal kelahiran pengguna (Gambar 5 & 6 sistem lama):
 *  - Mengambil data langsung dari endpoint GET /api/v1/search/ala-ayuning-dewasa.
 *  - Menampilkan setiap kriteria padewasan (nama, deskripsi anjuran/pantangan,
 *    dan siluet ikon Candi Bentar khas arsitektur Bali).
 *
 * Mengikuti Panduan AGENTS.md:
 *  - createPortal ke document.body (z-[100])
 *  - Desain konsisten dengan dialog modal kalender lainnya
 * ============================================================================
 */

interface DewasaTanggalLahirModalProps {
  isOpen: boolean;
  onClose: () => void;
  birthDate: string; // "YYYY-MM-DD"
  items: PadewasanItem[];
  isLoading: boolean;
}

/**
 * Ikon Vektor Siluet Candi Bentar Bali (Sesuai Referensi Gambar 5 & 6)
 */
const CandiBentarIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    {/* Siluet Gerbang Kiri */}
    <path d="M10 6 L20 6 L20 42 L12 42 L12 36 L10 36 Z M14 12 L18 12 L18 16 L14 16 Z M14 20 L18 20 L18 24 L14 24 Z M14 28 L18 28 L18 32 L14 32 Z" opacity="0.9" />
    {/* Siluet Gerbang Kanan */}
    <path d="M28 6 L38 6 L38 36 L36 36 L36 42 L28 42 Z M30 12 L34 12 L34 16 L30 16 Z M30 20 L34 20 L34 24 L30 24 Z M30 28 L34 28 L34 32 L30 32 Z" opacity="0.9" />
  </svg>
);

export const DewasaTanggalLahirModal: React.FC<DewasaTanggalLahirModalProps> = ({
  isOpen,
  onClose,
  birthDate,
  items,
  isLoading,
}) => {
  // Aksesibilitas: listener tombol Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest block">
              Padewasan & Ala Ayuning
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
              Dewasa Tanggal Lahir
            </h3>
            <p className="text-xs font-semibold text-slate-500">
              {formatFullIndoDate(birthDate)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela dewasa kelahiran"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-3">
          {isLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <div className="text-sm font-semibold text-slate-700">
                Tidak ada catatan khusus dewasa ayu / ala
              </div>
              <p className="text-xs text-slate-400">
                Pada tanggal kelahiran ini tidak ditemukan catatan pantangan atau anjuran spesifik padewasan.
              </p>
            </div>
          ) : (
            items.map((padewasan) => (
              <div
                key={padewasan.id || padewasan.nama}
                className="p-4 rounded-xl border border-slate-200/90 bg-white hover:border-teal-500/30 hover:shadow-2xs transition-all flex items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-[#0f172a] tracking-tight">
                    {padewasan.nama}
                  </h4>
                  {padewasan.keterangan ? (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {padewasan.keterangan}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Kriteria penanggalan padewasan aktif pada hari kelahiran.
                    </p>
                  )}
                </div>

                {/* Ornamen Ikon Candi Bentar Bali */}
                <div className="text-teal-500/40 shrink-0">
                  <CandiBentarIcon className="w-10 h-10" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

