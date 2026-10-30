/**
 * ==============================================================================
 * HALAMAN UTAMA: WartaPage (Orkestrator Fitur Warta Budaya Bali)
 * ==============================================================================
 * Mengintegrasikan seluruh komponen antarmuka, pencarian, paginasi, modal baca,
 * dan formulir publikasi warta dengan Backend Go.
 *
 * Menerapkan prinsip fe_strategy.md & AGENTS.md:
 * 1. Zero-Loading UX: Mengonsumsi cache TanStack Query dengan staleTime optimal.
 * 2. URL-as-State: Sinkronisasi reaktif (?tab=..., ?search=..., ?page=..., ?id=...).
 * 3. Zero Layout Shift (CLS = 0): Skeleton berdimensi presisi saat cold start.
 * 4. Dynamic Document Title: Memperbarui judul tab browser secara reaktif.
 * 5. Alur Navigasi Login: Jika belum login dan klik "Warta Saya", otomatis diarahkan ke /login.
 * 6. Tidak Ada Fallback Dummy: 100% data riil dari backend Go, dengan kartu penanganan error.
 * ==============================================================================
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  X,
  Globe,
  PenSquare,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import type { ArticleBackendItem, CreateArticlePayload, UpdateArticlePayload } from '../types/warta.types';
import {
  useWartaList,
  useCreateWartaMutation,
  useUpdateWartaMutation,
  useDeleteWartaMutation,
} from '../hooks/useWarta';
import { WartaCard } from '../components/WartaCard';
import { WartaAdminTable } from '../components/WartaAdminTable';
import { WartaFormModal } from '../components/WartaFormModal';

const ITEMS_PER_PAGE = 12;

export default function WartaPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const isAdmin = Boolean(user && user.role?.toLowerCase() === 'admin');

  // ---------------------------------------------------------------------------
  // 1. REKONSTRUKSI STATE DARI URL SEARCH PARAMS (URL-AS-STATE)
  // ---------------------------------------------------------------------------
  // Tab 'kelola' hanya aktif dan dapat diakses jika pengguna berstatus Admin.
  // Untuk pengguna biasa (Member / Tamu), activeTab selalu 'semua'.
  const rawTab = searchParams.get('tab');
  const activeTab: 'semua' | 'kelola' =
    isAdmin && (rawTab === 'kelola' || rawTab === 'saya') ? 'kelola' : 'semua';
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const activePage = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const activeSearchQuery = searchParams.get('search') || '';

  // Redirection otomatis jika ada yang membuka URL lama dengan parameter ?id=...
  const legacyArticleId = searchParams.get('id');
  useEffect(() => {
    if (legacyArticleId) {
      navigate(`/warta/${legacyArticleId}`, { replace: true });
    }
  }, [legacyArticleId, navigate]);

  // State lokal input pencarian sebelum ter-debounce
  const [searchInput, setSearchInput] = useState(activeSearchQuery);

  // State modal formulir tambah / edit warta
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingArticle, setEditingArticle] = useState<ArticleBackendItem | null>(null);

  // ---------------------------------------------------------------------------
  // 2. MEKANISME DEBOUNCE PENCARIAN (300 MS)
  // ---------------------------------------------------------------------------
  // Sinkronkan input lokal jika URL berubah dari luar (misal tombol Back browser)
  // Menerapkan pola resmi React: Adjusting state during render without useEffect
  const [prevSearchQuery, setPrevSearchQuery] = useState(activeSearchQuery);
  if (prevSearchQuery !== activeSearchQuery) {
    setPrevSearchQuery(activeSearchQuery);
    setSearchInput(activeSearchQuery);
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      // Jika input berbeda dengan URL, perbarui URL dan kembalikan page ke 1
      if (searchInput.trim() !== activeSearchQuery) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev);
          if (searchInput.trim()) {
            next.set('search', searchInput.trim());
          } else {
            next.delete('search');
          }
          next.set('page', '1');
          return next;
        });
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput, activeSearchQuery, setSearchParams]);

  // ---------------------------------------------------------------------------
  // 3. KONSUMSI DATA DARI BACKEND GO VIA TANSTACK QUERY
  // ---------------------------------------------------------------------------
  // Mengambil seluruh artikel warta dari database backend Go (Single Source of Truth)
  const activeQuery = useWartaList({
    page: activePage,
    per_page: ITEMS_PER_PAGE,
    search: activeSearchQuery,
  });

  const articles = useMemo(() => activeQuery.data?.data || [], [activeQuery.data?.data]);
  const totalCount = activeQuery.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  // Mutasi create, update, delete
  const createMutation = useCreateWartaMutation();
  const updateMutation = useUpdateWartaMutation();
  const deleteMutation = useDeleteWartaMutation();

  // ---------------------------------------------------------------------------
  // 4. SINKRONISASI JUDUL TAB BROWSER DINAMIS (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (activeTab === 'kelola') {
      document.title = 'Kelola Warta Redaksi · Kalender Bali';
    } else {
      document.title = 'Warta & Kabar Budaya · Kalender Bali';
    }
  }, [activeTab]);

  // ---------------------------------------------------------------------------
  // 5. HANDLER INTERAKSI TAB (KHUSUS ADMIN)
  // ---------------------------------------------------------------------------
  const handleTabChange = useCallback(
    (targetTab: 'semua' | 'kelola') => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (targetTab === 'kelola') {
          next.set('tab', 'kelola');
        } else {
          next.delete('tab');
        }
        next.set('page', '1');
        return next;
      });
    },
    [setSearchParams]
  );

  // Handler pergantian halaman (Pagination)
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
    // Scroll mulus kembali ke atas kisi warta
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handler membuka detail warta: navigasi langsung ke rute halaman artikel /warta/:id
  const handleOpenDetail = (article: ArticleBackendItem) => {
    navigate(`/warta/${article.id}`);
  };

  // Handler membuka form tambah warta
  const handleOpenCreateForm = () => {
    if (!isAuthenticated || !user) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setFormMode('create');
    setEditingArticle(null);
    setIsFormModalOpen(true);
  };

  // Handler membuka form edit warta
  const handleOpenEditForm = (article: ArticleBackendItem) => {
    setFormMode('edit');
    setEditingArticle(article);
    setIsFormModalOpen(true);
  };

  // Handler submit formulir tambah / edit
  const handleFormSubmit = async (payload: CreateArticlePayload | UpdateArticlePayload) => {
    if (formMode === 'create') {
      await createMutation.mutateAsync(payload as CreateArticlePayload);
      setIsFormModalOpen(false);
    } else if (formMode === 'edit' && editingArticle) {
      await updateMutation.mutateAsync({
        id: editingArticle.id,
        payload: payload as UpdateArticlePayload,
      });
      setIsFormModalOpen(false);
    }
  };

  // Handler hapus warta dari tabel kelola
  const handleDeleteArticle = async (id: number | string) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ==================================================================== */}
      {/* 1. HEADER HALAMAN STANDAR (AGENTS.md Bagian 4.1)                     */}
      {/* Header utama halaman warta: breadcrumb navigasi ringkas, judul H1,    */}
      {/* dan deskripsi ringkas tanpa tombol redundant di sudut kanan.          */}
      {/* ==================================================================== */}
      <div className="space-y-1.5">
        {/* Breadcrumb Navigasi Hierarkis: Wargabali / Warta */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span>Wargabali</span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">Warta Budaya</span>
        </nav>

        {/* Judul H1 Halaman */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          Warta Budaya
        </h1>

        {/* Deskripsi Ringkas Fungsi Halaman */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          Kumpulan artikel, kabar perayaan hari raya, dan wawasan sastra wariga Bali terverifikasi.
        </p>
      </div>

      {/* ==================================================================== */}
      {/* 2. BAR KONTROL: TAB SWITCHER (KHUSUS ADMIN) & PENCARIAN BER-DEBOUNCE */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Segmented Tab Switcher HANYA DITAMPILKAN KEPADA PENGELOLA (ADMIN) */}
        {isAdmin ? (
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1 select-none self-start shrink-0">
            <button
              type="button"
              onClick={() => handleTabChange('semua')}
              className={`cursor-pointer inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs sm:text-sm transition-all [touch-action:manipulation] ${
                activeTab === 'semua'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <Globe size={15} className={activeTab === 'semua' ? 'text-teal-700' : 'text-slate-400'} />
              <span>Semua Warta</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('kelola')}
              className={`cursor-pointer inline-flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs sm:text-sm transition-all [touch-action:manipulation] ${
                activeTab === 'kelola'
                  ? 'bg-white text-slate-900 font-bold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <PenSquare size={15} className={activeTab === 'kelola' ? 'text-teal-700' : 'text-slate-400'} />
              <span>Kelola Warta</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 select-none">
            <Globe size={16} className="text-[#0d9488]" />
            <span>Katalog Warta Budaya</span>
          </div>
        )}

        {/* Kolom Pencarian Cerdas dengan Tombol Bersihkan */}
        <div className={`relative flex-1 ${isAdmin ? 'max-w-md' : 'max-w-lg'}`}>
          <Search
            size={16}
            className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari judul atau isi warta budaya..."
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors cursor-pointer"
              title="Bersihkan Pencarian"
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. KONTEN UTAMA: FEEDBACK STATE (LOADING / ERROR / EMPTY / GRID)      */}
      {/* ==================================================================== */}

      {/* A. PENANGANAN STATE ERROR (ISOLASI KESALAHAN JARINGAN) */}
      {activeQuery.isError && (
        <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-10 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Warta</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              {activeQuery.error instanceof Error
                ? activeQuery.error.message
                : 'Terjadi gangguan saat memuat data warta dari server backend.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => activeQuery.refetch()}
            className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]"
          >
            <RefreshCw size={15} />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* B. PENANGANAN STATE LOADING (SKELETON PRESISI DIMENSI — CLS = 0) */}
      {activeQuery.isLoading && !activeQuery.isError && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col"
            >
              {/* Cover Skeleton */}
              <div className="aspect-video w-full bg-slate-200/80 animate-pulse" />
              {/* Content Skeleton */}
              <div className="p-5 sm:p-6 space-y-3 flex-1">
                <div className="h-3 w-32 bg-slate-200 rounded-full animate-pulse" />
                <div className="h-5 w-3/4 bg-slate-200/90 rounded-lg animate-pulse" />
                <div className="space-y-1.5 pt-1">
                  <div className="h-3.5 w-full bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-5/6 bg-slate-100 rounded animate-pulse" />
                  <div className="h-3.5 w-2/3 bg-slate-100 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* C. PENANGANAN STATE KOSONG (EMPTY STATE RAMAH) */}
      {!activeQuery.isLoading && !activeQuery.isError && articles.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-10 sm:p-14 text-center max-w-lg mx-auto my-8 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
            <BookOpen size={26} />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {activeSearchQuery
                ? 'Warta Tidak Ditemukan'
                : activeTab === 'kelola'
                ? 'Belum Ada Warta yang Anda Terbitkan'
                : 'Belum Ada Warta Tersedia'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
              {activeSearchQuery
                ? `Tidak ada artikel warta yang cocok dengan kata kunci "${activeSearchQuery}". Coba gunakan kata kunci lain.`
                : activeTab === 'kelola'
                ? 'Anda belum memiliki artikel warta budaya yang diterbitkan. Klik tombol "Tulis Warta Sekarang" untuk mulai mempublikasikan artikel ke publik.'
                : 'Belum ada warta budaya yang dipublikasikan pada sistem saat ini.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            {activeSearchQuery && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <X size={14} />
                <span>Bersihkan Pencarian</span>
              </button>
            )}

            {activeTab === 'kelola' && isAdmin && (
              <button
                type="button"
                onClick={handleOpenCreateForm}
                className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] text-white font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <PenSquare size={14} />
                <span>Tulis Warta Sekarang</span>
              </button>
            )}

            {activeTab === 'kelola' && (
              <button
                type="button"
                onClick={() => handleTabChange('semua')}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Globe size={14} className="text-teal-700" />
                <span>Jelajahi Semua Warta</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* D. GRID UTAMA ARTIKEL WARTA (TAMPILAN NORMAL) */}
      {!activeQuery.isLoading && !activeQuery.isError && articles.length > 0 && (
        <div className="space-y-8">
          {/* Header Jumlah Hasil */}
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold select-none">
            <span>
              Menampilkan <span className="tabular-nums font-bold text-slate-800">{articles.length}</span> dari{' '}
              <span className="tabular-nums font-bold text-slate-800">{totalCount}</span> warta budaya
            </span>
            {activeSearchQuery && (
              <span className="text-teal-700 font-bold">
                Kata kunci: &ldquo;{activeSearchQuery}&rdquo;
              </span>
            )}
          </div>

          {/* Mode Tab Kelola: Tampilkan Tabel Manajemen Redaksi Terpusat */}
          {activeTab === 'kelola' ? (
            <WartaAdminTable
              articles={articles}
              onView={handleOpenDetail}
              onEdit={handleOpenEditForm}
              onDelete={(id) => handleDeleteArticle(id)}
              onCreate={handleOpenCreateForm}
            />
          ) : (
            /* Mode Tab Semua Warta: Tampilkan Grid Kartu Publik */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <WartaCard
                  key={article.id}
                  article={article}
                />
              ))}
            </div>
          )}

          {/* ================================================================== */}
          {/* 4. PAGINATION KONTROL DENGAN ANGKA TABULAR                         */}
          {/* ================================================================== */}
          {totalPages > 1 && (
            <div className="pt-4 border-t border-slate-200/80 flex items-center justify-between gap-3 select-none">
              {/* Tombol Sebelumnya */}
              <button
                type="button"
                onClick={() => handlePageChange(activePage - 1)}
                disabled={activePage <= 1}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={15} />
                <span>Sebelumnya</span>
              </button>

              {/* Indikator Halaman Tabular */}
              <div className="text-xs font-semibold text-slate-500">
                Halaman <span className="tabular-nums font-bold text-slate-800">{activePage}</span> dari{' '}
                <span className="tabular-nums font-bold text-slate-800">{totalPages}</span>
              </div>

              {/* Tombol Selanjutnya */}
              <button
                type="button"
                onClick={() => handlePageChange(activePage + 1)}
                disabled={activePage >= totalPages}
                className="h-10 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Berikutnya</span>
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* 5. MODAL FORMULIR TULIS & EDIT WARTA                                 */}
      {/* ==================================================================== */}
      <WartaFormModal
        isOpen={isFormModalOpen}
        mode={formMode}
        initialData={editingArticle}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}
