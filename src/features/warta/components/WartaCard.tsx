/**
 * ==============================================================================
 * KOMPONEN: WartaCard (Kartu Artikel Warta Budaya Bali)
 * ==============================================================================
 * Menampilkan ringkasan kartu warta tunggal dalam tata letak kisi (grid).
 *
 * Menerapkan prinsip AGENTS.md:
 * 1. Desain Kartu Standar: bg-white rounded-2xl border border-slate-200/90 shadow-xs.
 * 2. Rasio Gambar 16:9 (aspect-video) dengan efek zoom mikro saat kartu di-hover.
 * 3. Tipografi Standar: Judul H3 font-extrabold text-[#0f172a], tanggal tabular-nums.
 * 4. Aksen Warna Semantik: Teal Tirta Bali (#0d9488, bg-[#e6f7f5]).
 * ==============================================================================
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Clock, ArrowRight } from 'lucide-react';
import type { ArticleBackendItem } from '../types/warta.types';
import { getArticleImageUrl, formatWartaDate, calculateReadTime } from '../api/wartaApi';

interface WartaCardProps {
  /** Objek data artikel tunggal dari Backend Go */
  article: ArticleBackendItem;

  /** Fungsi callback opsional ketika kartu warta diklik pengguna */
  onClick?: () => void;
}

export const WartaCard: React.FC<WartaCardProps> = ({ article, onClick }) => {
  // State cadangan jika gambar gagal dimuat oleh browser
  const [imgError, setImgError] = useState(false);

  // Resolusi URL gambar dengan penanganan path lama & baru
  const imageUrl = imgError
    ? 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'
    : getArticleImageUrl(article.image);

  const formattedDate = formatWartaDate(article.created_at);
  const readDuration = calculateReadTime(article.content);
  const authorName = article.author_name || 'Admin Wargabal';

  return (
    <Link
      to={`/warta/${article.id}`}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-teal-500/40 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col overflow-hidden active:scale-[0.99] [touch-action:manipulation] text-inherit no-underline select-none"
      aria-label={`Buka artikel: ${article.title}`}
    >
      <article className="flex flex-col flex-1 h-full">
      {/* ==================================================================== */}
      {/* 1. COVER GAMBAR WARTA (ASPECT-VIDEO 16:9)                            */}
      {/* Dilengkapi efek zoom mikro halus saat pointer mouse diarahkan        */}
      {/* ==================================================================== */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 shrink-0">
        <img
          src={imageUrl}
          alt={article.title}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out"
        />

        {/* Badge Penulis Mengambang di Sudut Kiri Bawah Gambar */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 backdrop-blur-md shadow-2xs border border-white/60">
          <User size={12} className="text-[#0d9488]" />
          <span className="text-[11px] font-bold text-slate-800 tracking-tight">
            {authorName}
          </span>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. BODY KARTU: METADATA, JUDUL & EXCERPT                              */}
      {/* ==================================================================== */}
      <div className="p-5 sm:p-6 flex flex-col flex-1 justify-between gap-4">
        <div className="space-y-2.5">
          {/* Baris Meta: Tanggal Terbit & Waktu Baca */}
          <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
            <span className="inline-flex items-center gap-1 tabular-nums">
              <Calendar size={13} className="text-slate-400" />
              {formattedDate}
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock size={13} className="text-slate-400" />
              {readDuration}
            </span>
          </div>

          {/* Judul Artikel (H3 Semantik) */}
          <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] group-hover:text-teal-700 transition-colors line-clamp-2 tracking-tight leading-snug">
            {article.title}
          </h3>

          {/* Cuplikan Teks Narasi (3 Baris Rapi) */}
          <p className="text-xs sm:text-sm font-normal text-slate-600 line-clamp-3 leading-relaxed">
            {article.content}
          </p>
        </div>

        {/* ==================================================================== */}
        {/* 3. FOOTER KARTU: TAUTAN INTERAKTIF BACA SELENGKAPNYA                 */}
        {/* ==================================================================== */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-teal-700 group-hover:text-teal-800">
          <span>Baca Selengkapnya</span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform duration-200"
          />
        </div>
      </div>
    </article>
    </Link>
  );
};

