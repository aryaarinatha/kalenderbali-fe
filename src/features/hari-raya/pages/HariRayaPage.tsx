import { useMemo, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type {
  HariRayaCardItem,
  HariRayaFilterState,
  HariRayaViewMode,
} from '../types/hariRaya.types';
import { useHariRayaData } from '../hooks/useHariRaya';
import {
  getTodayWITA,
  NAMA_BULAN_INDO,
} from '../utils/hariRayaUtils';
import { HariRayaHero } from '../components/HariRayaHero';
import { HariRayaFilter } from '../components/HariRayaFilter';
import { HariRayaMainContent } from '../components/HariRayaMainContent';
import { HariRayaSidebar } from '../components/HariRayaSidebar';
import { HariRayaSearchResults } from '../components/HariRayaSearchResults';
import { HariRayaDetailModal } from '../components/HariRayaDetailModal';

/**
 * ============================================================================
 * HALAMAN UTAMA: HariRayaPage (Orchestrator Fitur Hari Raya Bali)
 * ============================================================================
 * Halaman utama yang merakit seluruh komponen fitur Hari Raya Bali sesuai desain:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md & AGENTS.md):
 *  1. URL-as-State: Status filter (year, month, view, holiday) disinkronisasikan
 *     secara reaktif ke query parameter URL (?year=2026&month=9&view=bulanan&holiday=all).
 *     Tautan dapat dibagikan (shareable) dan tombol Back/Forward browser berfungsi alami.
 *  2. Zero-Loading: Mengonsumsi cache TanStack Query 1 tahun penuh (['kalender', year])
 *     sehingga navigasi antar-bulan berjalan instan dalam 0ms.
 *  3. Zero Layout Shift (CLS = 0): Menyajikan Skeleton Screen presisi dimensi
 *     saat data pertama kali ditarik dari backend Go.
 *  4. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 *  5. Responsivitas Layar Penuh:
 *     - Layar Desktop (lg): Split layout 2 kolom (67% Main Content, 33% Sidebar).
 *     - Layar Mobile / Tablet: Tata letak vertikal terurut dengan target sentuh min 44x44px.
 * ============================================================================
 */

export default function HariRayaPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Tanggal hari ini dalam zona waktu absolut WITA (UTC+8 / Asia/Makassar)
  const todayDate = useMemo(() => getTodayWITA(), []);
  const todayParts = useMemo(() => todayDate.split('-').map(Number), [todayDate]);
  const defaultYear = todayParts[0] || 2026;
  const defaultMonth = todayParts[1] || 9;

  // -------------------------------------------------------------------------
  // 1. REKONSTRUKSI STATE DARI URL SEARCH PARAMS (URL-AS-STATE)
  // -------------------------------------------------------------------------
  const activeYear = useMemo(() => {
    const raw = searchParams.get('year');
    const parsed = raw ? parseInt(raw, 10) : defaultYear;
    return isNaN(parsed) || parsed < 1800 || parsed > 2200 ? defaultYear : parsed;
  }, [searchParams, defaultYear]);

  const activeMonth = useMemo(() => {
    const raw = searchParams.get('month');
    const parsed = raw ? parseInt(raw, 10) : defaultMonth;
    return isNaN(parsed) || parsed < 1 || parsed > 12 ? defaultMonth : parsed;
  }, [searchParams, defaultMonth]);

  const activeViewMode = useMemo<HariRayaViewMode>(() => {
    const raw = searchParams.get('view');
    return raw === 'tahunan' ? 'tahunan' : 'bulanan';
  }, [searchParams]);

  const activeHolidayName = useMemo(() => {
    const raw = searchParams.get('holiday');
    return raw && raw !== 'all' ? raw : '';
  }, [searchParams]);

  // State lokal form filter sebelum disubmit
  const [localFilterState, setLocalFilterState] = useState<HariRayaFilterState>({
    year: activeYear,
    month: activeMonth,
    viewMode: activeViewMode,
    holidayName: activeHolidayName,
  });

  const [prevParams, setPrevParams] = useState({
    year: activeYear,
    month: activeMonth,
    viewMode: activeViewMode,
    holidayName: activeHolidayName,
  });

  // Sinkronkan state lokal saat URL search params berganti (rekomendasi React untuk sinkronisasi state dari props/URL)
  if (
    prevParams.year !== activeYear ||
    prevParams.month !== activeMonth ||
    prevParams.viewMode !== activeViewMode ||
    prevParams.holidayName !== activeHolidayName
  ) {
    setPrevParams({
      year: activeYear,
      month: activeMonth,
      viewMode: activeViewMode,
      holidayName: activeHolidayName,
    });
    setLocalFilterState({
      year: activeYear,
      month: activeMonth,
      viewMode: activeViewMode,
      holidayName: activeHolidayName,
    });
  }

  // -------------------------------------------------------------------------
  // 2. KONSUMSI DATA DENGAN TANSTACK QUERY (ZERO-LOADING CACHE LAPIS 3)
  // -------------------------------------------------------------------------
  const {
    allCards,
    monthCards,
    upcomingInfo,
    yearGroupedByMonth,
    masterList,
    masterMap,
    isLoading,
    isError,
    error,
    refetch,
  } = useHariRayaData(activeYear, activeMonth);

  // Status apakah pengguna sedang berada dalam mode pencarian spesifik
  const isSearchMode = Boolean(activeHolidayName);

  // -------------------------------------------------------------------------
  // 3. KARTU UNTUK HALAMAN UTAMA (SELALU MENAMPILKAN HARI RAYA BULAN INI)
  // -------------------------------------------------------------------------
  const displayedCards = monthCards;

  // Hasil pencarian spesifik perayaan sepanjang tahun berjalan (semua 12 bulan)
  const searchResults = useMemo(() => {
    if (!isSearchMode) return [];
    const query = activeHolidayName.toLowerCase().trim();
    return allCards.filter((card) =>
      card.nama.toLowerCase().includes(query)
    );
  }, [allCards, isSearchMode, activeHolidayName]);

  // Data master filosofis dari hari raya yang dicari
  const searchMasterItem = useMemo(() => {
    if (!isSearchMode) return null;
    const query = activeHolidayName.toLowerCase().trim();
    return (
      masterMap.get(query) ||
      masterList.find((m) => m.nama.toLowerCase().includes(query)) ||
      null
    );
  }, [isSearchMode, activeHolidayName, masterMap, masterList]);

  // -------------------------------------------------------------------------
  // 4. MODAL DIALOG DETAIL
  // -------------------------------------------------------------------------
  const [modalCard, setModalCard] = useState<HariRayaCardItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // Handler klik kartu hari raya pada grid
  const handleSelectCard = useCallback((card: HariRayaCardItem) => {
    setModalCard(card);
    setIsDetailModalOpen(true);
  }, []);

  // -------------------------------------------------------------------------
  // 5. HANDLER INTERAKSI FILTER
  // -------------------------------------------------------------------------

  // Handler perubahan input form filter
  const handleFilterChange = (updates: Partial<HariRayaFilterState>) => {
    setLocalFilterState((prev) => ({ ...prev, ...updates }));

    // Jika pengguna mengganti mode tampilan (Bulanan vs Tahunan) lewat segmented switcher tab,
    // langsung sinkronkan ke URL agar mode tampilan berpindah seketika
    if (updates.viewMode && updates.viewMode !== activeViewMode) {
      const newParams: Record<string, string> = {
        year: String(localFilterState.year),
        month: String(localFilterState.month),
        view: updates.viewMode,
      };
      if (localFilterState.holidayName && localFilterState.holidayName !== 'all') {
        newParams.holiday = localFilterState.holidayName;
      }
      setSearchParams(newParams);
    }
  };

  // Handler tombol "Cari hari raya": Sinkronkan ke query parameter URL
  const handleFilterSubmit = () => {
    const newParams: Record<string, string> = {
      year: String(localFilterState.year),
      month: String(localFilterState.month),
      view: localFilterState.viewMode,
    };
    if (localFilterState.holidayName && localFilterState.holidayName !== 'all') {
      newParams.holiday = localFilterState.holidayName;
    }
    setSearchParams(newParams);
  };

  // Handler kembali dari mode pencarian spesifik ke tampilan umum
  const handleBackToAll = useCallback(() => {
    setSearchParams({
      year: String(activeYear),
      month: String(activeMonth),
      view: activeViewMode,
    });
    setLocalFilterState((prev) => ({
      ...prev,
      holidayName: '',
    }));
  }, [activeYear, activeMonth, activeViewMode, setSearchParams]);

  // -------------------------------------------------------------------------
  // 6. DYNAMIC DOCUMENT TITLE (fe_strategy.md Bab 8.13)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const monthName = NAMA_BULAN_INDO[activeMonth - 1] || 'Bulan';
    if (isSearchMode) {
      document.title = `${activeHolidayName} (${activeYear}) · Hasil Pencarian Hari Raya | Kalender Bali`;
    } else {
      document.title = `${monthName} ${activeYear} · Hari Raya Bali | Kalender Bali`;
    }
  }, [activeMonth, activeYear, activeHolidayName, isSearchMode]);

  return (
    <div className="space-y-6 pb-12 max-w-[1560px] mx-auto">
      {/* =================================================================== */}
      {/* 1. HEADER & HERO BANNER SECTION                                     */}
      {/* =================================================================== */}
      <HariRayaHero />

      {/* =================================================================== */}
      {/* 2. FORM FILTER PENCARIAN HARI RAYA (Sembunyi saat Mode Hasil Cari)   */}
      {/* =================================================================== */}
      {!isSearchMode && (
        <HariRayaFilter
          filterState={localFilterState}
          masterList={masterList}
          onFilterChange={handleFilterChange}
          onSubmit={handleFilterSubmit}
        />
      )}

      {/* =================================================================== */}
      {/* 3. PENANGANAN KESALAHAN JARINGAN (ERROR STATE)                      */}
      {/* =================================================================== */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Memuat Jadwal Hari Raya
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {error || 'Terjadi kesalahan saat menghubungi server kalender Bali.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 [touch-action:manipulation]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SKELETON SCREEN LOADING (ZERO CLS: 2 KOLOM IDENTIK)              */}
      {/* =================================================================== */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full animate-pulse">
          {/* Skeleton Kolom Kiri */}
          <div className="lg:col-span-8 space-y-4">
            <div className="h-6 w-48 bg-slate-200 rounded-lg" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 flex items-center gap-4"
                >
                  <div className="w-14 h-14 bg-slate-100 rounded-xl shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-20 h-3 bg-slate-200 rounded" />
                    <div className="w-36 h-4 bg-slate-200 rounded" />
                    <div className="w-16 h-4 bg-slate-100 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton Kolom Kanan */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-4">
              <div className="w-32 h-5 bg-slate-200 rounded" />
              <div className="w-full h-40 bg-teal-50/50 rounded-2xl" />
              <div className="space-y-2">
                <div className="w-full h-10 bg-slate-100 rounded-xl" />
                <div className="w-full h-10 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. TATA LETAK UTAMA: MODE PENCARIAN SPESIFIK VS MODE UMUM           */}
      {/* =================================================================== */}
      {!isLoading && (
        isSearchMode ? (
          <HariRayaSearchResults
            holidayName={activeHolidayName}
            year={activeYear}
            results={searchResults}
            masterItem={searchMasterItem}
            onSelectCard={handleSelectCard}
            onBack={handleBackToAll}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Kolom Kiri: Grid Kartu Hari Raya */}
            <div className="lg:col-span-8">
              <HariRayaMainContent
                cards={displayedCards}
                viewMode={activeViewMode}
                activeMonth={activeMonth}
                activeYear={activeYear}
                onSelectCard={handleSelectCard}
                yearGroupedCards={yearGroupedByMonth}
              />
            </div>

            {/* Kolom Kanan: Panel Samping (Hari Raya Terdekat, Wuku/Sasih, Pengingat) */}
            <div className="lg:col-span-4 lg:sticky lg:top-6">
              <HariRayaSidebar
                upcomingInfo={upcomingInfo}
              />
            </div>
          </div>
        )
      )}

      {/* =================================================================== */}
      {/* 6. MODAL DIALOG POP-UP RINCIAN FILOSOFIS HARI RAYA                  */}
      {/* =================================================================== */}
      <HariRayaDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        cardItem={modalCard}
        masterItem={
          modalCard
            ? masterMap.get(modalCard.nama.toLowerCase().trim())
            : undefined
        }
      />
    </div>
  );
}
