import React from 'react';
import { Sparkles, Lock, ArrowRight, Star } from 'lucide-react';
import type { RekomendasiHari } from '../types/warigaPersonal.types';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalRecommendations
 * ============================================================================
 * Menampilkan panel rekomendasi otomatis tanggal terbaik (Guru & Ratu):
 *  1. Jika Member/Admin: Menyajikan daftar kartu tanggal emas dengan anjuran kegiatan.
 *  2. Jika Guest (isLimited = true): Menampilkan kartu ajakan upgrade elegan
 *     (Value Gating - Opsi 1) yang terhubung ke PremiumUpgradeModal.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Styling kartu border border-slate-200/90 shadow-xs
 *  - Font tabular-nums pada tanggal numerik
 * ============================================================================
 */

interface WarigaPersonalRecommendationsProps {
  recommendations: RekomendasiHari[];
  isLimited: boolean;
  upgradeMessage?: string;
  onSelectDate: (dateString: string) => void;
  onOpenUpgradeModal: () => void;
}

export const WarigaPersonalRecommendations: React.FC<
  WarigaPersonalRecommendationsProps
> = ({
  recommendations,
  isLimited,
  upgradeMessage,
  onSelectDate,
  onOpenUpgradeModal,
}) => {
  // -------------------------------------------------------------------------
  // KASUS A: PENGGUNA GUEST (TEASER UPGRADE EKSKLUSIF)
  // -------------------------------------------------------------------------
  if (isLimited || recommendations.length === 0) {
    return (
      <div className="bg-gradient-to-r from-amber-50/70 via-teal-50/40 to-slate-50 rounded-2xl border border-amber-200/70 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 max-w-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
                Rekomendasi Otomatis Hari Terbaik
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Khusus Member
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {upgradeMessage ||
                'Tingkatkan akun ke Member untuk membuka 3 rekomendasi tanggal emas terbaik secara otomatis beserta rincian dauh ayu (jam baik) bulan ini.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenUpgradeModal}
          className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 [touch-action:manipulation]"
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span>Buka Rekomendasi</span>
        </button>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // KASUS B: PENGGUNA MEMBER / ADMIN (REKOMENDASI TERBUKA PENUH)
  // -------------------------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <h3 className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
            Rekomendasi Hari Terbaik Bulan Ini
          </h3>
        </div>
        <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200/60">
          {recommendations.length} Tanggal Pilihan
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.slice(0, 3).map((item) => {
          const isGuru = item.wariga === 'Guru';
          const badgeClass = isGuru
            ? 'bg-sky-50 text-sky-800 border-sky-200/80'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
          const dotClass = isGuru ? 'bg-sky-500' : 'bg-emerald-500';

          return (
            <div
              key={item.tanggal}
              onClick={() => onSelectDate(item.tanggal)}
              className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-teal-500/40 hover:shadow-xs transition-all cursor-pointer group flex flex-col justify-between space-y-2 [touch-action:manipulation]"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotClass}`} />
                  {item.wariga} (Hari Baik)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
              </div>

              <div>
                <div className="text-xs sm:text-sm font-extrabold text-[#0f172a] tabular-nums">
                  {formatFullIndoDate(item.tanggal)}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                  {item.keterangan}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

