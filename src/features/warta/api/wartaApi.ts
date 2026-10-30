/**
 * ==============================================================================
 * JEMBATAN API & NORMALISASI DATA: FITUR WARTA BUDAYA BALI
 * ==============================================================================
 * Berkas ini menyediakan fungsi komunikasi HTTP (Axios) langsung ke Backend Go
 * untuk seluruh operasi CRUD artikel warta, ditambah helper utilitas penting
 * seperti normalisasi URL gambar dan pemformatan tanggal ramah budaya.
 *
 * Menerapkan prinsip:
 * 1. 100% Real API: Terhubung langsung ke endpoint Backend Go tanpa data dummy.
 * 2. URL Normalization: Menangani perbedaan format path gambar lama & baru.
 * 3. Token Otomatis: apiClient otomatis melampirkan header Authorization JWT.
 * 4. Komentar Jelas: Setiap fungsi didokumentasikan fungsi dan tujuannya.
 * ==============================================================================
 */

import { apiClient } from '@/lib/axios';
import type {
  ArticleBackendItem,
  ArticleDetailResponse,
  ArticleListResponse,
  CreateArticlePayload,
  UpdateArticlePayload,
  WartaFilterParams,
} from '../types/warta.types';

// ==============================================================================
// 1. HELPER UTILITAS: NORMALISASI GAMBAR, TANGGAL & DURASI BACA
// ==============================================================================

/**
 * Daftar nama bulan resmi Bahasa Indonesia untuk pemformatan tanggal warta.
 */
const NAMA_BULAN_INDO = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

/**
 * Normalisasi URL Gambar Artikel Warta (Bebas Bug 404).
 *
 * Fungsi ini menangani berbagai variasi format path gambar dari backend:
 * 1. Gambar kosong/null -> Mengembalikan URL placeholder SVG netral.
 * 2. URL eksternal absolut (http:// atau https://) -> Dikembalikan apa adanya.
 * 3. Format path lama ("image/qn0hkPtH1Utirwj7...jpg") -> Diubah menjadi "/uploads/image/...".
 * 4. Format upload baru ("/uploads/articles/...jpg") -> Dinormalisasi tanpa duplikasi "/uploads/".
 *
 * @param path - String path berkas gambar dari database backend
 * @returns URL gambar yang valid dan dapat dimuat oleh tag <img> di browser
 */
export function getArticleImageUrl(path?: string | null): string {
  if (!path || !path.trim()) {
    // Placeholder gambar warta bernuansa pura/budaya jika artikel tidak memiliki gambar
    return 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80';
  }

  const trimmed = path.trim();

  // Jika sudah merupakan URL absolut dari internet, gunakan langsung
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Bersihkan awalan slash atau 'uploads/' jika ada untuk menghindari duplikasi
  const cleanPath = trimmed.replace(/^\/?(uploads\/)?/, '');

  // Arahkan ke endpoint statis /uploads yang dilayani oleh Backend Go & Vite Proxy
  return `/uploads/${cleanPath}`;
}

/**
 * Format Tanggal Warta Berbudaya (WITA - UTC+8).
 *
 * Mengubah string tanggal ISO 8601 (contoh: "2024-08-09T15:29:15Z")
 * menjadi format teks Indonesia yang rapi (contoh: "9 Agustus 2024").
 *
 * @param isoDateStr - String tanggal ISO dari backend
 * @returns Teks tanggal terformat
 */
export function formatWartaDate(isoDateStr?: string | null): string {
  if (!isoDateStr) return '-';

  try {
    const date = new Date(isoDateStr);
    if (isNaN(date.getTime())) return '-';

    // Mengambil tanggal, bulan, dan tahun (disesuaikan dengan zona waktu lokal/WITA)
    const day = date.getDate();
    const month = NAMA_BULAN_INDO[date.getMonth()] || '';
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
  } catch {
    return '-';
  }
}

/**
 * Estimasi Waktu Baca Artikel (Reading Time).
 *
 * Menghitung perkiraan durasi yang dibutuhkan pembaca rata-rata
 * dengan asumsi kecepatan baca 200 kata per menit.
 *
 * @param content - Teks narasi lengkap artikel
 * @returns Label durasi baca (contoh: "2 mnt baca")
 */
export function calculateReadTime(content?: string | null): string {
  if (!content || !content.trim()) return '1 mnt baca';

  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));

  return `${minutes} mnt baca`;
}

// ==============================================================================
// 2. FUNGSI PEMANGGILAN HTTP CLIENT (AXIOS) KE BACKEND GO
// ==============================================================================

/**
 * Mengambil daftar seluruh artikel publik dari backend Go:
 * GET /api/v1/articles
 *
 * Mendukung paginasi dan pencarian server-side (ILIKE pada title & content).
 *
 * @param params - Parameter opsional (page, per_page, search)
 * @returns Objek berisi array artikel data dan total hitungan keseluruhan
 */
export async function fetchArticles(params?: WartaFilterParams): Promise<ArticleListResponse> {
  const queryParams: Record<string, string | number> = {
    page: params?.page && params.page > 0 ? params.page : 1,
    per_page: params?.per_page && params.per_page > 0 ? params.per_page : 12,
  };

  if (params?.search && params.search.trim()) {
    queryParams.search = params.search.trim();
  }

  const response = await apiClient.get<ArticleListResponse>('/articles', {
    params: queryParams,
  });

  return {
    data: Array.isArray(response.data?.data) ? response.data.data : [],
    total: typeof response.data?.total === 'number' ? response.data.total : 0,
  };
}

/**
 * Mengambil daftar artikel milik pengguna yang sedang login:
 * GET /api/v1/articles/my
 *
 * Memerlukan token autentikasi yang otomatis dilampirkan oleh apiClient interceptor.
 *
 * @param params - Parameter opsional (page, per_page)
 * @returns Objek berisi array artikel milik user dan total hitungan
 */
export async function fetchMyArticles(params?: WartaFilterParams): Promise<ArticleListResponse> {
  try {
    const queryParams: Record<string, string | number> = {
      page: params?.page && params.page > 0 ? params.page : 1,
      per_page: params?.per_page && params.per_page > 0 ? params.per_page : 12,
    };

    const response = await apiClient.get<ArticleListResponse>('/articles/my', {
      params: queryParams,
    });

    return {
      data: Array.isArray(response.data?.data) ? response.data.data : [],
      total: typeof response.data?.total === 'number' ? response.data.total : 0,
    };
  } catch (error: unknown) {
    const err = error as { response?: { status?: number } };
    // Jika backend merespon 403 Forbidden atau 404 (misal belum ada artikel atau peran member),
    // kembalikan daftar kosong secara anggun (0 warta) agar antarmuka menampilkan Empty State,
    // bukan layar error jaringan.
    if (err.response?.status === 403 || err.response?.status === 404) {
      return { data: [], total: 0 };
    }
    throw error;
  }
}

/**
 * Mengambil data rincian artikel warta tunggal berdasarkan ID:
 * GET /api/v1/articles/:id
 *
 * @param id - ID artikel yang ingin diambil
 * @returns Objek artikel warta tunggal
 */
export async function fetchArticleDetail(id: number | string): Promise<ArticleBackendItem> {
  const response = await apiClient.get<ArticleDetailResponse>(`/articles/${id}`);
  return response.data.data;
}

/**
 * Membuat artikel warta baru:
 * POST /api/v1/articles
 *
 * Jika menyertakan berkas gambar fisik (File), otomatis dikirim via multipart/form-data.
 * Jika hanya menyertakan URL gambar string, dikirim via JSON biasa.
 *
 * @param payload - Data judul, konten, dan berkas/URL gambar
 * @returns Objek artikel yang berhasil dibuat
 */
export async function createArticle(payload: CreateArticlePayload): Promise<ArticleBackendItem> {
  // Jika ada berkas gambar fisik, gunakan FormData multipart
  if (payload.imageFile) {
    const formData = new FormData();
    formData.append('title', payload.title.trim());
    formData.append('content', payload.content.trim());
    formData.append('image', payload.imageFile);

    if (payload.show_at_home_page_from) {
      formData.append('show_at_home_page_from', payload.show_at_home_page_from);
    }
    if (payload.show_at_home_page_until) {
      formData.append('show_at_home_page_until', payload.show_at_home_page_until);
    }

    const response = await apiClient.post<ArticleDetailResponse>('/articles', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Jika tanpa berkas fisik (hanya URL atau teks), kirim via JSON
  const jsonBody: Record<string, unknown> = {
    title: payload.title.trim(),
    content: payload.content.trim(),
  };

  if (payload.imageUrl) {
    jsonBody.image = payload.imageUrl.trim();
  }
  if (payload.show_at_home_page_from) {
    jsonBody.show_at_home_page_from = payload.show_at_home_page_from;
  }
  if (payload.show_at_home_page_until) {
    jsonBody.show_at_home_page_until = payload.show_at_home_page_until;
  }

  const response = await apiClient.post<ArticleDetailResponse>('/articles', jsonBody);
  return response.data.data;
}

/**
 * Memperbarui data artikel warta yang sudah ada:
 * PUT /api/v1/articles/:id
 *
 * @param id - ID artikel yang akan diperbarui
 * @param payload - Data pembaruan (judul, konten, cover)
 * @returns Objek artikel hasil pembaruan
 */
export async function updateArticle(
  id: number | string,
  payload: UpdateArticlePayload
): Promise<ArticleBackendItem> {
  // Jika menyertakan berkas gambar baru, gunakan multipart/form-data
  if (payload.imageFile) {
    const formData = new FormData();
    if (payload.title !== undefined) formData.append('title', payload.title.trim());
    if (payload.content !== undefined) formData.append('content', payload.content.trim());
    formData.append('image', payload.imageFile);

    if (payload.show_at_home_page_from) {
      formData.append('show_at_home_page_from', payload.show_at_home_page_from);
    }
    if (payload.show_at_home_page_until) {
      formData.append('show_at_home_page_until', payload.show_at_home_page_until);
    }

    const response = await apiClient.put<ArticleDetailResponse>(`/articles/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  }

  // Jika tanpa berkas gambar baru, kirim JSON standar
  const jsonBody: Record<string, unknown> = {};
  if (payload.title !== undefined) jsonBody.title = payload.title.trim();
  if (payload.content !== undefined) jsonBody.content = payload.content.trim();
  if (payload.imageUrl !== undefined) jsonBody.image = payload.imageUrl.trim();
  if (payload.show_at_home_page_from !== undefined) {
    jsonBody.show_at_home_page_from = payload.show_at_home_page_from;
  }
  if (payload.show_at_home_page_until !== undefined) {
    jsonBody.show_at_home_page_until = payload.show_at_home_page_until;
  }

  const response = await apiClient.put<ArticleDetailResponse>(`/articles/${id}`, jsonBody);
  return response.data.data;
}

/**
 * Menghapus artikel warta dari database:
 * DELETE /api/v1/articles/:id
 *
 * @param id - ID artikel yang ingin dihapus
 */
export async function deleteArticle(id: number | string): Promise<void> {
  await apiClient.delete(`/articles/${id}`);
}

