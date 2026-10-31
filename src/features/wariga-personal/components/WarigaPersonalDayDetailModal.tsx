import React, { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, CheckCircle2, AlertTriangle } from 'lucide-react';
import type {
  WarigaPersonalItem,
  IdentitasKelahiran,
} from '../types/warigaPersonal.types';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalDayDetailModal
 * ============================================================================
 * Pop-up modal dialog yang menyajikan rincian komputasi matematis budaya
 * untuk tanggal kalender yang dipilih oleh pengguna:
 *  1. Identitas tanggal & wewaran (Saptawara, Pancawara, Wuku).
 *  2. Badge arketipe Wariga Personal (Guru, Ratu, Lara, Pati).
 *  3. Transparansi Rumus Budaya: Urip Lahir + Urip Hari Target % 4 = Modulo.
 *  4. Penjelasan filosofis dan rekomendasi peruntukan kegiatan.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - createPortal ke document.body (z-[100])
 *  - Backdrop blur dan penanganan tombol Escape
 *  - Font tabular-nums pada seluruh angka matematis
 * ============================================================================
 */

interface WarigaPersonalDayDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: WarigaPersonalItem | null;
  identitas: IdentitasKelahiran;
}

export const WarigaPersonalDayDetailModal: React.FC<
  WarigaPersonalDayDetailModalProps
> = ({ isOpen, onClose, item, identitas }) => {
  // -------------------------------------------------------------------------
  // BLOK 1: AKSESIBILITAS: LISTENER TOMBOL ESCAPE & KUNCI OVERFLOW BODY
  // -------------------------------------------------------------------------
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !item) return null;

  const isBaik = item.status_hari === 'baik';
  const isGuru = item.wariga === 'Guru';
  const isRatu = item.wariga === 'Ratu';
  const isLara = item.wariga === 'Lara';

  // Penentuan styling badge arketipe
  let badgeColor = 'bg-rose-50 text-rose-800 border-rose-200';
  let dotColor = 'bg-rose-500';

  if (isGuru) {
    badgeColor = 'bg-sky-50 text-sky-800 border-sky-200';
    dotColor = 'bg-sky-500';
  } else if (isRatu) {
    badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (isLara) {
    badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';
    dotColor = 'bg-amber-500';
  }

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =============================================================== */}
        {/* HEADER MODAL DENGAN GRADIEN HALUS                               */}
        {/* =============================================================== */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-[#0d9488] uppercase tracking-widest">
                Detail Wariga Personal
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeColor}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                {item.wariga} (Angka {item.angka_perwakilan})
              </span>
            </div>

            <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
              {formatFullIndoDate(item.tanggal)}
            </h3>

            <p className="text-xs font-semibold text-slate-600">
              {item.wewaran.saptawara} {item.wewaran.pancawara} • Wuku{' '}
              {item.wewaran.wuku}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup jendela detail"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* =============================================================== */}
        {/* BODY MODAL SCROLLABLE                                           */}
        {/* =============================================================== */}
        <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Card Status Hari */}
          <div
            className={`p-3.5 rounded-xl border flex items-start gap-3 ${
              isBaik
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50/50 border-rose-200 text-rose-900'
            }`}
          >
            {isBaik ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <span className="text-xs font-extrabold block">
                {isBaik
                  ? 'Hari Berkategori Baik (Ayu)'
                  : 'Hari Berkategori Buruk (Ala)'}
              </span>
              <p className="text-xs leading-relaxed text-slate-700">
                {item.keterangan}
              </p>
            </div>
          </div>

          {/* Kotak Transparansi Rumus Matematis Budaya */}
          <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <Calculator className="w-4 h-4 text-teal-600" />
              <span>Transparansi Rumus Perhitungan</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Total Urip Kelahiran ({identitas.wewaran.saptawara} + {identitas.wewaran.pancawara})</span>
                <span className="font-extrabold text-[#0f172a] tabular-nums">
                  {identitas.total_urip_kelahiran}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Total Urip Hari Ini ({item.wewaran.saptawara} + {item.wewaran.pancawara})</span>
                <span className="font-extrabold text-[#0f172a] tabular-nums">
                  {item.total_urip_hari}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span>Total Urip Kumulatif ({identitas.total_urip_kelahiran} + {item.total_urip_hari})</span>
                <span className="font-extrabold text-[#0f766e] tabular-nums text-sm">
                  {item.total_urip_kumulatif}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span>Sisa Pembagian Modulo 4 ({item.total_urip_kumulatif} ÷ 4)</span>
                <span className="font-extrabold text-[#0f172a] tabular-nums">
                  Sisa {item.modulo === 0 ? '0 (diwakili angka 4)' : item.modulo}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-teal-50/70 border border-teal-200/50 text-[11px] text-teal-900 leading-relaxed">
              <strong>Kaidah Budaya:</strong> Sisa 1 = Guru, Sisa 2 = Ratu, Sisa 3 = Lara, Sisa 0 (habis dibagi 4) = Pati.
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* FOOTER MODAL                                                    */}
        {/* =============================================================== */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

