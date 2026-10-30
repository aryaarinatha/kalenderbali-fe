import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { KalenderHarian, HariRayaItem, PiodalanTerdekatItem } from '../types/kalender.types';
import { formatFullIndoDate, getHariRayaBadgeStyle } from '../utils/calendarUtils';
import { HariRayaDetailModal } from './HariRayaDetailModal';

/**
 * ============================================================================
 * KOMPONEN: CalendarBottomSection
 * ============================================================================
 * Bagian bawah kalender yang terdiri dari 2 panel:
 *  1. Sisi Kiri (~65%): "Hari Raya Bulan Ini"
 *     - Memuat seluruh hari raya bulan aktif secara dinamis.
 *     - Navigasi panah (< dan >) seperti di kalender untuk menjelajahi kartu.
 *     - Mengklik kartu membuka HariRayaDetailModal dengan penjelasan lengkap.
 *  2. Sisi Kanan (~35%): "Piodalan Terdekat"
 *     - Menampilkan daftar piodalan pura terdekat dalam bulan kalender dari backend Go.
 * ============================================================================
 */

interface CalendarBottomSectionProps {
  monthlyHolidays: KalenderHarian[];
  onSelectDate: (dateString: string) => void;
  onNavigateToFullHoliday?: () => void;
  monthlyPiodalans?: PiodalanTerdekatItem[];
  monthlyPiodalanTotal?: number;
  activeYear?: number;
  activeMonth?: number;
}

interface HolidayCardData {
  dateString: string;
  holiday: HariRayaItem;
}

const ITEMS_PER_PAGE = 3;

export const CalendarBottomSection: React.FC<CalendarBottomSectionProps> = ({
  monthlyHolidays,
  onSelectDate,
  monthlyPiodalans,
  monthlyPiodalanTotal,
}) => {
  // Evaluasi daftar piodalan: 100% data riil dari mesin piodalan backend Go
  const piodalanDisplayList = monthlyPiodalans || [];
  const piodalanTotalLocations = monthlyPiodalanTotal ?? 0;

  // State untuk modal penjelasan hari raya yang dipilih
  const [selectedHoliday, setSelectedHoliday] = useState<HariRayaItem | null>(null);

  // State halaman saat ini untuk paginasi kartu hari raya
  const [currentPage, setCurrentPage] = useState(0);

  // Reset ke halaman 1 jika bulan berganti (pola resmi React tanpa cascading renders)
  const [prevHolidays, setPrevHolidays] = useState(monthlyHolidays);
  if (prevHolidays !== monthlyHolidays) {
    setPrevHolidays(monthlyHolidays);
    setCurrentPage(0);
  }

  // Kumpulkan seluruh hari raya di bulan aktif (termasuk jika 1 hari memiliki >1 rahinan)
  const holidayCards: HolidayCardData[] = [];
  monthlyHolidays.forEach((day) => {
    day.hari_raya?.forEach((hr) => {
      holidayCards.push({
        dateString: day.tanggal,
        holiday: hr,
      });
    });
  });

  // Hitung jumlah halaman
  const totalPages = Math.max(1, Math.ceil(holidayCards.length / ITEMS_PER_PAGE));

  // Ambil kartu untuk halaman saat ini
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const displayedHolidays = holidayCards.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <>
      <div id="agenda-bulan-ini" className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* ========================================================= */}
        {/* 1. KARTU KIRI: HARI RAYA BULAN INI (lg:col-span-8)        */}
        {/* ========================================================= */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between">
          {/* Header Bagian Hari Raya */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
                Hari Raya Bulan Ini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Ringkasan seluruh rahinan pada bulan ini (<span className="tabular-nums font-semibold">{holidayCards.length}</span> perayaan).
              </p>
            </div>

            {/* Sisi Kanan: Navigasi Panah < dan > Seperti di Kalender */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentPage === 0}
                className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed [touch-action:manipulation]"
                title="Hari raya sebelumnya"
                aria-label="Hari raya sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={currentPage >= totalPages - 1}
                className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed [touch-action:manipulation]"
                title="Hari raya berikutnya"
                aria-label="Hari raya berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daftar Kartu Hari Raya Horisontal */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {displayedHolidays.length === 0 ? (
              <div className="col-span-3 text-center py-8 text-xs sm:text-sm text-slate-400">
                Tidak ada agenda hari raya pada bulan ini.
              </div>
            ) : (
              displayedHolidays.map((item, idx) => {
                const badgeStyle = getHariRayaBadgeStyle(item.holiday.nama);
                return (
                  <div
                    key={`${item.dateString}-${item.holiday.id || item.holiday.nama}-${idx}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      onSelectDate(item.dateString);
                      setSelectedHoliday(item.holiday);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onSelectDate(item.dateString);
                        setSelectedHoliday(item.holiday);
                      }
                    }}
                    className="rounded-2xl border border-slate-200/90 p-5 bg-white hover:border-[#0d9488]/60 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3.5 group active:scale-98 [touch-action:manipulation]"
                    title={`Klik untuk membaca penjelasan hari raya ${item.holiday.nama}`}
                  >
                    <div className="space-y-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-md ${badgeStyle.bg} ${badgeStyle.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`} />
                        {item.holiday.nama}
                      </span>

                      <h4 className="text-base font-bold text-[#0f172a] group-hover:text-[#0d9488] transition-colors block truncate">
                        {item.holiday.nama}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-500 font-medium tabular-nums">
                        {formatFullIndoDate(item.dateString)}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 group-hover:text-[#0d9488] font-medium transition-colors">
                        Klik untuk melihat penjelasan ↗
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* ========================================================= */}
      {/* 2. KARTU KANAN: PIODALAN TERDEKAT (lg:col-span-4)         */}
      {/* ========================================================= */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs flex flex-col justify-between space-y-4">
        {/* Header Piodalan Terdekat */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <h3 className="text-lg sm:text-xl font-extrabold text-[#0f172a] tracking-tight">
            Piodalan Terdekat
          </h3>
          <span className="text-[10px] font-extrabold text-[#0d9488] bg-[#e6f7f5] border border-teal-200/60 px-3 py-1 rounded-full uppercase tabular-nums">
            {piodalanTotalLocations} Lokasi
          </span>
        </div>

        {/* List 3 Piodalan Terdekat */}
        <div className="space-y-3">
          {piodalanDisplayList.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              Tidak ada agenda piodalan terdekat yang belum lewat.
            </div>
          ) : (
            piodalanDisplayList.map((pio) => (
              <div
                key={pio.id}
                onClick={() => {
                  // Jika memiliki tanggal spesifik, klik akan memfokuskan kalender ke tanggal tersebut
                  if ('dateStr' in pio && typeof pio.dateStr === 'string' && pio.dateStr) {
                    onSelectDate(pio.dateStr);
                  }
                }}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100/90 bg-[#f8fafc] hover:bg-slate-100/70 transition-colors cursor-pointer group [touch-action:manipulation]"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#e6f7f5] text-[#0d9488] font-black text-sm flex items-center justify-center shrink-0 tabular-nums">
                    {pio.dayNumber}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-[#0f172a] block truncate group-hover:text-[#0d9488] transition-colors">
                      {pio.wukuTitle}
                    </span>
                    <span className="text-xs text-slate-400 font-medium block tabular-nums">
                      {pio.puraCountText}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>

    {/* Modal Dialog Penjelasan Hari Raya */}
    {selectedHoliday && (
      <HariRayaDetailModal
        isOpen={!!selectedHoliday}
        onClose={() => setSelectedHoliday(null)}
        holidayId={selectedHoliday.id}
        holidayName={selectedHoliday.nama}
      />
    )}
  </>
);
};
