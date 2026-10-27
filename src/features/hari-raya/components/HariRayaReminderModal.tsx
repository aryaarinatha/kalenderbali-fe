import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Bell,
  Calendar,
  Clock,
  Compass,
  X,
  Check,
} from 'lucide-react';
import type { HariRayaUpcomingInfo } from '../types/hariRaya.types';

/**
 * ============================================================================
 * KOMPONEN: HariRayaReminderModal (Set Pengingat Hari Raya Terdekat)
 * ============================================================================
 * Modal dialog pop-up standar AGENTS.md (Bab 4.7) untuk memasang pengingat
 * perayaan hari raya terdekat.
 *
 * Catatan Arsitektur:
 * Karena backend Push Notification belum tersedia di server, modal ini
 * menyajikan alur simulasi dummy interaktif yang menyimpan preferensi
 * ke memori lokal peramban (localStorage) dengan feedback visual yang realistis.
 * ============================================================================
 */

import { NAMA_BULAN_INDO, NAMA_HARI_INDO } from '../utils/hariRayaUtils';

interface HariRayaReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  upcomingInfo: HariRayaUpcomingInfo | null;
  isCurrentlyActive: boolean;
  onSaveReminder: (options: { remindHMinus1: boolean; remindHariH: boolean }) => void;
  onCancelReminder: () => void;
}

export const HariRayaReminderModal: React.FC<HariRayaReminderModalProps> = ({
  isOpen,
  onClose,
  upcomingInfo,
  isCurrentlyActive,
  onSaveReminder,
  onCancelReminder,
}) => {
  // Pilihan opsi waktu pengingat (dimuat langsung dari localStorage)
  const [remindHMinus1, setRemindHMinus1] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hari_raya_reminder_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.remindHMinus1 === 'boolean') return parsed.remindHMinus1;
      }
    } catch {
      // Abaikan jika localStorage diblokir
    }
    return true;
  });

  const [remindHariH, setRemindHariH] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hari_raya_reminder_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.remindHariH === 'boolean') return parsed.remindHariH;
      }
    } catch {
      // Abaikan jika localStorage diblokir
    }
    return true;
  });

  // Listener tombol keyboard "Escape" dan kunci scroll latar belakang body
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Format tanggal Masehi target hari raya ke Bahasa Indonesia
  const formattedTargetDate = React.useMemo(() => {
    if (!upcomingInfo) return '';
    const parts = upcomingInfo.item.tanggal.split('-').map(Number);
    if (parts.length !== 3) return upcomingInfo.item.tanggal;
    const dateObj = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    const dayName = NAMA_HARI_INDO[dateObj.getUTCDay()];
    const monthName = NAMA_BULAN_INDO[parts[1] - 1];
    return `${dayName}, ${parts[2]} ${monthName} ${parts[0]}`;
  }, [upcomingInfo]);

  if (!isOpen || !upcomingInfo) return null;

  const holidayName = upcomingInfo.item.nama;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveReminder({ remindHMinus1, remindHariH });
    onClose();
  };

  const handleDeactivate = () => {
    onCancelReminder();
    onClose();
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-reminder-title"
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      {/* Wadah Utama Dialog Modal */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =============================================================== */}
        {/* BLOK 1: Header Dialog                                           */}
        {/* =============================================================== */}
        <div className="p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5" /> PENGINGAT HARI RAYA TERDEKAT
            </span>
            <h2
              id="modal-reminder-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight leading-snug"
            >
              Pasang Pengingat: {holidayName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Dapatkan pemberitahuan tepat waktu menjelang pelaksanaan rahina suci.
            </p>
          </div>

          {/* Tombol Tutup X */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-white active:scale-95 transition-all flex items-center justify-center shrink-0 cursor-pointer border border-transparent hover:border-slate-200 [touch-action:manipulation]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* =============================================================== */}
        {/* BLOK 2: Body Modal & Form Konfigurasi Dummy                     */}
        {/* =============================================================== */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
          {/* Kartu Informasi Hari Raya Terdekat Target */}
          <div className="bg-[#f0fdf9] border border-teal-200/80 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-teal-800">
                Target Perayaan:
              </span>
              <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                {upcomingInfo.countdownText}
              </span>
            </div>

            <h3 className="text-lg font-extrabold text-[#0f172a]">
              {holidayName}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-teal-100 text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{formattedTargetDate || upcomingInfo.item.tanggal}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <Compass className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">Wuku: {upcomingInfo.wuku} · Sasih {upcomingInfo.sasih}</span>
              </div>
            </div>
          </div>

          {/* Pilihan Waktu Pengingat (Dummy Checkboxes) */}
          <div className="space-y-2.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              PILIHAN WAKTU PENGINGAT
            </span>

            {/* Opsi 1: H-1 Sore Hari */}
            <label className="p-3.5 bg-[#f8fafc] border border-slate-200/70 rounded-xl flex items-start gap-3 cursor-pointer hover:border-teal-500/40 transition-colors">
              <input
                type="checkbox"
                checked={remindHMinus1}
                onChange={(e) => setRemindHMinus1(e.target.checked)}
                className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-xs font-bold text-[#0f172a]">
                    H-1 Perayaan (Pukul 17:00 WITA)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Waktu persiapan banten, canang sari, dan perlengkapan sembahyang.
                </span>
              </div>
            </label>

            {/* Opsi 2: Hari H Pagi Hari */}
            <label className="p-3.5 bg-[#f8fafc] border border-slate-200/70 rounded-xl flex items-start gap-3 cursor-pointer hover:border-teal-500/40 transition-colors">
              <input
                type="checkbox"
                checked={remindHariH}
                onChange={(e) => setRemindHariH(e.target.checked)}
                className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span className="text-xs font-bold text-[#0f172a]">
                    Hari H Pagi (Pukul 06:00 WITA)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block">
                  Pengingat saat fajar menyambut pelaksanaan upacara dan persembahyangan.
                </span>
              </div>
            </label>
          </div>

          {/* ============================================================= */}
          {/* BLOK 3: Footer Dialog & Aksi Simpan                           */}
          {/* ============================================================= */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
            {isCurrentlyActive ? (
              <button
                type="button"
                onClick={handleDeactivate}
                className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition-all cursor-pointer active:scale-98"
              >
                Hapus Pengingat
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer shadow-2xs active:scale-98"
              >
                Batal
              </button>
            )}

            <button
              type="submit"
              className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-98 ml-auto"
            >
              <Check className="w-4 h-4" />
              <span>
                {isCurrentlyActive ? 'Perbarui Pengingat' : 'Aktifkan Pengingat'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
