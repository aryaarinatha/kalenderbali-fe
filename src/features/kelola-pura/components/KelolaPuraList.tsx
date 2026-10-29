import React, { useState, useMemo } from 'react';
import { SearchX } from 'lucide-react';
import type { PuraBackendItem } from '../types/kelolaPura.types';
import { KelolaPuraCard } from './KelolaPuraCard';

/**
 * ==============================================================================
 * PROPS: KelolaPuraList
 * ==============================================================================
 * Menerima daftar pura yang sudah difilter, status loading, dan callback interaksi:
 * - puras: array objek master pura
 * - isLoading: flag status pemuatan data dari backend
 * - onOpenDetail: callback membuka modal popup detail pura
 * - onViewPiodalan: callback beralih ke sub-halaman piodalan & susunan acara
 * - onViewKeuangan: callback beralih ke sub-halaman catatan kas pura
 * - onResetFilter: callback untuk mereset seluruh filter saat hasil kosong
 */
interface KelolaPuraListProps {
  puras: PuraBackendItem[];
  isLoading: boolean;
  onOpenDetail: (pura: PuraBackendItem) => void;
  onViewPiodalan: (puraId: number) => void;
  onViewKeuangan: (puraId: number) => void;
  onResetFilter: () => void;
}

/** Jumlah kartu per halaman (12 item agar simetris penuh dengan grid 3 kolom: 4 baris x 3 kartu) */
const ITEMS_PER_PAGE = 12;

/**
 * ==============================================================================
 * HELPER: getPaginationRange (Smart Pagination Range dengan '..')
 * ==============================================================================
 * Menghasilkan susunan nomor halaman yang rapi dan ringkas seperti standar Gambar 2:
 *  - Jika total halaman <= 7: Tampilkan semua nomor [1, 2, 3, 4, 5, 6, 7]
 *  - Jika halaman aktif berada di awal (<= 4): [1, 2, 3, 4, 5, '..', totalPages]
 *  - Jika halaman aktif berada di akhir (>= totalPages - 3): [1, '..', end-4, ..., totalPages]
 *  - Jika halaman aktif berada di tengah: [1, '..', curr-1, curr, curr+1, '..', totalPages]
 * ==============================================================================
 */
function getPaginationRange(currentPage: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Kondisi 1: Berada di rentang awal halaman (contoh: [1, 2, 3, 4, 5, '..', 47])
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '..', totalPages];
  }

  // Kondisi 2: Berada di rentang akhir halaman (contoh: [1, '..', 43, 44, 45, 46, 47])
  if (currentPage >= totalPages - 3) {
    return [
      1,
      '..',
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Kondisi 3: Berada di tengah rentang halaman (contoh: [1, '..', 9, 10, 11, '..', 47])
  return [
    1,
    '..',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    '..',
    totalPages,
  ];
}

/**
 * ==============================================================================
 * KOMPONEN: KelolaPuraList (Katalog Grid Pura & Paginasi Presisi Sesuai Gambar 2)
 * ==============================================================================
 * Mengorkestrasi tampilan koleksi kartu pura dengan standar performa fe_strategy.md:
 * 1. CLS=0 Skeleton Screens: Menggunakan 6 kerangka kartu berdimensi presisi
 *    selama query cache TanStack Query sedang dimuat.
 * 2. Empty State Bersahabat: Tampilan ilustratif informatif saat kriteria filter
 *    tidak menemukan kecocokan, lengkap dengan tombol reset.
 * 3. Grid Responsif: 1 kolom di ponsel (<640px), 2 kolom di tablet (>=640px),
 *    dan 3 kolom di desktop layar lebar (>=1280px).
 * 4. Paginasi Tersegmentasi (Identik Gambar 2):
 *    - Teks sisi kiri: "Menampilkan X sampai Y dari Z entri"
 *    - Sisi kanan: Segmented control [ Sebelumnya ] [ 1 ] [ 2 ] ... [ .. ] [ N ] [ Berikutnya ]
 * ==============================================================================
 */
export const KelolaPuraList: React.FC<KelolaPuraListProps> = ({
  puras,
  isLoading,
  onOpenDetail,
  onViewPiodalan,
  onViewKeuangan,
  onResetFilter,
}) => {
  // State halaman paginasi saat ini
  const [currentPage, setCurrentPage] = useState<number>(1);
  // Simpan panjang array sebelumnya untuk mereset paginasi saat hasil pencarian berubah (pola resmi React)
  const [prevPurasLength, setPrevPurasLength] = useState<number>(puras.length);

  if (prevPurasLength !== puras.length) {
    setPrevPurasLength(puras.length);
    setCurrentPage(1);
  }

  // Hitung total halaman yang dibutuhkan
  const totalPages = Math.max(1, Math.ceil(puras.length / ITEMS_PER_PAGE));

  // Potong array pura khusus untuk halaman aktif saat ini
  const paginatedPuras = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return puras.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [puras, currentPage]);

  // Hitung rentang nomor data yang sedang tampil (misal: "1 sampai 10 dari 461 entri")
  const startNumber = puras.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const endNumber = Math.min(currentPage * ITEMS_PER_PAGE, puras.length);

  // Buat susunan array nomor halaman dan simbol elipsis '..'
  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  // ============================================================================
  // 1. TAMPILAN SKELETON LOADING (CLS = 0 DENGAN DIMENSI KARTU PRESISI)
  // ============================================================================
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Sedang memuat katalog pura"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5"
      >
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between min-h-[210px] animate-pulse"
          >
            {/* Header Skeleton: Nama Pura & Lencana Sejajar Satu Baris */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="h-5 w-3/5 bg-slate-200 rounded-md" />
                <div className="h-6 w-20 bg-slate-200 rounded-full shrink-0" />
              </div>
              {/* Alamat Skeleton */}
              <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
              {/* Piodalan Skeleton */}
              <div className="h-4 w-2/3 bg-slate-100 rounded-md mt-2" />
            </div>

            {/* Footer Skeleton: Rincian Kiri & Dua Tombol Kanan */}
            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="h-4 w-20 bg-slate-200 rounded-md" />
              <div className="flex items-center gap-1.5">
                <div className="h-8 w-16 bg-slate-200 rounded-lg" />
                <div className="h-8 w-18 bg-slate-200 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ============================================================================
  // 2. TAMPILAN KOSONG / EMPTY STATE (TIDAK ADA DATA YANG COCOK)
  // ============================================================================
  if (puras.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs max-w-xl mx-auto space-y-4"
      >
        {/* Lingkaran Ikon Ilustratif Pencarian Nihil */}
        <div className="w-16 h-16 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center mx-auto text-[#0e9f90]">
          <SearchX className="w-8 h-8" aria-hidden="true" />
        </div>

        {/* Teks Pesan Informasi */}
        <div className="space-y-1.5">
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Pura tidak ditemukan
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Tidak ada pura yang cocok dengan kata kunci atau kombinasi filter wilayah yang Anda
            pilih. Coba gunakan kata kunci umum atau reset filter.
          </p>
        </div>

        {/* Tombol Aksi Reset Filter */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onResetFilter}
            aria-label="Kembalikan semua filter pencarian"
            className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-[#0e9f90] text-white hover:bg-[#0c8a7d] active:scale-95 transition-all shadow-xs cursor-pointer"
          >
            <span>Reset Seluruh Filter</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 3. TAMPILAN UTAMA: GRID KARTU PURA & KONTROL PAGINASI IDENTIK GAMBAR 2
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Grid Koleksi Kartu Pura Responsif */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
        {paginatedPuras.map((pura) => (
          <KelolaPuraCard
            key={pura.id}
            pura={pura}
            onOpenDetail={onOpenDetail}
            onViewPiodalan={onViewPiodalan}
            onViewKeuangan={onViewKeuangan}
          />
        ))}
      </div>

      {/* ====================================================================== */}
      {/* 4. BILAH KONTROL PAGINASI PRESTISI IDENTIK DENGAN GAMBAR 2             */}
      {/* ====================================================================== */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:px-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 select-none">
          {/* =================================================================== */}
          {/* BLOK 1: TEKS INFORMASI RENTANG ENTRI AKTIF (SISI KIRI)             */}
          {/* =================================================================== */}
          <div className="text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left">
            <span>Menampilkan </span>
            <span className="font-bold text-[#0f172a] tabular-nums">{startNumber}</span>
            <span> sampai </span>
            <span className="font-bold text-[#0f172a] tabular-nums">{endNumber}</span>
            <span> dari </span>
            <span className="font-bold text-[#0f172a] tabular-nums">
              {puras.length.toLocaleString('id-ID')}
            </span>
            <span> entri</span>
          </div>

          {/* =================================================================== */}
          {/* BLOK 2: SEGMENTED BUTTON CONTROLS PAGINATION (SISI KANAN)           */}
          {/* =================================================================== */}
          <nav
            aria-label="Navigasi Halaman Katalog Pura"
            className="inline-flex items-stretch rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200 text-xs sm:text-sm bg-white shadow-2xs"
          >
            {/* Tombol Sebelumnya */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage <= 1}
              aria-label="Halaman Sebelumnya"
              className={`h-9 sm:h-10 px-3.5 sm:px-4 flex items-center justify-center font-medium transition-colors select-none [touch-action:manipulation] ${
                currentPage <= 1
                  ? 'text-slate-300 bg-slate-50/60 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-[#e6f7f5] hover:text-[#0e9f90] active:bg-[#ccf0ea] cursor-pointer'
              }`}
            >
              Sebelumnya
            </button>

            {/* Nomor Halaman & Elipsis '..' */}
            {paginationRange.map((page, index) => {
              // Jika elemen berupa tanda pemisah elipsis '..'
              if (typeof page === 'string') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    aria-hidden="true"
                    className="h-9 sm:h-10 px-3 sm:px-3.5 flex items-center justify-center text-slate-400 font-semibold bg-white cursor-default select-none tracking-wider"
                  >
                    ..
                  </span>
                );
              }

              // Jika elemen berupa tombol nomor halaman aktif atau biasa
              const isActive = page === currentPage;
              return (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`Buka Halaman ${page}`}
                  className={`h-9 sm:h-10 min-w-[36px] sm:min-w-[42px] px-2.5 sm:px-3 flex items-center justify-center font-bold tabular-nums transition-colors select-none [touch-action:manipulation] cursor-pointer ${
                    isActive
                      ? 'bg-[#0e9f90] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#e6f7f5] hover:text-[#0e9f90] active:bg-[#ccf0ea] bg-white'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {/* Tombol Berikutnya */}
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage >= totalPages}
              aria-label="Halaman Berikutnya"
              className={`h-9 sm:h-10 px-3.5 sm:px-4 flex items-center justify-center font-medium transition-colors select-none [touch-action:manipulation] ${
                currentPage >= totalPages
                  ? 'text-slate-300 bg-slate-50/60 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-[#e6f7f5] hover:text-[#0e9f90] active:bg-[#ccf0ea] cursor-pointer'
              }`}
            >
              Berikutnya
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};
