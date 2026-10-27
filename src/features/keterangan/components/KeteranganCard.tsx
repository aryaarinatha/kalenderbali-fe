import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  Clock,
  Compass,
  Coins,
  Eye,
  Feather,
  Flame,
  GitCommit,
  Layers,
  Moon,
  Shield,
  ShieldAlert,
  Sparkle,
  Star,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import type { KeteranganType } from '../types/keterangan.types';

/**
 * ============================================================================
 * KOMPONEN: KeteranganCard (Kartu Kategori Ensiklopedia Kalender Bali)
 * ============================================================================
 * Kartu interaktif representasi dari satu kategori referensi Kalender Bali
 * (contoh: Wuku, Ingkel, Hari Raya, Ala Ayuning Dewasa, Zodiak, dsb).
 *
 * Mengikuti Aturan Baku AGENTS.md:
 *  - Wadah kartu: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs
 *  - Efek sentuh mikro: hover:border-teal-500/40 hover:shadow-sm active:scale-[0.99]
 *  - Palet 4 Pilar Wariga: Mint Teal, Emerald, Violet, Surya Gold, Sky Blue
 *  - Ergonomi sentuh: min-h-[44px] dengan touch-action: manipulation
 * ============================================================================
 */

interface KeteranganCardProps {
  /** Objek kategori data (berisi id, code, name, description, isPendingBackend) */
  category: KeteranganType;
  /** Callback saat kartu diklik untuk membuka modal rincian */
  onClick: (category: KeteranganType) => void;
}

/**
 * Kamus konfigurasi visual (ikon dan warna aksen semantik) untuk setiap kategori
 */
interface CategoryThemeConfig {
  icon: LucideIcon;
  iconBgClass: string;
  iconColorClass: string;
  badgeClass: string;
  badgeText: string;
}

/**
 * Memetakan kode kategori ke tema visual semantik 4 pilar wariga
 */
function getCategoryTheme(code: string, isPending?: boolean): CategoryThemeConfig {
  if (isPending) {
    return {
      icon: BookOpen,
      iconBgClass: 'bg-slate-100',
      iconColorClass: 'text-slate-400',
      badgeClass: 'bg-slate-100 text-slate-600 border border-slate-200',
      badgeText: 'Belum Ada di DB',
    };
  }

  switch (code.toLowerCase()) {
    case 'hari_raya':
      return {
        icon: Sun,
        iconBgClass: 'bg-amber-50',
        iconColorClass: 'text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-300',
        badgeText: '106 Hari Raya',
      };
    case 'ala_ayuning_dewasa':
      return {
        icon: Compass,
        iconBgClass: 'bg-emerald-50',
        iconColorClass: 'text-emerald-700',
        badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
        badgeText: '220 Dewasa',
      };
    case 'wuku':
      return {
        icon: Layers,
        iconBgClass: 'bg-violet-50',
        iconColorClass: 'text-violet-700',
        badgeClass: 'bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60',
        badgeText: '30 Wuku',
      };
    case 'saptawara':
      return {
        icon: Calendar,
        iconBgClass: 'bg-[#e6f7f5]',
        iconColorClass: 'text-[#0f766e]',
        badgeClass: 'bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60',
        badgeText: '7 Hari',
      };
    case 'pancawara':
      return {
        icon: Feather,
        iconBgClass: 'bg-emerald-50',
        iconColorClass: 'text-emerald-700',
        badgeClass: 'bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60',
        badgeText: '5 Hari',
      };
    case 'ingkel':
      return {
        icon: ShieldAlert,
        iconBgClass: 'bg-rose-50',
        iconColorClass: 'text-rose-700',
        badgeClass: 'bg-rose-50 text-rose-800 border border-rose-200',
        badgeText: '6 Pantangan',
      };
    case 'jejepan':
      return {
        icon: Clock,
        iconBgClass: 'bg-amber-50',
        iconColorClass: 'text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
        badgeText: '6 Daur',
      };
    case 'lintang':
      return {
        icon: Star,
        iconBgClass: 'bg-sky-50',
        iconColorClass: 'text-sky-700',
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200',
        badgeText: '34 Lintang',
      };
    case 'panca_sudha':
      return {
        icon: Eye,
        iconBgClass: 'bg-teal-50',
        iconColorClass: 'text-teal-700',
        badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200',
        badgeText: '7 Karakter',
      };
    case 'pangarasan':
      return {
        icon: Award,
        iconBgClass: 'bg-indigo-50',
        iconColorClass: 'text-indigo-700',
        badgeClass: 'bg-indigo-50 text-indigo-800 border border-indigo-200',
        badgeText: '10 Sifat',
      };
    case 'rakam':
      return {
        icon: Coins,
        iconBgClass: 'bg-amber-50',
        iconColorClass: 'text-amber-700',
        badgeClass: 'bg-amber-50 text-amber-800 border border-amber-200',
        badgeText: '6 Rakam',
      };
    case 'watek_madya':
      return {
        icon: Flame,
        iconBgClass: 'bg-orange-50',
        iconColorClass: 'text-orange-700',
        badgeClass: 'bg-orange-50 text-orange-800 border border-orange-200',
        badgeText: '5 Watak',
      };
    case 'watek_alit':
      return {
        icon: Sparkle,
        iconBgClass: 'bg-cyan-50',
        iconColorClass: 'text-cyan-700',
        badgeClass: 'bg-cyan-50 text-cyan-800 border border-cyan-200',
        badgeText: '4 Watak',
      };
    case 'eka_jala_rsi':
      return {
        icon: Shield,
        iconBgClass: 'bg-teal-50',
        iconColorClass: 'text-teal-700',
        badgeClass: 'bg-teal-50 text-teal-800 border border-teal-200',
        badgeText: '24 Petunjuk',
      };
    case 'pratiti':
      return {
        icon: GitCommit,
        iconBgClass: 'bg-purple-50',
        iconColorClass: 'text-purple-700',
        badgeClass: 'bg-purple-50 text-purple-800 border border-purple-200',
        badgeText: '12 Karma',
      };
    case 'zodiak':
      return {
        icon: Moon,
        iconBgClass: 'bg-sky-50',
        iconColorClass: 'text-sky-700',
        badgeClass: 'bg-sky-50 text-sky-800 border border-sky-200',
        badgeText: '12 Zodiak',
      };
    default:
      return {
        icon: BookOpen,
        iconBgClass: 'bg-slate-50',
        iconColorClass: 'text-slate-600',
        badgeClass: 'bg-slate-50 text-slate-700 border border-slate-200',
        badgeText: 'Referensi Budaya',
      };
  }
}

export const KeteranganCard: React.FC<KeteranganCardProps> = ({
  category,
  onClick,
}) => {
  const isPending = Boolean(category.isPendingBackend);
  const theme = getCategoryTheme(category.code, isPending);
  const IconComponent = theme.icon;

  const hasDescription = Boolean(
    category.description && category.description.trim() !== ''
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(category)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(category);
        }
      }}
      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-teal-500/40 hover:shadow-sm active:scale-[0.99] transition-all cursor-pointer group flex flex-col justify-between select-none [touch-action:manipulation] relative overflow-hidden"
    >
      {/* ================================================================= */}
      {/* 1. BAGIAN ATAS: Ikon Tematik & Lencana Entri                       */}
      {/* ================================================================= */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-4">
          {/* Ikon Semantik Kategori */}
          <div
            className={`w-11 h-11 rounded-xl ${theme.iconBgClass} ${theme.iconColorClass} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-2xs`}
          >
            <IconComponent size={20} />
          </div>

          {/* Lencana (Pill Badge) Jumlah Entri */}
          <span
            className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs tabular-nums ${theme.badgeClass}`}
          >
            {theme.badgeText}
          </span>
        </div>

        {/* ================================================================= */}
        {/* 2. BAGIAN TENGAH: Nama Kategori & Uraian Filosofis               */}
        {/* ================================================================= */}
        <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight group-hover:text-[#0d9488] transition-colors">
          {category.name}
        </h3>

        {/* Uraian Singkat / Status Kosong di Database */}
        <p className="text-xs sm:text-sm text-slate-500 font-normal leading-relaxed line-clamp-3 mt-1.5">
          {hasDescription ? (
            category.description
          ) : (
            <span className="italic text-slate-400">
              Keterangan belum diisi di database.
            </span>
          )}
        </p>
      </div>

      {/* ================================================================= */}
      {/* 3. BAGIAN BAWAH: Tombol Aksi "Lihat Keterangan →"                  */}
      {/* ================================================================= */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 group-hover:text-[#0d9488] transition-colors">
          {isPending ? 'Lihat Status Data' : 'Lihat Keterangan'}
        </span>
        <div className="w-7 h-7 rounded-lg bg-slate-50 group-hover:bg-[#e6f7f5] text-slate-400 group-hover:text-[#0d9488] flex items-center justify-center transition-colors">
          <ArrowRight
            size={14}
            className="group-hover:translate-x-0.5 transition-transform"
          />
        </div>
      </div>
    </div>
  );
};
