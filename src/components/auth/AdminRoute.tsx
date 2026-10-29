import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

/**
 * ==============================================================================
 * KOMPONEN KEAMANAN: AdminRoute Guard
 * ==============================================================================
 * Melindungi rute-rute khusus administratif di sisi klien (frontend):
 * 1. Jika pengguna BELUM LOGIN: Otomatis dialihkan ke halaman /login (disertai state lokasi asal).
 * 2. Jika pengguna SUDAH LOGIN namun BUKAN ROLE ADMIN (contoh: 'member' atau 'guest'):
 *    Akses langsung diblokir dan ditampilkan layar 403 Forbidden (Akses Ditolak).
 * 3. Jika pengguna terkonfirmasi ROLE ADMIN: Seluruh komponen anak diizinkan tampil via <Outlet />.
 */
export default function AdminRoute() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuthStore();

  // Evaluasi apakah pengguna terautentikasi dan memiliki peran 'admin' (case-insensitive)
  const isAdmin = Boolean(
    isAuthenticated && user && (user.role || '').trim().toLowerCase() === 'admin'
  );

  // 1. Kondisi jika pengguna belum login: arahkan ke halaman masuk
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Kondisi jika pengguna sudah login tetapi bukan role Admin: tampilkan halaman 403
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-xs text-center max-w-lg w-full space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {/* Ikon Peringatan Hak Akses */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-2xs">
            <ShieldAlert size={34} />
          </div>

          {/* Judul & Penjelasan Hak Akses */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-rose-600 block">
              Peringatan Keamanan · Kode 403
            </span>
            <h2 className="text-2xl font-extrabold text-[#0f172a] tracking-tight">
              Akses Dibatasi
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Halaman ini secara eksklusif hanya dapat diakses oleh akun dengan peran{' '}
              <strong className="text-slate-900 font-bold">Administrator</strong>.
            </p>
            <div className="inline-block mt-1 px-3 py-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200/80">
              Peran Akun Anda Saat Ini:{' '}
              <span className="capitalize text-slate-900 font-bold">
                {user.role || 'Member'}
              </span>
            </div>
          </div>

          {/* Tombol Aksi Pengalihan */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/"
              className="w-full sm:w-auto h-11 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
            >
              <Home size={16} />
              <span>Kembali ke Beranda</span>
            </Link>

            <Link
              to="/login"
              className="w-full sm:w-auto h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm transition-all inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
            >
              <ArrowLeft size={16} />
              <span>Ganti Akun</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Kondisi jika terverifikasi Admin: izinkan akses komponen anak
  return <Outlet />;
}
