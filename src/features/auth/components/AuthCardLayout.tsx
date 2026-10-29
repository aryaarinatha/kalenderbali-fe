import type { ReactNode } from 'react';

/**
 * ==============================================================================
 * PROPS: KOMPONEN PEMBUNGKUS KARTU AUTENTIKASI (AuthCardLayout)
 * ==============================================================================
 */
interface AuthCardLayoutProps {
  /** Judul utama kartu (contoh: "Selamat Datang !") */
  title: string;

  /** Subjudul penjelasan di bawah judul utama */
  subtitle: string;

  /** Elemen form dan tombol aksi yang berada di dalam kartu putih */
  children: ReactNode;

  /** Elemen teks atau tautan navigasi yang berada di luar bagian bawah kartu */
  footer?: ReactNode;
}

/**
 * ==============================================================================
 * KOMPONEN: AuthCardLayout
 * ==============================================================================
 * Wadah tata letak terpusat (screen-centered) untuk halaman Login dan Register.
 * Mengikuti standar visual AGENTS.md:
 * - Latar belakang kanvas: #f4f7f6 (bg-[#f4f7f6])
 * - Kartu putih: border border-slate-200/90, rounded-2xl, shadow-sm, max-w-[440px]
 * - Tipografi teks hierarkis font-sans yang proporsional
 */
export default function AuthCardLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthCardLayoutProps) {
  return (
    <main
      className="min-h-screen bg-[#f4f7f6] flex flex-col items-center justify-center p-4 sm:p-6 font-sans antialiased select-none text-slate-800"
      role="main"
    >
      {/* ==================================================================== */}
      {/* WADAH KARTU UTAMA (Card Container) Sesuai Gambar 1 & Gambar 2         */}
      {/* ==================================================================== */}
      <div className="w-full max-w-[440px] bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 transition-all">
        {/* Header Kartu: Judul & Subjudul */}
        <div className="text-center mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
            {title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Isi Form Input & Aksi */}
        {children}
      </div>

      {/* ==================================================================== */}
      {/* NAVIGASI DI LUAR KARTU (Footer Links) Sesuai Gambar Referensi         */}
      {/* ==================================================================== */}
      {footer && (
        <footer className="mt-6 text-center space-y-2.5 text-xs text-slate-500 font-medium">
          {footer}
        </footer>
      )}
    </main>
  );
}
