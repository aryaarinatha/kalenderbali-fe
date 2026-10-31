import { useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useRamalanSifat } from '../hooks/useRamalanSifat';
import { RamalanSifatHero } from '../components/RamalanSifatHero';
import { RamalanSifatForm } from '../components/RamalanSifatForm';
import { RamalanSifatResultSection } from '../components/RamalanSifatResultSection';
import { RamalanSifatResultSectionSkeleton } from '../components/RamalanSifatSkeleton';

/**
 * ============================================================================
 * HALAMAN UTAMA: RamalanSifatPage
 * ============================================================================
 * Halaman orkestrator fitur Ramalan Sifat Penanggalan Bali yang menyatukan:
 *  1. Header & Hero Banner Refleksi (RamalanSifatHero).
 *  2. Form Input Tanggal Lahir & Waktu Lahir Jam 06.00 (RamalanSifatForm).
 *  3. Dynamic Document Title: Memperbarui judul tab browser secara reaktif
 *     berdasarkan tanggal atau weton yang sedang dianalisis.
 *  4. Dual-State Rendering:
 *     - Belum ada input: Menampilkan petunjuk awal eksplorasi budaya.
 *     - Sedang memuat: Menampilkan RamalanSifatResultSectionSkeleton (CLS = 0).
 *     - Berhasil: Menampilkan RamalanSifatResultSection (100% Real Data).
 *     - Terjadi kesalahan: Menampilkan kartu error interaktif dengan tombol "Coba Lagi".
 *  5. Navigasi Cepat (Scroll-to-Form) saat tombol "Ubah" pada hasil diklik.
 *
 * Menerapkan Standar AGENTS.md & fe_strategy.md:
 *  - URL-as-State synchronization (?birth_date=YYYY-MM-DD&time=before_06)
 *  - Zero layout shift (CLS = 0)
 * ============================================================================
 */

export default function RamalanSifatPage() {
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    activeParams,
    hasActiveSearch,
    executeSearch,
  } = useRamalanSifat();

  // Ref kontainer form untuk aksi scroll halus saat pengguna klik tombol "Ubah"
  const formSectionRef = useRef<HTMLDivElement>(null);

  // -------------------------------------------------------------------------
  // BLOK 1: SINKRONISASI JUDUL TAB BROWSER (DYNAMIC DOCUMENT TITLE)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (data?.identitas_kelahiran) {
      document.title = `Ramalan Sifat: ${data.identitas_kelahiran.ringkasan_weton} | Kalender Bali`;
    } else {
      document.title = 'Ramalan Sifat · Refleksi Karakter Penanggalan Bali | Kalender Bali';
    }
  }, [data]);

  // -------------------------------------------------------------------------
  // BLOK 2: HANDLER PENGIRIMAN PENCARIAN & MODIFIKASI TANGGAL
  // -------------------------------------------------------------------------
  const handleFormSubmit = (birthDate: string, sebelumJam6: boolean) => {
    executeSearch(birthDate, sebelumJam6);
  };

  const handleModifySearch = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 3: HEADER BREADCRUMB & HERO BANNER REFLEKSI                      */}
      {/* ===================================================================== */}
      <RamalanSifatHero />

      {/* ===================================================================== */}
      {/* BLOK 4: FORM PENCARIAN TANGGAL LAHIR (DENGAN REF SCROLL)              */}
      {/* ===================================================================== */}
      <div ref={formSectionRef}>
        <RamalanSifatForm
          initialBirthDate={activeParams?.tanggal_lahir || ''}
          initialSebelumJam6={activeParams?.sebelum_jam_6 || false}
          onSubmit={handleFormSubmit}
          isLoading={isLoading || isFetching}
        />
      </div>

      {/* ===================================================================== */}
      {/* BLOK 5: AREA PENYAJIAN HASIL (CONDITIONAL STATES)                     */}
      {/* ===================================================================== */}
      {/* Skenario A: Sedang Memuat Data (Loading Skeleton CLS = 0) */}
      {(isLoading || (isFetching && !data)) && (
        <RamalanSifatResultSectionSkeleton />
      )}

      {/* Skenario B: Terjadi Kesalahan Jaringan / Validasi Server */}
      {isError && !isLoading && (
        <div className="bg-white rounded-2xl border border-rose-200/90 p-6 sm:p-8 shadow-xs text-center max-w-xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h4 className="text-base sm:text-lg font-extrabold text-[#0f172a]">
              Gagal Memuat Ramalan Sifat
            </h4>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {error || 'Terjadi gangguan saat menghubungkan ke server Kalender Bali.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all active:scale-98 cursor-pointer [touch-action:manipulation]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      )}

      {/* Skenario C: Data Berhasil Dimuat (100% Real Data Dari Go Backend) */}
      {data && !isLoading && (
        <RamalanSifatResultSection
          data={data}
          onModifySearch={handleModifySearch}
        />
      )}

      {/* Skenario D: Keadaan Awal (Belum Ada Tanggal Lahir yang Dicari) */}
      {!hasActiveSearch && !isLoading && (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e6f7f5] border border-teal-200/60 text-teal-700 flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-extrabold text-[#0f172a] tracking-tight">
            Telusuri Karakter Berdasarkan Penanggalan Bali
          </h4>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Pilih tanggal lahir Anda pada formulir di atas untuk menelaah komposisi 4 pilar watak
            (Pancawara, Saptawara, Wuku, dan Zodiak) berdasarkan tradisi Wariga Bali.
          </p>
        </div>
      )}
    </div>
  );
}
