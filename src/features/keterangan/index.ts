/**
 * ============================================================================
 * MODUL PUBLIK (BARREL EXPORT): FEATURES/KETERANGAN
 * ============================================================================
 * Berkas ini bertindak sebagai pintu gerbang ekspor publik untuk domain Keterangan,
 * Ensiklopedia Wariga, Zodiak, dan Referensi Hari Raya Bali.
 *
 * Kebijakan Arsitektur (Multi-Page Architecture):
 *  1. Halaman 1 (Katalog Utama): Mengekspor `KeteranganPage` untuk rute `/keterangan`.
 *  2. Halaman 2 (Rincian Penuh): Mengekspor `KeteranganDetailPage` untuk rute `/keterangan/:typeCode`.
 *  3. Preservasi Kompatibilitas Mundur: Tetap mengekspor modul Zodiak dan modul Hari Raya
 *     lama yang digunakan bersama oleh fitur Kalender (CalendarHero, HariRayaDetailModal).
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. MODUL INTI KETERANGAN & ENSIKLOPEDIA KALENDER BALI (TERBARU)
// ----------------------------------------------------------------------------
export * from './types/keterangan.types';
export * from './api/keteranganApi';
export * from './hooks/useKeterangan';

// Ekspor komponen antarmuka pengguna
export * from './components/KeteranganHero';
export * from './components/KeteranganCard';
export * from './components/KeteranganDetailModal';
export * from './components/KeteranganPagination';

// Ekspor halaman utama katalog (Page 1) dan halaman rincian penuh (Page 2)
export { default as KeteranganPage } from './pages/KeteranganPage';
export { default as KeteranganDetailPage } from './pages/KeteranganDetailPage';

// ----------------------------------------------------------------------------
// 2. MODUL ZODIAK (DIGUNAKAN BERSAMA OLEH FITUR KALENDER)
// ----------------------------------------------------------------------------
export * from './types/zodiac.types';
export * from './api/zodiacApi';
export * from './hooks/useZodiac';

// ----------------------------------------------------------------------------
// 3. MODUL REFERENSI HARI RAYA (DIGUNAKAN BERSAMA OLEH FITUR KALENDER)
// ----------------------------------------------------------------------------
export * from './types/hariRaya.types';
export * from './api/hariRayaApi';
export * from './hooks/useHariRaya';
