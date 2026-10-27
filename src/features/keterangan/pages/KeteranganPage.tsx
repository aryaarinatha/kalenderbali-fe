import { useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useKeteranganTypes } from '../hooks/useKeterangan';
import {
  ALL_CATEGORY_REGISTRY,
  type KeteranganTabKey,
  type KeteranganType,
} from '../types/keterangan.types';
import { KeteranganHero } from '../components/KeteranganHero';
import { KeteranganCard } from '../components/KeteranganCard';

/**
 * ============================================================================
 * HALAMAN UTAMA (PAGE 1): KeteranganPage (Katalog Kategori Kalender Bali)
 * ============================================================================
 * Halaman katalog utama yang merender kartu-kartu kategori referensi Kalender Bali:
 *
 * Menerapkan Arsitektur 2 Halaman Mandiri (Bukan Modal Mengambang):
 *  1. Alur Interaksi: Saat pengguna mengklik salah satu kartu kategori, aplikasi
 *     melakukan navigasi rute penuh ke Page 2: `/keterangan/:typeCode` (contoh: /keterangan/wuku).
 *  2. Segmented Tab Filter: Memfilter kategori berdasarkan kelompoknya
 *     (Semua, Wariga, Hari Raya, Dewasa Ayu, Astrologi & Zodiak) tersinkronisasi ke URL (?tab=wariga).
 *  3. Zero-Loading: Mengambil data daftar kategori dari Backend Go via TanStack Query Lapis 3 (RAM).
 *  4. Zero Layout Shift (CLS = 0): Skeleton Screen berdimensi presisi saat cold start.
 * ============================================================================
 */

/** Daftar pilihan tombol segmented tab switcher */
const TAB_OPTIONS: { key: KeteranganTabKey; label: string }[] = [
  { key: 'semua', label: 'Semua Kategori' },
  { key: 'wariga', label: 'Wariga & Pawewaran' },
  { key: 'hari_raya', label: 'Hari Raya' },
  { key: 'dewasa', label: 'Ala Ayuning Dewasa' },
  { key: 'astrologi', label: 'Astrologi & Zodiak' },
];

export default function KeteranganPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // ---------------------------------------------------------------------------
  // 1. REKONSTRUKSI STATUS TAB FILTER DARI URL SEARCH PARAMS
  // ---------------------------------------------------------------------------
  const activeTab = useMemo<KeteranganTabKey>(() => {
    const rawTab = searchParams.get('tab') as KeteranganTabKey | null;
    const validTabs: KeteranganTabKey[] = [
      'semua',
      'wariga',
      'hari_raya',
      'dewasa',
      'astrologi',
    ];
    return rawTab && validTabs.includes(rawTab) ? rawTab : 'semua';
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // 2. KONSUMSI DATA KATEGORI DARI BACKEND GO (TANSTACK QUERY LAPIS 3)
  // ---------------------------------------------------------------------------
  const { categories, backendTypes, isLoading, isError, error, refetch } =
    useKeteranganTypes();

  // ---------------------------------------------------------------------------
  // 3. PENYARINGAN KARTU KATEGORI BERDASARKAN TAB AKTIF
  // ---------------------------------------------------------------------------
  const displayedCategories = useMemo<KeteranganType[]>(() => {
    if (activeTab === 'semua') return categories;

    // Buat pemetaan kelompok kategori dari ALL_CATEGORY_REGISTRY
    const groupMap = new Map<string, KeteranganTabKey>();
    ALL_CATEGORY_REGISTRY.forEach((reg) => {
      groupMap.set(reg.code.toLowerCase(), reg.group);
    });

    return categories.filter((cat) => {
      const catGroup = groupMap.get(cat.code.toLowerCase()) || 'wariga';
      return catGroup === activeTab;
    });
  }, [categories, activeTab]);

  // ---------------------------------------------------------------------------
  // 4. ACTION HANDLERS (NAVIGASI KE HALAMAN DETAIL & GANTI TAB)
  // ---------------------------------------------------------------------------

  /**
   * Mengubah tab kategori aktif dan menyinkronkannya ke parameter URL
   */
  const handleTabChange = (newTab: KeteranganTabKey) => {
    const newParams = new URLSearchParams(searchParams);
    if (newTab === 'semua') {
      newParams.delete('tab');
    } else {
      newParams.set('tab', newTab);
    }
    setSearchParams(newParams);
  };

  /**
   * Navigasi ke Halaman Penuh Rincian Kategori (Page 2: /keterangan/:typeCode)
   * Menggantikan pembukaan modal pop-up mengambang lama
   */
  const handleNavigateToDetail = (cat: KeteranganType) => {
    navigate(`/layanan/keterangan/${cat.code}`);
  };

  // ---------------------------------------------------------------------------
  // 5. DYNAMIC DOCUMENT TITLE (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    document.title = 'Keterangan Elemen Kalender Bali | Kalender Bali';
  }, []);

  return (
    <div className="space-y-6 pb-16 max-w-[1560px] mx-auto select-none">
      {/* =================================================================== */}
      {/* 1. HEADER HERO SECTION (Amplop Putih Bersih AGENTS.md)              */}
      {/* =================================================================== */}
      <KeteranganHero
        activeCategoryCount={backendTypes.length || 16}
        totalEntryCount={490}
        isLoading={isLoading}
      />

      {/* =================================================================== */}
      {/* 2. PENANGANAN KESALAHAN JARINGAN (ERROR STATE DARI GO BACKEND)      */}
      {/* =================================================================== */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Menghubungi Server Keterangan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {error || 'Terjadi kesalahan saat memuat data referensi kalender Bali.'}
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
      {/* 3. SEGMENTED TAB SWITCHER (PENYARING KELOMPOK KATEGORI)             */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="p-1 bg-slate-100 rounded-xl flex flex-wrap gap-1 select-none">
          {TAB_OPTIONS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => handleTabChange(tab.key)}
                className={`text-xs sm:text-sm py-2 px-3.5 rounded-lg transition-all cursor-pointer font-bold [touch-action:manipulation] ${
                  isActive
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Indikator Jumlah Kategori yang Tampil */}
        <span className="text-xs font-semibold text-slate-400 tabular-nums">
          Menampilkan {displayedCategories.length} Kategori
        </span>
      </div>

      {/* =================================================================== */}
      {/* 4. SKELETON SCREEN LOADING (ZERO CLS: GRID 3 KOLOM IDENTIK)         */}
      {/* =================================================================== */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 bg-slate-100 rounded-xl" />
                <div className="w-20 h-5 bg-slate-100 rounded-full" />
              </div>
              <div className="w-36 h-5 bg-slate-200 rounded" />
              <div className="space-y-2">
                <div className="w-full h-3 bg-slate-100 rounded" />
                <div className="w-3/4 h-3 bg-slate-100 rounded" />
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-6 h-6 bg-slate-100 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. GRID KATALOG KATEGORI UTAMA (RESPONSIF 3 KOLOM)                  */}
      {/* =================================================================== */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          {displayedCategories.map((cat) => (
            <KeteranganCard
              key={cat.code}
              category={cat}
              onClick={handleNavigateToDetail}
            />
          ))}
        </div>
      )}
    </div>
  );
}
