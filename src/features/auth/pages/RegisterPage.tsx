import { useState } from 'react';
import { NavLink, useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import AuthCardLayout from '../components/AuthCardLayout';
import GoogleAuthButton from '../components/GoogleAuthButton';
import EmailVerificationModal from '../components/EmailVerificationModal';
import GoogleCompleteProfileModal from '../components/GoogleCompleteProfileModal';
import { authService } from '../services/authService';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * HALAMAN: RegisterPage (Pendaftaran Akun Baru)
 * ==============================================================================
 * Mengimplementasikan desain sesuai Gambar 2 Mockup Pengguna:
 * - Kartu putih terpusat "Selamat Datang !" & "Dapatkan akunmu disini."
 * - Opsi Daftar dengan Google di bagian atas form
 * - Input 5 Kolom: Nama, Email, No. Telepon, Password, Konfirmasi Password
 * - Tombol "Register" di kanan bawah (Warna Teal #0e9f90)
 * - Tautan navigasi bawah: "Sudah punya akun ? Login"
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Jika sudah terotentikasi, otomatis alihkan ke halaman utama
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // State Formulir Registrasi (Sesuai Gambar 2)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Modal Verifikasi Email & Modal Google
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [showGoogleProfileModal, setShowGoogleProfileModal] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<{
    idToken: string;
    email: string;
    name: string;
  } | null>(null);

  // ============================================================================
  // HANDLER: SUBMIT REGISTRASI AKUN MANUAL
  // ============================================================================
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi esensial sisi klien
    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage('Harap lengkapi semua kolom wajib (Nama, Email, dan Password).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Panggil endpoint backend POST /api/v1/register
      await authService.register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        password,
      });

      // Simpan email terdaftar dan buka modal verifikasi kode 4-digit OTP
      setRegisteredEmail(email.trim());
      useAlertStore.getState().showAlert('Berhasil register!');
      setShowVerifyModal(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Pendaftaran gagal. Silakan periksa kembali data Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // HANDLER: AUTENTIKASI GOOGLE SIGN-UP
  // ============================================================================
  const handleGoogleSuccess = async (idToken: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await authService.googleLogin(idToken);

      // Jika akun sudah pernah ada & authenticated
      if (res.status === 'authenticated' && res.access_token) {
        const profile = await authService.getProfile(res.access_token);
        const user = await authService.buildAuthUser(profile, res.access_token);
        useAuthStore.getState().login(user, res.access_token, res.refresh_token);
        useAlertStore.getState().showAlert('Berhasil login!');
        navigate('/', { replace: true });
        return;
      }

      // Jika akun baru -> lengkapi nomor telepon dan password
      if (res.status === 'profile_required') {
        setPendingGoogleData({
          idToken,
          email: res.email || '',
          name: res.name || name || '',
        });
        setShowGoogleProfileModal(true);
        return;
      }

      if (res.status === 'link_required') {
        const linkRes = await authService.googleLink({ id_token: idToken });
        if (linkRes.access_token) {
          const profile = await authService.getProfile(linkRes.access_token);
          const user = await authService.buildAuthUser(profile, linkRes.access_token);
          useAuthStore.getState().login(user, linkRes.access_token, linkRes.refresh_token);
          useAlertStore.getState().showAlert('Berhasil login!');
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mendaftar dengan akun Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AuthCardLayout
        title="Selamat Datang !"
        subtitle="Dapatkan akunmu disini."
        footer={
          /* Link Bawah Luar Kartu: Sudah Punya Akun */
          <div>
            <span>Sudah punya akun ? </span>
            <NavLink
              to="/login"
              className="text-[#0d9488] hover:text-[#0f766e] font-semibold hover:underline transition-colors"
            >
              Login
            </NavLink>
          </div>
        }
      >
        {/* Tombol Opsi Daftar dengan Google */}
        {/* Banner Pesan Error */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
        )}

        {/* Formulir Registrasi 5 Kolom (Metode Email Utama Sesuai Gambar 2) */}
        <form onSubmit={handleRegister} className="space-y-3.5">
          {/* 1. Nama */}
          <div className="space-y-1">
            <label
              htmlFor="register-name"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Nama
            </label>
            <input
              id="register-name"
              type="text"
              required
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* 2. Email */}
          <div className="space-y-1">
            <label
              htmlFor="register-email"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Email
            </label>
            <input
              id="register-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* 3. No. Telepon */}
          <div className="space-y-1">
            <label
              htmlFor="register-phone"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              No. Telepon
            </label>
            <input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masukkan nomor telepon"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* 4. Password */}
          <div className="space-y-1">
            <label
              htmlFor="register-password"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
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

          {/* 5. Konfirmasi Password */}
          <div className="space-y-1">
            <label
              htmlFor="register-confirm-password"
              className="text-xs sm:text-sm font-semibold text-[#0f172a] block"
            >
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                id="register-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Masukkan konfirmasi password"
                className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer [touch-action:manipulation]"
                aria-label={showConfirmPassword ? 'Sembunyikan konfirmasi password' : 'Lihat konfirmasi password'}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Baris Tombol Register di Kanan Bawah Sesuai Gambar 2 */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={isLoading}
              className="h-11 px-7 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mendaftar...</span>
                </>
              ) : (
                <span>Register</span>
              )}
            </button>
          </div>
        </form>

        {/* Tombol Opsi Daftar dengan Google (di bawah form email) */}
        <GoogleAuthButton
          mode="register"
          onSuccess={handleGoogleSuccess}
          onError={(err) => setErrorMessage(err.message)}
          disabled={isLoading}
        />
      </AuthCardLayout>

      {/* ==================================================================== */}
      {/* MODAL-MODAL INTERAKTIF                                              */}
      {/* ==================================================================== */}

      {/* 1. Modal Verifikasi Email 4-Digit Setelah Pendaftaran Berhasil */}
      <EmailVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        email={registeredEmail}
        onVerified={() => {
          setShowVerifyModal(false);
          // Setelah verifikasi berhasil, arahkan ke halaman Login
          navigate('/login', { replace: true });
        }}
      />

      {/* 2. Modal Lengkapi Profil Google (Jika Akun Google Baru) */}
      {pendingGoogleData && (
        <GoogleCompleteProfileModal
          isOpen={showGoogleProfileModal}
          onClose={() => setShowGoogleProfileModal(false)}
          idToken={pendingGoogleData.idToken}
          email={pendingGoogleData.email}
          initialName={pendingGoogleData.name}
          onSuccess={() => {
            setShowGoogleProfileModal(false);
            useAlertStore.getState().showAlert('Berhasil register!');
            navigate('/', { replace: true });
          }}
        />
      )}
    </>
  );
}
