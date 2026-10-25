import axios from 'axios';

// 1. Buat instance Axios terpusat
export const apiClient = axios.create({
  // Jika menggunakan Vite Proxy, baseURL cukup '/api/v1'
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Timeout 15 detik jika backend tidak merespons
});

// 2. Request Interceptor: Otomatis sisipkan Bearer Token JWT jika sudah login
apiClient.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Tangani error umum dari backend secara terpusat
apiClient.interceptors.response.use(
  (response) => {
    // Response sukses (status 2xx) langsung diteruskan
    return response;
  },
  (error) => {
    // Tangani jika sesi login habis / token expired (401 Unauthorized)
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      // Opsional: bisa redirect ke halaman login jika rute dilindungi
      // window.location.href = '/login';
    }

    // Ekstrak pesan error dari response backend Go jika ada
    const errorPayload = error.response?.data;
    const errorMessage =
      errorPayload?.error?.message ||
      errorPayload?.message ||
      (typeof errorPayload?.error === 'string' ? errorPayload.error : null) ||
      'Terjadi kesalahan pada server';

    const err = new Error(errorMessage) as Error & { status?: number; code?: string; response?: any };
    err.status = error.response?.status;
    err.code = errorPayload?.error?.code;
    err.response = error.response;

    return Promise.reject(err);
  }
);
