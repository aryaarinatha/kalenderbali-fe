import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Send,
  Calendar,
  Clock,
  Sparkles,
  User,
  Phone,
  Tag,
  FileText,
} from 'lucide-react';
import { usePiodalanSubmissions } from '../hooks/useKelolaPura';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: AcaraSubmissionModal
 * ==============================================================================
 */
export interface AcaraSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  piodalanId: number;
  puraId: number;
  puraName: string;
  piodalanDate?: string;
  onSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: AcaraSubmissionModal (Dialog Pengajuan Usulan Susunan Acara Member)
 * ==============================================================================
 * Mengakomodasi partisipasi krama / umat dalam mengusulkan tahapan upacara:
 * 1. Nama Tahapan Upacara (Melasti, Puncak, Nyineb, dll)
 * 2. Tanggal & Jam Pelaksanaan (WITA)
 * 3. Tingkatan Upacara
 * 4. Nama Koordinator / PIC & Nomor Kontak
 * 5. Catatan / Alasan Rujukan
 * ==============================================================================
 */
export const AcaraSubmissionModal: React.FC<AcaraSubmissionModalProps> = ({
  isOpen,
  onClose,
  piodalanId,
  puraId,
  puraName,
  piodalanDate,
  onSuccess,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const { addAcaraSubmission } = usePiodalanSubmissions(puraId);

  // State Formulir
  const [name, setName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(
    piodalanDate ? piodalanDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [eventTime, setEventTime] = useState<string>('09:00');
  const [levelId, setLevelId] = useState<number | ''>(2);
  const [picName, setPicName] = useState<string>('');
  const [picPhone, setPicPhone] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sinkronisasi piodalanDate jika berubah dari luar
  const [prevDate, setPrevDate] = useState<string | undefined>(piodalanDate);
  if (prevDate !== piodalanDate) {
    setPrevDate(piodalanDate);
    setEventDate(
      piodalanDate ? piodalanDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
  }

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

    if (!name.trim()) {
      showAlert('Nama tahapan upacara wajib diisi!');
      return;
    }
    if (!eventDate) {
      showAlert('Tanggal tahapan acara wajib diisi!');
      return;
    }

    setIsSubmitting(true);

    const timeString = eventTime || '09:00';
    const eventAt = `${eventDate} ${timeString.length === 5 ? `${timeString}:00` : timeString}`;

    const levelNames: Record<number, string> = {
      1: 'Nista',
      2: 'Madya',
      3: 'Utama',
    };

    addAcaraSubmission({
      piodalan_id: piodalanId,
      pura_id: puraId,
      pura_name: puraName,
      user_id: String(user?.id || 'guest'),
      user_name: user?.name || 'Member Wargabali',
      user_email: user?.email || '-',
      name: name.trim(),
      event_at: eventAt,
      level_id: levelId !== '' ? Number(levelId) : null,
      level_name: levelId !== '' ? levelNames[Number(levelId)] : undefined,
      pic_name: picName.trim() || undefined,
      pic_phone: picPhone.trim() || undefined,
      reason: reason.trim() || undefined,
    });

    setIsSubmitting(false);
    showAlert('Usulan tahapan susunan acara berhasil diajukan untuk ditinjau oleh Admin!');
    if (onSuccess) onSuccess();
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="acara-submission-title"
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
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-amber-50/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="acara-submission-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                Ajukan Usulan Susunan Acara
              </h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {puraName} · Siklus Piodalan Terpilih
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir usulan acara"
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

          {/* 1. Nama Tahapan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-acara-name"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Nama Tahapan Upacara</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="sub-acara-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Contoh: Upacara Melasti ke Segara"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white"
            />
          </div>

          {/* 2. Grid Tanggal & Jam Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="sub-acara-date"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                <span>Tanggal Acara</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="sub-acara-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sub-acara-time"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                <span>Jam Pelaksanaan (WITA)</span>
              </label>
              <input
                id="sub-acara-time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* 3. Tingkatan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-acara-level"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Tingkatan Acara</span>
            </label>
            <select
              id="sub-acara-level"
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

          {/* 4. Grid Penanggung Jawab (PIC) & Kontak */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="sub-acara-pic"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                <span>Penanggung Jawab / PIC</span>
              </label>
              <input
                id="sub-acara-pic"
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                placeholder="Contoh: Jero Mangku Wayan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="sub-acara-phone"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                <span>Nomor Kontak PIC</span>
              </label>
              <input
                id="sub-acara-phone"
                type="tel"
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] transition-all bg-white"
              />
            </div>
          </div>

          {/* 5. Alasan / Rujukan Pengusulan */}
          <div className="space-y-1.5">
            <label
              htmlFor="sub-acara-reason"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
              <span>Catatan / Alasan Usulan</span>
            </label>
            <textarea
              id="sub-acara-reason"
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Jadwal disesuaikan dengan pasang surut air laut di pantai setempat..."
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
              <span>Kirim Usulan Acara</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

