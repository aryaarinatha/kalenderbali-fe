import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Calendar,
  X,
  BookOpen,
  Clock,
  Compass,
  Bell,
  BellRing,
  Check,
} from 'lucide-react';
import type {
  HariRayaCardItem,
  HariRayaMasterItem,
  HariRayaUpcomingInfo,
} from '../types/hariRaya.types';
import { HariRayaReminderModal } from './HariRayaReminderModal';
import {
  capitalize,
  getCategoryPillStyles,
  NAMA_BULAN_INDO,
} from '../utils/hariRayaUtils';

/**
 * ============================================================================
 * KOMPONEN: HariRayaDetailModal
 * ============================================================================
 * Modal dialog pop-up standar AGENTS.md (Bab 4.7) untuk menyajikan penjelasan
 * filosofis lengkap hari raya yang bersumber dari lontar Sundarigama di database Go.
 *
 * Standar Aksesibilitas & Tampilan:
 *  1. createPortal(..., document.body) dengan z-index z-[100]
 *  2. Backdrop blur halus: fixed inset-0 bg-slate-900/40 backdrop-blur-xs
 *  3. Header bergradien: from-teal-50/60 via-slate-50/40 to-emerald-50/30
 *  4. Tombol tutup X ergonomis min 36x36px
 *  5. Body scrollable independen dengan overflow-y-auto
 *  6. Listener keyboard tombol "Escape" dan penguncian scroll body dokumen
 * ============================================================================
 */

interface HariRayaDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardItem: HariRayaCardItem | null;
  masterItem?: HariRayaMasterItem | null;
}

export const HariRayaDetailModal: React.FC<HariRayaDetailModalProps> = ({
  isOpen,
  onClose,
  cardItem,
  masterItem,
}) => {
  // State modal pengingat dan status aktif per hari raya
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);
  const [isReminderActive, setIsReminderActive] = useState<boolean>(() => {
    try {
      return cardItem?.id ? localStorage.getItem(`reminder_${cardItem.id}_active`) === 'true' : false;
    } catch {
      return false;
    }
  });
  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  // Sinkronkan status aktif saat cardItem berganti
  const [prevCardId, setPrevCardId] = useState<string | number | undefined>(cardItem?.id);
  if (cardItem?.id !== prevCardId) {
    setPrevCardId(cardItem?.id);
    try {
      setIsReminderActive(
        cardItem?.id ? localStorage.getItem(`reminder_${cardItem.id}_active`) === 'true' : false
      );
    } catch {
      setIsReminderActive(false);
    }
    setNotificationFeedback(null);
  }

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

  if (!isOpen || !cardItem) return null;

  // Handler simpan pengingat
  const handleSaveReminder = () => {
    setIsReminderActive(true);
    try {
      if (cardItem?.id) {
        localStorage.setItem(`reminder_${cardItem.id}_active`, 'true');
      }
    } catch {
      // Abaikan jika storage diblokir peramban
    }
    const name = cardItem.nama || masterItem?.nama || 'Hari Raya';
    setNotificationFeedback(`Pengingat untuk ${name} berhasil diaktifkan.`);
    setTimeout(() => setNotificationFeedback(null), 4000);
  };

  // Handler batalkan pengingat
  const handleCancelReminder = () => {
    setIsReminderActive(false);
    try {
      if (cardItem?.id) {
        localStorage.removeItem(`reminder_${cardItem.id}_active`);
      }
    } catch {
      // Abaikan jika storage diblokir peramban
    }
    setNotificationFeedback('Pengingat telah dinonaktifkan.');
    setTimeout(() => setNotificationFeedback(null), 3000);
  };

  // Konversi kartu hari raya menjadi objek info pengingat
  const cardReminderInfo: HariRayaUpcomingInfo = {
    item: cardItem,
    daysRemaining: 0,
    countdownText: `Perayaan ${cardItem.nama}`,
    wuku: cardItem.wuku ? capitalize(cardItem.wuku) : 'Sinta',
    sasih: cardItem.sasih ? capitalize(cardItem.sasih) : 'Kapat',
  };

  // Nama hari raya dan deskripsi filosofis resmi dari database Go
  const namaHariRaya = cardItem.nama || masterItem?.nama || 'Hari Raya Bali';
  const jenis = cardItem.jenis || masterItem?.jenis || 'hari_raya';
  const deskripsi =
    cardItem.keterangan ||
    masterItem?.keterangan ||
    'Hari suci ini dirayakan oleh umat Hindu di Bali untuk memohon kerahayuan, penyucian lahir dan batin, serta keharmonisan jagat raya sekala dan niskala.';

  // Format tanggal Masehi lengkap
  const formattedDate = (() => {
    if (!cardItem.tanggal) return '-';
    const parts = cardItem.tanggal.split('-').map(Number);
    if (parts.length !== 3) return cardItem.tanggal;
    return `${parts[2]} ${NAMA_BULAN_INDO[parts[1] - 1]} ${parts[0]}`;
  })();

  const categoryPillStyles = getCategoryPillStyles(cardItem.categoryTag);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-hari-raya-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      {/* Wadah Utama Dialog Modal */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =============================================================== */}
        {/* BLOK 1: Header Dialog dengan Latar Gradien Lembut               */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            {/* Pill Kategori dan Jenis Hari Raya */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none ${categoryPillStyles}`}
              >
                {cardItem.categoryTag}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 capitalize">
                {jenis.replace('_', ' ')}
              </span>
            </div>

            {/* Judul Besar Hari Raya */}
            <h2
              id="modal-hari-raya-title"
              className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight leading-snug"
            >
              {namaHariRaya}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Rincian penanggalan dan makna filosofis perayaan.
            </p>
          </div>

          {/* Tombol Tutup X (Min 36x36px) */}
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
        {/* BLOK 2: Body Modal Scrollable                                   */}
        {/* =============================================================== */}
        <div className="overflow-y-auto p-6 sm:p-7 space-y-5">
          {/* Baris Rincian Penanggalan (Tanggal Masehi, Wuku, Sasih) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kotak Tanggal Masehi */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> TANGGAL
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.dayName ? `${capitalize(cardItem.dayName)}, ` : ''}
                {formattedDate}
              </span>
            </div>

            {/* Kotak Siklus Wuku */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Compass className="w-3 h-3" /> WUKU
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.wuku ? capitalize(cardItem.wuku) : '-'}
              </span>
            </div>

            {/* Kotak Sasih & Tahun Saka */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3.5 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block flex items-center gap-1">
                <Clock className="w-3 h-3" /> SASIH
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#0f172a] block">
                {cardItem.sasih ? capitalize(cardItem.sasih) : '-'}{' '}
                {cardItem.tahunSaka ? `(${cardItem.tahunSaka} Saka)` : ''}
              </span>
            </div>
          </div>

          {/* Kotak Uraian Filosofis Lontar Sundarigama */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-5 space-y-2">
            <span className="text-[11px] font-extrabold text-teal-700 uppercase tracking-widest flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              MAKNA FILOSOFIS
            </span>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
              {deskripsi}
            </p>
          </div>
        </div>

        {/* =============================================================== */}
        {/* BLOK 3: Footer Dialog                                           */}
        {/* =============================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Feedback Notifikasi Banner */}
          {notificationFeedback ? (
            <div className="text-xs text-teal-800 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{notificationFeedback}</span>
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center justify-end gap-2.5">
            {/* Tombol "Aktifkan pengingat" di samping kiri tombol "Tutup" (Warna Teal Utama #0e9f90) */}
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(true)}
              className="h-10 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 active:scale-98 [touch-action:manipulation]"
              title={`Atur pengingat untuk ${namaHariRaya}`}
            >
              {isReminderActive ? (
                <>
                  <BellRing className="w-4 h-4 text-white shrink-0" />
                  <span>Pengingat Aktif</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-white shrink-0" />
                  <span>Aktifkan pengingat</span>
                </>
              )}
            </button>

            {/* Tombol Tutup Dialog */}
            <button
              type="button"
              onClick={onClose}
              className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-2xs active:scale-98 [touch-action:manipulation]"
            >
              Tutup
            </button>
          </div>
        </div>

        {/* Modal Dialog Pop-up Konfigurasi Pengingat */}
        <HariRayaReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => setIsReminderModalOpen(false)}
          upcomingInfo={cardReminderInfo}
          isCurrentlyActive={isReminderActive}
          onSaveReminder={handleSaveReminder}
          onCancelReminder={handleCancelReminder}
        />
      </div>
    </div>,
    document.body
  );
};
