import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

// Import komponen-komponen halaman
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import CalendarPage from '@/features/kalender/pages/CalendarPage';
import KeteranganPage from '@/features/keterangan/pages/KeteranganPage';
// Import Halaman Rincian Kategori Keterangan Penuh (Page 2)
import KeteranganDetailPage from '@/features/keterangan/pages/KeteranganDetailPage';
import OtonanPage from '@/features/otonan/pages/OtonanPage';
import HariRayaPage from '@/features/hari-raya/pages/HariRayaPage';

/**
 * Komponen utama pengatur routing aplikasi Kalender Bali Digital
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================================= */}
        {/* LAYOUT UTAMA DENGAN SIDEBAR & NAVBAR                     */}
        {/* Semua halaman anak akan dirender di dalam <Outlet />     */}
        {/* ========================================================= */}
        <Route path="/" element={<AppLayout />}>
          {/* Halaman Beranda / Dashboard Utama */}
          <Route index element={<DashboardPage />} />

          {/* Halaman Kalender Bali Lengkap */}
          <Route path="kalender" element={<CalendarPage />} />

          {/* Halaman Ensiklopedia / Keterangan Wariga (Katalog Utama - Page 1) */}
          <Route path="keterangan" element={<KeteranganPage />} />

          {/* Halaman Penuh Rincian Kategori Keterangan (Page 2: contoh /keterangan/hari_raya) */}
          <Route path="keterangan/:typeCode" element={<KeteranganDetailPage />} />

          {/* Fallback jika ada yang mengakses rute dengan prefix layanan */}
          <Route path="layanan/keterangan" element={<Navigate to="/keterangan" replace />} />
          <Route path="layanan/keterangan/:typeCode" element={<Navigate to="/keterangan" replace />} />

          {/* Halaman Pencarian & Perhitungan Otonan */}
          <Route path="otonan" element={<OtonanPage />} />

          {/* Halaman Jadwal Hari Raya & Rahina Hindu Bali */}
          <Route path="hari-raya" element={<HariRayaPage />} />

          {/* ========================================================= */}
          {/* PLACEHOLDER FITUR LAINNYA (SESUAI DAFTAR MENU SIDEBAR)   */}
          {/* Menghindari 404 saat menu lain di sidebar diklik         */}
          {/* ========================================================= */}
          <Route
            path="ala-ayuning-dewasa"
            element={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Ala Ayuning Dewasa</h2>
                <p className="text-sm text-slate-500">Modul penentuan hari baik sedang disiapkan.</p>
              </div>
            }
          />

          <Route
            path="kelola-pura"
            element={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Kelola Pura</h2>
                <p className="text-sm text-slate-500">Modul pengelolaan data pura dan piodalan.</p>
              </div>
            }
          />

          <Route
            path="info-kita"
            element={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Info Kita</h2>
                <p className="text-sm text-slate-500">Artikel, berita, dan informasi seputar budaya Bali.</p>
              </div>
            }
          />

          <Route
            path="kontak"
            element={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Info Kontak</h2>
                <p className="text-sm text-slate-500">Hubungi pengembang untuk masukan atau kerja sama.</p>
              </div>
            }
          />

          {/* Alias rute info-kontak agar otomatis mengarah ke /kontak */}
          <Route path="info-kontak" element={<Navigate to="/kontak" replace />} />

          {/* ========================================================= */}
          {/* HALAMAN 404 (JIKA URL TIDAK DITEMUKAN)                   */}
          {/* ========================================================= */}
          <Route
            path="*"
            element={
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto my-12 space-y-3">
                <h2 className="text-3xl font-extrabold text-teal-700">404</h2>
                <p className="text-base font-semibold text-slate-800">Halaman Tidak Ditemukan</p>
                <p className="text-xs text-slate-500">
                  Alamat tautan yang Anda tuju mungkin telah dipindahkan atau belum tersedia.
                </p>
              </div>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
