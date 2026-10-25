import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Sparkles } from 'lucide-react';
import { fetchKeteranganValueByName } from '../api/otonanApi';

/**
 * ============================================================================
 * KOMPONEN: WarigaExplanationModal (Sub-Modal Penjelasan Nilai Elemen Wariga)
 * ============================================================================
 * Modal dialog tingkat kedua (z-[110]) yang dibuka saat pengguna mengklik tanda panah (→)
 * pada salah satu baris di modal "Detail Wariga":
 *  - Menampilkan uraian makna, filosofi, dan karakteristik nilai elemen yang diklik
 *    (misal: penjelasan untuk Saptawara "Saniscara" atau "Anggara", Wuku "Krulut", dll).
 *  - Mengikuti bahasa desain modern Kalender Bali (seperti HariRayaDetailModal):
 *     1. Header bergradasi halus dengan badge Sparkles & tombol silang (X).
 *     2. Judul nama elemen besar (text-2xl sm:text-3xl font-extrabold text-[#0f172a]).
 *     3. Subtitle kategori elemen dalam tradisi penanggalan Bali.
 *     4. Garis pembatas dekoratif dengan badge "MAKNA & KARAKTERISTIK".
 *     5. Kotak penjelasan berlatar #f8fafc dengan label "Penjelasan:".
 *     6. Footer tombol "Kembali" di pojok kanan bawah.
 *  - Saat ditutup (klik X, tombol Kembali, klik backdrop, atau tombol Escape),
 *    pengguna kembali secara mulus ke jendela Detail Wariga yang lengkap.
 * ============================================================================
 */

interface WarigaExplanationModalProps {
  /** Menandai apakah modal dialog sedang terbuka */
  isOpen: boolean;

  /** Callback untuk menutup modal dialog dan kembali ke modal Detail Wariga */
  onClose: () => void;

  /** Kode kategori API backend Go (misal: "saptawara", "pancawara", "wuku", dll) */
  categoryCode: string;

  /** Nama kategori ramah pengguna (misal: "Saptawara", "Pancawara", "Wuku", dll) */
  categoryName: string;

  /** Nama nilai elemen yang diklik (misal: "Saniscara", "Anggara", "Wage", dll) */
  itemName: string;
}

export const WarigaExplanationModal: React.FC<WarigaExplanationModalProps> = ({
  isOpen,
  onClose,
  categoryCode,
  categoryName,
  itemName,
}) => {
  // -------------------------------------------------------------------------
  // 1. AKSESIBILITAS: LISTENER TOMBOL ESCAPE KHUSUS SUB-MODAL
  // -------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation(); // Cegah modal induk di bawahnya ikut tertutup
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // -------------------------------------------------------------------------
  // 2. QUERY PENJELASAN MAKNA ELEMEN DARI BACKEND GO
  // -------------------------------------------------------------------------
  const { data: detail, isLoading } = useQuery({
    queryKey: ['keterangan', 'value', categoryCode, itemName],
    queryFn: () => fetchKeteranganValueByName(categoryCode, itemName),
    enabled: isOpen && Boolean(itemName),
    staleTime: Infinity, // Data referensi budaya statis, aman di-cache
  });

  if (!isOpen) return null;

  const displayName = detail?.name || itemName;
  const description = detail?.description?.trim() || '';

  const modalContent = (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur di atas Modal Detail Wariga */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Sub-Modal Dialog */}
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-20 max-h-[85vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 px-6 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-100/80 text-teal-800">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="text-sm sm:text-base font-extrabold text-slate-800 tracking-tight">
              {categoryName}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup penjelasan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Utama Penjelasan */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-center">
          {/* Judul Nama Nilai & Subtitle */}
          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
              {displayName}
            </h3>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">
              Elemen {categoryName} dalam Penanggalan Bali
            </p>
          </div>

          {/* Garis Pembatas Dekoratif */}
          <div className="relative flex items-center justify-center my-3">
            <div className="w-full border-t border-slate-100" />
            <span className="absolute bg-white px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">
              Makna & Karakteristik
            </span>
          </div>

          {/* Kotak Uraian Penjelasan Filosofis */}
          <div className="bg-[#f8fafc] border border-slate-100/90 rounded-2xl p-5 sm:p-6 text-left">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-2">
              Penjelasan:
            </span>

            {isLoading ? (
              <div className="space-y-2.5 animate-pulse py-2">
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
                Belum ada catatan uraian khusus yang tersedia untuk {displayName}.
              </p>
            )}
          </div>
        </div>

        {/* Footer Tombol Kembali */}
        <div className="p-4 sm:px-8 border-t border-slate-100 bg-slate-50/50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs active:scale-98 [touch-action:manipulation]"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
