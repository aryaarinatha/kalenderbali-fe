import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarDays,
  X,
  Sparkles,
  AlignLeft,
  Calendar,
  Loader2,
} from 'lucide-react';
import type { CreatePiodalanPayload } from '../types/kelolaPura.types';
import { usePiodalanMutations } from '../hooks/useKelolaPura';
import { getTodayWITA } from '../utils/kelolaPuraUtils';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: PiodalanEntryModal
 * ==============================================================================
 */
export interface PiodalanEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puraId: number;
  puraName?: string;
  onSuccess?: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanEntryModal (Formulir Tambah Siklus Piodalan Baru)
 * ==============================================================================
 * Khusus Administrator untuk menambahkan siklus piodalan resmi pura ke database Go:
 * 1. Tanggal Upacara Piodalan (Wajib)
 * 2. Keterangan / Sebutan Acara (misal: "Piodalan Ageng Pura", "Ngusaba Kasa")
 * 3. Tingkatan Upacara (Nista, Madya, Utama)
 * ==============================================================================
 */
export const PiodalanEntryModal: React.FC<PiodalanEntryModalProps> = ({
  isOpen,
  onClose,
  puraId,
  puraName = 'Pura',
  onSuccess,
}) => {
  const { showAlert } = useAlertStore();
  const { createPiodalan, isCreating } = usePiodalanMutations(puraId);

  // State Formulir (Tanggal diinisialisasi ke zona waktu WITA absolut agar presisi)
  const [ceremonyDate, setCeremonyDate] = useState<string>(() => getTodayWITA());
  const [description, setDescription] = useState<string>('Piodalan Ageng Pura');
  const [levelId, setLevelId] = useState<number | ''>(2); // Default Madya (2)

  // Handle tombol Escape keyboard
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

    if (!ceremonyDate) {
      showAlert('Tanggal piodalan wajib diisi!');
      return;
    }

    const payload: CreatePiodalanPayload = {
      date: ceremonyDate,
      description: description.trim() || 'Piodalan Ageng Pura',
      level_id: levelId !== '' ? Number(levelId) : null,
    };

    try {
      await createPiodalan(payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch {
      // Error sudah ditangani di level hook dengan showAlert
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="piodalan-entry-modal-title"
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
              <CalendarDays className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="piodalan-entry-modal-title"
                className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight"
              >
                Tambah Siklus Piodalan
              </h2>
              <p className="text-xs text-slate-500 font-medium line-clamp-1">
                {puraName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isCreating}
            aria-label="Tutup formulir piodalan"
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* 1. Tanggal Pelaksanaan Piodalan */}
          <div className="space-y-1.5">
            <label
              htmlFor="piodalan-date"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Tanggal Puncak Piodalan</span>
              <span className="text-rose-500">*</span>
            </label>
            <input
              id="piodalan-date"
              type="date"
              value={ceremonyDate}
              onChange={(e) => setCeremonyDate(e.target.value)}
              disabled={isCreating}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400">
              Format kalender resmi WITA (YYYY-MM-DD).
            </p>
          </div>

          {/* 2. Tingkatan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="piodalan-level"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Tingkatan Upacara Piodalan</span>
            </label>
            <select
              id="piodalan-level"
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

          {/* 3. Deskripsi / Sebutan Upacara */}
          <div className="space-y-1.5">
            <label
              htmlFor="piodalan-desc"
              className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
            >
              <AlignLeft className="w-3.5 h-3.5 text-teal-600" aria-hidden="true" />
              <span>Keterangan / Sebutan Acara</span>
            </label>
            <input
              id="piodalan-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isCreating}
              placeholder="Contoh: Piodalan Ageng Pura Penataran"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all bg-white"
            />
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
                <span>Simpan Jadwal Piodalan</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
