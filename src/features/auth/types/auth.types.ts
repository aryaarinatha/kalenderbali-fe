/**
 * ==============================================================================
 * KONTRAK TIPE DATA AUTENTIKASI (KALENDER BALI DIGITAL)
 * ==============================================================================
 * Berkas ini mendefinisikan seluruh tipe data request dan response API otentikasi
 * yang diselaraskan secara presisi dengan spesifikasi kontrak backend Go
 * (frontend-auth-contract.md dan handler/dto.go).
 */

// ==============================================================================
// 1. LOGIN DENGAN EMAIL & PASSWORD
// ==============================================================================

/**
 * Payload pengiriman untuk endpoint POST /api/v1/login
 */
export interface LoginRequest {
  /** Alamat email akun yang telah terdaftar */
  email: string;

  /** Kata sandi akun */
  password: string;
}

/**
 * Respon sukses dari endpoint POST /api/v1/login
 */
export interface LoginResponse {
  /** Pesan konfirmasi dari server (contoh: "Login successful") */
  message: string;

  /** Access Token JWT untuk otorisasi Bearer di header HTTP (berlaku 15 menit) */
  access_token: string;

  /** Refresh Token JWT untuk memperbarui sesi di endpoint POST /refresh */
  refresh_token: string;

  /** Durasi masa berlaku token dalam detik (900 detik / 15 menit) */
  expires_in: number;
}

// ==============================================================================
// 2. PENDAFTARAN AKUN BARU (REGISTER)
// ==============================================================================

/**
 * Payload pengiriman untuk endpoint POST /api/v1/register
 */
export interface RegisterRequest {
  /** Nama lengkap pendaftar */
  name: string;

  /** Alamat email unik pendaftar */
  email: string;

  /** Nomor telepon seluler pendaftar (opsional) */
  phone?: string;

  /** Kata sandi akun yang diinginkan */
  password: string;
}

/**
 * Respon dari endpoint POST /api/v1/register
 */
export interface RegisterResponse {
  /** Pesan status pendaftaran */
  message: string;

  /** Status boolean apakah email verifikasi berhasil dikirimkan via Brevo SMTP */
  email_sent: boolean;
}

// ==============================================================================
// 3. VERIFIKASI EMAIL KODE OTP 4-DIGIT
// ==============================================================================

/**
 * Payload pengiriman untuk endpoint POST /api/v1/verify-email
 */
export interface VerifyEmailRequest {
  /** Alamat email yang akan diverifikasi */
  email: string;

  /** Kode verifikasi 4-digit numerik ASCII yang diterima di kotak masuk email */
  code: string;
}

/**
 * Respon sukses dari endpoint POST /api/v1/verify-email
 */
export interface VerifyEmailResponse {
  message: string;
}

/**
 * Payload permintaan kirim ulang kode OTP untuk endpoint POST /api/v1/resend-verification
 */
export interface ResendVerificationRequest {
  /** Alamat email yang meminta kode verifikasi baru */
  email: string;
}

/**
 * Respon dari endpoint POST /api/v1/resend-verification
 */
export interface ResendVerificationResponse {
  message: string;
}

// ==============================================================================
// 4. ALUR LUPA KATA SANDI (3 LANGKAH)
// ==============================================================================

/**
 * Langkah 1: Payload pengiriman untuk endpoint POST /api/v1/forgot-password
 */
export interface ForgotPasswordRequest {
  /** Alamat email yang terdaftar untuk menerima kode reset */
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Langkah 2: Payload pengiriman untuk endpoint POST /api/v1/verify-reset-code
 */
export interface VerifyResetCodeRequest {
  /** Alamat email yang mereset password */
  email: string;

  /** Kode 4-digit numerik yang dikirim ke email */
  code: string;
}

/**
 * Respon langkah 2 yang mengembalikan grant token sementara
 */
export interface VerifyResetCodeResponse {
  /** Token izin reset sekali pakai (berlaku 10 menit) */
  reset_grant: string;

  /** Masa berlaku grant dalam detik (600 detik) */
  expires_in: number;
}

/**
 * Langkah 3: Payload pengiriman untuk endpoint POST /api/v1/reset-password
 */
export interface ResetPasswordRequest {
  /** Alamat email akun */
  email: string;

  /** Grant token yang diperoleh dari langkah verifikasi kode */
  reset_grant: string;

  /** Kata sandi baru yang diinginkan */
  new_password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

// ==============================================================================
// 5. AUTENTIKASI GOOGLE OAUTH 2.0
// ==============================================================================

/**
 * Payload login/daftar Google untuk endpoint POST /api/v1/auth/google
 */
export interface GoogleLoginRequest {
  /** ID Token JWT yang diterbitkan oleh Google Identity Services (GIS) */
  id_token: string;
}

/**
 * Respon dari endpoint POST /api/v1/auth/google
 * Backend mengembalikan salah satu dari 3 kemungkinan status:
 * 1. 'authenticated'   : User langsung login
 * 2. 'profile_required': User baru, wajib melengkapi data via /auth/google/register
 * 3. 'link_required'   : Email terdaftar lokal, butuh konfirmasi via /auth/google/link
 */
export interface GoogleLoginResponse {
  /** Status identifikasi akun Google */
  status: 'authenticated' | 'profile_required' | 'link_required';

  message?: string;

  /** Token sesi (tersedia jika status === 'authenticated') */
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;

  /** Data profil dari Google (tersedia jika status === 'profile_required' atau 'link_required') */
  email?: string;
  name?: string;

  /** Penanda apakah pengguna wajib memasukkan kata sandi saat menautkan akun */
  requires_new_password?: boolean;
}

/**
 * Payload melengkapi profil Google user baru untuk endpoint POST /api/v1/auth/google/register
 */
export interface GoogleRegisterRequest {
  /** ID Token Google */
  id_token: string;

  /** Nama pendaftar (opsional diubah dari nama bawaan Google) */
  name?: string;

  /** Nomor telepon seluler */
  phone?: string;

  /** Kata sandi baru akun */
  password: string;
}

/**
 * Payload konfirmasi penautan akun untuk endpoint POST /api/v1/auth/google/link
 */
export interface GoogleLinkRequest {
  /** ID Token Google */
  id_token: string;

  /** Kata sandi baru jika akun sebelumnya belum memiliki password lokal */
  new_password?: string;
}

// ==============================================================================
// 6. ENTITAS PROFIL PENGGUNA (GET /api/v1/profile)
// ==============================================================================

/**
 * Struktur objek profil pengguna asli dari database backend Go
 */
export interface BackendUserProfile {
  id: number | string;
  name: string;
  email: string;
  phone: string;
  role: string;
  is_verified: boolean;
  avatar: string;
  contribution_status: string | null;
  is_premium: boolean;
  premium_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Pembungkus standar respon API profil dari endpoint GET /api/v1/profile
 */
export interface UserProfileResponse {
  data: BackendUserProfile;
}

// ==============================================================================
// 7. ENTITAS LANGGANAN PENGGUNA (GET /api/v1/purchases/my-active-product)
// ==============================================================================

/**
 * Status entitlement langganan pengguna dari tabel store_purchases di backend Go.
 * Dicek berdasarkan user_id, status transaksi (settlement/capture), dan masa aktif (expires_at > now).
 */
export interface UserSubscriptionData {
  /** Status keaktifan paket premium saat ini */
  is_premium: boolean;

  /** Waktu kedaluwarsa masa aktif langganan premium (ISO timestamp) */
  active_until?: string | null;

  /** Nama atau ID produk langganan yang sedang aktif */
  active_product?: string;
}

/**
 * Pembungkus respon API langganan dari endpoint GET /api/v1/purchases/my-active-product
 */
export interface UserSubscriptionResponse {
  data: UserSubscriptionData;
}

/**
 * Label tingkatan akun pengguna di antarmuka (Frontend UI Tier):
 * - 'Admin'   : Pengguna dengan hak akses sistem (role backend 'admin')
 * - 'Premium' : Pengguna dengan transaksi sah yang masih aktif di tabel store_purchases
 * - 'Free'    : Pengguna biasa (guest/member) tanpa transaksi premium aktif atau sudah kedaluwarsa
 */
export type UserTier = 'Admin' | 'Premium' | 'Free';

