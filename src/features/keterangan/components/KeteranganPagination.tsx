import React, { useMemo } from 'react';

/**
 * ============================================================================
 * TIPE DATA PROPS KOMPONEN KeteranganPagination
 * ============================================================================
 * Mendefinisikan kontrak parameter yang dibutuhkan untuk kontrol navigasi halaman:
 *  - currentPage: Nomor halaman aktif saat ini (1-indexed, dimulai dari 1).
 *  - totalEntries: Jumlah total entri data yang tersedia (setelah disaring pencarian).
 *  - itemsPerPage: Jumlah item yang ditampilkan dalam satu halaman (default: 10).
 *  - onPageChange: Callback saat tombol nomor halaman atau Sebelumnya/Berikutnya diklik.
 *  - unfilteredCount: (Opsional) Jumlah total data sebelum disaring, untuk informasi audit.
 * ============================================================================
 */
export interface KeteranganPaginationProps {
  currentPage: number;
  totalEntries: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  unfilteredCount?: number;
}

/**
 * ============================================================================
 * HELPER: Menghitung Rentang Nomor Halaman (Smart Pagination Range with '..')
 * ============================================================================
 * Menghasilkan susunan nomor halaman yang rapi dan ringkas seperti standar DataTables:
 *  - Jika total halaman <= 7: Tampilkan semua nomor halaman [1, 2, 3, 4, 5, 6, 7].
 *  - Jika halaman aktif berada di awal (<= 4): Tampilkan [1, 2, 3, 4, 5, '..', totalPages].
 *  - Jika halaman aktif berada di akhir (>= total - 3): Tampilkan [1, '..', end-4, ..., totalPages].
 *  - Jika halaman aktif di tengah: Tampilkan [1, '..', curr-1, curr, curr+1, '..', totalPages].
 * ============================================================================
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Kondisi 1: Berada di rentang awal halaman (contoh: [1, 2, 3, 4, 5, '..', 11])
  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, '..', totalPages];
  }

  // Kondisi 2: Berada di rentang akhir halaman (contoh: [1, '..', 7, 8, 9, 10, 11])
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

  // Kondisi 3: Berada di tengah rentang halaman (contoh: [1, '..', 4, 5, 6, '..', 11])
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
 * ============================================================================
 * KOMPONEN UI: KeteranganPagination
 * ============================================================================
 * Merender baris kontrol navigasi pagination yang presisi sesuai desain acuan:
 *  1. Sisi Kiri: Teks informasi "Menampilkan X sampai Y dari Z entri".
 *  2. Sisi Kanan: Segmented control tombol dengan pembatas garis vertikal:
 *     [ Sebelumnya ] [ 1 ] [ 2 ] [ 3 ] [ 4 ] [ 5 ] [ .. ] [ 11 ] [ Berikutnya ]
 * ============================================================================
 */
export const KeteranganPagination: React.FC<KeteranganPaginationProps> = ({
  currentPage,
  totalEntries,
  itemsPerPage = 10,
  onPageChange,
  unfilteredCount,
}) => {
  // ---------------------------------------------------------------------------
  // 1. PERHITUNGAN MATEMATIS HALAMAN & INDEKS ITEM
  // ---------------------------------------------------------------------------
  // Total halaman minimal 1 agar tetap menampilkan antarmuka halaman yang konsisten
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));

  // Hitung indeks awal (1-indexed) dan indeks akhir yang sedang ditampilkan
  const startItem = totalEntries === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalEntries);

  // Buat susunan array nomor halaman dan simbol elipsis '..'
  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages),
    [currentPage, totalPages]
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:px-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* =================================================================== */}
      {/* BLOK 1: TEKS INFORMASI RENTANG ENTRI AKTIF (SISI KIRI)             */}
      {/* =================================================================== */}
      <div className="text-xs sm:text-sm font-medium text-slate-600 text-center sm:text-left">
        <span>Menampilkan </span>
        <span className="font-bold text-[#0f172a] tabular-nums">{startItem}</span>
        <span> sampai </span>
        <span className="font-bold text-[#0f172a] tabular-nums">{endItem}</span>
        <span> dari </span>
        <span className="font-bold text-[#0f172a] tabular-nums">{totalEntries}</span>
        <span> entri</span>

        {/* Info tambahan jika sedang dalam kondisi pencarian/penyaringan */}
        {unfilteredCount !== undefined && unfilteredCount !== totalEntries && (
          <span className="text-slate-400 font-normal">
            {' '}(disaring dari {unfilteredCount} total entri)
          </span>
        )}
      </div>

      {/* =================================================================== */}
      {/* BLOK 2: SEGMENTED BUTTON CONTROLS PAGINATION (SISI KANAN)           */}
      {/* =================================================================== */}
      <nav
        aria-label="Navigasi Halaman Entri"
        className="inline-flex items-stretch rounded-lg border border-slate-200 overflow-hidden divide-x divide-slate-200 text-xs sm:text-sm bg-white shadow-2xs"
      >
        {/* ================================================================= */}
        {/* TOMBOL: "Sebelumnya"                                              */}
        {/* ================================================================= */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
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

        {/* ================================================================= */}
        {/* DAFTAR NOMOR HALAMAN & ELIPSIS '..'                               */}
        {/* ================================================================= */}
        {paginationRange.map((page, index) => {
          // Jika elemen berupa pemisah elipsis '..'
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

          // Jika elemen berupa tombol nomor halaman
          const isActive = page === currentPage;
          return (
            <button
              key={`page-${page}`}
              type="button"
              onClick={() => onPageChange(page)}
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

        {/* ================================================================= */}
        {/* TOMBOL: "Berikutnya"                                              */}
        {/* ================================================================= */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
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
  );
};
