import { useState, useEffect } from 'react';
import { useWarigaPersonal } from '../hooks/useWarigaPersonal';
import { WarigaPersonalHero } from '../components/WarigaPersonalHero';
import { WarigaPersonalForm } from '../components/WarigaPersonalForm';
import { WarigaPersonalSidebar } from '../components/WarigaPersonalSidebar';
import { WarigaPersonalRecommendations } from '../components/WarigaPersonalRecommendations';
import { WarigaPersonalCalendarGrid } from '../components/WarigaPersonalCalendarGrid';
import { WarigaPersonalDayDetailModal } from '../components/WarigaPersonalDayDetailModal';
import { WarigaTanggalLahirModal } from '../components/WarigaTanggalLahirModal';
import { DewasaTanggalLahirModal } from '../components/DewasaTanggalLahirModal';
import { WarigaPersonalSkeleton } from '../components/WarigaPersonalSkeleton';
import { PremiumUpgradeModal } from '@/features/kelola-pura/components/PremiumUpgradeModal';
import { AlertCircle, CalendarSearch } from 'lucide-react';

/**
 * ============================================================================
 * HALAMAN UTAMA: WarigaPersonalPage
 * ============================================================================
 * Halaman orkestrator fitur Wariga Personal yang menggabungkan:
 *  1. Header & Breadcrumb (WarigaPersonalHero).
 *  2. Form Input Tanggal Lahir & Bulan/Tahun Target (WarigaPersonalForm).
 *  3. Panel Rekomendasi Tanggal Emas (WarigaPersonalRecommendations).
 *  4. Tata Letak Split-Screen (Desktop) / Vertikal (Mobile):
 *     - Sisi Kiri: Weton Lahir, Tombol Modal, Filter, & Legenda (WarigaPersonalSidebar).
 *     - Sisi Kanan: Matriks Kalender Bulanan 7 Kolom (WarigaPersonalCalendarGrid).
 *  5. Dialog Modals:
 *     - Day Detail Modal (Kalkulasi Matematis Modulo 4 & status hari terpilih).
 *     - Wariga Tanggal Lahir Modal (15 dimensi penanggalan & filosofi).
 *     - Dewasa Tanggal Lahir Modal (Padewasan ala/ayuning kelahiran).
 *     - Premium Upgrade Modal (Penawaran peningkatan akun bagi Guest).
 *
 * Mengikuti Panduan AGENTS.md & fe_strategy.md:
 *  - URL-as-State synchronization
 *  - Dynamic document.title
 *  - Ergonomi sentuhan mobile (44px target)
 *  - Tabular numbers pada seluruh angka tanggal & urip
 * ============================================================================
 */

export default function WarigaPersonalPage() {
  const {
    // Parameter URL
    queryTglLahir,
    querySebelumJam6,
    queryBulan,
    queryTahun,
    isBirthDateValid,

    // Data API server
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,

    // Filter & Hasil harian
    filterType,
    setFilterType,
    filteredHasil,

    // Seleksi sel tanggal
    selectedDate,
    selectedItem,
    handleSelectDate,
    handleCloseDetailModal,

    // Navigasi kalender & form
    handlePrevMonth,
    handleNextMonth,
    handleResetToday,
    handleSubmitSearch,

    // Modal Wariga Kelahiran
    isWarigaModalOpen,
    openWarigaModal,
    closeWarigaModal,

    // Modal Dewasa Kelahiran
    isDewasaModalOpen,
    openDewasaModal,
    closeDewasaModal,
    dewasaKelahiran,
    isDewasaLoading,
  } = useWarigaPersonal();

  // State untuk modal promosi upgrade Member/Premium
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // BLOK 1: JUDUL TAB BROWSER DINAMIS (DYNAMIC DOCUMENT TITLE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (data?.identitas_kelahiran) {
      document.title = `Wariga Personal · Bulan ${queryBulan}/${queryTahun} | Kalender Bali`;
    } else {
      document.title = 'Wariga Personal | Kalender Bali';
    }
  }, [data, queryBulan, queryTahun]);

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 1. HERO BANNER & BREADCRUMB                                         */}
      {/* =================================================================== */}
      <WarigaPersonalHero />

      {/* =================================================================== */}
      {/* 2. FORM CARD INPUT PENCARIAN WARIGA PERSONAL                        */}
      {/* =================================================================== */}
      <WarigaPersonalForm
        initialBirthDate={queryTglLahir}
        initialSebelumJam6={querySebelumJam6}
        initialMonth={queryBulan}
        initialYear={queryTahun}
        onSubmit={handleSubmitSearch}
        isLoading={isLoading || isFetching}
      />

      {/* =================================================================== */}
      {/* 3. PENANGANAN KONDISI: ERROR STATE                                  */}
      {/* =================================================================== */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200 p-6 sm:p-8 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            Gagal Memuat Data Wariga Personal
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {error?.message ||
              'Terjadi kendala saat menghubungkan ke server. Silakan periksa koneksi internet Anda.'}
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] text-white font-bold text-xs shadow-xs transition-all cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
          >
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. PENANGANAN KONDISI: LOADING SKELETON (CLS = 0)                   */}
      {/* =================================================================== */}
      {isLoading && !data && <WarigaPersonalSkeleton />}

      {/* =================================================================== */}
      {/* 5. PENANGANAN KONDISI: BELUM ADA INPUT PENCARIAN (EMPTY STATE)     */}
      {/* =================================================================== */}
      {!isBirthDateValid && !isLoading && !isError && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200/60 text-teal-700 flex items-center justify-center mx-auto shadow-2xs">
            <CalendarSearch className="w-8 h-8" />
          </div>

          <div className="space-y-2 max-w-lg mx-auto">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Mulai Evaluasi Wariga Personal Anda
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed font-medium">
              Masukkan tanggal lahir Anda pada formulir di atas untuk membuka matriks kalender
              keselarasan hari berdasarkan sistem 4 arketipe Wariga Bali.
            </p>
          </div>

          {/* Panduan Ringkas 4 Pilar Wariga */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-100 max-w-4xl mx-auto text-left">
            <div className="p-3.5 rounded-xl bg-sky-50/50 border border-sky-200/60 space-y-1">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Arketipe 1 (Hari Baik)
              </span>
              <h4 className="text-sm font-extrabold text-[#0f172a]">Guru</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Melambangkan kebijaksanaan, pendidikan, dan kelancaran usaha.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Arketipe 2 (Hari Baik)
              </span>
              <h4 className="text-sm font-extrabold text-[#0f172a]">Ratu</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Melambangkan wibawa kepemimpinan, relasi, dan kemakmuran.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-1">
              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">
                Arketipe 3 (Hari Buruk)
              </span>
              <h4 className="text-sm font-extrabold text-[#0f172a]">Lara</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Melambangkan potensi rintangan, kelelahan fisik, atau kesedihan.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/50 border border-rose-200/60 space-y-1">
              <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
                Arketipe 4 (Hari Buruk)
              </span>
              <h4 className="text-sm font-extrabold text-[#0f172a]">Pati</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Melambangkan penghentian, pantangan untuk memulai hajatan penting.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. TAMPILAN UTAMA SETELAH HASIL PENCARIAN TERSEDIA                  */}
      {/* =================================================================== */}
      {data && isBirthDateValid && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Panel Rekomendasi Tanggal Terbaik Bulan Ini */}
          <WarigaPersonalRecommendations
            recommendations={data.rekomendasi_hari_terbaik || []}
            isLimited={data.periode.is_limited}
            upgradeMessage={data.periode.upgrade_message}
            onSelectDate={handleSelectDate}
            onOpenUpgradeModal={() => setIsUpgradeModalOpen(true)}
          />

          {/* Tata Letak Split-Screen (Sidebar Kiri + Kalender Kanan) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Panel Sidebar Kiri (4 dari 12 kolom di Desktop) */}
            <div className="lg:col-span-4">
              <WarigaPersonalSidebar
                identitas={data.identitas_kelahiran}
                statistik={data.ringkasan_statistik}
                filterType={filterType}
                onFilterChange={setFilterType}
                onOpenWarigaModal={openWarigaModal}
                onOpenDewasaModal={openDewasaModal}
              />
            </div>

            {/* Matriks Kalender Bulanan Kanan (8 dari 12 kolom di Desktop) */}
            <div className="lg:col-span-8">
              <WarigaPersonalCalendarGrid
                year={queryTahun}
                month={queryBulan}
                items={filteredHasil}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onResetToday={handleResetToday}
              />
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 7. DIALOG MODAL: DETAIL PERHITUNGAN TANGGAL TERPILIH                 */}
      {/* =================================================================== */}
      {data && (
        <WarigaPersonalDayDetailModal
          isOpen={Boolean(selectedDate && selectedItem)}
          onClose={handleCloseDetailModal}
          item={selectedItem}
          identitas={data.identitas_kelahiran}
        />
      )}

      {/* =============================================================== */}
      {/* 8. DIALOG MODAL: WARIGA TANGGAL LAHIR (18 DIMENSI LENGKAP)          */}
      {/* =============================================================== */}
      <WarigaTanggalLahirModal
        isOpen={isWarigaModalOpen}
        onClose={closeWarigaModal}
        birthDate={queryTglLahir}
        identitasKelahiran={data?.identitas_kelahiran}
      />

      {/* =================================================================== */}
      {/* 9. DIALOG MODAL: DEWASA TANGGAL LAHIR (PADEWASAN)                    */}
      {/* =================================================================== */}
      <DewasaTanggalLahirModal
        isOpen={isDewasaModalOpen}
        onClose={closeDewasaModal}
        birthDate={queryTglLahir}
        items={dewasaKelahiran}
        isLoading={isDewasaLoading}
      />

      {/* =================================================================== */}
      {/* 10. DIALOG MODAL: UPGRADE KEANGGOTAAN MEMBER / PREMIUM               */}
      {/* =================================================================== */}
      <PremiumUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Buka Rekomendasi Lengkap Wariga Personal"
        description={
          <>
            Rekomendasi otomatis tanggal terbaik dan analisis mendalam jam baik (dauh ayu)
            adalah fitur khusus untuk <strong className="text-amber-800 font-bold">Member Premium</strong>.
          </>
        }
        benefits={[
          'Rekomendasi otomatis 3 tanggal emas terbaik setiap bulan',
          'Rincian dauh ayu (jam baik pelaksanaan upacara/usaha)',
          'Simpan riwayat profil weton keluarga tanpa perlu input ulang',
          'Akses penuh perhitungan wariga terperinci',
        ]}
      />
    </div>
  );
}
