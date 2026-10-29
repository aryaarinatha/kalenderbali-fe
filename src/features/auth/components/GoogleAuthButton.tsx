import { useEffect, useRef, useState } from 'react';
import type { GoogleCredentialResponse } from '@/types/google';

/**
 * ==============================================================================
 * PROPS: KOMPONEN TOMBOL AUTENTIKASI GOOGLE (GoogleAuthButton)
 * ==============================================================================
 */
interface GoogleAuthButtonProps {
  /** Mode tampilan: 'login' untuk Masuk, 'register' untuk Daftar */
  mode?: 'login' | 'register';

  /** Callback yang menerima ID Token dari Google setelah user sukses memilih akun */
  onSuccess: (idToken: string) => void;

  /** Callback opsional jika terjadi kegagalan pemuatan SDK */
  onError?: (error: Error) => void;

  /** Status penonaktifan tombol (misal saat sedang proses loading) */
  disabled?: boolean;
}

/**
 * ==============================================================================
 * KOMPONEN: GoogleAuthButton
 * ==============================================================================
 * Tombol resmi Google Sign-In yang terintegrasi dengan Google Identity Services (GIS).
 * Menerapkan pola Hybrid Overlay:
 * 1. Di lapisan visual bawah: Tombol bergaya AGENTS.md dengan ikon SVG resmi Google 4-warna.
 * 2. Di lapisan atas: Iframe resmi Google GIS dibuat transparan (opacity-0) agar klik pengguna
 *    langsung mengeksekusi jendela pop-up Google secara native tanpa terblokir popup blocker browser.
 */
export default function GoogleAuthButton({
  mode = 'login',
  onSuccess,
  onError,
  disabled = false,
}: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGisReady, setIsGisReady] = useState(false);

  // Gunakan ref agar perubahan fungsi onSuccess/onError dari parent tidak memicu re-render / re-inisialisasi tombol secara berulang saat user mengetik
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '428051604402-8gje2pbohauj79pgc48hhbi0je6pg3gh.apps.googleusercontent.com';

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    // Fungsi inisialisasi Google Identity Services ke elemen container
    const initGoogleSignIn = () => {
      if (typeof window === 'undefined' || !window.google?.accounts?.id) {
        return false;
      }

      try {
        // Inisialisasi konfigurasi klien Google
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            if (response.credential) {
              onSuccessRef.current(response.credential);
            } else {
              onErrorRef.current?.(new Error('Kredensial Google tidak ditemukan'));
            }
          },
        });

        // Render tombol Google ke dalam wadah DOM
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          window.google.accounts.id.renderButton(containerRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: mode === 'register' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            width: '380',
          });
          setIsGisReady(true);
        }
        return true;
      } catch (err) {
        console.error('Inisialisasi Google Identity Services gagal:', err);
        onErrorRef.current?.(err instanceof Error ? err : new Error('Inisialisasi Google gagal'));
        return false;
      }
    };

    // Coba inisialisasi langsung jika script GIS sudah selesai dimuat di index.html
    if (!initGoogleSignIn()) {
      // Jika script GIS masih proses unduh, lakukan polling berkala setiap 200ms
      intervalId = setInterval(() => {
        if (initGoogleSignIn()) {
          clearInterval(intervalId);
        }
      }, 200);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [clientId, mode]);

  const buttonLabel = mode === 'register' ? 'Daftar dengan Google' : 'Masuk dengan Google';

  const handleCustomButtonClick = () => {
    if (!isGisReady) {
      console.warn(
        '[GoogleAuth] Tombol Google belum siap atau diblokir browser. Pastikan Brave Shields dinonaktifkan untuk localhost atau periksa konfigurasi Client ID di .env.'
      );
    }
  };

  return (
    <div className="w-full">
      {/* ==================================================================== */}
      {/* GARIS PEMBATAS HALUS (Divider: "atau masuk/daftar dengan")           */}
      {/* ==================================================================== */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider select-none">
          {mode === 'register' ? 'atau daftar dengan' : 'atau masuk dengan'}
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* ==================================================================== */}
      {/* WADAH TOMBOL GOOGLE INTERAKTIF                                      */}
      {/* ==================================================================== */}
      <div className="relative w-full overflow-hidden rounded-xl">
        {/* Lapisan Visual Standar Desain Sistem Kalender Bali */}
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={disabled}
          className={`w-full h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-3 [touch-action:manipulation] shadow-2xs ${
            disabled ? 'opacity-60 cursor-not-allowed' : ''
          }`}
          aria-label={buttonLabel}
        >
          {/* Ikon Vektor Resmi Google (4 Warna) */}
          <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{buttonLabel}</span>
        </button>

        {/* Lapisan Iframe GIS Transparan di Atasnya untuk Memicu Popup Resmi */}
        <div
          ref={containerRef}
          className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer overflow-hidden z-10 flex items-center justify-center ${
            disabled || !isGisReady ? 'pointer-events-none' : ''
          }`}
          title={buttonLabel}
        />
      </div>
    </div>
  );
}
