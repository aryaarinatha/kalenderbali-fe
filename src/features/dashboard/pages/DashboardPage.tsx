import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { DashboardHero } from '../components/DashboardHero';
import { DashboardMiniCalendar } from '../components/DashboardMiniCalendar';
import { DashboardUpcomingHariRaya } from '../components/DashboardUpcomingHariRaya';
import { DashboardDewasaAyu } from '../components/DashboardDewasaAyu';
import { DashboardPiodalan } from '../components/DashboardPiodalan';
import { DashboardSkeleton } from '../components/DashboardSkeleton';

/**
 * ============================================================================
 * HALAMAN UTAMA: DashboardPage (Orkestrator Halaman Dashboard Kalender Bali)
 * ============================================================================
 * Halaman beranda utama yang merakit seluruh komponen fitur Dashboard sesuai desain:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md & AGENTS.md):
 *  1. ZERO-LOADING UX: Mengonsumsi cache TanStack Query 1 tahun penuh kalender
 *     sehingga navigasi antar halaman berlangsung instan dalam 0ms.
 *  2. ZERO LAYOUT SHIFT (CLS = 0): Menyajikan DashboardSkeleton presisi dimensi
 *     saat data pertama kali ditarik dari backend Go.
 *  3. DYNAMIC DOCUMENT TITLE: Memperbarui judul tab browser secara reaktif
 *     menjadi "Dashboard · Kalender Bali".
 *  4. TATA LETAK RESPONSIF & SIMETRIS:
 *     - Header Halaman: Breadcrumb / Eyebrow "Wargabal / Dashboard", Judul H1, & Deskripsi.
 *     - Baris 1: Hero Banner "HARI INI" (Wewaran, Urip, Sasih, Pawukon).
 *     - Baris 2: Mini Kalender Bulanan (lg:col-span-7) & Hari Raya Berikutnya (lg:col-span-5).
 *     - Baris 3: Dewasa Ayu Hari Ini (lg:col-span-1) & Piodalan Terdekat (lg:col-span-1).
 *  5. ISOLASI KESALAHAN (Error Boundary): Menyajikan kartu penanganan anggun
 *     dengan tombol "Coba Lagi" jika terjadi gangguan koneksi jaringan.
 * ============================================================================
 */

export default function DashboardPage() {
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 1. SINKRONISASI JUDUL TAB BROWSER DINAMIS (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    document.title = 'Dashboard · Kalender Bali';
  }, []);

  // ---------------------------------------------------------------------------
  // 2. KONSUMSI DATA DARI CUSTOM HOOK ORKESTRATOR
  // ---------------------------------------------------------------------------
  const {
    heroData,
    calendarHeaderInfo,
    calendarGridCells,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDate,
    upcomingHariRaya,
    dewasaAyu,
    piodalan,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardData();

  // Handler interaksi tanggal di mini kalender:
  // Mengarahkan pengguna langsung ke tanggal tersebut di halaman Kalender Bali
  const onCalendarDateClick = (dateString: string) => {
    handleSelectDate(dateString);
    navigate(`/kalender?date=${dateString}`);
  };

  // ---------------------------------------------------------------------------
  // 3. PENANGANAN STATE LOADING (SKELETON PRESISI DIMENSI — CLS = 0)
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header Title Skeleton */}
        <div className="space-y-1.5 mb-2">
          <div className="h-3.5 w-32 bg-slate-200/80 rounded-full animate-pulse" />
          <div className="h-8 w-48 bg-slate-300/70 rounded-xl animate-pulse" />
          <div className="h-4 w-96 max-w-2xl bg-slate-200/60 rounded-lg animate-pulse" />
        </div>

        {/* Skeleton Seluruh Section Dashboard */}
        <DashboardSkeleton />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 4. PENANGANAN STATE ERROR (ISOLASI KESALAHAN JARINGAN)
  // ---------------------------------------------------------------------------
  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-10 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">
            Gagal Memuat Data Kalender
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {error || 'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer [touch-action:manipulation]"
        >
          <RefreshCw size={15} />
          <span>Coba Muat Ulang</span>
        </button>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 5. RENDER UTAMA HALAMAN DASHBOARD
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER UTAMA: BREADCRUMB, JUDUL H1, & DESKRIPSI (GAYA SERAGAM)      */}
      {/* =================================================================== */}
      <div className="space-y-1.5">
        {/* Breadcrumb navigasi hierarkis */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Dashboard</span>
        </nav>

        {/* Judul Utama H1 */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Dashboard
        </h1>

        {/* Deskripsi Singkat */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Informasi wariga dan budaya Bali dalam satu ruang yang tenang dan mudah dipahami.
        </p>
      </div>

      {/* =================================================================== */}
      {/* BARIS 1: BANNER HERO "HARI INI" (WEWARAN, SASIH, PAWUKON, URIP)     */}
      {/* =================================================================== */}
      <section aria-label="Informasi Kalender Hari Ini">
        <DashboardHero heroData={heroData} />
      </section>

      {/* =================================================================== */}
      {/* BARIS 2: 2 KOLOM (MINI KALENDER & HARI RAYA BERIKUTNYA)             */}
      {/* =================================================================== */}
      <section
        aria-label="Kalender Bulanan dan Hari Raya Terdekat"
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch"
      >
        {/* Kolom Kiri: Mini Kalender Bulanan (lg:col-span-7) */}
        <div className="lg:col-span-7">
          <DashboardMiniCalendar
            title={calendarHeaderInfo.title}
            sasihSubtitle={calendarHeaderInfo.sasihSubtitle}
            days={calendarGridCells}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSelectDate={onCalendarDateClick}
          />
        </div>

        {/* Kolom Kanan: Hari Raya Berikutnya (lg:col-span-5) */}
        <div className="lg:col-span-5">
          <DashboardUpcomingHariRaya items={upcomingHariRaya} />
        </div>
      </section>

      {/* =================================================================== */}
      {/* BARIS 3: 2 KOLOM (DEWASA AYU HARI INI & PIODALAN TERDEKAT)          */}
      {/* =================================================================== */}
      <section
        aria-label="Dewasa Ayu dan Piodalan Terdekat"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
      >
        {/* Kolom Kiri: Dewasa Ayu Hari Ini (3 Tag Teratas) */}
        <div>
          <DashboardDewasaAyu data={dewasaAyu} />
        </div>

        {/* Kolom Kanan: Piodalan Terdekat (3 Pura Teratas) */}
        <div>
          <DashboardPiodalan data={piodalan} />
        </div>
      </section>
    </div>
  );
}
