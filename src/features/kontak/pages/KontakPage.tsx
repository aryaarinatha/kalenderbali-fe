import { useEffect } from 'react';
import { KontakHero } from '../components/KontakHero';
import { KontakDeveloperCard } from '../components/KontakDeveloperCard';
import { KontakFormCard } from '../components/KontakFormCard';

/**
 * ============================================================================
 * HALAMAN UTAMA: KontakPage (Orkestrator Halaman Info Kontak)
 * ============================================================================
 * Halaman utama untuk informasi kontak pengembang PT Bali Integrated Solution &
 * tim Wargabali Kalender Bali Digital.
 *
 * Menerapkan prinsip fe_strategy.md & AGENTS.md:
 *  1. ZERO-LOADING UX: Transisi instan dalam 0 milidetik tanpa overhead jaringan.
 *  2. DYNAMIC DOCUMENT TITLE: Menjaga judul tab browser konsisten: "Info Kontak · Kalender Bali".
 *  3. STRUKTUR TERPADU (2 KARTU BERSIH TANPA REDUNDANSI):
 *     - Header Halaman & Breadcrumb standar (Wargabali / Info Kontak)
 *     - Kartu Profil Pengembang & Saluran Email Terpadu (Logo, Nama, Email, Salin)
 *     - Formulir Masukan & Pertanyaan Interaktif dengan feedback SuccessAlert
 *  4. ERGONOMI SENTUH: Seluruh tombol memenuhi batas 44x44px [touch-action:manipulation].
 * ============================================================================
 */
export default function KontakPage() {
  // ---------------------------------------------------------------------------
  // 1. SINKRONISASI JUDUL TAB BROWSER DINAMIS (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    document.title = 'Info Kontak · Kalender Bali';
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Halaman & Breadcrumb Standar */}
      <KontakHero />

      {/* 2. Kartu Profil Pengembang & Email Resmi Terpadu */}
      <KontakDeveloperCard />

      {/* 3. Formulir Pengiriman Pesan & Masukan Interaktif */}
      <KontakFormCard />
    </div>
  );
}
