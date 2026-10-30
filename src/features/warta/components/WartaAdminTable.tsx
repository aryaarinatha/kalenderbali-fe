/**
 * ==============================================================================
 * KOMPONEN: WartaAdminTable (Tabel Manajemen Warta Terpusat Redaksi)
 * ==============================================================================
 * Menyajikan seluruh basis data artikel warta dari semua admin dalam bentuk
 * tabel manajemen data (CMS) terpusat.
 *
 * Menerapkan prinsip AGENTS.md:
 * 1. Tata Letak Tabel Standar: thead bg-[#f8fafc] border-b border-slate-200/80.
 * 2. Tipografi Tabular: Tanggal dan angka menggunakan tabular-nums.
 * 3. Aksi Cepat Baris: Tombol Lihat, Edit, dan Hapus pada setiap baris data.
 * 4. Tombol Utama Header: Tombol "Tulis Warta Baru" di atas tabel.
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Eye, Edit3, Trash2, PenSquare, Calendar, User, FileText } from 'lucide-react';
import type { ArticleBackendItem } from '../types/warta.types';
import { getArticleImageUrl, formatWartaDate } from '../api/wartaApi';

interface WartaAdminTableProps {
  /** Seluruh daftar artikel warta di database */
  articles: ArticleBackendItem[];

  /** Callback untuk melihat detail artikel (membuka modal baca) */
  onView: (article: ArticleBackendItem) => void;

  /** Callback untuk mengedit artikel (membuka modal formulir) */
  onEdit: (article: ArticleBackendItem) => void;

  /** Callback untuk menghapus artikel */
  onDelete: (id: number | string, title: string) => void;

  /** Callback untuk membuka formulir tulis warta baru */
  onCreate: () => void;
}

export const WartaAdminTable: React.FC<WartaAdminTableProps> = ({
  articles,
  onView,
  onEdit,
  onDelete,
  onCreate,
}) => {
  // State pelacak ID baris yang sedang dalam proses penghapusan
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  const handleDeleteClick = (article: ArticleBackendItem) => {
    const confirmDelete = window.confirm(
      `Apakah Anda yakin ingin menghapus warta "${article.title}"? Tindakan ini akan menghapus artikel dari seluruh sistem.`
    );
    if (confirmDelete) {
      setDeletingId(article.id);
      onDelete(article.id, article.title);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs space-y-0">
      {/* ==================================================================== */}
      {/* 1. HEADER TABEL: KETERANGAN REDAKSI & TOMBOL TAMBAH                  */}
      {/* ==================================================================== */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-teal-50/50 via-white to-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight flex items-center gap-2">
            <FileText size={18} className="text-teal-700" />
            <span>Manajemen Basis Data Warta Redaksi</span>
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            Kelola seluruh artikel budaya yang terbit di publik secara terpusat.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="h-10 px-5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 shrink-0 [touch-action:manipulation]"
          title="Buat artikel baru"
        >
          <PenSquare size={15} />
          <span>+ Tulis Warta Baru</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* 2. TABEL DATA ARTIKEL TERPUSAT                                       */}
      {/* ==================================================================== */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#f8fafc] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 select-none">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Artikel & Cuplikan</th>
              <th className="py-3.5 px-4">Penulis</th>
              <th className="py-3.5 px-4">Tanggal Terbit</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Aksi Manajemen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {articles.map((article) => {
              const formattedDate = formatWartaDate(article.created_at);
              const authorName = article.author_name || 'Admin Redaksi';
              const imageUrl = getArticleImageUrl(article.image);
              const isDeleting = deletingId === article.id;

              return (
                <tr
                  key={article.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  {/* Kolom 1: Thumbnail & Judul */}
                  <td className="py-3.5 px-4 sm:px-6 max-w-md">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={imageUrl}
                        alt={article.title}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-200/70 shadow-2xs"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => onView(article)}
                          className="font-extrabold text-[#0f172a] text-sm hover:text-teal-700 transition-colors line-clamp-1 text-left cursor-pointer"
                        >
                          {article.title}
                        </button>
                        <p className="text-xs text-slate-400 line-clamp-1 font-normal">
                          {article.content}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Kolom 2: Penulis */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 text-[11px] font-bold border border-teal-200/60">
                      <User size={12} className="text-teal-700" />
                      <span>{authorName}</span>
                    </span>
                  </td>

                  {/* Kolom 3: Tanggal Terbit */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 tabular-nums font-semibold">
                      <Calendar size={13} className="text-slate-400" />
                      {formattedDate}
                    </span>
                  </td>

                  {/* Kolom 4: Tombol Aksi */}
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1 justify-end">
                      {/* Tombol Lihat Detail */}
                      <button
                        type="button"
                        onClick={() => onView(article)}
                        className="min-w-8 min-h-8 p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 active:bg-teal-100 transition-colors cursor-pointer"
                        title="Lihat Tampilan Warta"
                        aria-label="Lihat Warta"
                      >
                        <Eye size={16} />
                      </button>

                      {/* Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => onEdit(article)}
                        className="min-w-8 min-h-8 p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 active:bg-amber-100 transition-colors cursor-pointer"
                        title="Edit Warta Ini"
                        aria-label="Edit Warta"
                      >
                        <Edit3 size={16} />
                      </button>

                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(article)}
                        disabled={isDeleting}
                        className="min-w-8 min-h-8 p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 active:bg-rose-100 transition-colors cursor-pointer disabled:opacity-40"
                        title="Hapus Warta Ini"
                        aria-label="Hapus Warta"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

