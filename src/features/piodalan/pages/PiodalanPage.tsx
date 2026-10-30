import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type {
  PiodalanFilterParams,
  PiodalanSearchTab,
  PiodalanScheduleItem,
  PiodalanDayGroup,
} from '../types/piodalan.types';
import {
  usePiodalanSearch,
  useUpcomingPiodalan,
} from '../hooks/usePiodalan';
import { getTodayWITA, INDO_MONTHS_LONG } from '../utils/piodalanUtils';
import { PiodalanSearchForm } from '../components/PiodalanSearchForm';
import { PiodalanResultList } from '../components/PiodalanResultList';
import { PiodalanSidebarWidgets } from '../components/PiodalanSidebarWidgets';
import { PiodalanDetailModal } from '../components/PiodalanDetailModal';
import { PiodalanPuraListModal } from '../components/PiodalanPuraListModal';

/**
 * ==============================================================================
 * HALAMAN UTAMA: PiodalanPage (Orkestrator Fitur Piodalan Kalender Bali)
 * ==============================================================================
 * Mengatur tata letak, state reaktif, dan integrasi backend:
 *
 * 1. Dual-State Rendering (Sesuai Arahan Pengguna & fe_strategy.md):
 *    - STATE AWAL (Belum Search): Hanya merender Header, PiodalanHero, dan PiodalanSearchForm.
 *      Bagian Hasil Pencarian dan 3 Sidebar Widgets TIDAK DITAMPILKAN DULU.
 *    - STATE AKTIF (Setelah Search): Begitu pengguna menekan tombol "Cari piodalan",
 *      tata letak responsif 2 kolom (Hasil pencarian di kiri + 3 Widget di kanan)
 *      ditampilkan sesuai persis dengan filter yang dicari.
 * 2. URL-as-State:
 *    - Parameter pencarian aktif disinkronkan ke URL (?tab=wewaran&saptawara=Buda&...)
 *    - Mendukung bookmark, tombol browser Back/Forward, dan shareable links.
 * ==============================================================================
 */

export const PiodalanPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFormRef = useRef<HTMLDivElement>(null);

  // Tanggal hari ini dalam zona waktu WITA (UTC+8)
  const todayWITA = useMemo(() => getTodayWITA(), []);
  const currentYear = useMemo(() => parseInt(todayWITA.split('-')[0], 10) || 2026, [todayWITA]);

  // ----------------------------------------------------------------------------
  // 1. EVALUASI APAKAH PENGGUNA SUDAH MELAKUKAN SEARCH
  // ----------------------------------------------------------------------------
  // Pengguna dianggap sudah melakukan search jika:
  // a) URL memiliki parameter 'searched=true'
  // b) ATAU dibuka lewat link langsung yang memiliki parameter spesifik (wuku / q / bulan)
  const hasSearched = useMemo(() => {
    if (searchParams.get('searched') === 'true') return true;

    const tab = searchParams.get('tab');
    if (tab === 'wewaran' && searchParams.has('wuku') && searchParams.has('saptawara')) {
      return true;
    }
    if (tab === 'pura' && (searchParams.has('nama_pura') || searchParams.has('q'))) {
      return true;
    }
    if (tab === 'bulan' && searchParams.has('bulan')) {
      return true;
    }

    return false;
  }, [searchParams]);

  // ----------------------------------------------------------------------------
  // 2. STATE FORM INPUT LOKAL (Dapat diedit bebas sebelum tombol Cari ditekan)
  // ----------------------------------------------------------------------------
  const [formInputs, setFormInputs] = useState<PiodalanFilterParams>(() => {
    const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
    const tab: PiodalanSearchTab =
      rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

    const saptawara = searchParams.get('saptawara') || '';
    const pancawara = searchParams.get('pancawara') || '';
    const wuku = searchParams.get('wuku') || '';
    // Tahun selalu default ke tahun berjalan WITA (contoh: 2026) agar form valid saat submit
    const tahun = searchParams.get('tahun') || String(currentYear);
    const bulanParam = searchParams.get('bulan');
    const bulan = bulanParam ? parseInt(bulanParam, 10) : '';
    const namaPura = searchParams.get('nama_pura') || searchParams.get('q') || '';

    return {
      tab,
      saptawara,
      pancawara,
      wuku,
      tahun,
      bulan,
      namaPura,
    };
  });

  // Sinkronkan formInputs jika URL searchParams berubah dari navigasi luar (pola resmi React tanpa cascading renders)
  const searchParamString = searchParams.toString();
  const [prevParamsString, setPrevParamsString] = useState(searchParamString);
  if (prevParamsString !== searchParamString) {
    setPrevParamsString(searchParamString);
    if (hasSearched) {
      const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
      const tab: PiodalanSearchTab =
        rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

      setFormInputs({
        tab,
        saptawara: searchParams.get('saptawara') || '',
        pancawara: searchParams.get('pancawara') || '',
        wuku: searchParams.get('wuku') || '',
        tahun: searchParams.get('tahun') || String(currentYear),
        bulan: searchParams.get('bulan') || '',
        namaPura: searchParams.get('nama_pura') || searchParams.get('q') || '',
      });
    }
  }

  // ----------------------------------------------------------------------------
  // 3. PARAMETER PENCARIAN AKTIF YANG DIKIRIM KE HOOK BACKEND
  // ----------------------------------------------------------------------------
  // Hanya aktif jika hasSearched bernilai true!
  const activeFilter: PiodalanFilterParams | null = useMemo(() => {
    if (!hasSearched) return null;

    const rawTab = searchParams.get('tab') as PiodalanSearchTab | null;
    const tab: PiodalanSearchTab =
      rawTab === 'bulan' || rawTab === 'pura' ? rawTab : 'wewaran';

    return {
      tab,
      saptawara: searchParams.get('saptawara') || formInputs.saptawara || '',
      pancawara: searchParams.get('pancawara') || formInputs.pancawara || '',
      wuku: searchParams.get('wuku') || formInputs.wuku || '',
      tahun: searchParams.get('tahun') || formInputs.tahun || currentYear,
      bulan: searchParams.get('bulan') || formInputs.bulan || '',
      namaPura: searchParams.get('nama_pura') || searchParams.get('q') || formInputs.namaPura || '',
    };
  }, [hasSearched, searchParams, formInputs, currentYear]);

  // ----------------------------------------------------------------------------
  // 4. QUERY BACKEND GO: HANYA BERJALAN JIKA SUDAH MELAKUKAN SEARCH
  // ----------------------------------------------------------------------------
  const {
    dayGroups,
    scheduleList,
    totalCount,
    isLoading,
    isError,
    error,
    refetch,
  } = usePiodalanSearch(activeFilter, hasSearched);

  // Hitung satu piodalan terdekat untuk widget sidebar kanan
  const upcomingPiodalan = useUpcomingPiodalan(scheduleList);

  // ----------------------------------------------------------------------------
  // 5. STATE KONTROL MODAL DIALOG POP-UP
  // ----------------------------------------------------------------------------
  // State untuk modal pop-up hierarkis: Level 2 (List Pura) & Level 3 (Detail Pura & Susunan Acara)
  const [puraListModalGroup, setPuraListModalGroup] = useState<PiodalanDayGroup | null>(null);
  const [selectedPuraIdForModal, setSelectedPuraIdForModal] = useState<number | null>(null);

  // State untuk modal pop-up rincian 15 dimensi Wariga Bali (Detail Tanggal)
  const [warigaModalState, setWarigaModalState] = useState<{
    isOpen: boolean;
    schedule: PiodalanScheduleItem | null;
  }>({
    isOpen: false,
    schedule: null,
  });

  // ----------------------------------------------------------------------------
  // 6. HANDLER AKSI PENGGUNA
  // ----------------------------------------------------------------------------
  // Update state form lokal saat user mengganti dropdown / input
  const handleFormInputChange = (updates: Partial<PiodalanFilterParams>) => {
    setFormInputs((prev) => ({ ...prev, ...updates }));
  };

  // Eksekusi pencarian saat tombol 'Cari piodalan' ditekan
  const handleSearchSubmit = () => {
    // Pastikan tahun target selalu valid (fallback aman ke tahun saat ini WITA)
    const targetTahun = formInputs.tahun ? String(formInputs.tahun).trim() : String(currentYear);

    if (formInputs.tab === 'wewaran') {
      // Validasi kelengkapan kombinasi Pawukon (Saptawara + Pancawara + Wuku)
      if (!formInputs.saptawara || !formInputs.pancawara || !formInputs.wuku) {
        return;
      }
    } else if (formInputs.tab === 'bulan') {
      // Validasi pemilihan bulan Masehi (1 - 12)
      if (!formInputs.bulan) {
        return;
      }
    } else if (formInputs.tab === 'pura') {
      // Validasi pemilihan nama pura
      if (!formInputs.namaPura || !formInputs.namaPura.trim()) {
        return;
      }
    }

    const newParams = new URLSearchParams();
    newParams.set('tab', formInputs.tab);
    newParams.set('tahun', targetTahun);
    newParams.set('searched', 'true');

    if (formInputs.tab === 'wewaran') {
      newParams.set('saptawara', formInputs.saptawara);
      newParams.set('pancawara', formInputs.pancawara);
      newParams.set('wuku', formInputs.wuku);
    } else if (formInputs.tab === 'bulan') {
      newParams.set('bulan', String(formInputs.bulan));
    } else if (formInputs.tab === 'pura') {
      newParams.set('nama_pura', (formInputs.namaPura || '').trim());
    }

    // Perbarui state lokal jika sebelumnya tahun belum terisi
    if (!formInputs.tahun) {
      setFormInputs((prev) => ({ ...prev, tahun: targetTahun }));
    }

    setSearchParams(newParams, { replace: true });
    refetch();
  };

  // Reset filter kembali ke keadaan awal (menghilangkan hasil pencarian)
  const handleResetFilter = () => {
    setSearchParams({}, { replace: true });
    setFormInputs({
      tab: 'wewaran',
      saptawara: '',
      pancawara: '',
      wuku: '',
      tahun: String(currentYear),
      bulan: '',
      namaPura: '',
    });
  };

  // Buka rincian pura & susunan acara langsung (Level 3 - Gambar 2) dari widget Piodalan Terdekat
  const handleOpenUpcomingDetail = (upcoming: PiodalanScheduleItem) => {
    const existingGroup = dayGroups.find((d) => d.dateStr === upcoming.dateStr);
    const targetGroup: PiodalanDayGroup = existingGroup || {
      dateStr: upcoming.dateStr,
      formattedDate: upcoming.formattedDate,
      dayName: upcoming.dayName,
      wewaran: upcoming.penanggalan,
      totalPura: 1,
      puras: [
        {
          id: upcoming.puraId,
          name: upcoming.puraName,
          type: upcoming.puraType,
          city: upcoming.location,
          province: 'BALI',
          address: upcoming.fullAddress,
          phone: upcoming.phone || null,
          location_url: upcoming.mapUrl || null,
          benchmark: 'Pawukon',
          pelaksanaan_aktual: null,
        },
      ],
    };
    setPuraListModalGroup(targetGroup);
    setSelectedPuraIdForModal(upcoming.puraId);
  };

  // Buka rincian 15 dimensi Wariga (Detail Tanggal)
  const handleOpenDayWariga = (dateStr: string) => {
    const foundSchedule = scheduleList.find((s) => s.dateStr === dateStr);
    const matchedDayGroup = dayGroups.find((d) => d.dateStr === dateStr);

    const scheduleForWariga: PiodalanScheduleItem = foundSchedule || {
      id: `wariga-${dateStr}`,
      dateStr,
      formattedDate: matchedDayGroup?.formattedDate || dateStr,
      dayName: matchedDayGroup?.dayName || 'Hari',
      dateBadge: {
        day: dateStr.split('-')[2] || '01',
        month: 'BALI',
        colorVariant: 'teal',
      },
      puraName: 'Wariga Kalender Bali',
      puraId: 0,
      location: 'Bali, Indonesia',
      fullAddress: 'Bali, Indonesia',
      puraType: 'Kahyangan Jagat',
      penanggalan: matchedDayGroup?.wewaran || 'Pawukon 210 hari',
      cycleInfo: 'Pawukon 210 hari',
      timeString: null,
    };

    setWarigaModalState({
      isOpen: true,
      schedule: scheduleForWariga,
    });
  };

  // Judul dinamis hasil pencarian piodalan (sesuai gambar referensi: "Data Piodalan Bulan ...")
  const resultTitle = useMemo(() => {
    if (!activeFilter) return 'Hasil Pencarian Piodalan';
    if (activeFilter.tab === 'bulan' && activeFilter.bulan) {
      const monthIdx = Number(activeFilter.bulan) - 1;
      const monthName = INDO_MONTHS_LONG[monthIdx] || '';
      return `Data Piodalan Bulan ${monthName} ${activeFilter.tahun || ''}`.trim();
    }
    if (activeFilter.tab === 'wewaran') {
      return `Data Piodalan ${activeFilter.saptawara || ''} ${activeFilter.pancawara || ''} ${activeFilter.wuku || ''} ${activeFilter.tahun || ''}`.trim();
    }
    if (activeFilter.tab === 'pura') {
      return `Data Piodalan "${activeFilter.namaPura || ''}" (${activeFilter.tahun || ''})`;
    }
    return 'Hasil Pencarian Piodalan';
  }, [activeFilter]);

  // ----------------------------------------------------------------------------
  // 7. JUDUL TAB BROWSER DINAMIS (DYNAMIC DOCUMENT TITLE)
  // ----------------------------------------------------------------------------
  useEffect(() => {
    if (hasSearched && activeFilter) {
      if (activeFilter.tab === 'wewaran') {
        document.title = `Piodalan ${activeFilter.saptawara} ${activeFilter.pancawara} ${activeFilter.wuku} ${activeFilter.tahun} | Kalender Bali`;
      } else if (activeFilter.tab === 'pura' && activeFilter.namaPura) {
        document.title = `Piodalan "${activeFilter.namaPura}" | Kalender Bali`;
      } else {
        document.title = 'Jadwal Piodalan Pura Bali | Kalender Bali';
      }
    } else {
      document.title = 'Pencarian Piodalan Pura | Kalender Bali';
    }
  }, [hasSearched, activeFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN STANDAR & BREADCRUMB (AGENTS.md 4.1)               */}
      {/* ==================================================================== */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          {/* Breadcrumb Navigasi Hierarkis */}
          <nav
            aria-label="Breadcrumb"
            className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
          >
            <span>Wargabali</span>
            <span className="text-slate-300">/</span>
            <span>Layanan</span>
            <span className="text-slate-300">/</span>
            <span className="text-teal-700 font-bold">Piodalan</span>
          </nav>

          {/* Judul H1 Halaman */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
            Piodalan
          </h1>

          {/* Deskripsi Ringkas Fungsi Halaman */}
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
            Pencarian jadwal piodalan pura di Bali berdasarkan siklus wewaran, bulan, atau nama pura.
          </p>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. KARTU PENCARIAN DENGAN SEGMENTED TAB SWITCHER                     */}
      {/* ==================================================================== */}
      <div ref={searchFormRef}>
        <PiodalanSearchForm
          filter={formInputs}
          hasSearched={hasSearched}
          onFilterChange={handleFormInputChange}
          onSearchSubmit={handleSearchSubmit}
          onResetFilter={handleResetFilter}
          isLoading={isLoading}
        />
      </div>

      {/* ==================================================================== */}
      {/* 4. PENANGANAN KESALAHAN JARINGAN (ERROR STATE DARI BACKEND GO)       */}
      {/* ==================================================================== */}
      {hasSearched && isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Memuat Jadwal Piodalan
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {(error as Error)?.message || 'Terjadi kesalahan saat menghubungi server kalender Bali.'}
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


      {/* ==================================================================== */}
      {/* 4. BAGIAN HASIL PENCARIAN & 3 WIDGET SIDEBAR                         */}
      {/* HANYA DITAMPILKAN JIKA PENGGUNA SUDAH MELAKUKAN SEARCH               */}
      {/* ==================================================================== */}
      {hasSearched && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
          {/* Kolom Kiri (~2/3 Lebar: lg:col-span-8) - Kartu Piodalan Utama (Level 1) */}
          <div className="lg:col-span-8 space-y-6">
            <PiodalanResultList
              dayGroups={dayGroups}
              totalCount={totalCount}
              isLoading={isLoading}
              onOpenPuraList={(group) => {
                setPuraListModalGroup(group);
                setSelectedPuraIdForModal(null);
              }}
              onOpenDayWariga={handleOpenDayWariga}
              onResetFilter={handleResetFilter}
              resultTitle={resultTitle}
            />
          </div>

          {/* Kolom Kanan (~1/3 Lebar: lg:col-span-4) - Widget Piodalan Terdekat */}
          <div className="lg:col-span-4 space-y-6">
            <PiodalanSidebarWidgets
              upcomingPiodalan={upcomingPiodalan}
              onOpenUpcomingDetail={handleOpenUpcomingDetail}
            />
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL HIERARKIS 3-LEVEL: LIST PURA & DETAIL ACARA PURA            */}
      {/* Level 2: Daftar Pura yang Melaksanakan Piodalan                      */}
      {/* Level 3: Rincian Piodalan Pura & Susunan Rangkaian Acara Kontributor */}
      {/* ==================================================================== */}
      <PiodalanPuraListModal
        isOpen={Boolean(puraListModalGroup)}
        onClose={() => {
          setPuraListModalGroup(null);
          setSelectedPuraIdForModal(null);
        }}
        dayGroup={puraListModalGroup}
        initialSelectedPuraId={selectedPuraIdForModal}
        onOpenDayWariga={handleOpenDayWariga}
      />

      {/* ==================================================================== */}
      {/* 6. MODAL DIALOG POP-UP: DETAIL WARIGA LENGKAP (15 DIMENSI)           */}
      {/* Sesuai Permintaan Pengguna: Khusus rincian wariga penanggalan saja  */}
      {/* ==================================================================== */}
      <PiodalanDetailModal
        isOpen={warigaModalState.isOpen}
        onClose={() => setWarigaModalState((prev) => ({ ...prev, isOpen: false }))}
        schedule={warigaModalState.schedule}
      />
    </div>
  );
};

export default PiodalanPage;
