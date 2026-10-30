/**
 * ==============================================================================
 * KONTRAK DATA & TIPE TYPESCRIPT: FITUR WARTA BUDAYA BALI
 * ==============================================================================
 * Berkas ini mendefinisikan seluruh tipe data TypeScript untuk fitur Warta,
 * diselaraskan secara presisi dengan struktur DTO (Data Transfer Object) dari
 * Backend Go (kalenderbali-be) pada endpoint /api/v1/articles.
 *
 * Menerapkan prinsip fe_strategy.md & AGENTS.md:
 * 1. Keamanan Presisi ID: Mendukung ID number/string untuk interoperabilitas aman.
 * 2. Konsistensi Penamaan: Properti snake_case sesuai payload resmi Backend Go.
 * 3. Type-Safety: Menghindari penggunaan tipe `any` pada seluruh alur data.
 * ==============================================================================
 */

/**
 * Representasi entitas artikel/warta tunggal dari database Backend Go.
 * Sesuai dengan struct `articleResponse` di backend-go (dto.go baris 467).
 */
export interface ArticleBackendItem {
  /** ID unik artikel (kunci primer di PostgreSQL) */
  id: number | string;

  /** ID pengguna pembuat artikel (relasi ke tabel users) */
  user_id: number | string;

  /**
   * Nama lengkap penulis artikel yang di-preload dari tabel users.
   * Contoh pada database riil: "super"
   */
  author_name?: string;

  /** Judul utama artikel warta */
  title: string;

  /** Isi narasi lengkap artikel (teks multibaris / paragraf) */
  content: string;

  /**
   * Jalur berkas gambar sampul warta di server backend.
   * Format data lama: "image/ZKJIfBapFlji5qFC4z8aJVCqrXzukmSm2wmxiwcq.jpg"
   * Format data baru hasil unggahan: "/uploads/articles/12345_hash.jpg"
   */
  image?: string;

  /** Tanggal mulai artikel ditampilkan pada beranda (opsional, format ISO 8601) */
  show_at_home_page_from?: string | null;

  /** Tanggal batas akhir artikel ditampilkan pada beranda (opsional, format ISO 8601) */
  show_at_home_page_until?: string | null;

  /** Waktu pembuatan artikel (format ISO 8601 UTC) */
  created_at: string;

  /** Waktu pembaruan artikel terakhir (format ISO 8601 UTC) */
  updated_at: string;
}

/**
 * Struktur respon dari endpoint daftar artikel:
 * GET /api/v1/articles dan GET /api/v1/articles/my
 */
export interface ArticleListResponse {
  /** Kumpulan data artikel sesuai halaman aktif */
  data: ArticleBackendItem[];

  /** Total keseluruhan data artikel di database (digunakan untuk pagination) */
  total: number;
}

/**
 * Struktur respon dari endpoint detail artikel tunggal:
 * GET /api/v1/articles/:id
 */
export interface ArticleDetailResponse {
  /** Objek artikel tunggal */
  data: ArticleBackendItem;

  /** Pesan status dari server (opsional) */
  message?: string;
}

/**
 * Parameter filter dan navigasi pencarian warta:
 * Dikirimkan melalui URL Search Params dan query parameter HTTP.
 */
export interface WartaFilterParams {
  /** Nomor halaman saat ini (1-indexed, default: 1) */
  page?: number;

  /** Jumlah item per halaman (default: 12 item untuk grid 3 kolom yang seimbang) */
  per_page?: number;

  /** Kata kunci pencarian judul atau isi konten warta (case-insensitive ILIKE di backend) */
  search?: string;

  /** Sudut pandang tab yang aktif: 'semua' warta publik atau 'kelola' (khusus Admin) */
  tab?: 'semua' | 'kelola' | 'saya';
}

/**
 * Payload data untuk membuat warta baru:
 * Digunakan oleh endpoint POST /api/v1/articles.
 * Jika menyertakan berkas gambar fisik (File), data dikirim via FormData.
 */
export interface CreateArticlePayload {
  /** Judul warta (wajib diisi, minimal 3 karakter) */
  title: string;

  /** Isi konten teks warta (wajib diisi, minimal 10 karakter) */
  content: string;

  /** Berkas gambar yang dipilih pengguna dari file picker lokal (opsional) */
  imageFile?: File | null;

  /** URL string gambar langsung jika tidak mengunggah berkas (opsional) */
  imageUrl?: string;

  /** Tanggal mulai tayang di beranda (opsional) */
  show_at_home_page_from?: string;

  /** Tanggal berakhir tayang di beranda (opsional) */
  show_at_home_page_until?: string;
}

/**
 * Payload data untuk memperbarui warta yang sudah ada:
 * Digunakan oleh endpoint PUT /api/v1/articles/:id.
 */
export interface UpdateArticlePayload {
  /** Judul artikel yang diperbarui */
  title?: string;

  /** Isi konten narasi yang diperbarui */
  content?: string;

  /** Berkas gambar baru jika pengguna mengganti cover (opsional) */
  imageFile?: File | null;

  /** URL gambar baru jika tidak menggunakan file picker (opsional) */
  imageUrl?: string;

  /** Tanggal mulai tayang di beranda (opsional) */
  show_at_home_page_from?: string;

  /** Tanggal berakhir tayang di beranda (opsional) */
  show_at_home_page_until?: string;
}

/**
 * Status aksi formulir warta (untuk mode modal):
 * Membedakan apakah modal sedang dalam mode tambah warta baru atau edit warta lama.
 */
export type WartaFormMode = 'create' | 'edit';

