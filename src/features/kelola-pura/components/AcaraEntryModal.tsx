import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  X,
  Sparkles,
  Calendar,
  User,
  Phone,
  Tag,
  Loader2,
} from 'lucide-react';
import type { CreateAcaraPayload } from '../types/kelolaPura.types';
import { useAcaraMutations } from '../hooks/useKelolaPura';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: AcaraEntryModal
 * ==============================================================================
 */
export interface AcaraEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  piodalanId: number;
  piodalanDate?: string;
  onSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: AcaraEntryModal (Formulir Tambah Tahapan Susunan Acara Piodalan)
 * ==============================================================================
 * Khusus Administrator untuk menambahkan rincian susunan tahapan upacara:
 * 1. Nama Tahapan Upacara (Melasti, Puncak, Nyineb, Mapepada, dll)
 * 2. Tanggal & Jam Pelaksanaan (WITA)
 * 3. Tingkatan Upacara (Nista, Madya, Utama)
 * 4. Nama Penanggung Jawab (PIC / Jero Mangku) & Nomor Telepon
 * ==============================================================================
 */
export const AcaraEntryModal: React.FC<AcaraEntryModalProps> = ({
  isOpen,
  onClose,
  piodalanId,
  piodalanDate,
  onSuccess,
}) => {
  const { showAlert } = useAlertStore();
  const { createAcara, isCreating } = useAcaraMutations(piodalanId);

  // State Formulir
  const [name, setName] = useState<string>('');
  const [eventDate, setEventDate] = useState<string>(
    piodalanDate ? piodalanDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [eventTime, setEventTime] = useState<string>('09:00');
  const [levelId, setLevelId] = useState<number | ''>(2); // Default Madya (2)
  const [picName, setPicName] = useState<string>('');
  const [picPhone, setPicPhone] = useState<string>('');

  // Sinkronisasi piodalanDate saat berubah dari luar (pola resmi React tanpa cascading renders)
  const [prevDate, setPrevDate] = useState<string | undefined>(piodalanDate);
  if (prevDate !== piodalanDate) {
    setPrevDate(piodalanDate);
    setEventDate(
      piodalanDate ? piodalanDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
    );
  }

  // Listener tombol Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCreating) {
        onClose();
      }
    },
    [onClose, isCreating]
  );

  // Kunci scroll body saat modal aktif
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

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showAlert('Nama tahapan upacara wajib diisi!');
      return;
    }
    if (!eventDate) {
      showAlert('Tanggal tahapan acara wajib diisi!');
      return;
    }

    const timeString = eventTime || '09:00';
    const eventAt = `${eventDate} ${timeString.length === 5 ? `${timeString}:00` : timeString}`;

    const payload: CreateAcaraPayload = {
      name: name.trim(),
      event_at: eventAt,
      level_id: levelId !== '' ? Number(levelId) : null,
      pic_name: picName.trim() || undefined,
      pic_phone: picPhone.trim() || undefined,
    };

    try {
      await createAcara(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      // Error sudah ditangani hook dengan showAlert
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="acara-entry-modal-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={!isCreating ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Kontainer Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-100/80 text-teal-800 flex items-center justify-center shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="acara-entry-modal-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                Tambah Tahapan Susunan Acara
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Piodalan siklus terpilih
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Tutup formulir acara"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* 1. Nama Tahapan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="acara-name"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Tag className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Nama Tahapan Upacara</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="acara-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isCreating}
              required
              placeholder="Contoh: Upacara Melasti ke Segara"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-white"
            />
          </div>

          {/* 2. Grid Tanggal & Jam Pelaksanaan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="acara-date"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Tanggal Acara</span>
                <span className="text-rose-500">*</span>
              </label>
              <input
                id="acara-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                disabled={isCreating}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="acara-time"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Clock className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Jam Pelaksanaan (WITA)</span>
              </label>
              <input
                id="acara-time"
                type="time"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
                disabled={isCreating}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
              />
            </div>
          </div>

          {/* 3. Tingkatan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="acara-level"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Tingkatan Acara</span>
            </label>
            <select
              id="acara-level"
              value={levelId}
              onChange={(e) => setLevelId(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={isCreating}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-white"
            >
              <option value="">Belum ditentukan</option>
              <option value="1">Nista (Kecil / Sederhana)</option>
              <option value="2">Madya (Menengah / Standar)</option>
              <option value="3">Utama (Ageng / Besar)</option>
            </select>
          </div>

          {/* 4. Grid Koordinator (PIC) & Nomor Telepon */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label
                htmlFor="acara-pic"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Penanggung Jawab / PIC</span>
              </label>
              <input
                id="acara-pic"
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                disabled={isCreating}
                placeholder="Contoh: Jero Mangku Wayan"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="acara-phone"
                className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
                <span>Nomor Kontak PIC</span>
              </label>
              <input
                id="acara-phone"
                type="tel"
                value={picPhone}
                onChange={(e) => setPicPhone(e.target.value)}
                disabled={isCreating}
                placeholder="Contoh: 08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-white"
              />
            </div>
          </div>

          {/* Footer Tombol Aksi */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="min-h-[42px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#0e9f90] hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <span>Simpan Susunan Acara</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
