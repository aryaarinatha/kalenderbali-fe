import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Calendar } from 'lucide-react';
import type { UpcomingHariRayaItem } from '../types/dashboard.types';
import { HariRayaDetailModal } from '@/features/kalender/components/HariRayaDetailModal';

/**
 * ============================================================================
 * KOMPONEN: DashboardUpcomingHariRaya (Baris 2 Kanan — Hari Raya Berikutnya)
 * ============================================================================
 * Menampilkan daftar vertikal maksimal 7 Hari Raya / Rahina terdekat pada bulan aktif.
 *
 * Mengadopsi Desain Sesuai Arahan:
 *  - Menggunakan layout list vertikal "Agenda Mendatang" dari mockup.
 *  - Mengubah judul menjadi "Hari Raya Berikutnya" (subteks: "Rahina dan upacara terdekat").
 *  - INTERAKSI KLIK ITEM (Sesuai Arahan Gambar 2):
 *    Jika item hari raya diklik, JANGAN dialihkan (redirect) ke halaman lain,
 *    melainkan buka modal dialog pop-up uraian "Makna & Filosofi" hari raya tersebut
 *    menggunakan HariRayaDetailModal.
 *  - Tombol bawah "Lihat semua hari raya" tetap mengarah ke /hari-raya.
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Kotak tanggal beraksen warna semantik (Gold Amber, Mint Teal, Rose Crimson).
 *  - Tipografi tabular-nums untuk angka tanggal dan hitungan sisa hari.
 * ============================================================================
 */

interface DashboardUpcomingHariRayaProps {
  /** Array hari raya terdekat (akan diambil maksimal 7 item teratas) */
  items: UpcomingHariRayaItem[];
}

export const DashboardUpcomingHariRaya: React.FC<DashboardUpcomingHariRayaProps> = ({
  items,
}) => {
  const navigate = useNavigate();

  // State untuk mengontrol pembukaan modal pop-up detail makna & filosofi hari raya
  const [selectedHoliday, setSelectedHoliday] = useState<{
    id?: string;
    nama: string;
  } | null>(null);

  // Memastikan menampilkan maksimal 7 agenda hari raya terdekat kedepan
  const topSevenItems = items.slice(0, 7);

  // Handler interaksi: membuka modal popup saat item hari raya diklik
  const handleHolidayClick = (item: UpcomingHariRayaItem) => {
    setSelectedHoliday({
      id: item.holidayId,
      nama: item.nama,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between h-full">
      {/* =================================================================== */}
      {/* 1. HEADER KARTU: JUDUL & SUBTEKS DESKRIPTIF                         */}
      {/* =================================================================== */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
              Hari Raya Berikutnya
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Rahina dan upacara terdekat
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. DAFTAR LIST 7 HARI RAYA TERATAS                                */}
        {/* ================================================================= */}
        <div className="space-y-2.5 max-h-[540px] overflow-y-auto pr-0.5">
          {topSevenItems.length === 0 ? (
            /* State kosong jika bulan aktif tidak memiliki hari raya */
            <div className="p-6 text-center rounded-xl bg-slate-50 border border-slate-100 text-slate-400 text-xs font-medium">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Tidak ada agenda hari raya pada bulan ini.
            </div>
          ) : (
            topSevenItems.map((item) => {
              // Pewarnaan semantik kotak tanggal berdasarkan varian AGENTS.md
              let badgeColorStyle = 'bg-teal-50 text-teal-800 border-teal-200/80';
              if (item.badgeVariant === 'gold') {
                badgeColorStyle = 'bg-amber-50 text-amber-800 border-amber-200/80';
              } else if (item.badgeVariant === 'rose') {
                badgeColorStyle = 'bg-rose-50 text-rose-800 border-rose-200/80';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleHolidayClick(item)}
                  className="flex items-center gap-3 p-2.5 sm:p-3 rounded-xl bg-[#f8fafc] border border-slate-200/70 hover:border-teal-300 hover:bg-white hover:shadow-2xs transition-all cursor-pointer group"
                  title={`Klik untuk melihat makna & filosofi ${item.nama}`}
                >
                  {/* SISI KIRI: Kotak Tanggal Vertikal (Angka + Singkatan Bulan) */}
                  <div
                    className={`w-11 h-11 sm:w-12 sm:h-12 shrink-0 rounded-xl border flex flex-col items-center justify-center transition-transform group-hover:scale-105 ${badgeColorStyle}`}
                  >
                    <span className="text-xs sm:text-sm font-extrabold tabular-nums leading-none">
                      {item.dayNumber}
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-0.5">
                      {item.monthShort}
                    </span>
                  </div>

                  {/* SISI TENGAH: Nama Hari Raya & Keterangan Acara/Pura */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] leading-snug truncate group-hover:text-[#0e9f90] transition-colors">
                      {item.nama}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate mt-0.5">
                      {item.keterangan}
                    </p>
                  </div>

                  {/* SISI KANAN: Pill Countdown Hari Tersisa */}
                  <div className="shrink-0 text-right">
                    <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600 tabular-nums shadow-2xs">
                      {item.daysRemainingText}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. TOMBOL AKSI BAWAH: LIHAT SEMUA HARI RAYA                         */}
      {/* =================================================================== */}
      <div className="mt-4 pt-2">
        <button
          type="button"
          onClick={() => navigate('/hari-raya')}
          className="w-full py-2.5 px-4 rounded-xl bg-[#f0fbf9] hover:bg-[#e6f7f5] text-[#0f766e] font-bold text-xs sm:text-sm border border-[#ccf0ea] transition-all text-center inline-flex items-center justify-center gap-1.5 cursor-pointer [touch-action:manipulation] active:scale-[0.99]"
        >
          <span>Lihat semua hari raya</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* =================================================================== */}
      {/* 4. MODAL POP-UP: MAKNA & FILOSOFI HARI RAYA (SESUAI GAMBAR 2)       */}
      {/* =================================================================== */}
      <HariRayaDetailModal
        isOpen={Boolean(selectedHoliday)}
        onClose={() => setSelectedHoliday(null)}
        holidayId={selectedHoliday?.id}
        holidayName={selectedHoliday?.nama}
      />
    </div>
  );
};
