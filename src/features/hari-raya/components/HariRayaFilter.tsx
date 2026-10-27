import React, { useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import type {
  HariRayaFilterState,
  HariRayaMasterItem,
} from '../types/hariRaya.types';
import { NAMA_BULAN_INDO } from '../utils/hariRayaUtils';

/**
 * ============================================================================
 * KOMPONEN: HariRayaFilter
 * ============================================================================
 * Komponen ini menyediakan kartu kontrol form penyaringan jadwal Hari Raya:
 *  1. Dropdown Nama Hari Raya (Daftar master hari raya diurutkan alfabetis A-Z)
 *  2. Segmented Tab Switcher (Bulanan vs Tahunan di pojok kanan header)
 *  3. Dropdown Bulan (Januari s.d. Desember - hanya tampil di mode bulanan)
 *  4. Dropdown Tahun (2024 s.d. 2028)
 *  5. Tombol Aksi "Cari hari raya"
 * ============================================================================
 */

interface HariRayaFilterProps {
  filterState: HariRayaFilterState;
  masterList: HariRayaMasterItem[];
  onFilterChange: (updates: Partial<HariRayaFilterState>) => void;
  onSubmit: () => void;
}

// Daftar pilihan tahun target yang umum digunakan
const AVAILABLE_YEARS = [2024, 2025, 2026, 2027, 2028];

export const HariRayaFilter: React.FC<HariRayaFilterProps> = ({
  filterState,
  masterList,
  onFilterChange,
  onSubmit,
}) => {
  // Urutkan pilihan dropdown nama hari raya sesuai alfabet (A - Z)
  const sortedMasterList = useMemo(() => {
    return [...masterList].sort((a, b) =>
      a.nama.localeCompare(b.nama, 'id', { sensitivity: 'base' })
    );
  }, [masterList]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs mb-6">
      {/* Header Form & Segmented Tab Switcher (Bulanan / Tahunan) Sesuai Referensi */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Pencarian Hari Raya
          </h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Pilih nama hari raya atau filter berdasarkan jadwal bulanan dan tahunan.
          </p>
        </div>

        {/* Segmented Switcher Tab (Bulanan / Tahunan) */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center gap-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'bulanan' })}
            className={`py-1.5 px-3.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterState.viewMode === 'bulanan'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            Bulanan
          </button>
          <button
            type="button"
            onClick={() => onFilterChange({ viewMode: 'tahunan' })}
            className={`py-1.5 px-3.5 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              filterState.viewMode === 'tahunan'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            Tahunan
          </button>
        </div>
      </div>

      {/* Grid Pilihan Input + Tombol Aksi */}
      <form onSubmit={handleSubmit} className="pt-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* ============================================================= */}
          {/* CONTROL 1: Nama Hari Raya                                     */}
          {/* ============================================================= */}
          <div
            className={
              filterState.viewMode === 'bulanan'
                ? 'sm:col-span-2 lg:col-span-4'
                : 'sm:col-span-2 lg:col-span-6'
            }
          >
            <label
              htmlFor="filter-nama"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
            >
              NAMA HARI RAYA
            </label>
            <div className="relative">
              <select
                id="filter-nama"
                value={filterState.holidayName === 'all' ? '' : filterState.holidayName}
                onChange={(e) => onFilterChange({ holidayName: e.target.value })}
                className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer"
              >
                <option value="">-- Pilih Hari Raya --</option>
                {sortedMasterList.map((item) => (
                  <option key={item.id} value={item.nama}>
                    {item.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ============================================================= */}
          {/* CONTROL 2: Pilihan Bulan (Hanya Tampil Jika Mode Bulanan)       */}
          {/* ============================================================= */}
          {filterState.viewMode === 'bulanan' && (
            <div className="lg:col-span-3 animate-in fade-in duration-150">
              <label
                htmlFor="filter-bulan"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                BULAN
              </label>
              <div className="relative">
                <select
                  id="filter-bulan"
                  value={filterState.month}
                  onChange={(e) =>
                    onFilterChange({ month: parseInt(e.target.value, 10) })
                  }
                  className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer"
                >
                  {NAMA_BULAN_INDO.map((bulan, idx) => (
                    <option key={idx + 1} value={idx + 1}>
                      {bulan}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* CONTROL 3: Pilihan Tahun                                      */}
          {/* ============================================================= */}
          <div
            className={
              filterState.viewMode === 'bulanan'
                ? 'lg:col-span-2'
                : 'lg:col-span-3'
            }
          >
            <label
              htmlFor="filter-tahun"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
            >
              TAHUN
            </label>
            <div className="relative">
              <select
                id="filter-tahun"
                value={filterState.year}
                onChange={(e) =>
                  onFilterChange({ year: parseInt(e.target.value, 10) })
                }
                className="w-full h-11 px-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] tabular-nums appearance-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer"
              >
                {AVAILABLE_YEARS.map((th) => (
                  <option key={th} value={th}>
                    {th}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* ============================================================= */}
          {/* CONTROL 4: Tombol Eksekusi "Cari hari raya"                   */}
          {/* ============================================================= */}
          <div className="sm:col-span-2 lg:col-span-3">
            <button
              type="submit"
              className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
            >
              <Search className="w-4 h-4" />
              <span>Cari hari raya</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
