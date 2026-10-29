import { apiClient } from '@/lib/axios';
import { useAuthStore, type AuthUser } from '@/stores/useAuthStore';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationResponse,
  ForgotPasswordResponse,
  VerifyResetCodeRequest,
  VerifyResetCodeResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  GoogleRegisterRequest,
  GoogleLinkRequest,
  UserProfileResponse,
  BackendUserProfile,
  UserSubscriptionResponse,
  UserSubscriptionData,
  UserTier,
} from '../types/auth.types';

/**
 * ==============================================================================
 * HELPER: MENGHITUNG TIER PENGGUNA UNTUK TAMPILAN ANTARMUKA (FRONTEND)
 * ==============================================================================
 * Aturan Pemetaan:
 * 1. Admin: Jika role backend adalah 'admin', tetap tampil sebagai 'Admin'.
 * 2. Premium: Jika memiliki transaksi yang masih aktif di tabel store_purchases
 *    (is_premium bernilai true dan masa berlaku belum kedaluwarsa).
 * 3. Free: Pengguna biasa (guest / member) tanpa paket premium atau yang sudah habis masa aktifnya.
 *
 * *Catatan Arsitektur: Role di database & backend tetap utuh (guest, member, admin).
 * Hanya label dan visualisasi antarmuka di frontend yang membedakan Free vs Premium.
 */
export function getUserTier(
  role?: string,
  isPremium?: boolean,
  premiumExpiresAt?: string | null
): UserTier {
  const normalizedRole = (role || '').trim().toLowerCase();
  if (normalizedRole === 'admin') {
    return 'Admin';
  }

  if (isPremium) {
    if (premiumExpiresAt) {
      const expDate = new Date(premiumExpiresAt);
      if (!isNaN(expDate.getTime()) && expDate <= new Date()) {
        return 'Free'; // Masa berlaku langganan sudah kedaluwarsa
      }
    }
    return 'Premium';
  }

  return 'Free';
}

/**
 * ==============================================================================
 * HELPER: NORMALISASI PROFIL PENGGUNA (Backend User + Subscription -> AuthUser)
 * ==============================================================================
 * Mengonversi format entitas profil dan data langganan tabel store_purchases
 * menjadi entitas yang siap dikonsumsi oleh store dan komponen antarmuka React.
 */
export function normalizeUserProfile(
  profile: BackendUserProfile,
  subscription?: UserSubscriptionData | null
): AuthUser {
  // Evaluasi keaktifan premium dari pengecekan tabel store_purchases
  const isPremium = Boolean(subscription?.is_premium ?? profile.is_premium);
  const premiumExpiresAt = subscription?.active_until ?? profile.premium_expires_at ?? null;

  // Hitung tier tampilan antarmuka (Admin | Premium | Free)
  const tier = getUserTier(profile.role, isPremium, premiumExpiresAt);

  return {
    id: String(profile.id),
    name: profile.name,
    email: profile.email,
    phone: profile.phone || '',
    role: profile.role || 'Member',
    tier,
    isVerified: profile.is_verified,
    avatar: profile.avatar || null,
    avatarUrl: profile.avatar || null,
    username: profile.email ? profile.email.split('@')[0] : profile.name,
    contributionStatus: profile.contribution_status || null,
    isPremium,
    premiumExpiresAt,
  };
}

/**
 * ==============================================================================
 * AUTH SERVICE: PUSAT PEMANGGILAN API AUTENTIKASI BACKEND GO
 * ==============================================================================
 */
export const authService = {
  /**
   * Mengirim kredensial login (email & kata sandi) ke backend
   * Endpoint: POST /api/v1/login
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/login', payload);
    return response.data;
  },

  /**
   * Mengambil data profil lengkap pengguna yang sedang aktif menggunakan Bearer Token
   * Endpoint: GET /api/v1/users/profile
   */
  async getProfile(customToken?: string): Promise<BackendUserProfile> {
    const headers = customToken ? { Authorization: `Bearer ${customToken}` } : undefined;
    const response = await apiClient.get<UserProfileResponse>('/users/profile', { headers });
    return response.data.data;
  },

  /**
   * Mengambil status langganan aktif pengguna langsung dari tabel store_purchases
   * Endpoint: GET /api/v1/purchases/my-active-product
   */
  async getMyActiveSubscription(customToken?: string): Promise<UserSubscriptionData | null> {
    try {
      const headers = customToken ? { Authorization: `Bearer ${customToken}` } : undefined;
      const response = await apiClient.get<UserSubscriptionResponse>('/purchases/my-active-product', { headers });
      return response.data?.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Helper Tingkat Tinggi: Mengonstruksi AuthUser lengkap dengan pengecekan store_purchases
   */
  async buildAuthUser(profile: BackendUserProfile, customToken?: string): Promise<AuthUser> {
    const sub = await this.getMyActiveSubscription(customToken);
    return normalizeUserProfile(profile, sub);
  },

  /**
   * Helper Tingkat Tinggi: Login sekaligus Ambil Profil & Cek Langganan store_purchases
   * Menyederhanakan penulisan kode di komponen antarmuka (LoginPage) agar tetap ringkas.
   */
  async loginAndFetchProfile(payload: LoginRequest): Promise<{
    user: AuthUser;
    token: string;
    refreshToken: string;
  }> {
    // 1. Dapatkan token dari endpoint login (POST /api/v1/login)
    const loginResult = await this.login(payload);
    const token = loginResult.access_token;

    // 2. Tarik data profil pengguna dan status langganan store_purchases secara paralel
    let user: AuthUser;
    try {
      const [profileResult, subResult] = await Promise.allSettled([
        this.getProfile(token),
        this.getMyActiveSubscription(token),
      ]);

      if (profileResult.status === 'fulfilled') {
        const sub = subResult.status === 'fulfilled' ? subResult.value : null;
        user = normalizeUserProfile(profileResult.value, sub);
      } else {
        throw profileResult.reason;
      }
    } catch (profileErr) {
      console.warn('Gagal memuat profil /users/profile, menggunakan fallback profil sesi:', profileErr);
      const nickname = payload.email.split('@')[0];
      user = {
        id: '1',
        name: nickname,
        email: payload.email,
        role: 'Member',
        tier: 'Free',
        username: nickname,
        isVerified: true,
        isPremium: false,
      };
    }

    return {
      user,
      token: loginResult.access_token,
      refreshToken: loginResult.refresh_token,
    };
  },

  /**
   * Sinkronisasi data langganan pengguna yang sedang login saat aplikasi berjalan.
   * Jika status transaksi di store_purchases berubah atau kedaluwarsa, store diperbarui otomatis.
   */
  async syncUserSubscription(): Promise<AuthUser | null> {
    const currentState = useAuthStore.getState();
    if (!currentState.isAuthenticated || !currentState.user) {
      return null;
    }

    try {
      const sub = await this.getMyActiveSubscription(currentState.token || undefined);
      if (!sub) return currentState.user;

      const isPremium = Boolean(sub.is_premium);
      const premiumExpiresAt = sub.active_until ?? null;
      const tier = getUserTier(currentState.user.role, isPremium, premiumExpiresAt);

      const updatedUser: AuthUser = {
        ...currentState.user,
        isPremium,
        premiumExpiresAt,
        tier,
      };

      currentState.updateUser(updatedUser);
      return updatedUser;
    } catch {
      return currentState.user;
    }
  },

  /**
   * Mendaftarkan pengguna baru ke database backend
   * Endpoint: POST /api/v1/register
   * Backend akan otomatis mengirimkan kode verifikasi 4-digit ke email via Brevo SMTP
   */
  async register(payload: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/register', payload);
    return response.data;
  },

  /**
   * Memverifikasi alamat email menggunakan kode 4-digit numerik yang dikirim via email
   * Endpoint: POST /api/v1/verify-email
   */
  async verifyEmail(payload: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await apiClient.post<VerifyEmailResponse>('/verify-email', payload);
    return response.data;
  },

  /**
   * Meminta pengiriman ulang kode verifikasi email jika kode sebelumnya kedaluwarsa
   * Endpoint: POST /api/v1/resend-verification (Jeda cooldown 60 detik)
   */
  async resendVerification(email: string): Promise<ResendVerificationResponse> {
    const response = await apiClient.post<ResendVerificationResponse>('/resend-verification', { email });
    return response.data;
  },

  /**
   * Lupa Password Langkah 1: Meminta pengiriman kode reset ke email
   * Endpoint: POST /api/v1/forgot-password
   */
  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/forgot-password', { email });
    return response.data;
  },

  /**
   * Lupa Password Langkah 2: Memverifikasi kode 4-digit reset untuk mendapatkan reset_grant
   * Endpoint: POST /api/v1/verify-reset-code
   */
  async verifyResetCode(payload: VerifyResetCodeRequest): Promise<VerifyResetCodeResponse> {
    const response = await apiClient.post<VerifyResetCodeResponse>('/verify-reset-code', payload);
    return response.data;
  },

  /**
   * Lupa Password Langkah 3: Mengubah kata sandi baru menggunakan reset_grant
   * Endpoint: POST /api/v1/reset-password
   */
  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/reset-password', payload);
    return response.data;
  },

  /**
   * Autentikasi Google: Mengirimkan ID Token dari Google Identity Services
   * Endpoint: POST /api/v1/auth/google
   */
  async googleLogin(idToken: string): Promise<GoogleLoginResponse> {
    const payload: GoogleLoginRequest = { id_token: idToken };
    const response = await apiClient.post<GoogleLoginResponse>('/auth/google', payload);
    return response.data;
  },

  /**
   * Pendaftaran akun Google baru yang belum lengkap (profil & password)
   * Endpoint: POST /api/v1/auth/google/register
   */
  async googleRegister(payload: GoogleRegisterRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/google/register', payload);
    return response.data;
  },

  /**
   * Menautkan akun Google ke akun lokal yang sudah ada
   * Endpoint: POST /api/v1/auth/google/link
   */
  async googleLink(payload: GoogleLinkRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/google/link', payload);
    return response.data;
  },

  /**
   * Menghapus sesi masuk di backend dan membersihkan penyimpanan state lokal
   * Endpoint: POST /api/v1/logout
   */
  async logout(): Promise<void> {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await apiClient.post('/logout', { refresh_token: refreshToken });
      }
    } catch (err) {
      // Sesuai kontrak: logout di sisi klien tetap wajib dilakukan walaupun request jaringan gagal
      console.warn('Network logout failed, clearing local session anyway:', err);
    } finally {
      useAuthStore.getState().logout();
    }
  },
};
