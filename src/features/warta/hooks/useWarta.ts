/**
 * ==============================================================================
 * STATE MANAGEMENT & CACHING: FITUR WARTA BUDAYA BALI
 * ==============================================================================
 * Berkas ini menyediakan Custom Hooks berbasis TanStack Query untuk mengelola
 * seluruh status asinkron (Server State), caching di RAM browser, serta mutasi
 * data warta dengan invalidasi cache otomatis.
 *
 * Menerapkan prinsip fe_strategy.md & AGENTS.md:
 * 1. Zero-Loading UX: Menggunakan memori RAM TanStack Query dengan staleTime 5 menit.
 * 2. Zero Layout Shift (CLS = 0): Memanfaatkan placeholderData untuk transisi mulus.
 * 3. Cache Invalidation: Otomatis memperbarui daftar warta setelah create/update/delete.
 * 4. User Feedback: Terintegrasi dengan useAlertStore untuk notifikasi mengambang.
 * ==============================================================================
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAlertStore } from '@/stores/useAlertStore';
import type {
  ArticleBackendItem,
  ArticleListResponse,
  CreateArticlePayload,
  UpdateArticlePayload,
  WartaFilterParams,
} from '../types/warta.types';
import {
  createArticle,
  deleteArticle,
  fetchArticleDetail,
  fetchArticles,
  fetchMyArticles,
  updateArticle,
} from '../api/wartaApi';

// ==============================================================================
// 1. QUERY HOOK: DAFTAR WARTA PUBLIK (SEMUA WARTA)
// ==============================================================================

/**
 * useWartaList mengambil daftar artikel publik dari backend Go:
 * GET /api/v1/articles?page={page}&per_page={per_page}&search={search}
 *
 * Menggunakan caching TanStack Query selama 5 menit:
 * Jika pengguna berpindah-pindah halaman atau tab dan kembali lagi,
 * data akan langsung muncul seketika dalam 0 milidetik tanpa loading spinner.
 *
 * @param params - Parameter filter paginasi dan kata kunci pencarian
 */
export function useWartaList(params: WartaFilterParams) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.per_page && params.per_page > 0 ? params.per_page : 12;
  const search = params.search?.trim() || '';

  return useQuery<ArticleListResponse>({
    queryKey: ['articles', 'list', { page, perPage, search }],
    queryFn: () => fetchArticles({ page, per_page: perPage, search }),
    staleTime: 1000 * 60 * 5, // Data dianggap segar selama 5 menit
    gcTime: 1000 * 60 * 60, // Dipertahankan di memori RAM selama 1 jam
    // Menjaga data sebelumnya tetap tampil saat pergantian halaman untuk mencegah kedipan layar
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 2. QUERY HOOK: DAFTAR WARTA SAYA (KHUSUS PENGGUNA TERAUTENTIKASI)
// ==============================================================================

/**
 * useMyWartaList mengambil artikel yang ditulis oleh pengguna yang sedang login:
 * GET /api/v1/articles/my?page={page}&per_page={per_page}
 *
 * Hanya dieksekusi jika parameter `isEnabled` bernilai true (pengguna terautentikasi).
 *
 * @param params - Parameter paginasi
 * @param isEnabled - Boolean penanda apakah query diizinkan berjalan
 */
export function useMyWartaList(params: WartaFilterParams, isEnabled = true) {
  const page = params.page && params.page > 0 ? params.page : 1;
  const perPage = params.per_page && params.per_page > 0 ? params.per_page : 12;

  return useQuery<ArticleListResponse>({
    queryKey: ['articles', 'my', { page, perPage }],
    queryFn: () => fetchMyArticles({ page, per_page: perPage }),
    enabled: isEnabled,
    staleTime: 1000 * 60 * 2, // Data warta milik sendiri segar selama 2 menit
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 3. QUERY HOOK: DETAIL WARTA TUNGGAL (UNTUK MODAL BACA)
// ==============================================================================

/**
 * useWartaDetail mengambil satu artikel lengkap berdasarkan ID:
 * GET /api/v1/articles/:id
 *
 * Query ini otomatis aktif jika ID artikel tersedia (misal saat modal terbuka).
 *
 * @param id - ID artikel (angka atau string numerik), null jika modal tertutup
 */
export function useWartaDetail(id: number | string | null) {
  return useQuery<ArticleBackendItem | null>({
    queryKey: ['articles', 'detail', String(id)],
    queryFn: () => (id ? fetchArticleDetail(id) : null),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 10, // Data detail artikel statis selama 10 menit
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 4. MUTATION HOOK: BUAT WARTA BARU
// ==============================================================================

/**
 * useCreateWartaMutation menangani pembuatan warta baru:
 * POST /api/v1/articles
 *
 * Setelah berhasil dibuat:
 * 1. Otomatis membersihkan (invalidate) cache 'articles' agar artikel baru langsung tampil di daftar.
 * 2. Menampilkan notifikasi sukses mengambang via useAlertStore.
 */
export function useCreateWartaMutation() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: (payload: CreateArticlePayload) => createArticle(payload),
    onSuccess: () => {
      // Perbarui cache daftar warta publik dan warta saya secara instan
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      showAlert('Warta berhasil diterbitkan!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || 'Gagal menerbitkan warta.';
      showAlert(msg);
    },
  });
}

// ==============================================================================
// 5. MUTATION HOOK: PERBARUI WARTA
// ==============================================================================

/**
 * useUpdateWartaMutation menangani pembaruan artikel warta yang sudah ada:
 * PUT /api/v1/articles/:id
 *
 * Setelah berhasil diperbarui:
 * 1. Invalidasi cache daftar artikel dan detail artikel bersangkutan.
 * 2. Menampilkan notifikasi sukses mengambang.
 */
export function useUpdateWartaMutation() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateArticlePayload }) =>
      updateArticle(id, payload),
    onSuccess: (_data, variables) => {
      // Invalidate daftar artikel dan detail spesifik artikel yang diedit
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['articles', 'detail', String(variables.id)] });
      showAlert('Warta berhasil diperbarui!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || 'Gagal memperbarui warta.';
      showAlert(msg);
    },
  });
}

// ==============================================================================
// 6. MUTATION HOOK: HAPUS WARTA
// ==============================================================================

/**
 * useDeleteWartaMutation menangani penghapusan warta:
 * DELETE /api/v1/articles/:id
 *
 * Setelah berhasil dihapus:
 * 1. Invalidasi cache agar kartu warta langsung menghilang dari antarmuka.
 * 2. Menampilkan notifikasi sukses mengambang.
 */
export function useDeleteWartaMutation() {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  return useMutation({
    mutationFn: (id: number | string) => deleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      showAlert('Warta berhasil dihapus!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const msg = err.response?.data?.message || err.message || 'Gagal menghapus warta.';
      showAlert(msg);
    },
  });
}

