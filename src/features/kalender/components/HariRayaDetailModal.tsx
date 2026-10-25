import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import { useHariRayaDetail } from '@/features/keterangan';

/**
 * ============================================================================
 * KOMPONEN: HariRayaDetailModal
 * ============================================================================
 * Modal dialog pop-up uraian makna dan filosofi Hari Raya / Rahinan:
 *  - Header dengan gradien lembut, badge Sparkles "Hari Raya & Rerainan", dan tombol tutup (X).
 *  - Nama Hari Raya besar dan tegas (text-2xl sm:text-3xl font-extrabold).
 *  - Subtitle keterangan kategori perayaan suci Hindu Bali.
 *  - Tanpa gambar/ilustrasi (fokus pada esensi makna & keterbacaan teks).
 *  - Garis pembatas dekoratif dengan badge "MAKNA & FILOSOFI".
 *  - Kotak kontainer deskripsi filosofis utuh tanpa terpotong.
 *  - Footer tombol "Tutup" di pojok kanan bawah.
 *
 * Efek Blur Menyeluruh (createPortal ke document.body):
 *  - Menggunakan createPortal ke document.body dengan z-[100] sehingga
 *    backdrop blur menutupi seluruh layar (termasuk Sidebar dan cell tanggal).
 *  - scrollbar-gutter: stable mencegah layout shifting.
 * ============================================================================
 */

interface HariRayaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  holidayId?: string;
  holidayName?: string;
}

export const HariRayaDetailModal: React.FC<HariRayaDetailModalProps> = ({
  isOpen,
  onClose,
  holidayId,
  holidayName,
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

  // Ambil data detail makna hari raya dari cache TanStack Query
  const { detail, isLoading } = useHariRayaDetail(holidayId, holidayName);

  if (!isOpen) return null;

  const displayName = holidayName || detail?.name || 'Penjelasan Hari Raya';
  const description = detail?.description || '';

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur Menyeluruh ke Seluruh Halaman (Sidebar, Navbar, & Grid Tanggal) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Modal Dialog (Melebar proporsional max-w-2xl) */}
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 px-6 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-100/80 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              Hari Raya & Rerainan
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela hari raya"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama Hari Raya */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-center">
          {/* Judul & Subtitle */}
          <div className="space-y-1.5">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {displayName}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Rahinan & Hari Suci Hindu Bali
            </p>
          </div>

          {/* Garis Pembatas Dekoratif */}
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Makna & Filosofi
            </span>
          </div>

          {/* Uraian Makna & Penjelasan Lengkap (Lebih lapang & mudah dibaca) */}
          <div className="bg-[#f8fafc] border border-slate-200/80 rounded-2xl p-5 sm:p-6 text-left shadow-2xs">
            {isLoading ? (
              <div className="space-y-2.5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-5/6" />
                <div className="h-4 bg-slate-200 rounded w-4/6" />
              </div>
            ) : description ? (
              <p className="text-sm sm:text-[15px] text-slate-700 leading-relaxed font-normal whitespace-pre-line text-left">
                {description}
              </p>
            ) : (
              <p className="text-sm text-slate-400 italic text-center py-2">
                Belum ada uraian penjelasan khusus yang tercatat untuk {displayName}.
              </p>
            )}
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
