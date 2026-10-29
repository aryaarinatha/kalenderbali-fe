import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * ==============================================================================
 * KOMPONEN KEAMANAN: ProtectedRoute Guard
 * ==============================================================================
 * Melindungi rute aplikasi yang mewajibkan pengguna untuk masuk/login terlebih dahulu.
 *
 * Logika Alur:
 * 1. Mengecek status autentikasi dari Zustand useAuthStore (Single Source of Truth).
 * 2. Jika pengguna BELUM LOGIN (isAuthenticated === false atau user === null):
 *    - Otomatis dialihkan ke halaman masuk (/login).
 *    - Melampirkan state lokasi asal ({ from: location }) agar pengguna otomatis
 *      dikembalikan ke halaman yang sedang dibuka setelah proses login berhasil.
 * 3. Jika pengguna SUDAH LOGIN (Guest, Member, atau Admin):
 *    - Mengizinkan komponen anak dirender di layar melalui <Outlet />.
 * ==============================================================================
 */
export default function ProtectedRoute() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();

  // Jika tidak memiliki sesi login aktif, arahkan ke /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika terautentikasi, render konten halaman anak
  return <Outlet />;
}

