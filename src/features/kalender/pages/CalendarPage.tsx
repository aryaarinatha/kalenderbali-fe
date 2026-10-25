import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { useKalenderTahun } from '../hooks/useKalender';
import {
  exportHariRayaToICS,
  generateMonthGrid,
  getTodayWITA,
  parseISODate,
  toISODateString,
} from '../utils/calendarUtils';
import { CalendarHeader } from '../components/CalendarHeader';
import { CalendarHero } from '../components/CalendarHero';
import { CalendarGrid } from '../components/CalendarGrid';
import { CalendarInspector } from '../components/CalendarInspector';
import { CalendarBottomSection } from '../components/CalendarBottomSection';
import { DayDetailModal } from '../components/DayDetailModal';

/**
 * ============================================================================
 * HALAMAN UTAMA: CalendarPage (Penyusun Kalender Bali Lengkap)
 * ============================================================================
 * Halaman orchestrator yang merakit seluruh sub-komponen kalender:
 *
 * Prinsip Arsitektur Utama (fe_strategy.md):
 *  1. URL-as-State: Status tanggal aktif dikontrol oleh query param URL
 *     (`/kalender?date=YYYY-MM-DD`). Tautan dapat dibagikan (shareable),
 *     mendukung tombol browser Back/Forward, dan tahan terhadap refresh halaman (F5).
 *  2. Zero-Loading: Mengambil data 1 tahun via `useKalenderTahun` (TanStack Query
 *     dengan `staleTime: Infinity`). Pergantian bulan & klik tanggal berjalan dalam 0ms.
 *  3. Responsivitas Layar Penuh:
 *     - Layar Desktop (lg): Split layout 2 kolom (Kolom Kiri 67% Grid, Kolom Kanan 33% Inspector).
 *     - Layar Mobile / Tablet: Tata letak vertikal terurut yang nyaman disentuh (min 44x44px).
 * ============================================================================
 */

export default function CalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State lokal modal dialog rincian hari (dibuka saat tombol "Lihat detail hari" diklik)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // -------------------------------------------------------------------------
  // 1. SINKRONISASI TANGGAL AKTIF KE URL PARAMETER (?date=YYYY-MM-DD)
  // -------------------------------------------------------------------------
  const todayWITA = useMemo(() => getTodayWITA(), []);

  // Ambil tanggal dari URL, jika tidak ada atau formatnya keliru gunakan hari ini
  const rawDateParam = searchParams.get('date');
  const selectedDate = useMemo(() => {
    if (rawDateParam && /^\d{4}-\d{2}-\d{2}$/.test(rawDateParam)) {
      return rawDateParam;
    }
    return todayWITA;
  }, [rawDateParam, todayWITA]);

  // Uraikan tahun, bulan, dan hari dari tanggal terpilih
  const { year: activeYear, month: activeMonth } = useMemo(
    () => parseISODate(selectedDate),
    [selectedDate]
  );

  // -------------------------------------------------------------------------
  // 2. KONSUMSI DATA 1 TAHUN VIA TANSTACK QUERY (ZERO-LOADING)
  // -------------------------------------------------------------------------
  const {
    daysMap,
    isLoading,
    isError,
    error,
    refetch,
    getMonthDays,
    getMonthHolidays,
    getDayData,
  } = useKalenderTahun(activeYear, activeMonth);

  // Data tanggal yang sedang dipilih
  const selectedData = useMemo(() => getDayData(selectedDate), [getDayData, selectedDate]);

  // Data seluruh hari di bulan aktif & daftar hari raya bulan aktif
  const currentMonthDays = useMemo(
    () => getMonthDays(activeMonth),
    [getMonthDays, activeMonth]
  );
  const currentMonthHolidays = useMemo(
    () => getMonthHolidays(activeMonth),
    [getMonthHolidays, activeMonth]
  );

  // -------------------------------------------------------------------------
  // 3. GENERATOR MATRIKS GRID BULANAN (7 KOLOM: MIN s.d. SAB)
  // -------------------------------------------------------------------------
  const gridCells = useMemo(
    () => generateMonthGrid(activeYear, activeMonth, selectedDate, daysMap),
    [activeYear, activeMonth, selectedDate, daysMap]
  );

  // Subteks Tahun Saka & Sasih untuk header CalendarGrid
  const sakaYearText = useMemo(() => {
    // Ambil data hari pertengahan bulan untuk representasi Sasih bulan ini
    const midDay = currentMonthDays[Math.floor(currentMonthDays.length / 2)];
    const tahunSaka = midDay?.sasih?.tahun_saka || 1948;
    const rawSasih = midDay?.sasih?.nama_sasih || 'kapat';
    const namaSasih = rawSasih.charAt(0).toUpperCase() + rawSasih.slice(1);
    return `Saka ${tahunSaka} · Sasih ${namaSasih}`;
  }, [currentMonthDays]);

  // -------------------------------------------------------------------------
  // 4. ACTION HANDLERS (NAVIGASI & AKSI)
  // -------------------------------------------------------------------------

  /**
   * Mengubah tanggal terpilih dan menyinkronkannya langsung ke parameter URL.
   */
  const handleSelectDate = (newDateStr: string) => {
    setSearchParams({ date: newDateStr });
  };

  /**
   * Mereset tampilan ke tanggal hari ini (zona WITA).
   */
  const handleResetToday = () => {
    setSearchParams({ date: todayWITA });
  };

  /**
   * Navigasi ke bulan sebelumnya.
   */
  const handlePrevMonth = () => {
    let newYear = activeYear;
    let newMonth = activeMonth - 1;
    if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    const newDateStr = toISODateString(newYear, newMonth, 1);
    setSearchParams({ date: newDateStr });
  };

  /**
   * Navigasi ke bulan berikutnya.
   */
  const handleNextMonth = () => {
    let newYear = activeYear;
    let newMonth = activeMonth + 1;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    }
    const newDateStr = toISODateString(newYear, newMonth, 1);
    setSearchParams({ date: newDateStr });
  };

  /**
   * Mengunduh berkas iCal (.ics) untuk seluruh hari raya di bulan aktif.
   */
  const handleDownloadICS = () => {
    exportHariRayaToICS(activeYear, activeMonth, currentMonthDays);
  };

  /**
   * Berpindah ke modul daftar Hari Raya lengkap.
   */
  const handleNavigateToFullHoliday = () => {
    navigate('/hari-raya');
  };

  return (
    <div className="space-y-6 w-full max-w-[1560px] mx-auto pb-12">
      {/* ========================================================= */}
      {/* 1. HEADER HALAMAN & TOMBOL AKSI CEPAT                     */}
      {/* ========================================================= */}
      <CalendarHeader
        onDownloadICS={handleDownloadICS}
        isLoading={isLoading}
      />

      {/* ========================================================= */}
      {/* NOTIFIKASI ERROR (JIKA KONEKSI KE SERVER GAGAL)          */}
      {/* ========================================================= */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Memuat Data Kalender Tahun {activeYear}
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {error || 'Terjadi kesalahan saat menghubungi server kalender Bali.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-11 px-5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 shrink-0 [touch-action:manipulation]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. TOP HERO BAR (RINGKASAN BULAN & ZODIAK)                */}
      {/* ========================================================= */}
      <CalendarHero
        year={activeYear}
        month={activeMonth}
        sakaYearText={sakaYearText}
        monthlyHolidays={currentMonthHolidays}
        todayDateString={todayWITA}
        isLoading={isLoading}
      />

      {/* ========================================================= */}
      {/* 3. GRID UTAMA (SPLIT LAYOUT: GRID BULANAN + INSPECTOR)   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri (~67%): Matriks Bulanan 7 Kolom */}
        <div className="lg:col-span-8">
          <CalendarGrid
            gridCells={gridCells}
            onSelectDate={handleSelectDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onResetToday={handleResetToday}
            canResetToday={selectedDate !== todayWITA}
          />
        </div>

        {/* Kolom Kanan (~33%): Panel Detail Tanggal Terpilih (Equal Height dengan Grid) */}
        <div className="lg:col-span-4 h-full">
          <CalendarInspector
            selectedDate={selectedDate}
            selectedData={selectedData}
            isToday={selectedDate === todayWITA}
            onOpenDetailModal={() => setIsDetailModalOpen(true)}
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. BAGIAN BAWAH: HARI RAYA BULAN INI & PIODALAN TERDEKAT  */}
      {/* ========================================================= */}
      <CalendarBottomSection
        monthlyHolidays={currentMonthHolidays}
        onSelectDate={handleSelectDate}
        onNavigateToFullHoliday={handleNavigateToFullHoliday}
      />

      {/* ========================================================= */}
      {/* 5. MODAL DIALOG RINCIAN PENANGGALAN BALI LENGKAP         */}
      {/* ========================================================= */}
      <DayDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        dateString={selectedDate}
        dayData={selectedData}
      />
    </div>
  );
}
