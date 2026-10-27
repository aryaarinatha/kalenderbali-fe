import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import type { DewasaAyuDashboard } from '../types/dashboard.types';

/**
 * ============================================================================
 * KOMPONEN: DashboardDewasaAyu (Baris 3 Kiri — Dewasa Ayu Hari Ini)
 * ============================================================================
 * Menampilkan 3 rekomendasi padewasan / hari baik harian dengan kontras visual tinggi:
 *  - Latar Card: Gradient Teal Tirta Bali pekat (from-[#0e9f90] via-[#0c8e80] to-[#0a756a])
 *  - Baris Atas: Pill "+ DEWASA AYU HARI INI" dan status "BAIK"
 *  - Headline: Ringkasan narasi petunjuk hari ini
 *  - Area Tengah: Menampilkan 3 item padewasan teratas hari ini secara terstruktur
 *  - Baris Bawah: Tautan "Lihat selengkapnya →" menuju ke /ala-ayuning-dewasa
 *
 * Mengikuti Aturan Desain AGENTS.md:
 *  - Target sentuh ergonomis min 44x44px dengan touch-action: manipulation
 *  - Efek glassmorphism halus (bg-white/10 hover:bg-white/15 backdrop-blur-xs)
 * ============================================================================
 */

interface DashboardDewasaAyuProps {
  data: DewasaAyuDashboard;
}

export const DashboardDewasaAyu: React.FC<DashboardDewasaAyuProps> = ({ data }) => {
  const navigate = useNavigate();

  // Memastikan hanya mengambil maksimal 3 item padewasan teratas sesuai instruksi
  const topThreeItems = (data.items || []).slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-[#0e9f90] via-[#0c8e80] to-[#0a756a] text-white rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden flex flex-col justify-between h-full">
      {/* Ornamen dekorasi watermark halus di pojok kanan bawah */}
      <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/5 rounded-full pointer-events-none blur-xl" />

      {/* =================================================================== */}
      {/* 1. BARIS ATAS: PILL MODUL & BADGE STATUS BAIK                       */}
      {/* =================================================================== */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Pill Nama Modul dengan ikon sparkle */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider">
            <Sparkles size={12} className="text-teal-200" />
            <span>DEWASA AYU HARI INI</span>
          </div>

          {/* Badge Status Hari (BAIK) */}
          <div className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10px] font-extrabold uppercase tracking-widest">
            {data.statusLabel}
          </div>
        </div>

        {/* Narasi Ringkas Hari Baik */}
        <p className="text-xs sm:text-sm text-teal-50/90 font-medium leading-snug mb-3">
          {data.headline}
        </p>

        {/* ================================================================= */}
        {/* 2. AREA TENGAH: DAFTAR 3 REKOMENDASI PADEWASAN HARI BAIK          */}
        {/* ================================================================= */}
        <div className="space-y-2.5">
          {topThreeItems.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(data.actionUrl)}
              className="p-2.5 sm:p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 backdrop-blur-xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-teal-100 transition-colors">
                  {item.nama}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-white/20 text-white uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-teal-100/80 font-medium truncate mt-1">
                {item.keterangan}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* =================================================================== */}
      {/* 3. BARIS BAWAH: KETERANGAN SUMBER & TAUTAN SELENGKAPNYA             */}
      {/* =================================================================== */}
      <div className="flex items-center justify-between gap-3 pt-3 mt-4 border-t border-white/10">
        <span className="text-[11px] text-teal-100/70 font-medium">
          Wariga harian
        </span>

        {/* Tautan Lihat Selengkapnya ke Halaman Ala Ayuning Dewasa */}
        <button
          type="button"
          onClick={() => navigate(data.actionUrl)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-teal-200 transition-colors cursor-pointer [touch-action:manipulation] py-1"
        >
          <span>Lihat selengkapnya</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
