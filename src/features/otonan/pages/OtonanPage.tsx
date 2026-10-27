import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { OtonanSearchParams, OtonanSearchType } from '../types/otonan.types';
import { useOtonanSearch } from '../hooks/useOtonan';
import { formatIndoDate, getTodayWITA } from '../utils/otonanUtils';
import { OtonanHero } from '../components/OtonanHero';
import { OtonanFormSection } from '../components/OtonanFormSection';
import { OtonanResultSection } from '../components/OtonanResultSection';
import { OtonanDetailModal } from '../components/OtonanDetailModal';

/**
 * ============================================================================
 * HALAMAN UTAMA: OtonanPage (Penyusun Fitur Otonan Kalender Bali)
 * ============================================================================
 * Halaman orchestrator yang mengatur siklus hidup dan penyajian fitur Otonan:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md):
 *  1. URL-as-State: Status pencarian disinkronisasikan ke query parameter URL
 *     (?type=tanggal_lahir&birth_date=1998-12-22&time=before_06&target_year=2026).
 *     Tautan dapat dibagikan (shareable), mendukung tombol Back/Forward browser,
 *     dan tahan terhadap refresh halaman (F5).
 *  2. Dual-State Rendering:
 *     - GAMBAR 2: Jika URL belum memiliki query pencarian -> hanya merender Form Section.
 *     - GAMBAR 1: Jika URL memiliki query pencarian valid -> merender Form Section + Result Section.
 *  3. Zero Layout Shift (CLS = 0): Menyajikan Skeleton Screen berdimensi presisi
 *     saat query TanStack sedang memuat data dari backend Go.
 *  4. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 * ============================================================================
 */

export default function OtonanPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State modal dialog rincian wariga otonan & tanggal yang dipilih
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [selectedOtonanDate, setSelectedOtonanDate] = useState<string | null>(null);

  const handleOpenDetailModal = (dateStr: string) => {
    setSelectedOtonanDate(dateStr);
    setIsDetailModalOpen(true);
  };

  // Tanggal hari ini dalam zona waktu WITA (UTC+8)
  const todayWITA = useMemo(() => getTodayWITA(), []);

  // -------------------------------------------------------------------------
  // 1. REKONSTRUKSI PARAMETER DARI URL SEARCH PARAMS
  // -------------------------------------------------------------------------
  const activeParams: OtonanSearchParams | null = useMemo(() => {
    const type = searchParams.get('type') as OtonanSearchType | null;
    const birthDate = searchParams.get('birth_date');
    const timeParam = searchParams.get('time');
    const targetYearParam = searchParams.get('target_year');

    const saptawaraId = searchParams.get('saptawara');
    const pancawaraId = searchParams.get('pancawara');
    const wukuId = searchParams.get('wuku');

    // Tahun target default: tahun berjalan dari todayWITA
    const currentYear = parseInt(todayWITA.split('-')[0], 10) || 2026;
    const targetYear = targetYearParam ? parseInt(targetYearParam, 10) : currentYear;

    // Skenario A: Mode Tanggal Lahir (Masehi)
    if (birthDate) {
      return {
        tipe_pencarian: 'tanggal_lahir',
        tanggal_lahir: birthDate,
        sebelum_jam_6: timeParam === 'before_06',
        tahun_target: targetYear,
      };
    }

    // Skenario B: Mode Wewaran Manual
    if (type === 'elemen_kalender' && saptawaraId && pancawaraId && wukuId) {
      return {
        tipe_pencarian: 'elemen_kalender',
        saptawara_id: saptawaraId,
        pancawara_id: pancawaraId,
        wuku_id: wukuId,
        tahun_target: targetYear,
      };
    }

    // Default: Belum ada pencarian aktif (GAMBAR 2)
    return null;
  }, [searchParams, todayWITA]);

  // -------------------------------------------------------------------------
  // 2. QUERY BACKEND DENGAN TANSTACK QUERY (LAPIS 3 CACHE)
  // -------------------------------------------------------------------------
  const {
    data: otonanData,
    isLoading,
    isError,
    error,
    refetch,
  } = useOtonanSearch(activeParams, Boolean(activeParams));

  // -------------------------------------------------------------------------
  // 3. DYNAMIC DOCUMENT TITLE (fe_strategy.md Bab 8.13)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (otonanData && otonanData.hasil && otonanData.hasil.length > 0) {
      const first = otonanData.hasil[0];
      const elemen = otonanData.input_dinormalisasi?.elemen;
      const wewaranText = elemen
        ? `${elemen.saptawara} ${elemen.pancawara} ${elemen.wuku}`
        : 'Pawukon';
      document.title = `Otonan ${wewaranText} (${formatIndoDate(first.tanggal, { format: 'short' })}) | Kalender Bali`;
    } else {
      document.title = 'Hitung Otonan Kelahiran | Kalender Bali';
    }
  }, [otonanData]);

  // -------------------------------------------------------------------------
  // 4. HANDLER PERUBAHAN & PENGIRIMAN FORM
  // -------------------------------------------------------------------------
  const handleFormSubmit = (params: OtonanSearchParams) => {
    const newParams: Record<string, string> = {
      type: params.tipe_pencarian,
      target_year: String(params.tahun_target),
    };

    if (params.tipe_pencarian === 'tanggal_lahir' && params.tanggal_lahir) {
      newParams.birth_date = params.tanggal_lahir;
      newParams.time = params.sebelum_jam_6 ? 'before_06' : 'after_06';
    } else if (params.tipe_pencarian === 'elemen_kalender') {
      if (params.saptawara_id) newParams.saptawara = String(params.saptawara_id);
      if (params.pancawara_id) newParams.pancawara = String(params.pancawara_id);
      if (params.wuku_id) newParams.wuku = String(params.wuku_id);
    }

    // Perbarui query parameter di URL (memicu eksekusi useOtonanSearch otomatis)
    setSearchParams(newParams);
  };

  // Jumlah tanggal otonan di tahun target (default 2 jika belum dihitung)
  const totalOtonanInYear = otonanData?.hasil?.length || 2;

  return (
    <div className="space-y-6 pb-12">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & BREADCRUMB (SESUAI DESAIN WARGABALI)                */}
      {/* =================================================================== */}
      <OtonanHero />

      {/* =================================================================== */}
      {/* 2. FORM SECTION (HERO BANNER & FORM HITUNG OTONAN)                  */}
      {/* Selalu tampil di Gambar 1 maupun Gambar 2                           */}
      {/* =================================================================== */}
      <OtonanFormSection
        activeParams={activeParams}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
        totalOtonanInYear={totalOtonanInYear}
      />

      {/* =================================================================== */}
      {/* 3. PENANGANAN KESALAHAN INPUT (ERROR ALERT DARI GO BACKEND)         */}
      {/* =================================================================== */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Melakukan Perhitungan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {error?.message || 'Terjadi kesalahan saat menghubungi server perhitungan otonan.'}
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
      {/* 4. SKELETON SCREEN LOADING (ZERO CLS: 2 KARTU DETAIL FULL-WIDTH)    */}
      {/* =================================================================== */}
      {isLoading && (
        <div className="space-y-6 w-full animate-pulse">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2.5">
                  <div className="w-36 h-4 bg-slate-200 rounded-md" />
                  <div className="w-72 h-9 bg-slate-200 rounded-lg" />
                  <div className="w-48 h-4 bg-slate-100 rounded-md" />
                </div>
                <div className="w-32 h-20 bg-slate-100 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-100">
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
              </div>
              <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100">
                <div className="w-44 h-10 bg-slate-200 rounded-xl" />
                <div className="w-36 h-10 bg-slate-100 rounded-xl" />
                <div className="w-36 h-4 bg-slate-100 rounded ml-auto" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. RESULT SECTION (MENAMPILKAN KARTU DETAIL OTONAN SESUAI BALIKAN GO) */}
      {/* =================================================================== */}
      {!isLoading && otonanData && (
        <OtonanResultSection
          data={otonanData}
          onOpenDetailModal={handleOpenDetailModal}
        />
      )}

      {/* =================================================================== */}
      {/* 6. MODAL POP-UP DETAIL WARIGA                                       */}
      {/* =================================================================== */}
      <OtonanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        selectedDate={selectedOtonanDate || otonanData?.hasil?.[0]?.tanggal}
        data={otonanData}
      />
    </div>
  );
}
