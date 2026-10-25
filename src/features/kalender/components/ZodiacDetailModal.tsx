import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import type { ZodiacItem } from '@/features/keterangan';
import { getIndoMonthName } from '../utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: ZodiacDetailModal
 * ============================================================================
 * Modal dialog pop-up yang menyajikan rincian lengkap Zodiak Bulanan:
 *  - Header dengan judul "Bulan [Nama Bulan]" dan tombol tutup (X).
 *  - Nama Zodiak (contoh: "Libra", "Scorpio", dll).
 *  - Rentang tanggal astronomis zodiak (contoh: "22 September - 21 Oktober").
 *  - Ilustrasi vektor SVG zodiak asli yang beresolusi tajam.
 *  - Uraian karakter, watak, dan filosofi zodiak secara utuh tanpa terpotong.
 *  - Menggunakan createPortal ke document.body dengan z-[100] agar backdrop blur
 *    menyelimuti seluruh layar (Sidebar & Kalender).
 *
 * Aksesibilitas (WAI-ARIA):
 *  - Menutup dialog saat tombol 'Escape' ditekan.
 *  - Menutup dialog saat mengklik area backdrop luar.
 * ============================================================================
 */

interface ZodiacDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  zodiac: ZodiacItem;
  month: number; // 1 s/d 12
}

export const ZodiacDetailModal: React.FC<ZodiacDetailModalProps> = ({
  isOpen,
  onClose,
  zodiac,
  month,
}) => {
  // Listener tombol 'Escape' untuk aksesibilitas keyboard & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const monthName = getIndoMonthName(month);

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur Menyeluruh ke Seluruh Halaman */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Modal Dialog (Standar AGENTS.md Bab 4.7) */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 px-6 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-100/80 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              Bulan {monthName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela zodiak"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama Zodiak */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center">
          {/* Judul & Rentang Tanggal */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {zodiac.name}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 tabular-nums">
              {zodiac.dateRange}
            </p>
          </div>

          {/* Gambar Ilustrasi SVG Zodiak */}
          <div className="flex justify-center py-2">
            <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-2xl bg-[#f8fafc] border border-slate-200/70 flex items-center justify-center p-4 shadow-2xs">
              <img
                src={zodiac.imagePath}
                alt={zodiac.name}
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
          </div>

          {/* Garis Pembatas Dekoratif */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Karakter & Watak
            </span>
          </div>

          {/* Uraian Watak & Karakteristik Lengkap */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-left shadow-2xs">
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {zodiac.description}
            </p>
          </div>
        </div>

        {/* Footer Tombol Tutup (Standar Secondary Button AGENTS.md Bab 4.4) */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

