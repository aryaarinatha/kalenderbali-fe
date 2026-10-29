import { useState, useEffect } from 'react';
import { KeyRound, X, AlertCircle, CheckCircle2, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/authService';

/**
 * ==============================================================================
 * PROPS: KOMPONEN MODAL LUPA KATA SANDI (ForgotPasswordModal)
 * ==============================================================================
 */
interface ForgotPasswordModalProps {
  /** Status keterbukaan modal dialog */
  isOpen: boolean;

  /** Fungsi callback untuk menutup modal */
  onClose: () => void;

  /** Nilai email default awal dari input login (jika sudah diketikkan sebelumnya) */
  initialEmail?: string;
}

/**
 * ==============================================================================
 * KOMPONEN: ForgotPasswordModal (3 LANGKAH RINGKAS)
 * ==============================================================================
 * Alur reset kata sandi sesuai kontrak backend Go (frontend-auth-contract.md):
 * 1. Langkah 1: Meminta kode reset ke email (POST /forgot-password)
 * 2. Langkah 2: Memverifikasi kode 4-digit numerik (POST /verify-reset-code) -> mendapat reset_grant
 * 3. Langkah 3: Menginput kata sandi baru (POST /reset-password) menggunakan reset_grant
 */
export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  // Step aktif: 1 = Input Email, 2 = Input Kode 4-Digit, 3 = Input Password Baru, 4 = Sukses
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetGrant, setResetGrant] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Inisialisasi email saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep(1);
      setCode('');
      setResetGrant('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMessage(null);
    }
  }, [isOpen, initialEmail]);

  // Listener tombol Escape untuk menutup dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Langkah 1: Kirim Kode Reset ke Email
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Harap masukkan alamat email Anda.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.forgotPassword(email.trim());
      setStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirimkan kode reset. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 2: Verifikasi Kode 4-Digit OTP
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 4) {
      setErrorMessage('Harap masukkan 4 digit kode numerik.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.verifyResetCode({
        email: email.trim(),
        code: code.trim(),
      });
      setResetGrant(res.reset_grant);
      setStep(3);
    } catch (err: any) {
      const remaining = err.remainingAttempts;
      if (remaining !== undefined) {
        setErrorMessage(`Kode salah. Sisa kesempatan mencoba: ${remaining} kali.`);
      } else {
        setErrorMessage(err.message || 'Kode verifikasi tidak valid atau telah kedaluwarsa.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Langkah 3: Simpan Kata Sandi Baru
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      await authService.resetPassword({
        email: email.trim(),
        reset_grant: resetGrant,
        new_password: newPassword,
      });
      setStep(4);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mereset kata sandi. Silakan ulangi langkah.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Dialog */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
                Lupa Kata Sandi
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {step === 1 && 'Langkah 1: Masukkan email akun Anda'}
                {step === 2 && 'Langkah 2: Masukkan kode verifikasi 4-digit'}
                {step === 3 && 'Langkah 3: Tentukan kata sandi baru'}
                {step === 4 && 'Kata sandi berhasil diperbarui'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Formulir */}
        <div className="p-5 sm:p-6 space-y-4">
          {/* Banner Pesan Error */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* STEP 1: INPUT ALAMAT EMAIL                                       */}
          {/* ================================================================ */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Masukkan alamat email yang terdaftar pada akun Anda. Kami akan mengirimkan 4-digit kode reset sandi ke email Anda.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  autoFocus
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengirim Kode...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Kode Reset</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* STEP 2: INPUT KODE VERIFIKASI 4-DIGIT                            */}
          {/* ================================================================ */}
          {step === 2 && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kode 4-digit telah dikirim ke <span className="font-bold text-[#0f172a]">{email}</span>. Silakan masukkan di bawah ini:
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  KODE VERIFIKASI (4 DIGIT)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={4}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#f8fafc] text-center text-2xl font-extrabold tracking-[0.5em] text-[#0f172a] tabular-nums placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || code.length !== 4}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Verifikasi Kode</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* STEP 3: INPUT KATA SANDI BARU                                    */}
          {/* ================================================================ */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Kode berhasil diverifikasi. Masukkan kata sandi baru untuk akun Anda.
              </p>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  KATA SANDI BARU
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full h-11 pl-4 pr-11 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                  KONFIRMASI KATA SANDI BARU
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan Sandi...</span>
                  </>
                ) : (
                  <span>Simpan Kata Sandi Baru</span>
                )}
              </button>
            </form>
          )}

          {/* ================================================================ */}
          {/* STEP 4: BERHASIL DIRESET                                         */}
          {/* ================================================================ */}
          {step === 4 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#0f172a]">
                  Kata Sandi Berhasil Diperbarui!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Silakan masuk kembali menggunakan alamat email dan kata sandi baru Anda.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] text-white font-bold text-sm shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
              >
                <span>Kembali ke Halaman Login</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
