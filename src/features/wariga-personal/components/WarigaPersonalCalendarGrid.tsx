import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { WarigaPersonalItem, WarigaCategory } from '../types/warigaPersonal.types';
import { getTodayWITA } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalCalendarGrid
 * ============================================================================
 * Matriks kalender bulanan 7 kolom (MIN s.d. SAB) khusus fitur Wariga Personal:
 *  1. Header navigasi bulan (< Prev, Next >, Reset Hari ini).
 *  2. Header nama hari 7 kolom (Min diwarnai merah rose-600).
 *  3. Matriks sel tanggal 35-42 kotak (dengan padding hari bulan sebelumnya & berikutnya).
 *  4. Setiap sel tanggal aktif menyajikan:
 *     - Angka tanggal (tabular-nums).
 *     - Badge status wariga (Guru: sky, Ratu: emerald, Lara: amber, Pati: rose).
 *     - Label wewaran harian (contoh: "Wraspati Pon").
 *     - Highlight tanggal hari ini & tanggal yang sedang dipilih pengguna.
 *
 * Mengikuti Panduan AGENTS.md & fe_strategy.md:
 *  - Area sentuh minimal 44x44px [touch-action:manipulation]
 *  - Tabular numbers pada seluruh teks numerik
 * ============================================================================
 */

interface WarigaPersonalCalendarGridProps {
  year: number;
  month: number; // 1-indexed (1 = Jan, 12 = Des)
  items: WarigaPersonalItem[];
  selectedDate: string | null;
  onSelectDate: (dateString: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onResetToday: () => void;
}

const HARI_SINGKAT = ['MIN', 'SEN', 'SEL', 'RAB', 'KAM', 'JUM', 'SAB'];

const NAMA_BULAN = [
  '',
  'JANUARI',
  'FEBRUARI',
  'MARET',
  'APRIL',
  'MEI',
  'JUNI',
  'JULI',
  'AGUSTUS',
  'SEPTEMBER',
  'OKTOBER',
  'NOVEMBER',
  'DESEMBER',
];

/**
 * Helper pemetaan gaya badge semantik untuk 4 arketipe Wariga
 */
function getWarigaBadgeStyle(category: WarigaCategory) {
  switch (category) {
    case 'Guru':
      return {
        bg: 'bg-sky-50 border-sky-200/80',
        text: 'text-sky-800',
        dot: 'bg-sky-500',
        label: 'Guru (1)',
      };
    case 'Ratu':
      return {
        bg: 'bg-emerald-50 border-emerald-200/80',
        text: 'text-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Ratu (2)',
      };
    case 'Lara':
      return {
        bg: 'bg-amber-50 border-amber-200/80',
        text: 'text-amber-800',
        dot: 'bg-amber-500',
        label: 'Lara (3)',
      };
    case 'Pati':
      return {
        bg: 'bg-rose-50 border-rose-200/80',
        text: 'text-rose-800',
        dot: 'bg-rose-500',
        label: 'Pati (4)',
      };
    default:
      return {
        bg: 'bg-slate-50 border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
        label: '-',
      };
  }
}

export const WarigaPersonalCalendarGrid: React.FC<
  WarigaPersonalCalendarGridProps
> = ({
  year,
  month,
  items,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onResetToday,
}) => {
  const todayWITA = getTodayWITA();
  const [todayYear, todayMonth] = todayWITA.split('-').map((v) => parseInt(v, 10));
  const isViewingCurrentMonth = year === todayYear && month === todayMonth;

  // -------------------------------------------------------------------------
  // BLOK 1: LOOKUP MAP DATA HARIAN & GENERASI GRID BULANAN
  // -------------------------------------------------------------------------
  // Buat map pencarian O(1) berdasarkan tanggal "YYYY-MM-DD"
  const itemMap = useMemo(() => {
    const map = new Map<string, WarigaPersonalItem>();
    for (const item of items) {
      map.set(item.tanggal, item);
    }
    return map;
  }, [items]);

  // Hitung jumlah hari dalam bulan aktif dan hari pertama jatuh di hari apa
  const { gridCells } = useMemo(() => {
    const firstDayIndex = new Date(year, month - 1, 1).getDay(); // 0 = Minggu
    const totalDaysInMonth = new Date(year, month, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month - 1, 0).getDate();

    interface GridCell {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      data?: WarigaPersonalItem;
    }

    const cells: GridCell[] = [];

    // 1. Padding hari bulan sebelumnya
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = totalDaysInPrevMonth - i;
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      const dateString = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(
        prevDay
      ).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: prevDay,
        isCurrentMonth: false,
      });
    }

    // 2. Sel hari aktif bulan ini
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const dateString = `${year}-${String(month).padStart(2, '0')}-${String(
        day
      ).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: day,
        isCurrentMonth: true,
        data: itemMap.get(dateString),
      });
    }

    // 3. Padding hari bulan berikutnya untuk melengkapi baris 7 kolom
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const dateString = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(
        d
      ).padStart(2, '0')}`;
      cells.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
      });
    }

    return { gridCells: cells };
  }, [year, month, itemMap]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      {/* ================================================================= */}
      {/* 1. BAR NAVIGASI BULAN KALENDER                                    */}
      {/* ================================================================= */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 min-h-[46px]">
        {/* Sisi Kiri: Judul Bulan & Tahun Aktif */}
        <div className="flex items-center gap-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            {NAMA_BULAN[month]} {year}
          </h2>

          {!isViewingCurrentMonth && (
            <button
              type="button"
              onClick={onResetToday}
              className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200/60 transition-all cursor-pointer select-none [touch-action:manipulation]"
              title="Kembali ke bulan hari ini"
            >
              <RotateCcw className="w-3 h-3 text-teal-600" />
              <span>Hari ini</span>
            </button>
          )}
        </div>

        {/* Sisi Kanan: Tombol Navigasi Panah < dan > */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevMonth}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 [touch-action:manipulation]"
            title="Bulan sebelumnya"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onNextMonth}
            className="w-9 h-9 min-w-9 min-h-9 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/90 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer active:scale-95 [touch-action:manipulation]"
            title="Bulan berikutnya"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 2. HEADER NAMA HARI (MIN, SEN, SEL, RAB, KAM, JUM, SAB)          */}
      {/* ================================================================= */}
      <div className="grid grid-cols-7 text-center pt-4 pb-2">
        {HARI_SINGKAT.map((hari, idx) => (
          <div
            key={hari}
            className={`text-xs tracking-wider uppercase ${
              idx === 0
                ? 'text-rose-600 font-extrabold'
                : 'text-slate-400 font-bold'
            }`}
          >
            {hari}
          </div>
        ))}
      </div>

      {/* ================================================================= */}
      {/* 3. MATRIKS SEL TANGGAL (GRID 7 KOLOM)                             */}
      {/* ================================================================= */}
      <div className="grid grid-cols-7 border-t border-l border-slate-200/90 mt-1">
        {gridCells.map((cell, idx) => {
          const { dateString, dayNumber, isCurrentMonth, data } = cell;
          const isSunday = idx % 7 === 0;
          const isToday = dateString === todayWITA;
          const isSelected = dateString === selectedDate;

          const badgeStyle = data ? getWarigaBadgeStyle(data.wariga) : null;

          return (
            <div
              key={dateString}
              onClick={() => {
                if (isCurrentMonth && data) {
                  onSelectDate(dateString);
                }
              }}
              className={`min-h-[105px] sm:min-h-[125px] p-2 sm:p-2.5 border-r border-b border-slate-200/90 flex flex-col justify-between transition-colors relative select-none [touch-action:manipulation] ${
                !isCurrentMonth
                  ? 'bg-slate-50/40 text-slate-300 pointer-events-none'
                  : 'bg-white hover:bg-slate-50/80 cursor-pointer'
              } ${
                isToday
                  ? 'bg-[#e6f7f5]/70 ring-2 ring-[#14b8a6] ring-inset z-10'
                  : ''
              } ${
                isSelected && !isToday
                  ? 'ring-2 ring-slate-800 ring-inset z-10'
                  : ''
              }`}
            >
              {/* Baris Atas: Angka Tanggal & Label "Hari ini" */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm sm:text-base font-bold tabular-nums leading-none ${
                    !isCurrentMonth
                      ? isSunday
                        ? 'text-rose-300 font-medium'
                        : 'text-slate-300 font-medium'
                      : isSunday
                      ? 'text-rose-600 font-extrabold'
                      : isToday
                      ? 'text-[#0f766e] font-extrabold'
                      : 'text-slate-800'
                  }`}
                >
                  {dayNumber}
                </span>

                {isToday && (
                  <span className="text-[9px] font-extrabold text-[#0d9488] bg-teal-100/70 px-1 rounded block">
                    Hari ini
                  </span>
                )}
              </div>

              {/* Baris Bawah: Badge Status Wariga & Ringkasan Wewaran */}
              {isCurrentMonth && data && badgeStyle && (
                <div className="space-y-1 mt-1.5">
                  <div
                    title={data.keterangan}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold border truncate ${badgeStyle.bg} ${badgeStyle.text}`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${badgeStyle.dot}`}
                    />
                    <span className="truncate">{badgeStyle.label}</span>
                  </div>

                  {/* Keterangan Wewaran & Urip Hari */}
                  <div className="text-[10px] text-slate-500 font-medium truncate flex items-center justify-between">
                    <span className="truncate">
                      {data.wewaran.saptawara} {data.wewaran.pancawara}
                    </span>
                    <span className="text-[9px] text-slate-400 tabular-nums">
                      U:{data.total_urip_hari}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

