import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ExternalLink,
  Info,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import type { KeteranganType, KeteranganValue } from '../types/keterangan.types';
import { useKeteranganTypeDetail } from '../hooks/useKeterangan';

/**
 * ============================================================================
 * KOMPONEN: KeteranganDetailModal (Modal Dialog Rincian Elemen Kategori)
 * ============================================================================
 * Modal dialog pop-up universal untuk menyajikan daftar seluruh elemen bernilai
 * dari kategori yang diklik (contoh: 30 Wuku, 6 Ingkel, 106 Hari Raya, dll).
 *
 * Mengikuti Aturan Baku AGENTS.md (Bab 4.7):
 *  1. createPortal(..., document.body) dengan z-index z-[100]
 *  2. Latar backdrop blur: fixed inset-0 bg-slate-900/40 backdrop-blur-xs
 *  3. Header bergradien: bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30
 *  4. Tombol tutup silang (X) ergonomis min 36x36px
 *  5. Body scrollable independen dengan overflow-y-auto
 *  6. Aksesibilitas: Listener keyboard tombol "Escape" dan kunci scroll body
 *  7. Cross-Feature Links: Tautan cepat ke modul Kalender Hari Raya / Ala Ayuning
 * ============================================================================
 */

interface KeteranganDetailModalProps {
  /** Status keterbukaan modal dialog */
  isOpen: boolean;
  /** Callback untuk menutup modal dialog */
  onClose: () => void;
  /** Kategori yang sedang dipilih untuk ditampilkan rinciannya */
  category: KeteranganType | null;
}

export const KeteranganDetailModal: React.FC<KeteranganDetailModalProps> = ({
  isOpen,
  onClose,
  category,
}) => {
  const navigate = useNavigate();

  // State lokal untuk filter pencarian instan di dalam modal (0ms Client-Side Filter)
  const [localSearchTerm, setLocalSearchTerm] = useState('');

  // Reset kata kunci pencarian setiap kali kategori yang dibuka berganti
  const [prevCategoryCode, setPrevCategoryCode] = useState<string | undefined>(
    category?.code
  );
  if (category?.code !== prevCategoryCode) {
    setPrevCategoryCode(category?.code);
    setLocalSearchTerm('');
  }

  // Tarik data elemen kategori dari Backend Go via TanStack Query (Zero-Loading)
  const { values, isLoading, isError, error, isPending } =
    useKeteranganTypeDetail(isOpen && category ? category.code : null);

  // Filter elemen secara lokal di memori klien dengan useMemo (0ms latency)
  const filteredValues = useMemo<KeteranganValue[]>(() => {
    if (!localSearchTerm.trim()) return values;

    const query = localSearchTerm.toLowerCase().trim();
    return values.filter((item) => {
      const matchName = item.name.toLowerCase().includes(query);
      const matchDesc = item.description.toLowerCase().includes(query);
      const matchAlias = item.aliases?.some((alias) =>
        alias.toLowerCase().includes(query)
      );
      return matchName || matchDesc || Boolean(matchAlias);
    });
  }, [values, localSearchTerm]);

  // Listener tombol keyboard "Escape" dan penguncian scroll latar belakang dokumen
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Jangan render apapun jika modal dalam keadaan tertutup atau kategori belum dipilih
  if (!isOpen || !category) return null;

  const isZodiacCategory = category.code.toLowerCase() === 'zodiak';
  const isHariRayaCategory = category.code.toLowerCase() === 'hari_raya';
  const isAlaAyuningCategory = category.code.toLowerCase() === 'ala_ayuning_dewasa';

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* =============================================================== */}
        {/* 1. HEADER MODAL: Judul Kategori, Filosofi, & Tombol Tutup (X)     */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-7 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
          <div className="space-y-1.5 min-w-0 pr-2">
            {/* Lencana Modul Kategori */}
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] flex items-center gap-1.5 select-none">
              <Sparkles size={13} className="shrink-0" />
              RINCIAN KETERANGAN
            </span>

            {/* Nama Judul Kategori */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight truncate">
              {category.name}
            </h2>

            {/* Uraian Makna Filosofis Kategori */}
            {category.description ? (
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                {category.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Keterangan umum belum diisi di database.
              </p>
            )}
          </div>

          {/* Tombol Tutup Silang (X) Ergonomis */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 min-w-9 min-h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 rounded-xl cursor-pointer transition-all shrink-0 [touch-action:manipulation]"
            aria-label="Tutup jendela rincian"
          >
            <X size={18} />
          </button>
        </div>

        {/* =============================================================== */}
        {/* 2. TOOLBAR KHUSUS & CROSS-FEATURE LINKS                          */}
        {/* =============================================================== */}
        {(isHariRayaCategory || isAlaAyuningCategory) && (
          <div className="px-6 py-3 bg-[#e6f7f5]/60 border-b border-[#ccf0ea] flex items-center justify-between gap-3 text-xs shrink-0">
            <span className="text-teal-800 font-medium truncate flex items-center gap-1.5">
              <Info size={14} className="shrink-0 text-[#0d9488]" />
              {isHariRayaCategory
                ? 'Tersedia kalender jadwal perayaan lengkap sepanjang tahun.'
                : 'Tersedia modul kalkulasi hari baik berdasarkan wewaran.'}
            </span>

            {isHariRayaCategory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/hari-raya');
                }}
                className="font-bold text-[#0e9f90] hover:text-[#0c8a7d] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Buka Hari Raya</span>
                <ExternalLink size={12} />
              </button>
            )}

            {isAlaAyuningCategory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate('/ala-ayuning-dewasa');
                }}
                className="font-bold text-[#0e9f90] hover:text-[#0c8a7d] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Buka Dewasa Ayu</span>
                <ExternalLink size={12} />
              </button>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* 3. INPUT PENCARIAN ELEMEN LOKAL (0ms Instant Client Filter)       */}
        {/* =============================================================== */}
        {!isPending && values.length > 0 && (
          <div className="p-4 sm:px-7 sm:py-3.5 border-b border-slate-100 bg-white shrink-0">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                placeholder={`Saring elemen ${category.name} (contoh: nama atau makna)...`}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
              {localSearchTerm && (
                <button
                  type="button"
                  onClick={() => setLocalSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* 4. BODY MODAL: DAFTAR ELEMEN / EMPTY STATE / LOADING STATE       */}
        {/* =============================================================== */}
        <div className="overflow-y-auto p-6 sm:p-7 space-y-3.5 flex-1">
          {/* A. Status Loading Shimmer */}
          {isLoading && (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2"
                >
                  <div className="w-36 h-4 bg-slate-200 rounded" />
                  <div className="w-full h-10 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* B. Status Kesalahan API */}
          {isError && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-600" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold block">Gagal Memuat Rincian</span>
                <span>{error || 'Terjadi kesalahan saat menghubungi server.'}</span>
              </div>
            </div>
          )}

          {/* C. Status Kategori Pending / Belum Diisi di Database Backend */}
          {isPending && (
            <div className="p-6 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-center space-y-2.5 my-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-800 flex items-center justify-center mx-auto">
                <Info size={24} />
              </div>
              <h4 className="text-sm sm:text-base font-bold text-amber-900">
                Data Belum Tersedia di Database
              </h4>
              <p className="text-xs sm:text-sm text-amber-800/90 leading-relaxed max-w-md mx-auto">
                Kategori <strong>{category.name}</strong> terdaftar pada sistem
                penanggalan Bali lama, namun entri nilainya saat ini masih kosong di
                database backend. Silakan lengkapi tabel{' '}
                <code className="px-1.5 py-0.5 rounded bg-amber-200/60 font-mono text-xs">
                  calendar_reference_values
                </code>{' '}
                di backend untuk memunculkan rincian elemen ini.
              </p>
            </div>
          )}

          {/* D. Status Hasil Saring Lokal Tidak Ditemukan */}
          {!isLoading && !isPending && filteredValues.length === 0 && values.length > 0 && (
            <div className="p-8 text-center text-slate-400 space-y-1">
              <p className="text-sm font-semibold text-slate-700">
                Tidak ada elemen yang cocok
              </p>
              <p className="text-xs">
                Tidak ditemukan hasil dengan kata kunci &quot;{localSearchTerm}&quot;.
              </p>
            </div>
          )}

          {/* E. Daftar Elemen Nilai Riil dari Backend Go */}
          {!isLoading &&
            !isPending &&
            filteredValues.map((item, idx) => (
              <div
                key={item.id || idx}
                className="bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4 sm:p-5 space-y-2 hover:border-teal-500/30 transition-colors"
              >
                {/* Header Elemen: Nama & Lencana Nomor / Urip */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-teal-50 text-teal-800 text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                      {idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                      {item.name}
                    </h4>
                  </div>

                  {/* Lencana Urip (jika ada nilai urip) */}
                  {typeof item.urip === 'number' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 tabular-nums">
                      Urip {item.urip}
                    </span>
                  )}
                </div>

                {/* Khusus Kategori Zodiak: Render Rentang Tanggal & Gambar SVG */}
                {isZodiacCategory && item.zodiac_detail && (
                  <div className="flex items-center gap-3 py-1">
                    {item.legacy_id && (
                      <img
                        src={`/assets/images/zodiak/Asset_${item.legacy_id}.svg`}
                        alt={item.name}
                        className="w-10 h-10 object-contain shrink-0 filter drop-shadow-2xs"
                      />
                    )}
                    <span className="text-xs font-semibold text-teal-700 tabular-nums">
                      Rentang Tanggal: {item.zodiac_detail.start_day}/
                      {item.zodiac_detail.start_month} - {item.zodiac_detail.end_day}/
                      {item.zodiac_detail.end_month}
                    </span>
                  </div>
                )}

                {/* Deskripsi Filosofis & Makna Elemen */}
                {item.description ? (
                  <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Uraian deskripsi belum diisi di database.
                  </p>
                )}
              </div>
            ))}
        </div>

        {/* =============================================================== */}
        {/* 5. FOOTER MODAL: Total Elemen & Tombol Tutup                    */}
        {/* =============================================================== */}
        <div className="p-4 sm:px-7 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-4 shrink-0">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            Total:{' '}
            <strong className="text-slate-800">
              {filteredValues.length} Elemen
            </strong>
          </span>

          <button
            type="button"
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer [touch-action:manipulation]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
