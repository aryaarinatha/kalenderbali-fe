import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * ==============================================================================
 * TIPE DATA PENGGUNA (AuthUser)
 * ==============================================================================
 * Entitas data pengguna yang diselaraskan dengan respon resmi backend Go (userResponse).
 * Dilengkapi properti alias avatarUrl & username agar komponen Navbar yang sudah ada
 * dapat langsung merender foto/inisial tanpa perlu refactoring.
 */
export interface AuthUser {
  /** ID unik pengguna dari database PostgreSQL (disimpan sebagai string untuk keamanan presisi) */
  id: string;

  /** Nama lengkap pengguna */
  name: string;

  /** Alamat email resmi pengguna */
  email: string;

  /** Nomor telepon pengguna (opsional) */
  phone?: string;

  /** Peran hak akses (contoh: 'member', 'admin', 'contributor') */
  role: string;

  /** Status verifikasi email (true jika kode OTP 4-digit sudah diverifikasi) */
  isVerified?: boolean;

  /** URL foto avatar asli dari server backend */
  avatar?: string | null;

  /** Alias untuk avatar agar kompatibel dengan pembacaan Avatar di Navbar */
  avatarUrl?: string | null;

  /** Alias username untuk tampilan identitas ringkas (misal: @nama atau bagian depan email) */
  username?: string;

  /** Status pengajuan kontributor pura/konten ('pending', 'approved', 'rejected') */
  contributionStatus?: string | null;

  /** Status keanggotaan langganan premium */
  isPremium?: boolean;

  /** Tanggal masa kedaluwarsa akun premium */
  premiumExpiresAt?: string | null;

  /** Label tingkatan status pengguna untuk tampilan antarmuka (Admin | Premium | Free) */
  tier?: 'Admin' | 'Premium' | 'Free';
}

/**
 * ==============================================================================
 * STATE & ACTIONS GLOBAL AUTH STORE
 * ==============================================================================
 */
interface AuthState {
  /** Data akun pengguna aktif (null jika belum login / tamu) */
  user: AuthUser | null;

  /** Token JWT akses otentikasi (Access Token, masa berlaku 15 menit) */
  token: string | null;

  /** Token JWT perpanjangan sesi (Refresh Token, masa berlaku 30 hari) */
  refreshToken: string | null;

  /** Penanda boolean apakah pengguna sudah berhasil masuk */
  isAuthenticated: boolean;

  /**
   * Menyimpan sesi login pengguna baru beserta access token dan refresh token
   */
  login: (userData: AuthUser, token?: string, refreshToken?: string) => void;

  /**
   * Memperbarui token akses baru (digunakan saat terjadi rotasi token via /refresh)
   */
  setToken: (token: string, refreshToken?: string) => void;

  /**
   * Menghapus sesi pengguna (logout) dan membersihkan seluruh token lokal
   */
  logout: () => void;

  /**
   * Memperbarui sebagian data profil pengguna yang sedang aktif di memori
   */
  updateUser: (partialData: Partial<AuthUser>) => void;
}

/**
 * ==============================================================================
 * GLOBAL ZUSTAND STORE DENGAN PERSISTENSI TUNGGAL
 * ==============================================================================
 * Menggunakan middleware 'persist' Zustand ke localStorage dengan kunci 'kalenderbali_auth'.
 * Menghilangkan duplikasi penulisan manual 'localStorage.setItem' demi prinsip Single Source of Truth.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Keadaan awal aplikasi saat baru dibuka
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      // Handler Login: Menyimpan profil dan token ke memori & localStorage
      login: (userData: AuthUser, token?: string, refreshToken?: string) => {
        // Normalisasi data profil agar fallback avatarUrl dan username selalu terisi
        const normalizedUser: AuthUser = {
          ...userData,
          avatarUrl: userData.avatarUrl || userData.avatar || null,
          username: userData.username || (userData.email ? userData.email.split('@')[0] : userData.name),
        };

        set({
          user: normalizedUser,
          token: token || null,
          refreshToken: refreshToken || null,
          isAuthenticated: Boolean(token),
        });
      },

      // Handler Pembaruan Token: Memperbarui token akses baru dari response refresh
      setToken: (token: string, refreshToken?: string) => {
        set((state) => ({
          token,
          refreshToken: refreshToken || state.refreshToken,
          isAuthenticated: true,
        }));
      },

      // Handler Logout: Mengosongkan seluruh state autentikasi seketika
      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // Handler Pembaruan Profil: Memperbarui field profil tanpa menghilangkan field yang ada
      updateUser: (partialData: Partial<AuthUser>) => {
        set((state) => ({
          user: state.user
            ? {
                ...state.user,
                ...partialData,
                avatarUrl: partialData.avatarUrl || partialData.avatar || state.user.avatarUrl,
              }
            : null,
        }));
      },
    }),
    {
      name: 'kalenderbali_auth', // Kunci penyimpanan terpadu di browser localStorage
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
