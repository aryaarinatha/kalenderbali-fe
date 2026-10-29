import { useState, useEffect } from 'react';
import { Mail, X, AlertCircle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * PROPS: KOMPONEN MODAL VERIFIKASI EMAIL (EmailVerificationModal)
 * ==============================================================================
 */
interface EmailVerificationModalProps {
  /** Status keterbukaan modal pop-up */
  isOpen: boolean;

  /** Fungsi callback untuk menutup modal */
  onClose: () => void;

  /** Alamat email tujuan pengiriman kode OTP 4-digit */
  email: string;

  /** Callback yang dipicu ketika verifikasi berhasil */
  onVerified: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: EmailVerificationModal
 * ==============================================================================
 * Pop-up dialog verifikasi kode OTP 4-digit sesuai standar modal AGENTS.md:
 * - Backdrop blur z-[100]
 * - Input kode 4 digit tabular-nums dengan penataan huruf terpisah
 * - Tombol kirim ulang dengan penghitung mundur (cooldown) 60 detik
 */
export default function EmailVerificationModal({
  isOpen,
  onClose,
  email,
  onVerified,
}: EmailVerificationModalProps) {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Timer hitung mundur 60 detik untuk tombol kirim ulang kode
  useEffect(() => {
    if (!isOpen) return;

    setCooldown(60);
    setCanResend(false);

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, email]);

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

  // Handler pengiriman verifikasi kode 4-digit ke backend Go
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 4) {
      setErrorMessage('Harap masukkan 4 digit kode angka yang lengkap.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.verifyEmail({
        email,
        code: code.trim(),
      });

      setSuccessMessage('Email berhasil diverifikasi!');
      useAlertStore.getState().showAlert('Berhasil register!');
      setTimeout(() => {
        onVerified();
      }, 1000);
    } catch (err: any) {
      const remaining = err.remainingAttempts;
      if (remaining !== undefined) {
        setErrorMessage(`Kode salah. Sisa kesempatan mencoba: ${remaining} kali.`);
      } else {
        setErrorMessage(err.message || 'Verifikasi gagal. Pastikan kode benar.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handler kirim ulang kode OTP
  const handleResend = async () => {
    if (!canResend) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await authService.resendVerification(email);
      setSuccessMessage('Kode verifikasi baru telah dikirimkan ke email Anda.');
      setCooldown(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim ulang kode. Silakan coba lagi.');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Wadah Modal Dialog (Standar AGENTS.md: rounded-2xl, border-slate-200, shadow-2xl) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
                Verifikasi Email
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Satu langkah lagi untuk mengaktifkan akun Anda
              </p>
            </div>
          </div>

          {/* Tombol Tutup X */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation]"
            aria-label="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Isi Modal Form */}
        <form onSubmit={handleVerify} className="p-5 sm:p-6 space-y-4">
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Kode verifikasi 4-digit telah dikirimkan ke alamat email:{' '}
            <span className="font-bold text-[#0f172a] block mt-0.5">{email}</span>
          </p>

          {/* Banner Pesan Error */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Banner Pesan Sukses */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Input Kode OTP 4 Digit Terpusat */}
          <div className="space-y-1.5">
            <label
              htmlFor="otp-code"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block"
            >
              KODE VERIFIKASI (4 DIGIT)
            </label>
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              autoFocus
              className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-[#f8fafc] text-center text-2xl font-extrabold tracking-[0.5em] text-[#0f172a] tabular-nums placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* Tombol Aksi Verifikasi (Primary Teal Tirta Bali) */}
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
                <span>Verifikasi Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Baris Tombol Kirim Ulang Kode */}
          <div className="text-center pt-2">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="text-xs font-bold text-[#0d9488] hover:text-[#0f766e] hover:underline cursor-pointer [touch-action:manipulation]"
              >
                Kirim Ulang Kode Verifikasi
              </button>
            ) : (
              <p className="text-xs text-slate-400 font-medium">
                Kirim ulang kode dalam <span className="font-bold text-slate-600 tabular-nums">{cooldown} detik</span>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
