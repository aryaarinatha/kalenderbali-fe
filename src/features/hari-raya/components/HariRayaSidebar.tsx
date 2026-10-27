import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import type { HariRayaUpcomingInfo } from '../types/hariRaya.types';
import { capitalize, NAMA_BULAN_INDO } from '../utils/hariRayaUtils';
import { HariRayaReminderModal } from './HariRayaReminderModal';

/**
 * ============================================================================
 * KOMPONEN: HariRayaSidebar (Kolom Kanan)
 * ============================================================================
 * Komponen ini menyajikan panel ringkasan informasi di kolom kanan:
 *
 * 1. Panel "Hari Raya Terdekat"
 *    - Header badge hitung mundur: "4 HARI" / "HARI INI"
 *    - Highlight Box hijau toska lembut dengan ilustrasi fase bulan Purnama,
 *      nama hari raya besar, subtitle paksa bulan, tanggal lengkap,
 *      dan uraian makna filosofis langsung di kartu tanpa tombol pop-up.
 *    - Blok "Ringkasan": Menyajikan Wuku dan Sasih riil dari backend Go.
 *    - Tombol Aksi: "Aktifkan pengingat" untuk hari raya terdekat
 *      (membuka HariRayaReminderModal dummy flow).
 * ============================================================================
 */

interface HariRayaSidebarProps {
  upcomingInfo: HariRayaUpcomingInfo | null;
}

export const HariRayaSidebar: React.FC<HariRayaSidebarProps> = ({
  upcomingInfo,
}) => {
  // State modal pengingat hari raya terdekat
  const [isReminderModalOpen, setIsReminderModalOpen] = useState<boolean>(false);

  // State lokal aktif/tidaknya pengingat dengan sinkronisasi ke localStorage
  const [isReminderActive, setIsReminderActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reminder_upcoming_active') === 'true';
    } catch {
      return false;
    }
  });

  const [notificationFeedback, setNotificationFeedback] = useState<string | null>(null);

  // Handler simpan pengingat dari modal
  const handleSaveReminder = () => {
    setIsReminderActive(true);
    try {
      localStorage.setItem('reminder_upcoming_active', 'true');
    } catch {
      // Abaikan jika localStorage tidak didukung / diblokir peramban
    }

    const targetName = upcomingInfo?.item.nama || 'rahina terdekat';
    setNotificationFeedback(`Pengingat untuk ${targetName} berhasil diaktifkan.`);
    setTimeout(() => setNotificationFeedback(null), 4000);
  };

  // Handler batalkan pengingat
  const handleCancelReminder = () => {
    setIsReminderActive(false);
    try {
      localStorage.removeItem('reminder_upcoming_active');
    } catch {
      // Abaikan jika localStorage tidak didukung / diblokir peramban
    }

    setNotificationFeedback('Pengingat telah dinonaktifkan.');
    setTimeout(() => setNotificationFeedback(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* ================================================================= */}
      {/* KARTU: Panel "Hari Raya Terdekat"                                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Header Kartu: Judul dan Badge Sisa Hari */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Hari Raya Terdekat
          </h3>
          {upcomingInfo && (
            <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold text-[11px] rounded-full px-2.5 py-0.5 uppercase tracking-wider select-none shrink-0">
              {upcomingInfo.daysRemaining === 0
                ? 'HARI INI'
                : `${upcomingInfo.daysRemaining} HARI`}
            </span>
          )}
        </div>

        {/* Highlight Box Hijau Toska Lembut dengan Ilustrasi Bulan */}
        {upcomingInfo ? (
          <div className="bg-[#f0fdf9] border border-teal-200/80 rounded-2xl p-5 relative overflow-hidden space-y-3">
            {/* Ilustrasi Vektor Bulan Purnama Lembut di Sisi Kanan Atas */}
            <div className="absolute -top-3 -right-3 w-28 h-28 pointer-events-none opacity-25">
              <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                <circle cx="50" cy="50" r="42" fill="#fef08a" />
                <path
                  d="M50 8C73.196 8 92 26.804 92 50C92 73.196 73.196 92 50 92C38.4 92 27.9 87.3 20.3 79.7C33.8 77.2 44 64.9 44 50C44 35.1 33.8 22.8 20.3 20.3C27.9 12.7 38.4 8 50 8Z"
                  fill="#facc15"
                />
              </svg>
            </div>

            {/* Tanggal Masehi Lengkap */}
            <span className="text-xs font-semibold text-teal-800 block relative z-10">
              {upcomingInfo.item.dayName ? `${capitalize(upcomingInfo.item.dayName)}, ` : ''}
              {upcomingInfo.item.dayNumber}{' '}
              {NAMA_BULAN_INDO[parseInt(upcomingInfo.item.tanggal.split('-')[1], 10) - 1]}{' '}
              {upcomingInfo.item.tanggal.split('-')[0]}
            </span>

            {/* Judul Besar Hari Raya */}
            <div className="relative z-10">
              <h4 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight">
                {upcomingInfo.item.nama}
              </h4>
              {upcomingInfo.moonPhaseText && (
                <span className="text-xs font-semibold text-teal-700 block mt-0.5">
                  {upcomingInfo.moonPhaseText}
                </span>
              )}
            </div>

            {/* Uraian Makna Filosofis Lengkap Langsung di Kartu */}
            <div className="pt-2 border-t border-teal-200/60 space-y-1.5 relative z-10">
              <span className="text-[11px] font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-teal-700" />
                Makna Filosofis
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-line">
                {upcomingInfo.item.keterangan ||
                  'Hari pemujaan suci ini dirayakan oleh umat Hindu di Bali untuk memohon kerahayuan, penyucian lahir dan batin, serta keharmonisan jagat raya sekala dan niskala.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-[#f8fafc] rounded-xl p-4 text-center text-xs text-slate-500">
            Tidak ada perayaan terdekat yang ditemukan.
          </div>
        )}

        {/* =============================================================== */}
        {/* SUB-SEKSI: Ringkasan Wuku & Sasih (Sifat Hari Ditiadakan)       */}
        {/* =============================================================== */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Ringkasan
          </span>
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3 space-y-2.5">
            {/* Baris Wuku */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Wuku</span>
              <span className="font-bold text-[#0f172a]">
                {upcomingInfo?.wuku || 'Sinta'}
              </span>
            </div>

            {/* Baris Sasih */}
            <div className="flex items-center justify-between text-xs border-t border-slate-200/50 pt-2">
              <span className="text-slate-500 font-medium">Sasih</span>
              <span className="font-bold text-[#0f172a]">
                {upcomingInfo?.sasih || 'Kapat'}{' '}
                {upcomingInfo?.item.tahunSaka ? `(${upcomingInfo.item.tahunSaka} Saka)` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* SUB-SEKSI: Tombol "Aktifkan pengingat" untuk Hari Raya Terdekat   */}
        {/* =============================================================== */}
        <div className="pt-2 space-y-3">
          {/* Feedback Banner jika Pengingat Disimpan atau Dibatalkan */}
          {notificationFeedback && (
            <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl text-xs text-teal-800 font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{notificationFeedback}</span>
            </div>
          )}

          {/* Tombol Interaktif "Aktifkan pengingat" untuk Hari Raya Terdekat (Warna Teal Utama #0e9f90) */}
          <button
            type="button"
            onClick={() => setIsReminderModalOpen(true)}
            className="w-full h-11 px-4 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 [touch-action:manipulation]"
            title={`Atur pengingat untuk ${upcomingInfo?.item.nama || 'hari raya terdekat'}`}
          >
            {isReminderActive ? (
              <>
                <BellRing className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">
                  Pengingat Aktif ({upcomingInfo?.item.nama || 'Rahina'})
                </span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-white shrink-0" />
                <span>Aktifkan pengingat</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* MODAL POP-UP: Set Pengingat Hari Raya Terdekat (Dummy Flow)       */}
      {/* ================================================================= */}
      <HariRayaReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        upcomingInfo={upcomingInfo}
        isCurrentlyActive={isReminderActive}
        onSaveReminder={handleSaveReminder}
        onCancelReminder={handleCancelReminder}
      />
    </div>
  );
};
