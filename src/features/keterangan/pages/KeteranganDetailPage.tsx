import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Info,
  RefreshCw,
  Search,
} from 'lucide-react';
import {
  ALL_CATEGORY_REGISTRY,
  type KeteranganType,
  type KeteranganValue,
} from '../types/keterangan.types';
import {
  useKeteranganTypes,
  useKeteranganTypeDetail,
} from '../hooks/useKeterangan';
import { KeteranganPagination } from '../components/KeteranganPagination';

/** Konfigurasi jumlah item maksimum per halaman (10 entri per halaman) */
const ITEMS_PER_PAGE = 10;

/**
 * ============================================================================
 * HALAMAN UTAMA (PAGE 2): KeteranganDetailPage
 * ============================================================================
 * Halaman penuh mandiri (bukan modal mengambang) untuk menampilkan seluruh rincian
 * elemen nilai dari satu kategori referensi Kalender Bali terpilih.
 *
 * Contoh URL Rute:
 *  - /keterangan/wuku
 *  - /keterangan/ingkel
 *  - /keterangan/hari_raya
 *  - /keterangan/ala_ayuning_dewasa
 *
 * Keunggulan Arsitektur 2 Halaman (Mengikuti Masukan Pengguna & Sistem Lama):
 *  1. Tata Letak Penuh & Leluasa: Rincian kategori yang memiliki ratusan entri
 *     (seperti 220 Ala Ayuning Dewasa atau 106 Hari Raya) tersaji secara luas
 *     tanpa terhimpit oleh batasan ukuran modal pop-up.
 *  2. Alur Navigasi Alami: Dilengkapi tombol "Kembali ke Daftar Kategori" di bagian
 *     atas dan bawah (sesuai tombol 'Kembali' ungu pada sistem lama).
 *  3. Filter Pencarian Cepat 0ms: Input penyaring lokal di memori klien dengan useMemo.
 *  4. Audit-Friendly Empty State: Jika data di backend masih kosong (Sadwara, Neptu, dll),
 *     halaman menampilkan status audit transparan.
 * ============================================================================
 */

export default function KeteranganDetailPage() {
  const { typeCode } = useParams<{ typeCode: string }>();
  const navigate = useNavigate();

  // State lokal untuk filter pencarian instan nama elemen di halaman ini
  const [searchTerm, setSearchTerm] = useState('');

  // ---------------------------------------------------------------------------
  // 1. RESOLUSI METADATA KATEGORI DARI REGISTRI & CACHE BACKEND
  // ---------------------------------------------------------------------------
  const { categories } = useKeteranganTypes();

  // Cari metadata kategori yang sedang dibuka berdasarkan parameter URL :typeCode
  const category = useMemo<KeteranganType | null>(() => {
    if (!typeCode) return null;

    // 1. Cocokkan dengan data kategori gabungan (live backend + registri)
    const match = categories.find(
      (c) => c.code.toLowerCase() === typeCode.toLowerCase()
    );
    if (match) return match;

    // 2. Fallback ke ALL_CATEGORY_REGISTRY jika cache types belum selesai
    const regItem = ALL_CATEGORY_REGISTRY.find(
      (c) => c.code.toLowerCase() === typeCode.toLowerCase()
    );
    if (regItem) {
      return {
        id: `reg_${regItem.code}`,
        code: regItem.code,
        name: regItem.name,
        description: regItem.defaultDescription,
        isPendingBackend: !regItem.isCoreActive,
      };
    }

    return null;
  }, [categories, typeCode]);

  // ---------------------------------------------------------------------------
  // 2. PENARIKAN DATA ELEMEN NILAI VIA TANSTACK QUERY (ZERO-LOADING)
  // ---------------------------------------------------------------------------
  const { values, isLoading, isError, error, refetch, isPending } =
    useKeteranganTypeDetail(typeCode || null);

  // ---------------------------------------------------------------------------
  // 3. PENYARINGAN ELEMEN DI SISI KLIEN (0ms Client-Side Instant Filter)
  // ---------------------------------------------------------------------------
  const filteredValues = useMemo<KeteranganValue[]>(() => {
    if (!searchTerm.trim()) return values;

    const query = searchTerm.toLowerCase().trim();
    return values.filter((item) => {
      const matchName = item.name.toLowerCase().includes(query);
      const matchDesc = item.description.toLowerCase().includes(query);
      // Alias tetap aktif sebagai pendukung pencarian (walaupun tidak ditampilkan di card UI)
      const matchAlias = item.aliases?.some((alias) =>
        alias.toLowerCase().includes(query)
      );
      return matchName || matchDesc || Boolean(matchAlias);
    });
  }, [values, searchTerm]);

  // ---------------------------------------------------------------------------
  // 4. PEMBAGIAN HALAMAN KLIEN (CLIENT-SIDE PAGINATION: 10 ITEM PER HALAMAN)
  // ---------------------------------------------------------------------------
  // Nomor halaman aktif (1-indexed, dimulai dari 1)
  const [currentPage, setCurrentPage] = useState(1);

  // Reset nomor halaman kembali ke halaman 1 saat pencarian atau kategori berganti
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeCode]);

  // Perhitungan matematis total halaman dan indeks rentang item aktif
  const totalEntries = filteredValues.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalEntries);

  // Potongan 10 data elemen nilai yang aktif disajikan pada halaman saat ini
  const paginatedValues = useMemo<KeteranganValue[]>(() => {
    return filteredValues.slice(startIndex, endIndex);
  }, [filteredValues, startIndex, endIndex]);

  /**
   * Mengubah nomor halaman dan menggulir halus kembali ke posisi atas daftar
   */
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && newPage !== currentPage) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 220, behavior: 'smooth' });
    }
  };

  // ---------------------------------------------------------------------------
  // 4. DYNAMIC DOCUMENT TITLE (fe_strategy.md Bab 8.13)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (category) {
      document.title = `${category.name} · Rincian Keterangan Kalender Bali | Kalender Bali`;
    } else {
      document.title = 'Rincian Keterangan Kalender Bali | Kalender Bali';
    }
  }, [category]);

  // Kondisi penanda kategori khusus untuk elemen zodiak (menampilkan rentang tanggal masehi)
  const isZodiak = typeCode?.toLowerCase() === 'zodiak';

  return (
    <div className="space-y-6 pb-16 max-w-[1560px] mx-auto select-none">
      {/* =================================================================== */}
      {/* 1. HEADER & HERO BANNER SECTION (Sesuai Gaya HariRayaHero)          */}
      {/* =================================================================== */}
      <div className="space-y-1.5">
        {/* Breadcrumb navigasi hierarkis */}
        <nav
          aria-label="Breadcrumb"
          className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
        >
          <span
            onClick={() => navigate('/')}
            className="hover:text-slate-600 cursor-pointer"
          >
            Wargabali
          </span>
          <span className="text-slate-300">/</span>
          <span
            onClick={() => navigate('/layanan/keterangan')}
            className="hover:text-slate-600 cursor-pointer"
          >
            Layanan
          </span>
          <span className="text-slate-300">/</span>
          <span
            onClick={() => navigate('/layanan/keterangan')}
            className="hover:text-slate-600 cursor-pointer"
          >
            Keterangan
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-teal-700 font-bold">
            {category?.name || typeCode}
          </span>
        </nav>

        {/* Judul H1 Kategori */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
          {category?.name || 'Keterangan Kategori'}
        </h1>

        {/* Uraian makna / deskripsi ringkas kategori */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
          {category?.description ||
            'Katalog rincian elemen dan makna filosofis penanggalan Bali.'}
        </p>
      </div>

      {/* =================================================================== */}
      {/* 2. TOOLBAR PENYARING ELEMEN LOKAL (0ms Client-Side Instant Filter)  */}
      {/* =================================================================== */}
      {!isPending && values.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Input Pencarian */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Saring elemen ${category?.name || ''} berdasarkan nama atau makna...`}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
            />
          </div>

          {/* Keterangan Jumlah Saring & Status Halaman */}
          <span className="text-xs font-semibold text-slate-400 tabular-nums">
            Menampilkan {totalEntries === 0 ? 0 : startIndex + 1}–{endIndex} dari {totalEntries} Elemen (Halaman {currentPage}/{totalPages})
          </span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. STATE PENANGANAN JARINGAN (ERROR STATE)                          */}
      {/* =================================================================== */}
      {isError && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-bold text-[#0f172a]">
                Gagal Memuat Rincian Kategori
              </h4>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
                {error || 'Terjadi kesalahan saat menghubungi server backend.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            className="h-10 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center gap-2 shrink-0 [touch-action:manipulation]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. SKELETON SCREEN LOADING (ZERO CLS: DAFTAR 1 KOLOM IDENTIK)       */}
      {/* =================================================================== */}
      {isLoading && (
        <div className="space-y-4 w-full animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="w-48 h-5 bg-slate-200 rounded" />
                <div className="w-16 h-5 bg-slate-100 rounded-full" />
              </div>
              <div className="space-y-1.5">
                <div className="w-full h-3.5 bg-slate-100 rounded" />
                <div className="w-3/4 h-3.5 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. STATUS PENDING / BELUM DIISI DI DATABASE BACKEND GO              */}
      {/* =================================================================== */}
      {isPending && (
        <div className="bg-white rounded-2xl border border-amber-200/80 p-8 sm:p-12 text-center space-y-3 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center justify-center mx-auto">
            <Info size={28} />
          </div>
          <h3 className="text-base sm:text-lg font-extrabold text-amber-900">
            Data Belum Tersedia di Database
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Kategori <strong>{category?.name || typeCode}</strong> terdaftar pada
            sistem penanggalan Bali lama, namun entri nilainya saat ini masih kosong
            di database backend. Silakan lengkapi tabel{' '}
            <code className="px-1.5 py-0.5 rounded bg-amber-100 font-mono text-xs text-amber-900 font-bold">
              calendar_reference_values
            </code>{' '}
            di backend untuk memunculkan rincian elemen kategori ini.
          </p>
        </div>
      )}

      {/* =================================================================== */}
      {/* 6. DAFTAR ELEMEN NILAI PENUH (1 BARIS PER ITEM)                     */}
      {/* =================================================================== */}
      {!isLoading && !isPending && (
        <>
          {filteredValues.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-12 text-center text-slate-400 space-y-2">
              <p className="text-base font-bold text-slate-700">
                Tidak ada elemen yang cocok
              </p>
              <p className="text-xs text-slate-500">
                Tidak ditemukan elemen dengan kata kunci &quot;{searchTerm}&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Daftar 1 Kolom Vertikal (1 Item per Baris untuk Kemudahan Membaca Urutan) */}
              <div className="flex flex-col gap-4">
                {paginatedValues.map((item, idx) => {
                  // Hitung nomor urut berkelanjutan berdasarkan halaman aktif
                  const itemNumber = startIndex + idx + 1;

                  return (
                    <div
                      key={item.id || itemNumber}
                      className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:border-teal-500/40 hover:shadow-sm transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2.5">
                        {/* Header Elemen: Nomor Urut Berkelanjutan, Nama, & Urip */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 h-7 rounded-xl bg-teal-50 text-teal-800 border border-teal-200/60 text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                              {itemNumber}
                            </span>
                            <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
                              {item.name}
                            </h3>
                          </div>

                          {/* Lencana Urip (jika ada nilai urip) */}
                          {typeof item.urip === 'number' && (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 tabular-nums">
                              Urip {item.urip}
                            </span>
                          )}
                        </div>

                        {/* Khusus Kategori Zodiak: Render Rentang Tanggal & Gambar Vektor SVG */}
                        {isZodiak && item.zodiac_detail && (
                          <div className="flex items-center gap-3.5 p-3 rounded-xl bg-sky-50/60 border border-sky-100 my-2">
                            {item.legacy_id && (
                              <img
                                src={`/assets/images/zodiak/Asset_${item.legacy_id}.svg`}
                                alt={item.name}
                                className="w-10 h-10 object-contain shrink-0 filter drop-shadow-2xs"
                              />
                            )}
                            <span className="text-xs font-semibold text-sky-800 tabular-nums">
                              Rentang Tanggal: {item.zodiac_detail.start_day}/
                              {item.zodiac_detail.start_month} - {item.zodiac_detail.end_day}/
                              {item.zodiac_detail.end_month}
                            </span>
                          </div>
                        )}

                        {/* Deskripsi Lengkap Nilai Budaya */}
                        {item.description ? (
                          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed">
                            {item.description}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            Uraian deskripsi elemen ini belum diisi di database.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ============================================================= */}
              {/* KONTROL PAGINATION RESMI (10 ITEM PER HALAMAN DENGAN '..')     */}
              {/* ============================================================= */}
              <KeteranganPagination
                currentPage={currentPage}
                totalEntries={totalEntries}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={handlePageChange}
                unfilteredCount={values.length}
              />
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* 7. TOMBOL BAWAH: "KEMBALI KE DAFTAR KATEGORI" (SEPERTI SISTEM LAMA) */}
      {/* =================================================================== */}
      <div className="pt-6 flex justify-start">
        <button
          type="button"
          onClick={() => navigate('/layanan/keterangan')}
          className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center gap-2 [touch-action:manipulation]"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Daftar Kategori</span>
        </button>
      </div>
    </div>
  );
}
