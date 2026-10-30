/**
 * ==============================================================================
 * HALAMAN: WartaDetailPage (Halaman Membaca Artikel Warta Budaya Bali)
 * ==============================================================================
 * Menyajikan artikel warta secara penuh dalam satu halaman khusus (/warta/:id)
 * mengikuti standar portal media berita modern (prose lega, ergonomis, bebas modal).
 *
 * Menerapkan prinsip AGENTS.md & fe_strategy.md:
 * 1. Zero Layout Shift (CLS = 0): Skeleton loading yang presisi menyerupai halaman riil.
 * 2. URL Bersih & Shareable: Rute langsung /warta/:id yang mudah dibagikan & di-bookmark.
 * 3. Dynamic Document Title: Memperbarui judul tab browser sesuai judul warta.
 * 4. Tipografi Editorial: Spasi paragraf nyaman (max-w-3xl), banner gambar proporsional.
 * 5. Manajemen Admin Terintegrasi: Tombol Edit (membuka WartaFormModal) & Hapus (konfirmasi).
 * ==============================================================================
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Share2,
  Edit3,
  Trash2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import {
  useWartaDetail,
  useUpdateWartaMutation,
  useDeleteWartaMutation,
} from '../hooks/useWarta';
import { getArticleImageUrl, formatWartaDate, calculateReadTime } from '../api/wartaApi';
import { WartaFormModal } from '../components/WartaFormModal';
import type { UpdateArticlePayload } from '../types/warta.types';

export default function WartaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();

  // State gambar fallback dan modal edit warta
  const [imgError, setImgError] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. PENGAMBILAN DATA ARTIKEL DARI BACKEND GO VIA TANSTACK QUERY
  // ---------------------------------------------------------------------------
  // Mengambil data detail artikel berdasarkan ID dari URL parameter
  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useWartaDetail(id ?? null);

  // Mutasi pembaruan dan penghapusan warta
  const updateMutation = useUpdateWartaMutation();
  const deleteMutation = useDeleteWartaMutation();

  // ---------------------------------------------------------------------------
  // 2. SINKRONISASI JUDUL BROWSER (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  // Mengubah judul tab browser secara dinamis agar representatif untuk pengguna
  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} · Warta Kalender Bali`;
    } else if (isLoading) {
      document.title = 'Memuat Warta Budaya... · Kalender Bali';
    } else {
      document.title = 'Warta Tidak Ditemukan · Kalender Bali';
    }
  }, [article?.title, isLoading]);

  // Cek otorisasi manajemen warta (hanya pemilik atau admin yang berhak edit/hapus)
  const isOwner = Boolean(user && article && String(user.id) === String(article.user_id));
  const isAdmin = Boolean(user && user.role?.toLowerCase() === 'admin');
  const canManage = Boolean(isOwner || isAdmin);

  // ---------------------------------------------------------------------------
  // 3. HANDLER SALIN TAUTAN (SHAREABLE LINK)
  // ---------------------------------------------------------------------------
  // Menyalin URL artikel saat ini ke clipboard dengan notifikasi toast
  const handleShare = async () => {
    try {
      const shareUrl = window.location.href;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showAlert('Tautan warta berhasil disalin ke papan klip!');
    } catch {
      showAlert('Gagal menyalin tautan warta.');
    }
  };

  // ---------------------------------------------------------------------------
  // 4. HANDLER PENGHAPUSAN WARTA
  // ---------------------------------------------------------------------------
  // Konfirmasi penghapusan warta dan navigasi kembali ke katalog warta setelah sukses
  const handleDeleteArticle = async () => {
    if (!article) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus warta "${article.title}"? Tindakan ini permanen dan tidak dapat dibatalkan.`
    );
    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      await deleteMutation.mutateAsync(article.id);
      showAlert('Warta berhasil dihapus');
      navigate('/warta', { replace: true });
    } catch {
      setIsDeleting(false);
      showAlert('Gagal menghapus warta, silakan coba lagi.');
    }
  };

  // ---------------------------------------------------------------------------
  // 5. HANDLER SIMPAN PERUBAHAN EDIT WARTA
  // ---------------------------------------------------------------------------
  // Mengirim payload pembaruan ke backend Go dan menutup modal
  const handleUpdateSubmit = async (payload: UpdateArticlePayload) => {
    if (!article) return;
    await updateMutation.mutateAsync({
      id: article.id,
      payload,
    });
    setIsEditModalOpen(false);
  };

  // ===========================================================================
  // TAMPILAN LOADING / SKELETON (ZERO CLS SESUAI fe_strategy.md)
  // Menggunakan lebar terpadu max-w-3xl agar presisi dengan layout artikel
  // ===========================================================================
  if (isLoading) {
    return (
      <div className="space-y-6 sm:space-y-8 animate-pulse max-w-3xl mx-auto py-2">
        {/* Skeleton Breadcrumb Navigasi */}
        <div className="pb-2 border-b border-slate-100">
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>

        {/* Skeleton Judul H1 */}
        <div className="space-y-3">
          <div className="h-8 sm:h-10 w-4/5 bg-slate-200 rounded-lg" />
          <div className="h-8 sm:h-10 w-2/3 bg-slate-200 rounded-lg" />
        </div>

        {/* Skeleton Meta Bar */}
        <div className="flex items-center gap-4 py-2 border-y border-slate-100">
          <div className="h-5 w-32 bg-slate-200 rounded-full" />
          <div className="h-5 w-28 bg-slate-200 rounded-full" />
          <div className="h-5 w-20 bg-slate-200 rounded-full" />
        </div>

        {/* Skeleton Cover Banner (Lebar sejajar dengan teks) */}
        <div className="w-full aspect-video sm:aspect-21/9 bg-slate-200 rounded-2xl" />

        {/* Skeleton Paragraf Konten */}
        <div className="space-y-4 pt-4">
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-5/6 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-200 rounded" />
          <div className="h-4 w-4/5 bg-slate-200 rounded" />
        </div>
      </div>
    );
  }

  // ===========================================================================
  // TAMPILAN ERROR ATAU DATA TIDAK DITEMUKAN
  // ===========================================================================
  if (isError || !article) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <AlertCircle size={28} />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-800">Warta Tidak Ditemukan</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            {error instanceof Error
              ? error.message
              : 'Artikel warta yang Anda cari tidak tersedia atau mungkin telah dihapus.'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Coba Lagi</span>
          </button>
          <Link
            to="/warta"
            className="h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Warta</span>
          </Link>
        </div>
      </div>
    );
  }

  // Variabel metadata artikel terformat
  const imageUrl = imgError
    ? 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'
    : getArticleImageUrl(article.image);

  const formattedDate = formatWartaDate(article.created_at);
  const readDuration = calculateReadTime(article.content);
  const authorName = article.author_name || 'Admin Wargabal';

  // Pisahkan konten berdasarkan baris baru untuk render paragraf yang nyaman dibaca
  const paragraphs = article.content
    ? article.content.split(/\r?\n/).filter((p) => p.trim().length > 0)
    : [];

  return (
    <article className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 max-w-3xl mx-auto py-2">
      {/* ==================================================================== */}
      {/* 1. NAVIGASI ATAS: BREADCRUMB HIERARKIS                               */}
      {/* ==================================================================== */}
      <div className="pb-2 border-b border-slate-100">
        {/* Breadcrumb Navigasi: Wargabali / Warta / Judul */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none flex-wrap"
        >
          <Link to="/" className="hover:text-slate-600 transition-colors">
            Wargabali
          </Link>
          <span className="text-slate-300">/</span>
          <Link to="/warta" className="hover:text-slate-600 transition-colors">
            Warta
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold truncate max-w-xs sm:max-w-md">
            {article.title}
          </span>
        </nav>
      </div>

      {/* ==================================================================== */}
      {/* 2. HEADER ARTIKEL: JUDUL, PENULIS, TANGGAL & AKSI PENGELOLA          */}
      {/* ==================================================================== */}
      <div className="space-y-4">
        {/* Judul Utama Artikel (H1 Semantik) */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight leading-snug sm:leading-tight">
          {article.title}
        </h1>

        {/* Baris Metadata & Tombol Aksi */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 pb-4 border-b border-slate-100">
          {/* Metadata: Penulis, Tanggal Terbit, Estimasi Baca */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-semibold text-slate-500">
            {/* Penulis Artikel */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200/60">
              <User size={13} className="text-teal-700" />
              <span>{authorName}</span>
            </div>

            {/* Tanggal Terbit (WITA) */}
            <div className="inline-flex items-center gap-1.5 text-slate-500 tabular-nums">
              <Calendar size={13} className="text-slate-400" />
              <span>{formattedDate}</span>
            </div>

            <span className="text-slate-300 hidden sm:inline">·</span>

            {/* Estimasi Durasi Baca */}
            <div className="inline-flex items-center gap-1.5 text-slate-500">
              <Clock size={13} className="text-slate-400" />
              <span>{readDuration}</span>
            </div>
          </div>

          {/* Tombol Aksi: Salin Tautan, Edit, Hapus */}
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Tombol Salin Tautan */}
            <button
              type="button"
              onClick={handleShare}
              className="h-9 px-3 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Salin Tautan Warta"
            >
              <Share2 size={13} />
              <span>Bagikan</span>
            </button>

            {/* Tombol Khusus Pemilik / Admin */}
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="h-9 px-3 rounded-lg border border-teal-200/80 bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Edit Warta"
                >
                  <Edit3 size={13} />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteArticle}
                  disabled={isDeleting}
                  className="h-9 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  title="Hapus Warta"
                >
                  <Trash2 size={13} />
                  <span>{isDeleting ? 'Menghapus...' : 'Hapus'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3. HERO IMAGE: BANNER GAMBAR UTAMA ARTIKEL                           */}
      {/* ==================================================================== */}
      <div className="w-full overflow-hidden rounded-2xl bg-slate-100 border border-slate-200/80 shadow-2xs">
        <img
          src={imageUrl}
          alt={article.title}
          onError={() => setImgError(true)}
          className="w-full max-h-[500px] object-cover object-center"
        />
      </div>

      {/* ==================================================================== */}
      {/* 4. KONTEN BACAAN: PROSE LEGA SEJAJAR DENGAN GAMBAR (MAX-W-3XL)       */}
      {/* ==================================================================== */}
      <div className="space-y-6 pt-2 pb-8">
        {paragraphs.length > 0 ? (
          paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-slate-700 leading-relaxed font-normal ${
                index === 0
                  ? 'text-base sm:text-lg text-slate-800 font-medium'
                  : 'text-sm sm:text-base'
              }`}
            >
              {paragraph}
            </p>
          ))
        ) : (
          <p className="text-sm text-slate-500 italic">
            Belum ada narasi warta yang dicantumkan.
          </p>
        )}
      </div>

      {/* ==================================================================== */}
      {/* 5. FOOTER ARTIKEL: TOMBOL KEMBALI KE KATALOG WARTA                   */}
      {/* ==================================================================== */}
      <div className="pt-8 border-t border-slate-200 flex items-center justify-end">
        <Link
          to="/warta"
          className="h-10 px-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs inline-flex items-center justify-center gap-2 transition-all active:scale-98 shadow-xs"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Katalog Warta</span>
        </Link>
      </div>

      {/* ==================================================================== */}
      {/* 6. MODAL EDIT WARTA (KHUSUS PEMILIK / ADMIN)                         */}
      {/* ==================================================================== */}
      {canManage && (
        <WartaFormModal
          isOpen={isEditModalOpen}
          mode="edit"
          initialData={article}
          isSubmitting={updateMutation.isPending}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateSubmit}
        />
      )}
    </article>
  );
}
