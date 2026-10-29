import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * ==============================================================================
 * TIPE DATA: BreadcrumbItem
 * ==============================================================================
 * Model butir navigasi reaktif untuk breadcrumb hierarkis
 */
export interface BreadcrumbItem {
  /** Label teks butir breadcrumb */
  label: string;
  /** Callback saat butir breadcrumb diklik */
  onClick?: () => void;
  /** Menandakan apakah butir ini adalah segmen aktif terakhir */
  active?: boolean;
}

/**
 * ==============================================================================
 * PROPS: KelolaPuraHero
 * ==============================================================================
 * Properti untuk konfigurasi judul, deskripsi, breadcrumb, dan aksi sisi kanan:
 * - title: Judul utama halaman (default: "Kelola Pura")
 * - description: Deskripsi fungsi halaman
 * - breadcrumbChild: Label sub-halaman anakan yang sedang aktif
 * - breadcrumbs: Daftar kustom butir breadcrumb jika memerlukan struktur khusus
 * - showBackButton: Kontrol tampilan tombol kembali (otomatis true jika ada breadcrumbChild)
 * - backButtonLabel: Label tombol kembali (default: "Kembali ke Daftar Pura")
 * - rightAction: Komponen kustom di sisi kanan header
 * - onNavigateToList: Callback saat pengguna mengklik tombol kembali atau breadcrumb "Kelola Pura"
 * - totalPura: Total pura terdata (opsional)
 * - totalKabupaten: Total kabupaten terdata (opsional)
 */
export interface KelolaPuraHeroProps {
  /** Judul utama halaman (default: "Kelola Pura") */
  title?: string;
  /** Deskripsi fungsi fitur kelola pura */
  description?: string;
  /** Sub-segmen breadcrumb aktif untuk halaman anakan (misal: "Jadwal Piodalan & Acara" atau "Transparansi Kas Pura") */
  breadcrumbChild?: string;
  /** Breadcrumb items kustom penuh jika ingin kendali langsung */
  breadcrumbs?: BreadcrumbItem[];
  /** Menampilkan tombol kembali ke daftar pura di pojok kanan header */
  showBackButton?: boolean;
  /** Teks label tombol kembali (default: "Kembali ke Daftar Pura") */
  backButtonLabel?: string;
  /** Elemen aksi kustom di sisi kanan header */
  rightAction?: React.ReactNode;
  /** Callback untuk navigasi kembali ke katalog pura */
  onNavigateToList?: () => void;
  /** Total pura terdata (opsional untuk kompatibilitas ke belakang) */
  totalPura?: number;
  /** Total kabupaten terdata (opsional untuk kompatibilitas ke belakang) */
  totalKabupaten?: number;
}

/**
 * ==============================================================================
 * KOMPONEN: KelolaPuraHero (Header Minimalis Standar Halaman Wargabali)
 * ==============================================================================
 * Mengadopsi gaya visual bersih, elegan, dan tenang dari Dashboard Wargabali:
 * 1. Sisi Kiri:
 *    - Breadcrumb Navigasi Hierarkis:
 *      * Katalog Utama: "Wargabali / Kelola Pura"
 *      * Halaman Anakan: "Wargabali / Kelola Pura / [Sub-halaman Aktif]"
 *    - Judul Utama (H1): Tipografi besar kontras tinggi (Slate 900)
 *    - Paragraf Deskripsi Singkat: Penjelasan kontekstual fitur aktif
 * 2. Sisi Kanan (Pojok Kanan Header):
 *    - Tombol "Kembali ke Daftar Pura" dengan ikon panah kiri yang rapi dan terstandarisasi.
 * ==============================================================================
 */
export const KelolaPuraHero: React.FC<KelolaPuraHeroProps> = ({
  title = 'Kelola Pura',
  description = 'Pusat informasi terpadu jadwal upacara piodalan, susunan tahapan acara, serta transparansi pencatatan kas pura di seluruh Bali.',
  breadcrumbChild,
  breadcrumbs,
  showBackButton,
  backButtonLabel = 'Kembali ke Daftar Pura',
  rightAction,
  onNavigateToList,
}) => {
  const navigate = useNavigate();

  // Tombol kembali otomatis muncul jika ada breadcrumbChild atau jika showBackButton eksplisit true
  const shouldShowBack = showBackButton ?? Boolean(breadcrumbChild);

  // Konstruksi daftar butir breadcrumb secara reaktif dan aman
  const navItems: BreadcrumbItem[] = useMemo(() => {
    if (breadcrumbs && breadcrumbs.length > 0) {
      return breadcrumbs;
    }

    // Segmen awal: Beranda Wargabali
    const list: BreadcrumbItem[] = [
      {
        label: 'Wargabali',
        onClick: () => navigate('/'),
      },
    ];

    if (breadcrumbChild) {
      // Jika berada di sub-halaman anakan:
      // "Kelola Pura" menjadi link interaktif untuk kembali ke katalog
      list.push({
        label: 'Kelola Pura',
        onClick: onNavigateToList || (() => navigate('/kelola-pura')),
      });
      // Segmen aktif sub-halaman (berwarna teal tebal)
      list.push({
        label: breadcrumbChild,
        active: true,
      });
    } else {
      // Jika berada di halaman utama katalog:
      // "Kelola Pura" adalah segmen aktif
      list.push({
        label: 'Kelola Pura',
        active: true,
      });
    }

    return list;
  }, [breadcrumbs, breadcrumbChild, onNavigateToList, navigate]);

  return (
    <header
      role="banner"
      aria-label="Header Halaman Kelola Pura"
      className="flex flex-col md:flex-row md:items-center justify-between gap-4"
    >
      {/* ==================================================================== */}
      {/* 1. SISI KIRI: BREADCRUMB, JUDUL H1, & DESKRIPSI KONTEKSTUAL           */}
      {/* ==================================================================== */}
      <div className="space-y-1.5">
        {/* Breadcrumb Navigasi Hierarkis */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center flex-wrap gap-2 select-none"
        >
          {navItems.map((item, index) => {
            const isLast = index === navItems.length - 1;
            const isActive = item.active || isLast;

            return (
              <React.Fragment key={`${item.label}-${index}`}>
                {index > 0 && (
                  <span className="text-slate-300" aria-hidden="true">
                    /
                  </span>
                )}
                {isActive ? (
                  <span className="text-teal-700 font-bold">
                    {item.label}
                  </span>
                ) : item.onClick ? (
                  <button
                    type="button"
                    onClick={item.onClick}
                    className="hover:text-slate-600 transition-colors cursor-pointer focus:outline-hidden"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="hover:text-slate-600">
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Judul Utama Halaman (H1) */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          {title}
        </h1>

        {/* Paragraf Deskripsi Fitur */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          {description}
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 2. SISI KANAN: TOMBOL KEMBALI KE DAFTAR PURA (POJOK KANAN HEADER)     */}
      {/* ==================================================================== */}
      {rightAction ? (
        <div className="shrink-0 self-start md:self-center">{rightAction}</div>
      ) : shouldShowBack ? (
        <div className="shrink-0 self-start md:self-center">
          <button
            type="button"
            onClick={onNavigateToList || (() => navigate('/kelola-pura'))}
            aria-label={backButtonLabel}
            className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:text-slate-900 active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>{backButtonLabel}</span>
          </button>
        </div>
      ) : null}
    </header>
  );
};
