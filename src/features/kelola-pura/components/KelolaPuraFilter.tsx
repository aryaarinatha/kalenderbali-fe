import React, { useState, useEffect } from 'react';
import { Search, X, RotateCcw, Filter, MapPin, Landmark } from 'lucide-react';
import { PURA_TYPES, BALI_REGENCIES } from '../utils/kelolaPuraUtils';

/**
 * ==============================================================================
 * PROPS: KelolaPuraFilter
 * ==============================================================================
 * Menampung nilai filter aktif dan fungsi callback untuk memperbarui parameter:
 * - searchQuery: teks pencarian nama pura atau banjar
 * - selectedType: filter klasifikasi tipe pura
 * - selectedCity: filter kabupaten / kota
 * - totalFiltered: jumlah data yang cocok dengan kriteria filter saat ini
 * - totalAll: total seluruh master pura
 * - onSearchChange, onTypeChange, onCityChange, onReset: event handlers
 */
interface KelolaPuraFilterProps {
  searchQuery: string;
  selectedType: string;
  selectedCity: string;
  totalFiltered: number;
  totalAll: number;
  onSearchChange: (q: string) => void;
  onTypeChange: (type: string) => void;
  onCityChange: (city: string) => void;
  onReset: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: KelolaPuraFilter (Bilah Filter Pencarian Pura)
 * ==============================================================================
 * Bilah kontrol interaktif untuk menyaring katalog pura:
 * 1. Input teks pencarian berbasis debouncing 300ms untuk performa tinggi tanpa lag.
 * 2. Tombol cepat 'X' untuk mengosongkan kata kunci pencarian seketika.
 * 3. Dropdown pilihan Klasifikasi Tipe Pura (Kahyangan Jagat, Kahyangan Tiga, dll).
 * 4. Dropdown pilihan Kabupaten / Kota di Bali (9 Kabupaten/Kota + Luar Bali).
 * 5. Tombol 'Reset Filter' yang aktif secara kondisional saat ada filter aktif.
 * 6. Badge jumlah data hasil pencarian dengan format tabular-nums.
 *
 * Menerapkan standar aksesibilitas & UI/UX AGENTS.md:
 * - Ukuran touch target minimal 44px
 * - Label aksesibel (aria-label) untuk pembaca layar
 * - Border fokus Teal Tirta Bali (#0e9f90)
 * ==============================================================================
 */
export const KelolaPuraFilter: React.FC<KelolaPuraFilterProps> = ({
  searchQuery,
  selectedType,
  selectedCity,
  totalFiltered,
  totalAll,
  onSearchChange,
  onTypeChange,
  onCityChange,
  onReset,
}) => {
  // State lokal untuk input teks agar pengetikan responsif instan di layar
  const [localSearch, setLocalSearch] = useState<string>(searchQuery);
  // Simpan nilai prop sebelumnya untuk menyelaraskan state tanpa effect cascade (pola resmi React)
  const [prevSearchQuery, setPrevSearchQuery] = useState<string>(searchQuery);

  if (prevSearchQuery !== searchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Efek debounce 300ms: Hanya memicu pembaruan filter ke luar setelah pengguna berhenti mengetik
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        onSearchChange(localSearch);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, onSearchChange]);

  // Menentukan apakah ada filter yang sedang aktif
  const hasActiveFilter = Boolean(
    searchQuery.trim() ||
      (selectedType && selectedType !== 'Semua') ||
      (selectedCity && selectedCity !== 'Semua')
  );

  return (
    <div
      aria-label="Panel Filter Pencarian Pura"
      className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-4"
    >
      {/* ==================================================================== */}
      {/* 1. BARIS ATAS: KONTROL INPUT PENCARIAN & DROPDOWN FILTER            */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        {/* Kolom Input Teks Pencarian (span 5 di desktop) */}
        <div className="lg:col-span-5 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" aria-hidden="true" />
          </div>

          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Cari nama pura, banjar, atau desa..."
            aria-label="Cari nama pura atau lokasi"
            className="w-full min-h-[44px] pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all"
          />

          {/* Tombol Hapus Cepat (Tampil jika input memiliki teks) */}
          {localSearch.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              aria-label="Hapus kata kunci pencarian"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-hidden"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Kolom Dropdown Pilihan Klasifikasi Tipe Pura (span 3 di desktop) */}
        <div className="lg:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Landmark className="w-4 h-4" aria-hidden="true" />
          </div>

          <select
            value={selectedType || 'Semua'}
            onChange={(e) => onTypeChange(e.target.value === 'Semua' ? '' : e.target.value)}
            aria-label="Pilih klasifikasi pura"
            className="w-full min-h-[44px] pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="Semua">Semua Klasifikasi Pura</option>
            {PURA_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Panah kustom dropdown select */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Kolom Dropdown Pilihan Kabupaten / Kota (span 3 di desktop) */}
        <div className="lg:col-span-3 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MapPin className="w-4 h-4" aria-hidden="true" />
          </div>

          <select
            value={selectedCity || 'Semua'}
            onChange={(e) => onCityChange(e.target.value === 'Semua' ? '' : e.target.value)}
            aria-label="Pilih wilayah kabupaten atau kota"
            className="w-full min-h-[44px] pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0e9f90]/20 focus:border-[#0e9f90] focus:bg-white transition-all appearance-none cursor-pointer"
          >
            <option value="Semua">Semua Kabupaten/Kota</option>
            {BALI_REGENCIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* Panah kustom dropdown select */}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Kolom Tombol Reset Filter (span 1 di desktop) */}
        <div className="lg:col-span-1 flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setLocalSearch('');
              onReset();
            }}
            disabled={!hasActiveFilter}
            aria-label="Reset seluruh filter"
            title="Reset seluruh filter"
            className={`w-full min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border ${
              hasActiveFilter
                ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 active:scale-95 cursor-pointer'
                : 'bg-slate-100/70 text-slate-400 border-slate-200/60 cursor-not-allowed opacity-60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="lg:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BARIS BAWAH: STATUS REKAPITULASI HASIL & CHIP AKTIF              */}
      {/* ==================================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
        {/* Keterangan Jumlah Data Terfilter */}
        <div className="flex items-center gap-2 text-slate-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
          <span>
            Menampilkan{' '}
            <strong className="text-slate-900 font-bold tabular-nums">
              {totalFiltered.toLocaleString('id-ID')}
            </strong>{' '}
            dari total{' '}
            <span className="tabular-nums font-semibold">{totalAll.toLocaleString('id-ID')}</span>{' '}
            pura
          </span>
        </div>

        {/* Tag Ringkasan Filter yang Sedang Aktif */}
        {hasActiveFilter && (
          <div className="flex flex-wrap items-center gap-1.5">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                Pencarian: &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedType}
              </span>
            )}
            {selectedCity && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                {selectedCity}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
