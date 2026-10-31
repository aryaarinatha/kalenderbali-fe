import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';

// Import komponen proteksi rute khusus Admin & Pengguna Terautentikasi
import AdminRoute from '@/components/auth/AdminRoute';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Import komponen-komponen halaman autentikasi mandiri
import LoginPage from '@/features/auth/pages/LoginPage';
import RegisterPage from '@/features/auth/pages/RegisterPage';

// Import komponen notifikasi alert sukses global
import SuccessAlert from '@/components/ui/SuccessAlert';

// Import komponen-komponen halaman fitur utama Kalender Bali
import DashboardPage from '@/features/dashboard/pages/DashboardPage';
import CalendarPage from '@/features/kalender/pages/CalendarPage';
import KeteranganPage from '@/features/keterangan/pages/KeteranganPage';
import KeteranganDetailPage from '@/features/keterangan/pages/KeteranganDetailPage';
import OtonanPage from '@/features/otonan/pages/OtonanPage';
import PiodalanPage from '@/features/piodalan/pages/PiodalanPage';
import HariRayaPage from '@/features/hari-raya/pages/HariRayaPage';
import KelolaPuraPage from '@/features/kelola-pura/pages/KelolaPuraPage';
import WartaPage from '@/features/warta/pages/WartaPage';
import WartaDetailPage from '@/features/warta/pages/WartaDetailPage';

// Import komponen halaman Info Kontak dengan Route-Level Code Splitting (fe_strategy.md 8.12)
const KontakPage = lazy(() => import('@/features/kontak/pages/KontakPage'));
import { KontakSkeleton } from '@/features/kontak/components/KontakSkeleton';

// Import komponen halaman Wariga Personal dengan Route-Level Code Splitting (fe_strategy.md 8.12)
const WarigaPersonalPage = lazy(() => import('@/features/wariga-personal/pages/WarigaPersonalPage'));
import { WarigaPersonalSkeleton } from '@/features/wariga-personal/components/WarigaPersonalSkeleton';

// Import komponen halaman Ramalan Sifat dengan Route-Level Code Splitting (fe_strategy.md 8.12)
const RamalanSifatPage = lazy(() => import('@/features/ramalan-sifat/pages/RamalanSifatPage'));
import { RamalanSifatSkeleton } from '@/features/ramalan-sifat/components/RamalanSifatSkeleton';

// Import komponen-komponen halaman Manajemen Admin
import AdminUserPage from '@/features/admin/pages/AdminUserPage';
import AdminTransactionPage from '@/features/admin/pages/AdminTransactionPage';
import AdminContributionPage from '@/features/admin/pages/AdminContributionPage';

/**
 * ==============================================================================
 * ROUTER UTAMA APLIKASI (Kalender Bali Digital)
 * ==============================================================================
 * Mengatur seluruh rute navigasi aplikasi:
 * 1. Rute Autentikasi Standalone (/login & /register): Tampil terpusat di kanvas tanpa Sidebar/Navbar.
 * 2. Rute Tata Letak Utama (/): Dibungkus oleh <AppLayout /> (Navbar, Sidebar dinamis, & Footer).
 */
export default function AppRoutes() {
  return (
    <BrowserRouter>
      {/* Floating Alert Sukses (Berhasil login / logout / register) */}
      <SuccessAlert />

      <Routes>
        {/* ==================================================================== */}
        {/* 1. RUTE AUTENTIKASI STANDALONE (DI LUAR APPLAYOUT)                   */}
        {/* Menampilkan kartu login/register terpusat penuh di layar             */}
        {/* ==================================================================== */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* ==================================================================== */}
        {/* 2. LAYOUT UTAMA DENGAN SIDEBAR & NAVBAR                             */}
        {/* Semua halaman anak akan dirender di dalam slot <Outlet /> AppLayout  */}
        {/* ==================================================================== */}
        <Route path="/" element={<AppLayout />}>
          {/* Halaman Beranda / Dashboard Utama */}
          <Route index element={<DashboardPage />} />

          {/* Halaman Kalender Bali Lengkap */}
          <Route path="kalender" element={<CalendarPage />} />

          {/* Halaman Ensiklopedia / Keterangan Wariga (Katalog Utama) */}
          <Route path="keterangan" element={<KeteranganPage />} />

          {/* Halaman Rincian Kategori Keterangan (Contoh: /keterangan/hari_raya) */}
          <Route path="keterangan/:typeCode" element={<KeteranganDetailPage />} />

          {/* Fallback jika ada yang mengakses rute dengan prefix layanan */}
          <Route path="layanan/keterangan" element={<Navigate to="/keterangan" replace />} />
          <Route path="layanan/keterangan/:typeCode" element={<Navigate to="/keterangan" replace />} />

          {/* Halaman Pencarian & Perhitungan Otonan */}
          <Route path="otonan" element={<OtonanPage />} />

          {/* Halaman Pencarian Jadwal Piodalan Pura */}
          <Route path="piodalan" element={<PiodalanPage />} />
          <Route path="layanan/piodalan" element={<Navigate to="/piodalan" replace />} />

          {/* Halaman Jadwal Hari Raya & Rahina Hindu Bali */}
          <Route path="hari-raya" element={<HariRayaPage />} />

          {/* ==================================================================== */}
          {/* HALAMAN WARIGA PERSONAL (EVALUASI KECOCOKAN HARI WETON KELAHIRAN)    */}
          {/* ==================================================================== */}
          <Route
            path="wariga-personal"
            element={
              <Suspense fallback={<WarigaPersonalSkeleton />}>
                <WarigaPersonalPage />
              </Suspense>
            }
          />
          <Route path="layanan/wariga-personal" element={<Navigate to="/wariga-personal" replace />} />

          {/* ==================================================================== */}
          {/* HALAMAN RAMALAN SIFAT (WATAK & KARAKTER PENANGGALAN BALI)           */}
          {/* ==================================================================== */}
          <Route
            path="ramalan-sifat"
            element={
              <Suspense fallback={<RamalanSifatSkeleton />}>
                <RamalanSifatPage />
              </Suspense>
            }
          />
          <Route path="layanan/ramalan-sifat" element={<Navigate to="/ramalan-sifat" replace />} />
          <Route path="ramalan_sifat" element={<Navigate to="/ramalan-sifat" replace />} />

          {/* ==================================================================== */}
          {/* PLACEHOLDER FITUR LAINNYA (Mencegah 404 saat menu sidebar diklik)    */}
          {/* ==================================================================== */}
          <Route
            path="ala-ayuning-dewasa"
            element={
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">Ala Ayuning Dewasa</h2>
                <p className="text-sm text-slate-500">Modul penentuan hari baik sedang disiapkan.</p>
              </div>
            }
          />

          {/* ==================================================================== */}
          {/* RUTE TERLINDUNGI LOGIN (MEMBER, GUEST TERDAFTAR, & ADMIN)            */}
          {/* Mengalihkan pengguna non-login ke /login dengan state { from: loc }  */}
          {/* ==================================================================== */}
          <Route element={<ProtectedRoute />}>
            {/* Halaman Utama Katalog & Kelola Pura Bali */}
            <Route path="kelola-pura" element={<KelolaPuraPage />} />
            <Route path="layanan/kelola-pura" element={<Navigate to="/kelola-pura" replace />} />
          </Route>

          {/* ==================================================================== */}
          {/* HALAMAN WARTA BUDAYA BALI (MENGGANTIKAN FITUR LAMA INFO KITA)        */}
          {/* Menyajikan artikel, wawasan tradisi, & publikasi berita budaya       */}
          {/* ==================================================================== */}
          <Route path="warta" element={<WartaPage />} />
          {/* Halaman baca artikel warta penuh (dedicated reading page) */}
          <Route path="warta/:id" element={<WartaDetailPage />} />

          {/* Rute kompatibilitas pengalihan /info-kita ke /warta */}
          <Route path="info-kita" element={<Navigate to="/warta" replace />} />

          {/* ==================================================================== */}
          {/* HALAMAN INFO KONTAK & DUKUNGAN PENGEMBANG (AGENTS.md & fe_strategy.md) */}
          {/* ==================================================================== */}
          <Route
            path="kontak"
            element={
              <Suspense fallback={<KontakSkeleton />}>
                <KontakPage />
              </Suspense>
            }
          />

          {/* Alias rute info-kontak & about_us untuk kompatibilitas penuh */}
          <Route path="info-kontak" element={<Navigate to="/kontak" replace />} />
          <Route path="about_us" element={<Navigate to="/kontak" replace />} />
          <Route path="about" element={<Navigate to="/kontak" replace />} />
          <Route path="tentang-kami" element={<Navigate to="/kontak" replace />} />

          {/* ==================================================================== */}
          {/* RUTE KHUSUS ADMINISTRATOR (DILINDUNGI OLEH ADMINROUTE)              */}
          {/* Hanya dapat diakses oleh pengguna dengan peran 'admin'                */}
          {/* Role 'member' atau 'guest' akan diblokir dengan tampilan 403       */}
          {/* ==================================================================== */}
          <Route element={<AdminRoute />}>
            {/* Manajemen Anggota / User (Data User, Ubah Role, Verifikasi Kontributor) */}
            <Route path="admin/users" element={<AdminUserPage />} />
            <Route path="admin/manajemen-user" element={<Navigate to="/admin/users" replace />} />
            <Route path="kelola-pengguna" element={<Navigate to="/admin/users" replace />} />

            {/* Transaksi User (Riwayat Pembelian Saldo/Layanan) */}
            <Route path="admin/transaksi" element={<AdminTransactionPage />} />
            <Route path="admin/transaksi-user" element={<Navigate to="/admin/transaksi" replace />} />

            {/* Pengajuan Kontribusi (Verifikasi Data Pura/Wariga dari Kontributor) */}
            <Route path="admin/kontribusi" element={<AdminContributionPage />} />
            <Route path="admin/pengajuan-kontribusi" element={<Navigate to="/admin/kontribusi" replace />} />
          </Route>

          {/* ==================================================================== */}
          {/* HALAMAN 404 (JIKA URL TIDAK DITEMUKAN)                              */}
          {/* ==================================================================== */}
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
