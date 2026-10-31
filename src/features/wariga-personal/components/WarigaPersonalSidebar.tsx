import React from 'react';
import {
  Calendar,
  ChevronDown,
  FileText,
} from 'lucide-react';
import type {
  IdentitasKelahiran,
  RingkasanStatistik,
  WarigaFilterType,
} from '../types/warigaPersonal.types';
import { formatFullIndoDate } from '@/features/kalender/utils/calendarUtils';

/**
 * ============================================================================
 * KOMPONEN: WarigaPersonalSidebar
 * ============================================================================
 * Panel kontrol sisi kiri yang menyajikan:
 *  1. Kartu Info Weton & Urip Kelahiran Pengguna.
 *  2. Tombol Aksi: "Wariga Tanggal Lahir" & "Dewasa Tanggal Lahir".
 *  3. Dropdown Filter Kategori (Semua, Guru, Ratu, Lara, Pati).
 *  4. Legenda Keterangan 4 Arketipe Wariga & Statistik Rekapitulasi Bulan Ini.
 *
 * Mengikuti Panduan AGENTS.md:
 *  - Angka statistik tabular-nums
 *  - Warna semantik konsisten: Guru (sky), Ratu (emerald), Lara (amber), Pati (rose)
 *  - Tombol aksi ergonomis h-11 dengan touch-action manipulation
 * ============================================================================
 */

interface WarigaPersonalSidebarProps {
  identitas: IdentitasKelahiran;
  statistik: RingkasanStatistik;
  filterType: WarigaFilterType;
  onFilterChange: (type: WarigaFilterType) => void;
  onOpenWarigaModal: () => void;
  onOpenDewasaModal: () => void;
}

export const WarigaPersonalSidebar: React.FC<WarigaPersonalSidebarProps> = ({
  identitas,
  statistik,
  filterType,
  onFilterChange,
  onOpenWarigaModal,
  onOpenDewasaModal,
}) => {
  const { tanggal_lahir_sipil, wewaran, total_urip_kelahiran, sebelum_jam_6 } =
    identitas;

  return (
    <div className="space-y-4">
      {/* ================================================================= */}
      {/* 1. KARTU IDENTITAS KELAHIRAN (WETON & URIP LAHIR)                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
            Tanggal Lahir
          </span>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200/60 text-teal-700 text-[10px] font-bold">
            Weton Pengguna
          </span>
        </div>

        {/* Banner Weton Kelahiran */}
        <div className="bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-slate-50 border border-teal-200/60 rounded-xl p-3.5 space-y-1.5">
          <div className="text-sm sm:text-base font-extrabold text-[#0f172a] tracking-tight">
            {formatFullIndoDate(tanggal_lahir_sipil)}
          </div>
          <div className="text-xs font-semibold text-teal-800 flex items-center gap-1.5">
            <span>{wewaran.saptawara}</span>
            <span className="text-slate-300">•</span>
            <span>{wewaran.pancawara}</span>
            <span className="text-slate-300">•</span>
            <span>Wuku {wewaran.wuku}</span>
          </div>
          <div className="text-[11px] text-slate-500 font-medium pt-1 border-t border-teal-100/60 flex items-center justify-between">
            <span>
              Urip: {wewaran.urip_saptawara} + {wewaran.urip_pancawara}
            </span>
            <span className="font-bold text-[#0f766e] tabular-nums">
              Total Urip: {total_urip_kelahiran}
            </span>
          </div>
          {sebelum_jam_6 && (
            <div className="text-[10px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded border border-amber-200/50 mt-1">
              *Lahir sebelum 06.00 WITA (Weton mundur 1 hari)
            </div>
          )}
        </div>

        {/* =============================================================== */}
        {/* 2. TOMBOL AKSI: WARIGA & DEWASA TANGGAL LAHIR                   */}
        {/* =============================================================== */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onOpenWarigaModal}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Wariga Tanggal Lahir</span>
          </button>

          <button
            type="button"
            onClick={onOpenDewasaModal}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] shadow-2xs"
          >
            <FileText className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Dewasa Tanggal Lahir</span>
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* 3. DROPDOWN FILTER KATEGORI (CLIENT-SIDE)                         */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-2">
        <label
          htmlFor="sidebar-filter-wariga"
          className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
        >
          Filter Kategori
        </label>
        <div className="relative">
          <select
            id="sidebar-filter-wariga"
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value as WarigaFilterType)}
            className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] appearance-none transition-all cursor-pointer [touch-action:manipulation]"
          >
            <option value="all">Semua Tanggal</option>
            <option value="baik">Hari Baik (Guru & Ratu)</option>
            <option value="Guru">Guru Saja (Hari Baik - Angka 1)</option>
            <option value="Ratu">Ratu Saja (Hari Baik - Angka 2)</option>
            <option value="buruk">Hari Buruk (Lara & Pati)</option>
            <option value="Lara">Lara Saja (Hari Buruk - Angka 3)</option>
            <option value="Pati">Pati Saja (Hari Buruk - Angka 4)</option>
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* ================================================================= */}
      {/* 4. LEGENDA KETERANGAN 4 WARIGA & REKAPITULASI STATISTIK           */}
      {/* ================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
          Keterangan & Statistik Bulan Ini
        </span>

        <div className="space-y-2.5">
          {/* Item 1: Guru */}
          <div className="p-2.5 rounded-xl bg-sky-50/60 border border-sky-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-100 text-sky-800">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                Guru (Angka 1)
              </span>
              <span className="text-xs font-extrabold text-sky-800 tabular-nums">
                {statistik.total_guru} Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Hari baik:</strong> Melambangkan kebijaksanaan rohani,
              pendidikan, dan kelancaran usaha.
            </p>
          </div>

          {/* Item 2: Ratu */}
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Ratu (Angka 2)
              </span>
              <span className="text-xs font-extrabold text-emerald-800 tabular-nums">
                {statistik.total_ratu} Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Hari baik:</strong> Melambangkan wibawa kepemimpinan,
              kemakmuran, dan relasi.
            </p>
          </div>

          {/* Item 3: Lara */}
          <div className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Lara (Angka 3)
              </span>
              <span className="text-xs font-extrabold text-amber-800 tabular-nums">
                {statistik.total_lara} Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Hari buruk:</strong> Melambangkan potensi rintangan,
              kelelahan, atau kesedihan.
            </p>
          </div>

          {/* Item 4: Pati */}
          <div className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Pati (Angka 4)
              </span>
              <span className="text-xs font-extrabold text-rose-800 tabular-nums">
                {statistik.total_pati} Hari
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Hari buruk:</strong> Melambangkan penghentian, pantangan
              untuk memulai hajatan krusial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

