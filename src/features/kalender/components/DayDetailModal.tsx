import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Calendar, Moon, Compass } from 'lucide-react';
import type { KalenderHarian, HariRayaItem } from '../types/kalender.types';
import { formatFullIndoDate, getIndoDayName, getWarigaSummary, getHariRayaBadgeStyle } from '../utils/calendarUtils';
import { HariRayaDetailModal } from './HariRayaDetailModal';

/**
 * ============================================================================
 * KOMPONEN: DayDetailModal
 * ============================================================================
 * Modal dialog pop-up yang menyajikan ensiklopedia rincian penanggalan Bali
 * secara lengkap untuk satu hari yang dipilih:
 *  - Informasi Tanggal Masehi & Hari
 *  - Sasih Bali & Tahun Saka
 *  - Detail Pengalantaka (Penanggal / Pangelong & Status Purnama/Tilem)
 *  - Total Urip & Arah Mata Angin (Pangider-ider)
 *  - 10 Siklus Wewaran Lengkap (Ekawara s.d. Dasawara + Wuku)
 *  - Daftar Hari Raya / Rerainan (dapat diklik untuk membaca makna filosofis)
 *  - Menggunakan createPortal ke document.body dengan z-[100] agar backdrop blur
 *    menyelimuti seluruh layar (Sidebar & Kalender).
 *
 * Aksesibilitas (WAI-ARIA):
 *  - Menutup dialog saat tombol 'Escape' ditekan.
 *  - Menutup dialog saat mengklik area backdrop luar.
 * ============================================================================
 */

interface DayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateString: string;
  dayData?: KalenderHarian;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = ({
  isOpen,
  onClose,
  dateString,
  dayData,
}) => {
  // State untuk melihat detail penjelasan hari raya dari dalam modal
  const [selectedHoliday, setSelectedHoliday] = useState<HariRayaItem | null>(null);

  // Listener tombol 'Escape' untuk aksesibilitas keyboard & lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Jika sub-modal hari raya terbuka, biarkan sub-modal yang menangani Escape
      if (selectedHoliday) return;

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
  }, [isOpen, onClose, selectedHoliday]);

  if (!isOpen) return null;

  const w = dayData?.wewaran;
  const sasih = dayData?.sasih;
  const pengalantaka = dayData?.pengalantaka;
  const hariRayaList = dayData?.hari_raya || [];
  const indoDayName = getIndoDayName(dateString);

  // Perhitungan Urip & Arah (Pangider-ider)
  const saptawaraName = w?.saptawara?.nama || '-';
  const pancawaraName = w?.pancawara?.nama || '-';
  const { totalUrip, arah } = getWarigaSummary(saptawaraName, pancawaraName);

  // Daftar 10 wara untuk dirender dalam grid
  const waraItems = [
    { label: 'Ekawara', value: w?.ekawara?.nama || '-' },
    { label: 'Dwiwara', value: w?.dwiwara?.nama || '-' },
    { label: 'Triwara', value: w?.triwara?.nama || '-' },
    { label: 'Caturwara', value: w?.caturwara?.nama || '-' },
    { label: 'Pancawara', value: w?.pancawara?.nama || '-' },
    { label: 'Sadwara', value: w?.sadwara?.nama || '-' },
    { label: 'Saptawara', value: w?.saptawara?.nama || '-' },
    { label: 'Astawara', value: w?.astawara?.nama || '-' },
    { label: 'Sangawara', value: w?.sangawara?.nama || '-' },
    { label: 'Dasawara', value: w?.dasawara?.nama || '-' },
    { label: 'Wuku', value: w?.wuku?.nama || '-' },
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overscroll-contain animate-in fade-in duration-150">
      {/* 1. Backdrop Gelap dengan Efek Blur Menyeluruh ke Seluruh Halaman */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />

      {/* 2. Kontainer Kotak Modal Dialog (Standar AGENTS.md Bab 4.7) */}
      <div
        className="relative w-full max-w-xl bg-white rounded-2xl border border-slate-200/90 shadow-2xl overflow-hidden z-10 max-h-[88vh] flex flex-col zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Banner Header dengan Sentuhan Gradien Lembut */}
        <div className="relative bg-gradient-to-r from-teal-50 via-slate-50 to-emerald-50 px-6 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-teal-100/80 text-teal-800">
              <Calendar className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                Rincian Penyelidikan Kalender
              </h3>
              <p className="text-xs text-slate-500 font-medium tabular-nums">
                {indoDayName}, {formatFullIndoDate(dateString)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/80 transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup rincian"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* A. Sasih, Pengalantaka, & Urip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Sasih (Amber Gold - AGENTS.md Bab 3.C.4) */}
            <div className="p-3.5 rounded-xl border border-amber-200/60 bg-[#fffbeb] space-y-1">
              <div className="flex items-center gap-1.5 text-[#b45309] text-xs font-bold uppercase tracking-wider">
                <Moon className="w-3.5 h-3.5" />
                <span>Sasih & Saka</span>
              </div>
              <p className="text-sm font-bold text-slate-800 capitalize">
                Sasih {sasih?.nama_sasih || '-'} ({sasih?.no_sasih || 0})
              </p>
              <p className="text-xs text-slate-500 tabular-nums">
                Tahun Saka {sasih?.tahun_saka || '-'}
              </p>
            </div>

            {/* Pengalantaka */}
            <div className="p-3.5 rounded-xl border border-slate-200/70 bg-[#f8fafc] space-y-1">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Pengalantaka</span>
              </div>
              <p className="text-sm font-bold text-slate-800 tabular-nums">
                {pengalantaka?.pengalantaka || 'Penanggal'} {pengalantaka?.penanggal_1 || 1}
              </p>
              <p className="text-xs text-slate-500">
                Status: {pengalantaka?.purnama_tilem !== '-' ? pengalantaka?.purnama_tilem : 'Hari Biasa'}
              </p>
            </div>

            {/* Urip & Arah */}
            <div className="p-3.5 rounded-xl border border-indigo-100 bg-indigo-50/40 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5" />
                <span>Urip & Arah</span>
              </div>
              <p className="text-sm font-bold text-slate-800 tabular-nums">
                Urip {totalUrip}
              </p>
              <p className="text-xs text-slate-500">
                Arah {arah}
              </p>
            </div>
          </div>

          {/* B. Hari Raya / Rahinan (Jika ada pada tanggal ini) */}
          {hariRayaList.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                Hari Raya & Rerainan
              </span>
              <div className="flex flex-wrap gap-2">
                {hariRayaList.map((hr) => {
                  const badgeStyle = getHariRayaBadgeStyle(hr.nama);
                  return (
                    <button
                      key={hr.id || hr.nama}
                      type="button"
                      onClick={() => setSelectedHoliday(hr)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${badgeStyle.bg} ${badgeStyle.text} transition-colors cursor-pointer group active:scale-95 [touch-action:manipulation]`}
                      title="Klik untuk membaca penjelasan hari raya ini"
                    >
                      <span className={`w-2 h-2 rounded-full shrink-0 ${badgeStyle.dot}`} />
                      <span>{hr.nama}</span>
                      <span className="text-[10px] opacity-60 group-hover:opacity-100 transition-opacity">↗</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* C. 10 Siklus Wewaran & Wuku */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              10 Wewaran Lengkap & Wuku
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {waraItems.map((item) => (
                <div
                  key={item.label}
                  className="p-2.5 rounded-xl border border-slate-200/70 bg-[#f8fafc] flex flex-col justify-center"
                >
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    {item.label}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block truncate tabular-nums">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Modal (Standar Secondary Button AGENTS.md Bab 4.4) */}
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

      {/* Pop-up penjelasan hari raya jika diklik dari dalam modal detail hari */}
      {selectedHoliday && (
        <HariRayaDetailModal
          isOpen={!!selectedHoliday}
          onClose={() => setSelectedHoliday(null)}
          holidayId={selectedHoliday.id}
          holidayName={selectedHoliday.nama}
        />
      )}
    </div>
  );

  return createPortal(modalContent, document.body);
};


