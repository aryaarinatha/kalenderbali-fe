/**
 * ==============================================================================
 * KOMPONEN: WartaDetailModal (Modal Dialog Baca Warta Budaya Lengkap)
 * ==============================================================================
 * Menampilkan artikel warta secara menyeluruh dalam dialog pop-up terpusat
 * tanpa memaksa pengguna keluar dari konteks daftar warta.
 *
 * Menerapkan prinsip AGENTS.md Bagian 4.7 & fe_strategy.md:
 * 1. Portal Global: Dirender melalui createPortal(..., document.body) dengan z-[100].
 * 2. Aksesibilitas Penuh: Tombol Escape untuk menutup & body scroll lock otomatis.
 * 3. Fitur Berbagi (Shareable Link): Tombol salin tautan dengan notifikasi instan.
 * 4. Kontrol Penulis/Admin: Tombol edit & hapus jika pengguna adalah pemilik/admin.
 * ==============================================================================
 */

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, User, Share2, Edit3, Trash2 } from 'lucide-react';
import type { ArticleBackendItem } from '../types/warta.types';
import { getArticleImageUrl, formatWartaDate, calculateReadTime } from '../api/wartaApi';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

interface WartaDetailModalProps {
  /** Objek artikel yang sedang dibuka (null jika modal tertutup) */
  article: ArticleBackendItem | null;

  /** Fungsi callback untuk menutup modal */
  onClose: () => void;

  /** Fungsi callback jika pengguna mengklik edit (opsional) */
  onEdit?: (article: ArticleBackendItem) => void;

  /** Fungsi callback jika pengguna menghapus artikel (opsional) */
  onDelete?: (id: number | string) => void;
}

export const WartaDetailModal: React.FC<WartaDetailModalProps> = ({
  article,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [imgError, setImgError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Kunci scroll halaman latar belakang dan pasang listener tombol ESC saat modal aktif
  useEffect(() => {
    if (!article) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [article, onClose]);

  if (!article) return null;

  // Cek hak akses untuk mengedit atau menghapus artikel
  const isOwner = user && String(user.id) === String(article.user_id);
  const isAdmin = user && user.role?.toLowerCase() === 'admin';
  const canManage = Boolean(isOwner || isAdmin);

  const imageUrl = imgError
    ? 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80'
    : getArticleImageUrl(article.image);

  const formattedDate = formatWartaDate(article.created_at);
  const readDuration = calculateReadTime(article.content);
  const authorName = article.author_name || 'Admin Wargabal';

  // Handler salin tautan artikel ke clipboard
  const handleShare = async () => {
    try {
      const shareUrl = `${window.location.origin}/warta?id=${article.id}`;
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Fallback untuk environment non-HTTPS / sandbox
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

  // Handler konfirmasi penghapusan warta
  const handleDeleteConfirm = () => {
    if (!onDelete) return;
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus warta "${article.title}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (confirmDelete) {
      setIsDeleting(true);
      onDelete(article.id);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-article-title"
    >
      {/* Wadah Utama Dialog Modal */}
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl lg:max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================================================================== */}
        {/* 1. HEADER MODAL: EYEBROW & TOMBOL AKSI CEPAT                          */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] block">
              DETAIL WARTA BUDAYA
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Informasi sastra, tradisi, dan perayaan Bali
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Tombol Salin Tautan (Share) */}
            <button
              type="button"
              onClick={handleShare}
              className="min-w-9 min-h-9 px-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation]"
              title="Salin Tautan Artikel"
              aria-label="Salin Tautan Warta"
            >
              <Share2 size={14} className="text-teal-700" />
              <span className="hidden sm:inline">Salin Tautan</span>
            </button>

            {/* Tombol Edit Khusus Pemilik/Admin */}
            {canManage && onEdit && (
              <button
                type="button"
                onClick={() => onEdit(article)}
                className="min-w-9 min-h-9 px-2.5 rounded-xl border border-teal-200 bg-teal-50 hover:bg-teal-100 active:bg-teal-200/60 text-teal-800 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation]"
                title="Edit Warta Ini"
              >
                <Edit3 size={14} />
                <span className="hidden sm:inline">Edit</span>
              </button>
            )}

            {/* Tombol Hapus Khusus Pemilik/Admin */}
            {canManage && onDelete && (
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="min-w-9 min-h-9 px-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 active:bg-rose-200/60 text-rose-700 font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 [touch-action:manipulation] disabled:opacity-50"
                title="Hapus Warta Ini"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Hapus</span>
              </button>
            )}

            {/* Tombol Tutup X Standar 36x36px */}
            <button
              type="button"
              onClick={onClose}
              className="min-w-9 min-h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation]"
              aria-label="Tutup Dialog"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 2. BODY MODAL (SCROLLABLE): COVER, METADATA & PARAGRAF LENGKAP         */}
        {/* ==================================================================== */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6 flex-1">
          {/* Banner Foto Sampul Penuh */}
          <div className="relative aspect-video sm:aspect-21/9 w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/70 shadow-xs">
            <img
              src={imageUrl}
              alt={article.title}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center"
            />
          </div>

          {/* Judul Utama Artikel */}
          <div className="space-y-3">
            <h2
              id="modal-article-title"
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-[#0f172a] tracking-tight leading-snug"
            >
              {article.title}
            </h2>

            {/* Kotak Informasi Penulis & Tanggal (Sesuai AGENTS.md Bagian 4.7.7) */}
            <div className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center text-xs shrink-0">
                  <User size={15} />
                </div>
                <div>
                  <span className="font-bold text-slate-800 block text-sm">
                    {authorName}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Penulis Konten Wargabal
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500 font-medium">
                <span className="inline-flex items-center gap-1.5 tabular-nums">
                  <Calendar size={14} className="text-[#0d9488]" />
                  {formattedDate}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} className="text-[#0d9488]" />
                  {readDuration}
                </span>
              </div>
            </div>
          </div>

          {/* Isi Teks Narasi Berparagraf Nyaman Dibaca */}
          <div className="prose prose-slate max-w-none text-sm sm:text-base font-normal text-slate-700 leading-relaxed space-y-4">
            {article.content.split('\n').map((paragraph, index) => {
              const trimmed = paragraph.trim();
              if (!trimmed) return null;
              return (
                <p key={index} className="leading-relaxed">
                  {trimmed}
                </p>
              );
            })}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* 3. FOOTER MODAL: TOMBOL TUTUP DI SUDUT KANAN BAWAH                   */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-sm transition-all cursor-pointer inline-flex items-center justify-center [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

