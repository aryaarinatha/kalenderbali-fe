import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, RotateCcw } from 'lucide-react';
import { AestheticDatePicker } from '@/components/ui/AestheticDatePicker';
import type {
  OtonanSearchParams,
  OtonanSearchType,
} from '../types/otonan.types';
import { useMasterWewaranOptions } from '../hooks/useOtonan';
import { getTodayWITA } from '../utils/otonanUtils';
import {
  buildPawukonDays,
  getValidPancawara,
  getValidSaptawaras,
  getValidWukus,
  isCombinationValid,
  getFilteredOptions,
} from '../utils/pawukonFilter';

/**
 * ============================================================================
 * KOMPONEN: OtonanFormSection (Hero Banner & Form Hitung Otonan)
 * ============================================================================
 * Komponen ini merupakan fondasi utama antarmuka Otonan:
 *  1. Hero Info Banner: Menampilkan ringkasan edukasi siklus 210 hari Pawukon,
 *     statistik jumlah otonan di tahun target, dan ornamen pura Bali.
 *  2. Card Form Hitung:
 *     - Tab Switcher: Pilihan antara "Tanggal lahir" (Masehi) vs "Wewaran manual".
 *     - Input Tanggal Lahir & Dropdown Waktu Lahir (< 06.00 WITA).
 *     - Dropdown Saptawara, Pancawara, dan Wuku dengan filter dinamis reaktif
 *       (opsi yang tidak cocok otomatis disaring, mencegah kombinasi mustahil).
 *     - Dropdown Tahun Target & Tombol Submit "Hitung Otonan".
 *     - Aksi cepat "Gunakan tanggal hari ini".
 *
 * Komponen ini tampil mandiri saat belum ada hasil (GAMBAR 2) dan tetap berada
 * di atas ketika hasil perhitungan muncul (GAMBAR 1).
 * ============================================================================
 */

interface OtonanFormSectionProps {
  /** Parameter pencarian aktif dari URL (jika ada) */
  activeParams: OtonanSearchParams | null;

  /** Callback saat pengguna menekan tombol "Hitung Otonan" */
  onSubmit: (params: OtonanSearchParams) => void;

  /** Status loading saat query backend sedang berjalan */
  isLoading?: boolean;

  /** Jumlah otonan yang ditemukan pada tahun target (opsional, default 2) */
  totalOtonanInYear?: number;
}

export const OtonanFormSection: React.FC<OtonanFormSectionProps> = ({
  activeParams,
  onSubmit,
  isLoading = false,
}) => {
  // Ambil tanggal hari ini dalam zona waktu WITA (UTC+8)
  const todayWITA = getTodayWITA();
  const currentYear = parseInt(todayWITA.split('-')[0], 10) || 2026;

  // -------------------------------------------------------------------------
  // 1. STATE FORM LOKAL
  // -------------------------------------------------------------------------
  // Tab aktif: 'tanggal_lahir' | 'elemen_kalender'
  const [activeTab, setActiveTab] = useState<OtonanSearchType>(
    activeParams?.tipe_pencarian || 'tanggal_lahir'
  );

  // Input mode tanggal lahir (default kosong agar menampilkan placeholder "dd/mm/yyyy")
  const [birthDate, setBirthDate] = useState<string>(
    activeParams?.tanggal_lahir || ''
  );
  const [birthTime, setBirthTime] = useState<'before_06' | 'after_06'>(
    activeParams?.sebelum_jam_6 ? 'before_06' : 'after_06'
  );

  // Input tahun target perhitungan (mendukung input pengetikan manual angka)
  const [targetYear, setTargetYear] = useState<number | string>(
    activeParams?.tahun_target || currentYear
  );

  // Input mode wewaran manual
  const [saptawaraId, setSaptawaraId] = useState<string>(
    activeParams?.saptawara_id ? String(activeParams.saptawara_id) : ''
  );
  const [pancawaraId, setPancawaraId] = useState<string>(
    activeParams?.pancawara_id ? String(activeParams.pancawara_id) : ''
  );
  const [wukuId, setWukuId] = useState<string>(
    activeParams?.wuku_id ? String(activeParams.wuku_id) : ''
  );

  // -------------------------------------------------------------------------
  // 2. DATA MASTER WEWARAN & TABEL PAWUKON 210 HARI
  // -------------------------------------------------------------------------
  const { saptawaraList, pancawaraList, wukuList, isLoading: isMasterLoading } =
    useMasterWewaranOptions();

  // Membangun tabel lookup 210 hari Pawukon secara reaktif
  const pawukonDays = useMemo(() => {
    return buildPawukonDays(saptawaraList, pancawaraList, wukuList);
  }, [saptawaraList, pancawaraList, wukuList]);

  // Evaluasi daftar opsi yang mungkin (possible) untuk masing-masing dropdown
  const { availableSaptawaras, availablePancawaras, availableWukus } = useMemo(() => {
    return getFilteredOptions({
      saptawaraId,
      pancawaraId,
      wukuId,
      saptawaraList,
      pancawaraList,
      wukuList,
      pawukonDays,
    });
  }, [saptawaraId, pancawaraId, wukuId, saptawaraList, pancawaraList, wukuList, pawukonDays]);

  // Status kelengkapan dan kevalidan kombinasi Pawukon
  const isWewaranComplete = Boolean(saptawaraId && pancawaraId && wukuId);
  const isValidPawukon = useMemo(() => {
    if (!isWewaranComplete) return false;
    return isCombinationValid(saptawaraId, pancawaraId, wukuId, pawukonDays);
  }, [isWewaranComplete, saptawaraId, pancawaraId, wukuId, pawukonDays]);

  // Sinkronisasi state lokal jika activeParams berubah dari URL
  useEffect(() => {
    if (activeParams) {
      setActiveTab(activeParams.tipe_pencarian);
      if (activeParams.tanggal_lahir) setBirthDate(activeParams.tanggal_lahir);
      setBirthTime(activeParams.sebelum_jam_6 ? 'before_06' : 'after_06');
      if (activeParams.tahun_target) setTargetYear(activeParams.tahun_target);
      if (activeParams.saptawara_id) setSaptawaraId(String(activeParams.saptawara_id));
      if (activeParams.pancawara_id) setPancawaraId(String(activeParams.pancawara_id));
      if (activeParams.wuku_id) setWukuId(String(activeParams.wuku_id));
    }
  }, [activeParams]);

  // -------------------------------------------------------------------------
  // 3. HANDLER REAKTIF DROPDOWN WEWARAN (PILIH BEBAS DARI MANA SAJA)
  // -------------------------------------------------------------------------
  const handleSaptawaraChange = (newId: string) => {
    setSaptawaraId(newId);
    if (!newId) return;

    // Jika Wuku sudah terisi, sinkronkan Pancawara ke satu-satunya opsi yang valid
    if (wukuId) {
      const validPanca = getValidPancawara(wukuId, newId, pawukonDays);
      if (validPanca) {
        setPancawaraId(validPanca);
      }
    } else if (pancawaraId) {
      // Jika Pancawara sudah terisi tapi Wuku belum:
      const validWukus = getValidWukus(newId, pancawaraId, pawukonDays);
      if (wukuId && !validWukus.includes(wukuId)) {
        setWukuId('');
      }
    }
  };

  const handlePancawaraChange = (newId: string) => {
    setPancawaraId(newId);
    if (!newId) return;

    // Jika Wuku sudah terisi, sinkronkan Saptawara ke hari yang valid di Wuku tersebut
    if (wukuId) {
      const validSaptas = getValidSaptawaras(wukuId, newId, pawukonDays);
      if (validSaptas.length > 0 && !validSaptas.includes(saptawaraId)) {
        setSaptawaraId(validSaptas[0]);
      }
    } else if (saptawaraId) {
      // Jika Saptawara sudah terisi tapi Wuku belum:
      const validWukus = getValidWukus(saptawaraId, newId, pawukonDays);
      if (wukuId && !validWukus.includes(wukuId)) {
        setWukuId('');
      }
    }
  };

  const handleWukuChange = (newId: string) => {
    setWukuId(newId);
    if (!newId) return;

    // Jika Saptawara sudah terisi, sinkronkan Pancawara ke Wuku baru tersebut
    if (saptawaraId) {
      const validPanca = getValidPancawara(newId, saptawaraId, pawukonDays);
      if (validPanca) {
        setPancawaraId(validPanca);
      }
    } else if (pancawaraId) {
      // Jika Pancawara sudah terisi tapi Saptawara belum:
      const validSaptas = getValidSaptawaras(newId, pancawaraId, pawukonDays);
      if (validSaptas.length > 0 && !validSaptas.includes(saptawaraId)) {
        setSaptawaraId(validSaptas[0]);
      }
    }
  };

  const handleResetWewaran = () => {
    setSaptawaraId('');
    setPancawaraId('');
    setWukuId('');
  };

  // -------------------------------------------------------------------------
  // 4. HANDLER INPUT TAHUN TARGET (NUMBER ONLY)
  // -------------------------------------------------------------------------
  const handleYearKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Izinkan kontrol navigasi keyboard (Backspace, Delete, Tab, Arrow, Enter)
    if (
      ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key) ||
      e.ctrlKey ||
      e.metaKey
    ) {
      return;
    }
    // Cegah semua tombol karakter selain angka 0-9
    if (!/^[0-9]$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitasi ekstra: pastikan hanya karakter angka (maksimal 4 digit tahun)
    const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 4);
    setTargetYear(numericOnly);
  };

  // -------------------------------------------------------------------------
  // 5. HANDLER AKSI SUBMIT FORM
  // -------------------------------------------------------------------------
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Resolusi tahun target menjadi angka valid (fallback ke tahun berjalan jika kosong)
    const parsedYear = typeof targetYear === 'number' ? targetYear : parseInt(targetYear, 10);
    const finalTargetYear = !isNaN(parsedYear) && parsedYear > 0 ? parsedYear : currentYear;

    if (activeTab === 'tanggal_lahir') {
      if (!birthDate) return;
      onSubmit({
        tipe_pencarian: 'tanggal_lahir',
        tanggal_lahir: birthDate,
        sebelum_jam_6: birthTime === 'before_06',
        tahun_target: finalTargetYear,
      });
    } else {
      if (!saptawaraId || !pancawaraId || !wukuId || !isValidPawukon) return;
      onSubmit({
        tipe_pencarian: 'elemen_kalender',
        saptawara_id: saptawaraId,
        pancawara_id: pancawaraId,
        wuku_id: wukuId,
        tahun_target: finalTargetYear,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* 2. CARD FORM: HITUNG OTONAN                                         */}
      {/* =================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs transition-all">
        {/* Header Form & Segmented Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-[#0f172a] tracking-tight">
              Hitung Otonan
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Tanggal lahir paling praktis; gunakan Wewaran bila data kalender Bali sudah diketahui.
            </p>
          </div>

          {/* Segmented Switcher Tab (Sesuai Standar AGENTS.md Bab 4.6) */}
          <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center gap-1 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('tanggal_lahir')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'tanggal_lahir'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Tanggal lahir
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('elemen_kalender')}
              className={`py-1.5 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'elemen_kalender'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              Wewaran
            </button>
          </div>
        </div>

        {/* Form Inputs Container */}
        <form onSubmit={handleSubmit} className="pt-6 space-y-4">
          {/* =============================================================== */}
          {/* MODE 1: TANGGAL LAHIR (Masehi)                                  */}
          {/* =============================================================== */}
          {activeTab === 'tanggal_lahir' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* Field 1: Tanggal Lahir (lg:col-span-4) dengan Date Picker Estetik */}
              <div className="lg:col-span-4 space-y-1.5">
                <label
                  htmlFor="birth-date"
                  className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                >
                  TANGGAL LAHIR
                </label>
                <AestheticDatePicker
                  id="birth-date"
                  value={birthDate}
                  onChange={(iso) => setBirthDate(iso)}
                  placeholder="dd/mm/yyyy"
                  required
                />
              </div>

              {/* Field 2: Waktu Lahir (lg:col-span-3) */}
              <div className="lg:col-span-3 space-y-1.5">
                <label
                  htmlFor="birth-time"
                  className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                >
                  WAKTU LAHIR
                </label>
                <div className="relative">
                  <select
                    id="birth-time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value as 'before_06' | 'after_06')}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none pr-10 cursor-pointer"
                  >
                    <option value="before_06">Sebelum 06.00</option>
                    <option value="after_06">Setelah 06.00</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Field 3: Tahun Perhitungan (lg:col-span-2) */}
              <div className="lg:col-span-2 space-y-1.5">
                <label
                  htmlFor="target-year"
                  className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                >
                  TAHUN PERHITUNGAN
                </label>
                <div className="relative">
                  <input
                    id="target-year"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={targetYear}
                    onChange={handleYearChange}
                    onKeyDown={handleYearKeyDown}
                    placeholder={String(currentYear)}
                    required
                    maxLength={4}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums"
                  />
                </div>
              </div>

              {/* Tombol Aksi: Hitung Otonan (lg:col-span-3) */}
              <div className="lg:col-span-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 [touch-action:manipulation]"
                >
                  <span>{isLoading ? 'Menghitung...' : 'Hitung Otonan'}</span>
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* =============================================================== */
            /* MODE 2: WEWARAN MANUAL (Saptawara + Pancawara + Wuku)            */
            /* =============================================================== */
            <div className="space-y-4">
              {/* Tombol Reset Cepat (tampil saat ada elemen yang dipilih) */}
              {(saptawaraId || pancawaraId || wukuId) && (
                <div className="flex justify-end -mb-2">
                  <button
                    type="button"
                    onClick={handleResetWewaran}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Pilihan</span>
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                {/* Field 1: Saptawara (lg:col-span-3) */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label
                    htmlFor="saptawara-select"
                    className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                  >
                    SAPTAWARA
                  </label>
                  <div className="relative">
                    <select
                      id="saptawara-select"
                      value={saptawaraId}
                      onChange={(e) => handleSaptawaraChange(e.target.value)}
                      disabled={isMasterLoading}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">-- Pilih Saptawara --</option>
                      {availableSaptawaras.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Field 2: Pancawara (lg:col-span-3) */}
                <div className="lg:col-span-3 space-y-1.5">
                  <label
                    htmlFor="pancawara-select"
                    className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                  >
                    PANCAWARA
                  </label>
                  <div className="relative">
                    <select
                      id="pancawara-select"
                      value={pancawaraId}
                      onChange={(e) => handlePancawaraChange(e.target.value)}
                      disabled={isMasterLoading}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">-- Pilih Pancawara --</option>
                      {availablePancawaras.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Field 3: Wuku (lg:col-span-2) */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label
                    htmlFor="wuku-select"
                    className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                  >
                    WUKU
                  </label>
                  <div className="relative">
                    <select
                      id="wuku-select"
                      value={wukuId}
                      onChange={(e) => handleWukuChange(e.target.value)}
                      disabled={isMasterLoading}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all appearance-none pr-10 cursor-pointer"
                    >
                      <option value="">-- Pilih Wuku --</option>
                      {availableWukus.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {/* Field 4: Tahun Target (lg:col-span-2) */}
                <div className="lg:col-span-2 space-y-1.5">
                  <label
                    htmlFor="target-year-manual"
                    className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                  >
                    TAHUN TARGET
                  </label>
                  <div className="relative">
                    <input
                      id="target-year-manual"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={targetYear}
                      onChange={handleYearChange}
                      onKeyDown={handleYearKeyDown}
                      placeholder={String(currentYear)}
                      required
                      maxLength={4}
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all tabular-nums"
                    />
                  </div>
                </div>

                {/* Tombol Aksi: Hitung Otonan (lg:col-span-2) */}
                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading || isMasterLoading || !isWewaranComplete || !isValidPawukon}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed [touch-action:manipulation]"
                  >
                    <span>
                      {isLoading
                        ? 'Menghitung...'
                        : !isWewaranComplete
                          ? 'Lengkapi Pilihan'
                          : 'Hitung Otonan'}
                    </span>
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
