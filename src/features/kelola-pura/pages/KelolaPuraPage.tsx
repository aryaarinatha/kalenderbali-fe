import { useMemo, useState, useEffect } from 'react';
import type { PuraBackendItem } from '../types/kelolaPura.types';
import {
  usePurasData,
  usePuraDetailData,
  useKelolaPuraUrlState,
} from '../hooks/useKelolaPura';
import { isPuraLuarBali } from '../utils/kelolaPuraUtils';
import { KelolaPuraHero } from '../components/KelolaPuraHero';
import { KelolaPuraFilter } from '../components/KelolaPuraFilter';
import { KelolaPuraList } from '../components/KelolaPuraList';
import { PuraDetailModal } from '../components/PuraDetailModal';
import { PuraPiodalanView } from '../components/PuraPiodalanView';
import { PuraKeuanganView } from '../components/PuraKeuanganView';

/**
 * ==============================================================================
 * HALAMAN UTAMA: KelolaPuraPage (Orkestrator Fitur Kelola Pura Bali)
 * ==============================================================================
 * Halaman utama yang memadukan seluruh alur katalog pura, piodalan, dan transparansi kas:
 *
 * Prinsip Arsitektur (fe_strategy.md & AGENTS.md):
 * 1. URL-as-State: Status sub-halaman (?view=list | piodalan | keuangan) dan ID pura (?pura_id=...)
 *    tersinkronisasi secara reaktif ke URL. Tombol Back/Forward browser berfungsi alami.
 * 2. Zero-Loading: Memanfaatkan memori cache TanStack Query ['piodalan', 'puras', 'all']
 *    sehingga 461 master pura dari PostgreSQL langsung siap dalam 0ms tanpa loading ganda.
 * 3. Role-Based Access Control (RBAC):
 *    - Unauthenticated: Dialihkan ke /login via ProtectedRoute.
 *    - Guest / Free Member: Read-only seluruh data pura, piodalan, dan mutasi kas.
 *    - Member Premium: Read-only + dapat mengajukan usulan/koreksi kas pura.
 *    - Admin: Full Control langsung catat kas baru, edit, hapus, dan tinjau usulan.
 * 4. Zero Layout Shift (CLS = 0): Skeleton screens presisi dimensi saat data dimuat.
 * ==============================================================================
 */
export default function KelolaPuraPage() {
  // ============================================================================
  // 1. MANAJEMEN STATE PARAMETER URL (URL-AS-STATE)
  // ============================================================================
  const {
    viewMode,
    selectedPuraId,
    searchQuery,
    selectedType,
    selectedCity,
    navigateToView,
    setFilters,
    resetFilters,
  } = useKelolaPuraUrlState();

  // ============================================================================
  // 2. STATE DIALOG MODAL DETAIL PURA (POPUP DI TAMPILAN LIST)
  // ============================================================================
  const [selectedDetailPura, setSelectedDetailPura] = useState<PuraBackendItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  // ============================================================================
  // 3. PENGAMBILAN DATA MASTER PURA (CACHE QUERY 461 PURA)
  // ============================================================================
  const { data: puras = [], isLoading: isLoadingPuras } = usePurasData();

  // Ambil data detail pura spesifik jika ada selectedPuraId di URL (fallback query)
  const { data: fallbackPuraDetail } = usePuraDetailData(selectedPuraId);

  // Cari objek data pura terpilih dari memori RAM (instan) atau dari query detail
  const activePura: PuraBackendItem | null = useMemo(() => {
    if (!selectedPuraId) return null;
    const foundInList = puras.find((p) => p.id === selectedPuraId);
    if (foundInList) return foundInList;
    return fallbackPuraDetail || null;
  }, [puras, selectedPuraId, fallbackPuraDetail]);

  // ============================================================================
  // 4. PENYARINGAN DATA PURA BERDASARKAN FILTER AKTIF (MEMOIZED)
  // ============================================================================
  const filteredPuras = useMemo(() => {
    return puras.filter((pura) => {
      // 1. Filter Pencarian Teks (Nama pura, alamat fisik, kabupaten, provinsi, atau negara)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (pura.name || '').toLowerCase().includes(q);
        const matchAddress = (pura.address || '').toLowerCase().includes(q);
        const matchCity = (pura.city || '').toLowerCase().includes(q);
        const matchProvince = (pura.province || '').toLowerCase().includes(q);
        const matchCountry = (pura.country || '').toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchCity && !matchProvince && !matchCountry) {
          return false;
        }
      }

      // 2. Filter Klasifikasi Tipe Pura (Kahyangan Jagat, Kahyangan Tiga, dll)
      if (selectedType && selectedType !== 'Semua') {
        if ((pura.type || '').trim().toLowerCase() !== selectedType.trim().toLowerCase()) {
          return false;
        }
      }

      // 3. Filter Wilayah Kabupaten / Kota (Termasuk Opsi Khusus "Luar Bali")
      if (selectedCity && selectedCity !== 'Semua') {
        if (selectedCity === 'Luar Bali') {
          // Hanya sertakan pura yang berlokasi di luar 9 Kabupaten/Kota di Bali
          if (!isPuraLuarBali(pura)) {
            return false;
          }
        } else {
          // Cocokkan nama kabupaten/kota secara eksak (case-insensitive)
          if ((pura.city || '').trim().toLowerCase() !== selectedCity.trim().toLowerCase()) {
            return false;
          }
        }
      }

      return true;
    });
  }, [puras, searchQuery, selectedType, selectedCity]);

  // ============================================================================
  // 5. PEMBARUAN JUDUL TAB BROWSER SECARA REAKTIF
  // ============================================================================
  useEffect(() => {
    if (viewMode === 'piodalan') {
      document.title = activePura
        ? `Jadwal Piodalan & Acara ${activePura.name} - Kalender Bali`
        : 'Jadwal Piodalan & Acara Pura - Kalender Bali';
    } else if (viewMode === 'keuangan') {
      document.title = activePura
        ? `Transparansi Kas ${activePura.name} - Kalender Bali`
        : 'Transparansi Kas Pura - Kalender Bali';
    } else {
      document.title = 'Katalog & Kelola Pura Bali - Kalender Bali Digital';
    }
  }, [viewMode, activePura]);

  // ============================================================================
  // 6. HANDLER INTERAKSI PENGGUNA
  // ============================================================================
  // Membuka modal popup detail profil pura
  const handleOpenDetailModal = (pura: PuraBackendItem) => {
    setSelectedDetailPura(pura);
    setIsDetailModalOpen(true);
  };

  // Menutup modal popup detail profil pura
  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedDetailPura(null);
  };

  // Navigasi ke sub-halaman jadwal piodalan & acara
  const handleViewPiodalan = (puraId: number) => {
    navigateToView('piodalan', puraId);
  };

  // Navigasi ke sub-halaman transparansi kas pura
  const handleViewKeuangan = (puraId: number) => {
    navigateToView('keuangan', puraId);
  };

  // Kembali ke tampilan katalog utama
  const handleBackToList = () => {
    navigateToView('list');
  };

  // ============================================================================
  // 7. RENDER SUB-HALAMAN: JADWAL PIODALAN & ACARA (?view=piodalan&pura_id=...)
  // ============================================================================
  if (viewMode === 'piodalan' && selectedPuraId) {
    return (
      <div className="space-y-6">
        {/* Header Breadcrumb & Identitas Sub-Halaman Jadwal Piodalan & Acara */}
        <KelolaPuraHero
          title="Jadwal Piodalan & Acara"
          description={`Pusat informasi jadwal upacara piodalan resmi dan susunan tahapan rangkaian acara ${activePura ? `di ${activePura.name}` : 'pura'}.`}
          breadcrumbChild="Jadwal Piodalan & Acara"
          onNavigateToList={handleBackToList}
        />

        <PuraPiodalanView
          puraId={selectedPuraId}
          pura={activePura}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // ============================================================================
  // 8. RENDER SUB-HALAMAN: TRANSPARANSI KAS PURA (?view=keuangan&pura_id=...)
  // ============================================================================
  if (viewMode === 'keuangan' && selectedPuraId) {
    return (
      <div className="space-y-6">
        {/* Header Breadcrumb & Identitas Sub-Halaman Transparansi Kas Pura */}
        <KelolaPuraHero
          title="Transparansi Kas Pura"
          description={`Pencatatan mutasi kas masuk punia serta pengeluaran belanja operasional ${activePura ? `di ${activePura.name}` : 'pura'} secara transparan dan akuntabel.`}
          breadcrumbChild="Transparansi Kas Pura"
          onNavigateToList={handleBackToList}
        />

        <PuraKeuanganView
          puraId={selectedPuraId}
          pura={activePura}
          onBack={handleBackToList}
        />
      </div>
    );
  }

  // ============================================================================
  // 9. RENDER TAMPILAN UTAMA: KATALOG PURA, FILTER, & GRID DAFTAR PURA (?view=list)
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* 1. Header Banner Utama dengan Estetika Tirta Bali & Metrik */}
      <KelolaPuraHero
        totalPura={puras.length || 461}
        totalKabupaten={9}
      />

      {/* 2. Bilah Kontrol Pencarian, Dropdown Tipe, dan Kabupaten */}
      <KelolaPuraFilter
        searchQuery={searchQuery}
        selectedType={selectedType}
        selectedCity={selectedCity}
        totalFiltered={filteredPuras.length}
        totalAll={puras.length || 461}
        onSearchChange={(q) => setFilters({ q })}
        onTypeChange={(type) => setFilters({ type })}
        onCityChange={(city) => setFilters({ city })}
        onReset={resetFilters}
      />

      {/* 3. Grid Kartu Pura dengan CLS=0 Skeleton Loading & Paginasi Presisi */}
      <KelolaPuraList
        puras={filteredPuras}
        isLoading={isLoadingPuras}
        onOpenDetail={handleOpenDetailModal}
        onViewPiodalan={handleViewPiodalan}
        onViewKeuangan={handleViewKeuangan}
        onResetFilter={resetFilters}
      />

      {/* 4. Dialog Pop-up Rincian Lengkap Pura (Portal ke document.body) */}
      <PuraDetailModal
        isOpen={isDetailModalOpen}
        pura={selectedDetailPura}
        onClose={handleCloseDetailModal}
        onViewPiodalan={handleViewPiodalan}
        onViewKeuangan={handleViewKeuangan}
      />
    </div>
  );
}

