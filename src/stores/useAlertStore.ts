import { create } from 'zustand';

/**
 * ==============================================================================
 * STATE GLOBAL UNTUK POPUP ALERT / TOAST SUKSES
 * ==============================================================================
 * Mengatur tampilan popover notifikasi sukses mengambang (floating alert)
 * yang muncul saat login, logout, maupun registrasi berhasil.
 */
export interface AlertState {
  /** Status apakah alert sedang terbuka/tampil di layar */
  isOpen: boolean;

  /** Teks pesan yang ditampilkan (contoh: "Berhasil login!", "Berhasil logout!") */
  message: string;

  /**
   * Menampilkan alert sukses dengan durasi otomatis (default 2500ms)
   */
  showAlert: (message: string, duration?: number) => void;

  /**
   * Menutup alert seketika
   */
  hideAlert: () => void;
}

// Timer ID untuk auto-dismiss alert
let alertTimer: ReturnType<typeof setTimeout> | null = null;

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  message: '',

  showAlert: (message: string, duration = 2500) => {
    // Bersihkan timer sebelumnya jika alert dipanggil berurutan
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }

    set({ isOpen: true, message });

    // Otomatis sembunyikan alert setelah durasi berakhir
    alertTimer = setTimeout(() => {
      set({ isOpen: false });
      alertTimer = null;
    }, duration);
  },

  hideAlert: () => {
    if (alertTimer) {
      clearTimeout(alertTimer);
      alertTimer = null;
    }
    set({ isOpen: false });
  },
}));
