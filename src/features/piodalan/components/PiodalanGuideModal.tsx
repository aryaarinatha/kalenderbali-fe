import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Landmark, CheckCircle2 } from 'lucide-react';

/**
 * ==============================================================================
 * KOMPONEN: PiodalanGuideModal (Modal Dialog Panduan Penanggalan Piodalan)
 * ==============================================================================
 * Modal edukatif yang dibuka saat pengguna mengklik tombol 'Baca panduan penanggalan'
 * pada Widget 3 ('Memahami hasil').
 *
 * Menjelaskan:
 * 1. Perbedaan mendasar Piodalan berbasis Pawukon (210 hari) vs berbasis Sasih (Purnama/Tilem)
 * 2. Konsep Dresta Desa Pekraman & variasi tata laksana upacara lokal
 * 3. Peran kontributor dalam memperbarui informasi rangkaian acara dan jam upacara
 * ==============================================================================
 */

interface PiodalanGuideModalProps {
  /** Status apakah modal panduan sedang terbuka */
  isOpen: boolean;

  /** Callback untuk menutup modal dialog */
  onClose: () => void;
}

export const PiodalanGuideModal: React.FC<PiodalanGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Listener tombol Escape keyboard
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

  const modalNode = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Wadah Dialog Modal */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/40 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-[#0e9f90] rounded-full inline-block" />
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                Panduan Penanggalan
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Pedoman Piodalan Pura di Bali
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Memahami siklus waktu upacara pujawali dan tradisi dresta desa.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela panduan"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Scrollable Panduan */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Poin 1: Dua Basis Penanggalan */}
          <div className="bg-[#f8fafc] border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
              <Calendar className="w-4 h-4 text-[#0e9f90]" />
              <span>1. Dua Basis Waktu Piodalan</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Piodalan atau Pujawali pura di Bali terbagi menjadi dua sistem perhitungan:
            </p>
            <ul className="space-y-2 pl-4 list-disc text-xs text-slate-600">
              <li>
                <strong className="text-slate-800">Siklus Pawukon (210 Hari):</strong> Dihitung dari
                pertemuan Saptawara, Pancawara, dan Wuku. Upacara berulang setiap 6 bulan kalender Bali
                (misal: *Buda Kliwon Pahang*, *Saniscara Kliwon Kuningan*).
              </li>
              <li>
                <strong className="text-slate-800">Siklus Sasih (1 Tahun Candra):</strong> Dihitung
                berdasarkan fase bulan (Purnama atau Tilem) pada Sasih tertentu (misal: *Purnama Kadasa*
                di Pura Besakih, *Purnama Kapat* di Batur).
              </li>
            </ul>
          </div>

          {/* Poin 2: Konfirmasi Tradisi Desa Pekraman */}
          <div className="bg-[#f8fafc] border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
              <Landmark className="w-4 h-4 text-[#0e9f90]" />
              <span>2. Konfirmasi Dresta Desa Setempat</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Meskipun penanggalan wariga bersifat matematis pasti, pelaksanaan upacara (*dudukan karya*)
              dapat berlangsung 1 hari (*Nyejer 1 hari*), 3 hari, atau hingga 11 hari tergantung awig-awig
              dan dresta desa pekraman setempat. Krama disarankan tetap mengonfirmasi kepada pengempon pura.
            </p>
          </div>

          {/* Poin 3: Kontribusi Data & Jadwal Acara */}
          <div className="bg-[#f8fafc] border border-slate-200/70 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-teal-800 font-extrabold text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#0e9f90]" />
              <span>3. Pembaruan Jadwal oleh Kontributor</span>
            </div>
            <p className="text-slate-600 text-xs leading-relaxed">
              Jadwal jam persembahyangan dan rangkaian tahapan upacara (*Melasti, Puncak Karya, Panyineban*)
              dapat dilengkapi oleh pengurus pura yang telah terverifikasi sebagai Kontributor melalui modul
              Kelola Pura.
            </p>
          </div>
        </div>

        {/* Footer Tombol Tutup */}
        <div className="p-4 sm:p-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalNode, document.body);
};
