import React from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';
import type {
  PiodalanFilterParams,
  PiodalanSearchTab,
} from '../types/piodalan.types';
import { useMasterDropdown } from '../hooks/usePiodalan';
import { INDO_MONTHS_LONG } from '../utils/piodalanUtils';
import { PuraSearchableSelect } from './PuraSearchableSelect';



/**
 * ==============================================================================
 * KOMPONEN: PiodalanSearchForm (Formulir Tabular Pencarian Piodalan)
 * ==============================================================================
 * Komponen form pencarian serbaguna yang menyajikan 3 tab metode:
 * 1. Tab 'Wewaran & Wuku': Pencarian berbasis siklus Pawukon (Saptawara + Pancawara + Wuku + Tahun)
 * 2. Tab 'Bulan': Pencarian berbasis bulan Masehi (1-12) atau Sasih di tahun target
 * 3. Tab 'Nama Pura': Pencarian cepat toleran berdasarkan nama pura, desa, atau kabupaten
 *
 * Menerapkan aturan AGENTS.md:
 * - Segmented Tab Switcher (p-1 bg-slate-100 rounded-xl)
 * - Ergonomi sentuh h-11 (44px) dengan touch-action: manipulation
 * - Dropdown dengan ikon ChevronDown absolute pointer-events-none
 * - Tombol Primer warna Teal Tirta Bali #0e9f90
 * - Ringkasan filter aktif dan tombol 'Atur ulang' di baris bawah
 * ==============================================================================
 */

interface PiodalanSearchFormProps {
  /** Nilai filter pencarian aktif */
  filter: PiodalanFilterParams;

  /** Status apakah pengguna sudah melakukan pencarian */
  hasSearched?: boolean;

  /** Callback ketika terjadi perubahan nilai salah satu input filter */
  onFilterChange: (updates: Partial<PiodalanFilterParams>) => void;

  /** Callback ketika pengguna menekan tombol 'Cari piodalan' */
  onSearchSubmit: (e?: React.FormEvent) => void;

  /** Callback untuk mereset filter kembali ke konfigurasi bawaan */
  onResetFilter: () => void;

  /** Status pemuatan data sedang berlangsung */
  isLoading?: boolean;
}

export const PiodalanSearchForm: React.FC<PiodalanSearchFormProps> = ({
  filter,
  hasSearched = false,
  onFilterChange,
  onSearchSubmit,
  onResetFilter,
  isLoading = false,
}) => {
  // Ambil opsi master dropdown dari cache memori backend Go
  const { data: saptawaraList = [] } = useMasterDropdown('saptawara');
  const { data: pancawaraList = [] } = useMasterDropdown('pancawara');
  const { data: wukuList = [] } = useMasterDropdown('wuku');

  // Handle pergantian tab pencarian
  const handleTabChange = (newTab: PiodalanSearchTab) => {
    onFilterChange({ tab: newTab });
  };

  // Form submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(e);
  };

  // Label teks ringkasan filter aktif atau panduan interaksi jika belum search
  const activeFilterLabel = (() => {
    if (!hasSearched) {
      if (filter.tab === 'wewaran') {
        return 'Pilih kombinasi wewaran & wuku di atas, lalu klik tombol "Cari piodalan".';
      }
      if (filter.tab === 'bulan') {
        return 'Pilih bulan & tahun di atas, lalu klik tombol "Cari piodalan".';
      }
      if (filter.tab === 'pura') {
        return 'Pilih dari dropdown atau ketik nama pura/lokasi di atas, lalu klik tombol "Cari piodalan".';
      }
    }

    if (filter.tab === 'wewaran') {
      return `Filter aktif: ${filter.saptawara || '-'} · ${filter.pancawara || '-'} · ${filter.wuku || '-'} · ${filter.tahun || '-'}`;
    }
    if (filter.tab === 'bulan') {
      const monthIdx = filter.bulan ? Number(filter.bulan) - 1 : -1;
      const monthName = INDO_MONTHS_LONG[monthIdx] || '-';
      return `Filter aktif: Bulan ${monthName} · ${filter.tahun || '-'}`;
    }
    if (filter.tab === 'pura') {
      return filter.namaPura
        ? `Filter aktif: Pencarian "${filter.namaPura}"`
        : 'Filter aktif: Seluruh Pura Terdaftar';
    }
    return '';
  })();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs space-y-6">
      {/* ==================================================================== */}
      {/* 1. HEADER KARTU: JUDUL & SEGMENTED TAB SWITCHER                      */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
            Pencarian piodalan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Metode pencarian dapat diganti tanpa kehilangan konteks hasil.
          </p>
        </div>

        {/* Segmented Tab Switcher (Standar AGENTS.md 4.6) */}
        <div
          role="tablist"
          aria-label="Pilih metode pencarian piodalan"
          className="p-1 bg-slate-100 rounded-xl flex gap-1 self-start sm:self-auto shrink-0"
        >
          {/* Tab 1: Wewaran & Wuku */}
          <button
            type="button"
            role="tab"
            aria-selected={filter.tab === 'wewaran'}
            onClick={() => handleTabChange('wewaran')}
            className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer font-bold ${
              filter.tab === 'wewaran'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Wewaran & Wuku
          </button>

          {/* Tab 2: Bulan */}
          <button
            type="button"
            role="tab"
            aria-selected={filter.tab === 'bulan'}
            onClick={() => handleTabChange('bulan')}
            className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer font-bold ${
              filter.tab === 'bulan'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Bulan
          </button>

          {/* Tab 3: Nama Pura */}
          <button
            type="button"
            role="tab"
            aria-selected={filter.tab === 'pura'}
            onClick={() => handleTabChange('pura')}
            className={`py-2 px-3.5 rounded-lg text-xs sm:text-sm transition-all cursor-pointer font-bold ${
              filter.tab === 'pura'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Nama Pura
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FORMULIR INPUT BERDASARKAN TAB AKTIF                              */}
      {/* ==================================================================== */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* TAB 1: KONTROL WEWARAN & WUKU */}
        {filter.tab === 'wewaran' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-end">
            {/* Input Saptawara (7 Hari) */}
            <div>
              <label
                htmlFor="select-saptawara"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Saptawara
              </label>
              <div className="relative">
                <select
                  id="select-saptawara"
                  value={filter.saptawara || ''}
                  onChange={(e) => onFilterChange({ saptawara: e.target.value })}
                  required
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Saptawara --</option>
                  {saptawaraList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input Pancawara (5 Hari) */}
            <div>
              <label
                htmlFor="select-pancawara"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Pancawara
              </label>
              <div className="relative">
                <select
                  id="select-pancawara"
                  value={filter.pancawara || ''}
                  onChange={(e) => onFilterChange({ pancawara: e.target.value })}
                  required
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Pancawara --</option>
                  {pancawaraList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input Wuku (30 Wuku) */}
            <div>
              <label
                htmlFor="select-wuku"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Wuku
              </label>
              <div className="relative">
                <select
                  id="select-wuku"
                  value={filter.wuku || ''}
                  onChange={(e) => onFilterChange({ wuku: e.target.value })}
                  required
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Wuku --</option>
                  {wukuList.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input Tahun Masehi (Ketik Manual) */}
            <div>
              <label
                htmlFor="input-tahun"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Tahun
              </label>
              <input
                id="input-tahun"
                type="number"
                min={1900}
                max={2100}
                value={filter.tahun ?? ''}
                onChange={(e) => onFilterChange({ tahun: e.target.value })}
                placeholder="Contoh: 2026"
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums"
              />
            </div>

            {/* Tombol Eksekusi Cari Piodalan */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>{isLoading ? 'Mencari...' : 'Cari piodalan'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: KONTROL PENCARIAN BERBASIS BULAN */}
        {filter.tab === 'bulan' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4 items-end">
            {/* Input Bulan Masehi */}
            <div>
              <label
                htmlFor="select-bulan"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Bulan Masehi
              </label>
              <div className="relative">
                <select
                  id="select-bulan"
                  value={filter.bulan || ''}
                  onChange={(e) => onFilterChange({ bulan: e.target.value ? parseInt(e.target.value, 10) : '' })}
                  required
                  className="w-full h-11 px-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none cursor-pointer"
                >
                  <option value="">-- Pilih Bulan --</option>
                  {INDO_MONTHS_LONG.map((mName, idx) => (
                    <option key={mName} value={idx + 1}>
                      {mName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Input Tahun Masehi (Ketik Manual) */}
            <div>
              <label
                htmlFor="select-tahun-bulan"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Tahun
              </label>
              <input
                id="select-tahun-bulan"
                type="number"
                min={1900}
                max={2100}
                value={filter.tahun ?? ''}
                onChange={(e) => onFilterChange({ tahun: e.target.value })}
                placeholder="Contoh: 2026"
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums"
              />
            </div>

            {/* Tombol Eksekusi Cari Bulan */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>{isLoading ? 'Mencari...' : 'Cari piodalan'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: KONTROL PENCARIAN BERBASIS NAMA PURA */}
        {filter.tab === 'pura' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 sm:gap-4 items-end">
            {/* Searchable Combobox Pura (Select2 Style Sesuai Gambar Referensi Pengguna) */}
            <div className="lg:col-span-6">
              <label
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Pura
              </label>
              <PuraSearchableSelect
                value={filter.namaPura || ''}
                onChange={(val) => onFilterChange({ namaPura: val })}
                placeholder="-- Pilih Nama Pura --"
              />
            </div>

            {/* Input Tahun Masehi (Ketik Manual) */}
            <div className="lg:col-span-3">
              <label
                htmlFor="select-tahun-pura"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Tahun
              </label>
              <input
                id="select-tahun-pura"
                type="number"
                min={1900}
                max={2100}
                value={filter.tahun ?? ''}
                onChange={(e) => onFilterChange({ tahun: e.target.value })}
                placeholder="Contoh: 2026"
                required
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums"
              />
            </div>

            {/* Tombol Eksekusi Cari Pura */}
            <div className="lg:col-span-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span>{isLoading ? 'Mencari...' : 'Cari piodalan'}</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ==================================================================== */}
      {/* 3. BARIS BAWAH: STATUS FILTER AKTIF & TOMBOL ATUR ULANG              */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-xs">
        {/* Indikator Filter Aktif */}
        <span className="font-semibold text-slate-500">{activeFilterLabel}</span>

        {/* Tombol Atur Ulang Filter */}
        <button
          type="button"
          onClick={onResetFilter}
          className="inline-flex items-center gap-1.5 font-bold text-slate-500 hover:text-teal-700 active:text-teal-800 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Atur ulang</span>
        </button>
      </div>
    </div>
  );
};
