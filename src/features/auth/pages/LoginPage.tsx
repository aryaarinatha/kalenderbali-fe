import { useState } from 'react';
import { NavLink, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthCardLayout from '../components/AuthCardLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';
import EmailVerificationModal from '../components/EmailVerificationModal';
import ForgotPasswordModal from '../components/ForgotPasswordModal';
import GoogleCompleteProfileModal from '../components/GoogleCompleteProfileModal';
import { authService } from '../services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * HALAMAN: LoginPage (Masuk Akun)
 * ==============================================================================
 * Mengimplementasikan desain sesuai Gambar 1 Mockup Pengguna:
 * - Kartu putih terpusat "Selamat Datang !" & "Silahkan login untuk melanjutkan."
 * - Opsi Masuk dengan Google di bagian atas form
 * - Input Email ("Masukkan email") & Password ("Masukkan password")
 * - Aksi bawah form: "Lupa Password?" di kiri dan tombol "Login" di kanan (Teal #0e9f90)
 * - Tautan navigasi bawah:
 *   1. "Kembali ke dashboard tanpa login. Kalender Bali"
 *   2. "Belum punya akun ? Signup Sekarang"
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Ambil state redirect jika pengguna sebelumnya dicegat oleh route guard
  const from = (location.state as any)?.from?.pathname || '/';

  // Jika sudah terotentikasi, otomatis alihkan ke halaman utama/asal
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  // State Formulir
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Modal-Modal Interaktif
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showGoogleProfileModal, setShowGoogleProfileModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<{
    idToken: string;
    email: string;
    name: string;
  } | null>(null);

  // ============================================================================
  // HANDLER: SUBMIT LOGIN MANUAL (Email + Kata Sandi)
  // ============================================================================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Panggil one-flow helper: login + ambil profil user sekaligus
      const { user, token, refreshToken } = await authService.loginAndFetchProfile({
        email: email.trim(),
        password,
      });

      // Simpan sesi login ke Zustand store & localStorage
      useAuthStore.getState().login(user, token, refreshToken);

      // Tampilkan alert notifikasi sukses mengambang
      useAlertStore.getState().showAlert('Berhasil login!');

      // Arahkan pengguna ke halaman tujuan atau dashboard
      navigate(from, { replace: true });
    } catch (err: any) {
      // Deteksi jika akun terdaftar tetapi belum verifikasi email (HTTP 403 EMAIL_NOT_VERIFIED)
      if (err.code === 'EMAIL_NOT_VERIFIED' || err.message?.toLowerCase().includes('not verified')) {
        setErrorMessage('Akun Anda belum diverifikasi. Kode verifikasi baru telah dikirimkan ke email Anda.');
        setShowVerifyModal(true);
      } else {
        setErrorMessage(err.message || 'Email atau kata sandi yang Anda masukkan salah.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLER: AUTENTIKASI GOOGLE SIGN-IN
  // ============================================================================
  const handleGoogleSuccess = async (idToken: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authService.googleLogin(idToken);

      // Skenario 1: Akun sudah terhubung / terverifikasi -> Langsung Login
      if (res.status === 'authenticated' && res.access_token) {
        const profile = await authService.getProfile(res.access_token);
        const user = await authService.buildAuthUser(profile, res.access_token);
        useAuthStore.getState().login(user, res.access_token, res.refresh_token);
        useAlertStore.getState().showAlert('Berhasil login!');
        navigate(from, { replace: true });
        return;
      }

      // Skenario 2: Akun Google baru -> Buka modal Lengkapi Profil
      if (res.status === 'profile_required') {
        setPendingGoogleData({
          idToken,
          email: res.email || '',
          name: res.name || '',
        });
        setShowGoogleProfileModal(true);
        return;
      }

      // Skenario 3: Email sudah terdaftar lokal -> Tautkan otomatis ke Google
      if (res.status === 'link_required') {
        const linkRes = await authService.googleLink({ id_token: idToken });
        if (linkRes.access_token) {
          const profile = await authService.getProfile(linkRes.access_token);
          const user = await authService.buildAuthUser(profile, linkRes.access_token);
          useAuthStore.getState().login(user, linkRes.access_token, linkRes.refresh_token);
          useAlertStore.getState().showAlert('Berhasil login!');
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthCardLayout
        title="Selamat Datang !"
        subtitle="Silahkan login untuk melanjutkan."
        footer={
          <>
            {/* Link Baris 1: Kembali ke Dashboard Tanpa Login */}
            <div>
              <span>Kembali ke dashboard tanpa login. </span>
              <NavLink
                to="/"
                className="text-[#0d9488] hover:text-[#0f766e] font-semibold hover:underline transition-colors"
              >
                Kalender Bali
              </NavLink>
            </div>

            {/* Link Baris 2: Belum Punya Akun */}
            <div>
              <span>Belum punya akun ? </span>
              <NavLink
                to="/register"
                className="text-[#0d9488] hover:text-[#0f766e] font-semibold hover:underline transition-colors"
              >
                Signup Sekarang
              </NavLink>
            </div>
          </>
        }
      >
        {/* Banner Pesan Error */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulir Login Utama (Metode Email Utama Sesuai Gambar 1) */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Input Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-email"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* Input Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="login-password"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
              {/* Tombol Intip / Sembunyikan Password */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer [touch-action:manipulation]"
                aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Baris Bawah Form: "Lupa Password?" di kiri & Tombol "Login" di kanan */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs sm:text-sm font-semibold text-[#0d9488] hover:text-[#0f766e] hover:underline cursor-pointer [touch-action:manipulation]"
            >
              Lupa Password?
            </button>

            {/* Tombol Login Primer (Warna Teal Tirta Bali #0e9f90) */}
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-7 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Masuk...</span>
                </>
              ) : (
                <span>Login</span>
              )}
            </button>
          </div>
        </form>

        {/* Tombol Opsi Masuk dengan Google (di bawah form email) */}
        <GoogleAuthButton
          mode="login"
          onSuccess={handleGoogleSuccess}
          onError={(err) => setErrorMessage(err.message)}
          disabled={isLoading}
        />
      </AuthCardLayout>

      {/* ==================================================================== */}
      {/* MODAL-MODAL INTERAKTIF PENDUKUNG                                    */}
      {/* ==================================================================== */}

      {/* 1. Modal Verifikasi Email (Jika akun belum verifikasi) */}
      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={email}
        onVerified={() => {
          setShowVerifyModal(false);
          // Auto login atau minta user menekan login kembali
          setErrorMessage(null);
        }}
      />

      {/* 2. Modal Lupa Password (3 Langkah Ringkas) */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
      />

      {/* 3. Modal Lengkapi Profil Google (Jika akun Google baru) */}
      {pendingGoogleData && (
        <GoogleCompleteProfileModal
          isOpen={showGoogleProfileModal}
          onClose={() => setShowGoogleProfileModal(false)}
          idToken={pendingGoogleData.idToken}
          email={pendingGoogleData.email}
          initialName={pendingGoogleData.name}
          onSuccess={() => {
            setShowGoogleProfileModal(false);
            // Selesai mendaftar Google -> munculkan alert & arahkan ke halaman tujuan
            useAlertStore.getState().showAlert('Berhasil login!');
            navigate(from, { replace: true });
          }}
        />
      )}
    </>
  );
}
