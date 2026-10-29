import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Calendar,
  Sparkles,
  AlignLeft,
  FileText,
  CalendarDays,
} from 'lucide-react';
import { usePiodalanSubmissions } from '../hooks/useKelolaPura';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: PiodalanSubmissionModal
 * ==============================================================================
 */
export interface PiodalanSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  puraId: number;
  puraName: string;
  onSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanSubmissionModal (Dialog Pengajuan Usulan Piodalan Member)
 * ==============================================================================
 * Mengakomodasi partisipasi krama / umat dalam mengusulkan jadwal piodalan resmi pura:
 * 1. Tanggal Pelaksanaan Odalan yang diusulkan
 * 2. Tingkatan Upacara (Nista, Madya, Utama)
 * 3. Keterangan / Sebutan Acara
 * 4. Catatan / Alasan Rujukan Pengajuan
 * 5. Identitas Pengusul: Otomatis tercatat dari profil pengguna login.
 * ==============================================================================
 */
export const PiodalanSubmissionModal: React.FC<PiodalanSubmissionModalProps> = ({
  isOpen,
  onClose,
  puraId,
  puraName,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const { addPiodalanSubmission } = usePiodalanSubmissions(puraId);

  // State Formulir
  const [ceremonyDate, setCeremonyDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [description, setDescription] = useState<string>('Piodalan Ageng Pura');
  const [levelId, setLevelId] = useState<number | ''>(2);
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Handle tombol Escape keyboard
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ceremonyDate) {
      showAlert('Tanggal piodalan wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    const levelNames: Record<number, string> = {
      1: 'Nista',
      2: 'Madya',
      3: 'Utama',
    };

    addPiodalanSubmission({
      pura_id: puraId,
      pura_name: puraName,
      user_id: String(user?.id || 'guest'),
      user_name: user?.name || 'Member Wargabali',
      user_email: user?.email || '-',
      ceremony_date: ceremonyDate,
      description: description.trim() || 'Piodalan Ageng Pura',
      level_id: levelId !== '' ? Number(levelId) : null,
      level_name: levelId !== '' ? levelNames[Number(levelId)] : undefined,
      reason: reason.trim() || undefined,
    });

    setIsSubmitting(false);
    showAlert('Usulan jadwal piodalan berhasil diajukan untuk ditinjau oleh Admin!');
    if (onSuccess) onSuccess();
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="piodalan-submission-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Kontainer Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/70 via-teal-50/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="piodalan-submission-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                Ajukan Usulan Jadwal Piodalan
              </h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {puraName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir usulan"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Info Card Pengusul */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Pengusul:</span>
            <span className="font-bold text-slate-800">
              {user?.name || 'Member Komunitas'} ({user?.email || 'Akun Aktif'})
            </span>
          </div>

          {/* 1. Tanggal Pelaksanaan Odalan */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-piodalan-date"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Tanggal Piodalan yang Diusulkan</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="sub-piodalan-date"
              type="date"
              value={ceremonyDate}
              onChange={(e) => setCeremonyDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-slate-50/50"
            />
          </div>

          {/* 2. Tingkatan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-piodalan-level"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Perkiraan Tingkatan Upacara</span>
            </label>
            <select
              id="sub-piodalan-level"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white"
            >
              <option value="">Belum ditentukan</option>
              <option value="1">Nista (Sederhana)</option>
              <option value="2">Madya (Menengah / Standar)</option>
              <option value="3">Utama (Ageng / Besar)</option>
            </select>
          </div>

          {/* 3. Sebutan / Nama Piodalan */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-piodalan-desc"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <AlignLeft className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Nama / Sebutan Upacara</span>
            </label>
            <input
              id="sub-piodalan-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Piodalan Ageng Pura Penataran"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white"
            />
          </div>

          {/* 4. Alasan / Rujukan Pengusulan */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-piodalan-reason"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Alasan / Rujukan Usulan</span>
            </label>
            <textarea
              id="sub-piodalan-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Berdasarkan musyawarah prajuru banjar dan rujukan purana pura..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white resize-none"
            />
          </div>

          {/* Footer Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>Kirim Usulan Odalan</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

