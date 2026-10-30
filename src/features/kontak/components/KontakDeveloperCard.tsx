import React, { useState } from 'react';
import { ShieldCheck, Mail, Copy, Check } from 'lucide-react';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ============================================================================
 * KOMPONEN: KontakDeveloperCard (Kartu Terpadu Profil Pengembang & Email Estetik)
 * ============================================================================
 * Mengikuti AGENTS.md Bagian 4.2 (Standar Card Container) & fe_strategy.md Bab 8.4:
 *  1. Logo resmi Kalender Bali / Bali Integrated Solution (SVG vektor tajam)
 *  2. Identitas resmi PT Bali Integrated Solution & Tim Wargabali
 *  3. Pill Email Estetik: Ukuran kotak pas (snug) dengan isi email. Saat di-hover,
 *     kotak melebar secara halus (smooth width transition) untuk memunculkan ikon salin.
 * ============================================================================
 */
export const KontakDeveloperCard: React.FC = () => {
  const { showAlert } = useAlertStore();
  const [copied, setCopied] = useState<boolean>(false);
  const emailAddress = 'bali.integrated.solution@gmail.com';

  /**
   * Menyalin alamat email resmi ke clipboard pengguna dan menampilkan feedback toast
   */
  const handleCopyEmail = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(emailAddress);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = emailAddress;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      showAlert('Alamat email berhasil disalin ke papan klip!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      showAlert('Gagal menyalin alamat email.');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* ================================================================= */}
        {/* 1. SISI KIRI: LOGO RESMI, IDENTITAS, & DESKRIPSI MISI             */}
        {/* ================================================================= */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 flex-1 min-w-0">
          {/* Wadah Logo Vektor Presisi */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-teal-50/80 via-white to-emerald-50/50 border border-teal-200/60 p-2.5 sm:p-3 flex items-center justify-center shrink-0 shadow-2xs">
            <img
              src="/assets/images/icon/logo-kalenderbali.svg"
              alt="Logo Kalender Bali"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Uraian Identitas Pengembang */}
          <div className="space-y-1.5 min-w-0">
            {/* Eyebrow Label & Badge Verifikasi */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]">
                Pengembang Resmi
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-50 border border-teal-200/60 rounded-full px-2 py-0.5 select-none">
                <ShieldCheck className="w-3 h-3 text-[#0d9488]" />
                Terverifikasi
              </span>
            </div>

            {/* Nama Entitas Pengembang */}
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tracking-tight">
              PT Bali Integrated Solution
            </h2>

            {/* Narasi Komitmen & Slogan */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
              Pengembang sistem digitalisasi Kalender Bali dan ensiklopedia Wariga terpadu.
              Jika Anda memiliki pertanyaan, saran perbaikan, atau kendala teknis, silakan kirim pesan melalui formulir di bawah atau hubungi email resmi kami.
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. SISI KANAN: PILL EMAIL ESTETIK (PAS & MELEBAR SAAT HOVER)      */}
        {/* ================================================================= */}
        <div className="shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex items-center">
          <button
            type="button"
            onClick={handleCopyEmail}
            className="group relative inline-flex items-center px-3.5 py-2.5 rounded-xl bg-[#f8fafc] hover:bg-teal-50/70 active:bg-teal-100/70 border border-slate-200/80 hover:border-teal-300 shadow-2xs transition-all duration-300 ease-out cursor-pointer select-none [touch-action:manipulation]"
            title="Klik untuk menyalin alamat email"
          >
            {/* Ikon Surat */}
            <Mail className="w-4 h-4 text-[#0d9488] shrink-0 group-hover:scale-105 transition-transform" />

            {/* Alamat Email */}
            <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-teal-900 font-mono transition-colors ml-2">
              {emailAddress}
            </span>

            {/* Container Ikon Salin: 0px secara default, melebar halus saat hover / copied */}
            <span
              className={`inline-flex items-center overflow-hidden transition-all duration-300 ease-out ${
                copied
                  ? 'max-w-[70px] opacity-100 ml-2'
                  : 'max-w-0 group-hover:max-w-6 opacity-0 group-hover:opacity-100 group-hover:ml-2'
              }`}
            >
              {copied ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 whitespace-nowrap">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Tersalin</span>
                </span>
              ) : (
                <Copy className="w-3.5 h-3.5 text-teal-700 shrink-0" />
              )}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
