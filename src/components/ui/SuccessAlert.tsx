import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * KOMPONEN FLOATING SUCCESS ALERT / TOAST
 * ==============================================================================
 * Menampilkan kartu popover notifikasi sukses mengambang di atas halaman
 * dengan ikon centang lingkaran hijau dan pesan status sesuai desain mockup:
 * - "Berhasil login!"
 * - "Berhasil logout!"
 * - "Berhasil register!"
 */
export default function SuccessAlert() {
  const { isOpen, message, hideAlert } = useAlertStore();

  if (!isOpen) return null;

  return (
    <aside
      className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[9999] pointer-events-auto cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-250 ease-out"
      onClick={hideAlert}
      role="status"
      aria-live="polite"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100/90 px-6 sm:px-8 py-4 sm:py-5 flex items-center gap-4 sm:gap-5 min-w-[260px] sm:min-w-[330px] max-w-[92vw] select-none hover:shadow-xl transition-shadow">
        {/* Lingkaran Ikon Centang Hijau Sesuai Mockup */}
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#f0fdf4] border-[3.5px] border-[#bbf7d0] flex items-center justify-center shrink-0">
          <svg
            className="w-6 h-6 sm:w-7 sm:h-7 text-[#22c55e]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Teks Pesan Notifikasi Sukses */}
        <span className="text-xl sm:text-2xl font-bold text-[#1e293b] tracking-tight">
          {message}
        </span>
      </div>
    </aside>
  );
}
