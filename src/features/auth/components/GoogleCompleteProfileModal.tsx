import { useState, useEffect } from 'react';
import { UserCheck, X, AlertCircle, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';

/**
 * ==============================================================================
 * PROPS: KOMPONEN MODAL LENGKAPI PROFIL GOOGLE (GoogleCompleteProfileModal)
 * ==============================================================================
 */
interface GoogleCompleteProfileModalProps {
  /** Status keterbukaan modal dialog */
  isOpen: boolean;

  /** Fungsi callback untuk menutup modal */
  onClose: () => void;

  /** Token ID Google yang sedang aktif */
  idToken: string;

  /** Alamat email dari Google */
  email: string;

  /** Nama pendaftar dari Google */
  initialName: string;

  /** Callback yang dipanggil saat pendaftaran Google berhasil diselesaikan */
  onSuccess: () => void;
}

/**
 * ==============================================================================
 * KOMPONEN: GoogleCompleteProfileModal
 * ==============================================================================
 * Modal pelengkap pendaftaran akun pengguna baru via Google OAuth 2.0.
 * Dipicu ketika backend Go mengembalikan status "profile_required".
 * Meminta pengguna melengkapi nomor telepon dan kata sandi lokal akun.
 */
export default function GoogleCompleteProfileModal({
  isOpen,
  onClose,
  idToken,
  email,
  initialName,
  onSuccess,
}: GoogleCompleteProfileModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setPhone('');
      setPassword('');
      setErrorMessage(null);
    }
  }, [isOpen, initialName]);

  // Listener tombol Escape
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

  // Handler submit registrasi akun Google ke backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authService.googleRegister({
        id_token: idToken,
        name: name.trim(),
        phone: phone.trim(),
        password,
      });

      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal melengkapi profil. Silakan coba lagi.');
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
        {/* Header Modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
                Lengkapi Profil Anda
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Akun Google Anda siap dihubungkan ke Kalender Bali
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

        {/* Form Isi Data */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-3.5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* Email (Readonly dari Google) */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              EMAIL GOOGLE
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-100/70 text-sm font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Nama Lengkap */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              NAMA LENGKAP
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* Nomor Telepon */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              NO. TELEPON
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Masukkan nomor telepon"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* Kata Sandi Akun */}
          <div className="space-y-1">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
              BUAT KATA SANDI AKUN
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Kata sandi ini dapat Anda gunakan untuk login manual jika tidak menggunakan Google.
            </p>
          </div>

          {/* Tombol Simpan */}
          <button
            type="submit"
            disabled={isLoading || !name || !password}
            className="w-full h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50 mt-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Akun...</span>
              </>
            ) : (
              <span>Selesaikan Pendaftaran</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
