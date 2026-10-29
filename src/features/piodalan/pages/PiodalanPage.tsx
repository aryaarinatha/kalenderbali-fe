import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type {
  PiodalanFilterParams,
  PiodalanSearchTab,
  PiodalanScheduleItem,
  PiodalanModalActiveSection,
} from '../types/piodalan.types';
import {
  usePiodalanSearch,
  useUpcomingPiodalan,
} from '../hooks/usePiodalan';
import { getTodayWITA } from '../utils/piodalanUtils';
import { PiodalanSearchForm } from '../components/PiodalanSearchForm';
import { PiodalanResultList } from '../components/PiodalanResultList';
import { PiodalanSidebarWidgets } from '../components/PiodalanSidebarWidgets';
import { PiodalanDetailModal } from '../components/PiodalanDetailModal';
import { PiodalanGuideModal } from '../components/PiodalanGuideModal';

/**
 * ==============================================================================
 * HALAMAN UTAMA: PiodalanPage (Orkestrator Fitur Piodalan Kalender Bali)
 * ==============================================================================
 * Mengatur tata letak, state reaktif, dan integrasi backend:
 *
 * 1. Dual-State Rendering (Sesuai Arahan Pengguna & fe_strategy.md):
 *    - STATE AWAL (Belum Search): Hanya merender Header, PiodalanHero, dan PiodalanSearchForm.
 *      Bagian Hasil Pencarian dan 3 Sidebar Widgets TIDAK DITAMPILKAN DULU.
 *    - STATE AKTIF (Setelah Search): Begitu pengguna menekan tombol "Cari piodalan",
 *      tata letak responsif 2 kolom (Hasil pencarian di kiri + 3 Widget di kanan)
 *      ditampilkan sesuai persis dengan filter yang dicari.
 * 2. URL-as-State:
 *    - Parameter pencarian aktif disinkronkan ke URL (?tab=wewaran&saptawara=Buda&...)
 *    - Mendukung bookmark, tombol browser Back/Forward, dan shareable links.
 * ==============================================================================
 */

export const PiodalanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFormRef = useRef<HTMLDivElement>(null);

  // Tanggal hari ini dalam zona waktu WITA (UTC+8)
  const todayWITA = useMemo(() => getTodayWITA(), []);
  const currentYear = useMemo(() => parseInt(todayWITA.split('-')[0], 10) || 2026, [todayWITA]);

  // ----------------------------------------------------------------------------
  // 1. EVALUASI APAKAH PENGGUNA SUDAH MELAKUKAN SEARCH
  // ----------------------------------------------------------------------------
  // Pengguna dianggap sudah melakukan search jika:
  // a) URL memiliki parameter 'searched=true'
  // b) ATAU dibuka lewat link langsung yang memiliki parameter spesifik (wuku / q / bulan)
  const hasSearched = useMemo(() => {
    if (searchParams.get('searched') === 'true') return true;

    const tab = searchParams.get('tab');
    if (tab === 'wewaran' && searchParams.has('wuku') && searchParams.has('saptawara')) {
      return true;
    }
    if (tab === 'pura' && (searchParams.has('nama_pura') || searchParams.has('q'))) {
      return true;
    }
    if (tab === 'bulan' && searchParams.has('bulan')) {
      return true;
    }

    return false;
  }, [searchParams]);

  // ----------------------------------------------------------------------------
  // 2. STATE FORM INPUT LOKAL (Dapat diedit bebas sebelum tombol Cari ditekan)
  // ----------------------------------------------------------------------------
  const [formInputs, setFormInputs] = useState<PiodalanFilterParams>(() => {
    const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
    const tab: PiodalanSearchTab =
      rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

    const saptawara = searchParams.get('saptawara') || '';
    const pancawara = searchParams.get('pancawara') || '';
    const wuku = searchParams.get('wuku') || '';
    const tahun = searchParams.get('tahun') || '';
    const bulanParam = searchParams.get('bulan');
    const bulan = bulanParam ? parseInt(bulanParam, 10) : '';
    const namaPura = searchParams.get('nama_pura') || searchParams.get('q') || '';

    return {
      tab,
      saptawara,
      pancawara,
      wuku,
      tahun,
      bulan,
      namaPura,
    };
  });

  // Sinkronkan formInputs jika URL searchParams berubah dari navigasi luar (Back/Forward)
  useEffect(() => {
    if (hasSearched) {
      const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
      const tab: PiodalanSearchTab =
        rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

      setFormInputs({
        tab,
        saptawara: searchParams.get('saptawara') || '',
        pancawara: searchParams.get('pancawara') || '',
        wuku: searchParams.get('wuku') || '',
        tahun: searchParams.get('tahun') || '',
        bulan: searchParams.get('bulan') || '',
        namaPura: searchParams.get('nama_pura') || searchParams.get('q') || '',
      });
    }
  }, [searchParams, hasSearched]);

  // ----------------------------------------------------------------------------
  // 3. PARAMETER PENCARIAN AKTIF YANG DIKIRIM KE HOOK BACKEND
  // ----------------------------------------------------------------------------
  // Hanya aktif jika hasSearched bernilai true!
  const activeFilter: PiodalanFilterParams | null = useMemo(() => {
    if (!hasSearched) return null;

    const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
    const tab: PiodalanSearchTab =
      rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

    return {
      tab,
      saptawara: searchParams.get('saptawara') || formInputs.saptawara || '',
      pancawara: searchParams.get('pancawara') || formInputs.pancawara || '',
      wuku: searchParams.get('wuku') || formInputs.wuku || '',
      tahun: searchParams.get('tahun') || formInputs.tahun || currentYear,
      bulan: searchParams.get('bulan') || formInputs.bulan || '',
      namaPura: searchParams.get('nama_pura') || searchParams.get('q') || formInputs.namaPura || '',
    };
  }, [hasSearched, searchParams, formInputs, currentYear]);

  // ----------------------------------------------------------------------------
  // 4. QUERY BACKEND GO: HANYA BERJALAN JIKA SUDAH MELAKUKAN SEARCH
  // ----------------------------------------------------------------------------
  const {
    scheduleList,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
  } = usePiodalanSearch(activeFilter, hasSearched);

  // Hitung satu piodalan terdekat untuk widget sidebar kanan
  const upcomingPiodalan = useUpcomingPiodalan(scheduleList);

  // ----------------------------------------------------------------------------
  // 5. STATE KONTROL MODAL DIALOG POP-UP
  // ----------------------------------------------------------------------------
  const [detailModalState, setDetailModalState] = useState<{
    isOpen: boolean;
    schedule: PiodalanScheduleItem | null;
    activeSection: PiodalanModalActiveSection;
  }>({
    isOpen: false,
    schedule: null,
    activeSection: 'pura',
  });

  const [isGuideModalOpen, setIsGuideModalOpen] = useState<boolean>(false);

  // ----------------------------------------------------------------------------
  // 6. HANDLER AKSI PENGGUNA
  // ----------------------------------------------------------------------------
  // Update state form lokal saat user mengganti dropdown / input
  const handleFormInputChange = (updates: Partial<PiodalanFilterParams>) => {
    setFormInputs((prev) => ({ ...prev, ...updates }));
  };

  // Eksekusi pencarian saat tombol 'Cari piodalan' ditekan
  const handleSearchSubmit = () => {
    if (formInputs.tab === 'wewaran') {
      if (!formInputs.saptawara || !formInputs.pancawara || !formInputs.wuku || !formInputs.tahun) {
        return;
      }
    } else if (formInputs.tab === 'bulan') {
      if (!formInputs.bulan || !formInputs.tahun) {
        return;
      }
    } else if (formInputs.tab === 'pura') {
      if (!formInputs.namaPura || !formInputs.namaPura.trim()) {
        return;
      }
    }

    const newParams = new URLSearchParams();
    newParams.set('tab', formInputs.tab);
    newParams.set('tahun', String(formInputs.tahun));
    newParams.set('searched', 'true');

    if (formInputs.tab === 'wewaran') {
      newParams.set('saptawara', formInputs.saptawara);
      newParams.set('pancawara', formInputs.pancawara);
      newParams.set('wuku', formInputs.wuku);
    } else if (formInputs.tab === 'bulan') {
      newParams.set('bulan', String(formInputs.bulan));
    } else if (formInputs.tab === 'pura') {
      newParams.set('nama_pura', (formInputs.namaPura || '').trim());
    }

    setSearchParams(newParams, { replace: true });
    refetch();
  };

  // Reset filter kembali ke keadaan awal (menghilangkan hasil pencarian)
  const handleResetFilter = () => {
    setSearchParams({}, { replace: true });
    setFormInputs({
      tab: 'wewaran',
      saptawara: '',
      pancawara: '',
      wuku: '',
      tahun: '',
      bulan: '',
      namaPura: '',
    });
  };

  // Fokus kembali ke form pencarian saat tombol 'Ubah' pada Widget 2 diklik
  const handleFocusSearchForm = () => {
    if (searchFormRef.current) {
      searchFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Buka modal detail 2 section
  const handleOpenScheduleDetail = (
    item: PiodalanScheduleItem,
    initialSection: PiodalanModalActiveSection
  ) => {
    setDetailModalState({
      isOpen: true,
      schedule: item,
      activeSection: initialSection,
    });
  };

  const handleCloseDetailModal = () => {
    setDetailModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // ----------------------------------------------------------------------------
  // 7. JUDUL TAB BROWSER DINAMIS (DYNAMIC DOCUMENT TITLE)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (hasSearched && activeFilter) {
      if (activeFilter.tab === 'wewaran') {
        document.title = `Piodalan ${activeFilter.saptawara} ${activeFilter.pancawara} ${activeFilter.wuku} ${activeFilter.tahun} | Kalender Bali`;
      } else if (activeFilter.tab === 'pura' && activeFilter.namaPura) {
        document.title = `Piodalan "${activeFilter.namaPura}" | Kalender Bali`;
      } else {
        document.title = 'Jadwal Piodalan Pura Bali | Kalender Bali';
      }
    } else {
      document.title = 'Pencarian Piodalan Pura | Kalender Bali';
    }
  }, [hasSearched, activeFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN STANDAR & BREADCRUMB (AGENTS.md 4.1)               */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumb Navigasi Hierarkis */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
          >
            <span>Wargabali</span>
            <span className="text-slate-300">/</span>
            <span>Layanan</span>
            <span className="text-slate-300">/</span>
            <span className="text-teal-700 font-bold">Piodalan</span>
          </nav>

          {/* Judul H1 Halaman */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Piodalan
          </h1>

          {/* Deskripsi Ringkas Fungsi Halaman */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Pencarian jadwal piodalan pura di Bali berdasarkan siklus wewaran, bulan, atau nama pura.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KARTU PENCARIAN DENGAN SEGMENTED TAB SWITCHER                     */}
      {/* ==================================================================== */}
      <div ref={searchFormRef}>
        <PiodalanSearchForm
          filter={formInputs}
          hasSearched={hasSearched}
          onFilterChange={handleFormInputChange}
          onSearchSubmit={handleSearchSubmit}
          onResetFilter={handleResetFilter}
          isLoading={isLoading}
        />
      </div>

      {/* ==================================================================== */}
      {/* 4. PENANGANAN KESALAHAN JARINGAN (ERROR STATE DARI BACKEND GO)       */}
      {/* ==================================================================== */}
      {hasSearched && isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Memuat Jadwal Piodalan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {(error as Error)?.message || 'Terjadi kesalahan saat menghubungi server kalender Bali.'}
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


      {/* ==================================================================== */}
      {/* 4. BAGIAN HASIL PENCARIAN & 3 WIDGET SIDEBAR                         */}
      {/* HANYA DITAMPILKAN JIKA PENGGUNA SUDAH MELAKUKAN SEARCH               */}
      {/* ==================================================================== */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          {/* Kolom Kiri (~2/3 Lebar: lg:col-span-8) - Tabel Hasil Piodalan */}
          <div className="lg:col-span-8 space-y-6">
            <PiodalanResultList
              scheduleList={scheduleList}
              totalCount={totalCount}
              isLoading={isLoading}
              onOpenScheduleDetail={handleOpenScheduleDetail}
              onResetFilter={handleResetFilter}
            />
          </div>

          {/* Kolom Kanan (~1/3 Lebar: lg:col-span-4) - 3 Widget Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <PiodalanSidebarWidgets
              upcomingPiodalan={upcomingPiodalan}
              filter={activeFilter || formInputs}
              totalCount={totalCount}
              onOpenScheduleDetail={handleOpenScheduleDetail}
              onFocusSearchForm={handleFocusSearchForm}
              onOpenGuideModal={() => setIsGuideModalOpen(true)}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL DIALOG POP-UP TERPADU 2 SECTION                             */}
      {/* Section 1: Detail Wariga (Gambar 1 & 2)                              */}
      {/* Section 2: Detail Pura & Rangkaian Acara Kontributor                  */}
      {/* ==================================================================== */}
      <PiodalanDetailModal
        isOpen={detailModalState.isOpen}
        onClose={handleCloseDetailModal}
        schedule={detailModalState.schedule}
        initialSection={detailModalState.activeSection}
      />

      {/* ==================================================================== */}
      {/* 6. MODAL DIALOG PEDOMAN PENANGGALAN BUDAYA                           */}
      {/* ==================================================================== */}
      <PiodalanGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />
    </div>
  );
};

export default PiodalanPage;
