/**
 * ==============================================================================
 * TYPE DEFINITIONS: GOOGLE IDENTITY SERVICES (GIS)
 * ==============================================================================
 * Deklarasi tipe global untuk objek 'window.google.accounts.id'
 * agar dikenali oleh compiler TypeScript tanpa error tipe tak dikenal.
 */

export interface GoogleCredentialResponse {
  /**
   * Token ID JWT yang dikembalikan oleh server Google setelah user sukses login.
   * Token ini yang dikirim ke backend Go endpoint POST /api/v1/auth/google
   */
  credential: string;

  /**
   * Metode autentikasi yang digunakan, misal: 'credential', 'user_cancel', dsb.
   */
  select_by?: string;
}

export interface GoogleIdConfiguration {
  /**
   * OAuth 2.0 Client ID dari Google Cloud Console
   */
  client_id: string;

  /**
   * Fungsi callback yang dipanggil saat user berhasil login dan menerima ID Token
   */
  callback: (response: GoogleCredentialResponse) => void;

  /**
   * Opsional: Batalkan otomatis jika user menutup pop-up
   */
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

export interface GoogleRenderButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number | string;
  locale?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          /**
           * Inisialisasi konfigurasi klien Google Identity Services
           */
          initialize: (config: GoogleIdConfiguration) => void;

          /**
           * Render tombol resmi Google ke dalam elemen DOM container
           */
          renderButton: (
            parent: HTMLElement,
            options: GoogleRenderButtonOptions,
            clickHandler?: () => void
          ) => void;

          /**
           * Tampilkan prompt Google One-Tap
           */
          prompt: (momentListener?: (notification: unknown) => void) => void;

          /**
           * Batalkan sesi One-Tap yang sedang berjalan
           */
          cancel: () => void;
        };
      };
    };
  }
}
