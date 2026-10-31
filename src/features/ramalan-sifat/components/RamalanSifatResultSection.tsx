import React, { useState } from 'react';
import {
  Compass,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  Star,
  Edit3,
} from 'lucide-react';
import type { RamalanSifatData, KarakterElemen } from '../types/ramalanSifat.types';
import { buildRingkasanSintesis } from '../utils/ramalanSifatUtils';

/**
 * ============================================================================
 * KOMPONEN: RamalanSifatResultSection
 * ============================================================================
 * Komponen ini menyajikan hasil perhitungan Ramalan Sifat secara 100% data riil:
 *  1. Baris Atas (Full-Width Banner Weton & Identitas Kelahiran):
 *     - Menggabungkan identitas penanggalan, total neptu/urip, dan narasi sintesis
 *       watak ke dalam 1 banner terpadu yang kaya informasi dan bebas redundansi.
 *     - Sisi Kiri: Tanggal Lahir Masehi, Weton Lengkap, Tahun Saka & Sasih,
 *       Total Urip (Neptu), serta tombol "Ubah Tanggal".
 *     - Sisi Kanan: Narasi sintesis watak kelahiran dari backend Go.
 *  2. Baris Tengah (Grid 2x2 - 4 Pilar Karakter Otentik Wariga):
 *     - Pancawara (Watak Batiniah / Emerald Green)
 *     - Saptawara (Watak Sosial Lahiriah / Mint Teal)
 *     - Wuku (Pawacakan Takdir Bawaan / Violet Purple)
 *     - Zodiak (Karakter Astrologis / Surya Gold + Aset Vektor SVG Lokal)
 *  3. Baris Bawah:
 *     - Dasar Interpretasi Penanggalan Bali & Disclaimer Refleksi Etika Budaya.
 *
 * Menerapkan Standar AGENTS.md:
 *  - Wadah Kartu: bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs
 *  - Tipografi Angka: tabular-nums untuk seluruh angka numerik (urip, tanggal, tahun)
 *  - Palet Aksen Budaya: Mint Teal, Emerald Green, Violet Purple, dan Amber Gold
 * ============================================================================
 */

interface RamalanSifatResultSectionProps {
  data: RamalanSifatData;
  onModifySearch?: () => void;
}

/**
 * Komponen pembantu kartu untuk merender satu pilar karakter dengan toggle ekspansi teks
 */
const PilarKarakterCard: React.FC<{
  elemen: KarakterElemen;
  pilarType: 'pancawara' | 'saptawara' | 'wuku' | 'zodiak';
}> = ({ elemen, pilarType }) => {
  // State untuk toggle "Selengkapnya / Lebih sedikit" jika teks panjang
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Batas karakter untuk memicu tombol ekspansi teks
  const TRUNCATE_LENGTH = 180;
  const shouldTruncate = elemen.penjelasan && elemen.penjelasan.length > TRUNCATE_LENGTH;

  // Konfigurasi visual semantik sesuai AGENTS.md Bagian 3C
  const visualConfig = {
    pancawara: {
      badgeBg: 'bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60',
      categoryLabel: 'PANCAWARA · WATAK BATINIAH',
      icon: Sparkles,
      iconColor: 'text-emerald-600',
    },
    saptawara: {
      badgeBg: 'bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60',
      categoryLabel: 'SAPTAWARA · WATAK SOSIAL',
      icon: Compass,
      iconColor: 'text-teal-600',
    },
    wuku: {
      badgeBg: 'bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60',
      categoryLabel: 'WUKU · TAKDIR PAWACAKAN',
      icon: ShieldCheck,
      iconColor: 'text-violet-600',
    },
    zodiak: {
      badgeBg: 'bg-amber-50 text-amber-800 border border-amber-300',
      categoryLabel: 'ZODIAK · KARAKTER ASTROLOGIS',
      icon: Star,
      iconColor: 'text-amber-600',
    },
  }[pilarType];

  const IconComponent = visualConfig.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col justify-between transition-all hover:border-slate-300">
      <div className="space-y-3.5">
        {/* Header Kartu Pilar: Badge Kategori & Nomor Urut */}
        <div className="flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-bold uppercase tracking-wider ${visualConfig.badgeBg}`}
          >
            <IconComponent className="w-3.5 h-3.5" />
            <span>{visualConfig.categoryLabel}</span>
          </span>

          {/* Rentang Tanggal Khusus Zodiak */}
          {elemen.rentang_tanggal && (
            <span className="text-[11px] font-semibold text-slate-400 tabular-nums">
              {elemen.rentang_tanggal}
            </span>
          )}
        </div>

        {/* Nama Elemen & Judul Watak */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base sm:text-lg font-bold text-[#0f172a] tracking-tight">
              {elemen.nama}
              {elemen.nomor_wuku && (
                <span className="text-xs font-medium text-slate-400 ml-2">
                  (Wuku ke-{elemen.nomor_wuku})
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {elemen.judul_sifat}
            </p>
          </div>

          {/* Ikon Vektor SVG Khusus Zodiak */}
          {pilarType === 'zodiak' && elemen.nomor_urut && (
            <div className="w-12 h-12 rounded-xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-center p-1.5 shrink-0">
              <img
                src={`/assets/images/zodiak/Asset_${elemen.nomor_urut}.svg`}
                alt={elemen.nama}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        {/* Paragraf Uraian Sastra Otentik dari Basis Data */}
        <div className="text-sm font-normal text-slate-600 leading-relaxed pt-1">
          <p>
            {shouldTruncate && !isExpanded
              ? `${elemen.penjelasan.slice(0, TRUNCATE_LENGTH)}...`
              : elemen.penjelasan}
          </p>
        </div>
      </div>

      {/* Tombol Toggle Baca Selengkapnya jika Teks Panjang */}
      {shouldTruncate && (
        <div className="pt-3 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer select-none [touch-action:manipulation]"
          >
            <span>{isExpanded ? 'Lebih sedikit' : 'Selengkapnya'}</span>
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export const RamalanSifatResultSection: React.FC<RamalanSifatResultSectionProps> = ({
  data,
  onModifySearch,
}) => {
  const { identitas_kelahiran, karakter } = data;

  return (
    <div className="space-y-6">
      {/* ===================================================================== */}
      {/* BLOK 1: FULL-WIDTH BANNER IDENTITAS WETON & KESIMPULAN 4 PILAR        */}
      {/* Sisi Kiri: Identitas Kelahiran | Sisi Kanan: Kesimpulan Ringkas       */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs relative overflow-hidden">
        {/* Ornamen Latar Aksen Mint Halus */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-full blur-2xl pointer-events-none opacity-60" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Sisi Kiri (lg:col-span-5): Identitas Penanggalan & Weton Kelahiran */}
          <div className="lg:col-span-5 space-y-3 lg:border-r lg:border-slate-100 lg:pr-6">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#0d9488] uppercase tracking-wider block">
                IDENTITAS KELAHIRAN
              </span>
            </div>

            {/* Tanggal Lahir Format Indonesia */}
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tracking-tight tabular-nums">
                {identitas_kelahiran.hari}, {identitas_kelahiran.tanggal_format_indonesia}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                {identitas_kelahiran.ringkasan_weton}
              </p>
            </div>

            {/* Badges Info Kunci */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              {/* Badge Sasih & Saka */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-50 border border-slate-200/80 font-medium text-slate-700 tabular-nums">
                <span>Sasih {identitas_kelahiran.sasih}</span>
                <span className="text-slate-300">•</span>
                <span>Saka {identitas_kelahiran.tahun_saka}</span>
              </div>

              {/* Badge Jam Lahir Sebelum 06.00 WITA jika aktif */}
              {identitas_kelahiran.sebelum_jam_6 && (
                <div className="inline-flex items-center gap-1.5 text-amber-700 font-medium text-[11px] bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200/60">
                  <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Lahir sebelum 06.00 WITA (Weton disesuaikan)</span>
                </div>
              )}
            </div>
          </div>

          {/* Sisi Kanan (lg:col-span-7): Kesimpulan Karakter (1 Paragraf Bahasa Indonesia Lugas) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#e6f7f5] border border-teal-200/60 text-[11px] font-bold uppercase tracking-wider text-[#0d9488]">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                <span>KESIMPULAN KARAKTER</span>
              </div>
            </div>

            {/* 1 Paragraf Bacaan Ringkas: Bahasa Indonesia Lugas, Efisien, Informasi Tepat */}
            <p className="text-sm font-normal text-slate-700 leading-relaxed">
              {buildRingkasanSintesis(karakter)}
            </p>

            {/* Petunjuk Membaca Detail Sastra di Bawah */}
            <p className="text-[11px] text-slate-400 font-medium pt-1 border-t border-slate-100">
              Uraian sastra dan filosofi selengkapnya dapat Anda telaah pada 4 pilar di bawah.
            </p>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 2: PENJELASAN DETAIL 4 PILAR KARAKTER (GRID 2x2)                 */}
      {/* Menampilkan isi mendalam dan sastra tradisional dari basis data        */}
      {/* ===================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-bold text-[#0f172a] tracking-tight">
            Penjelasan Detail 4 Pilar Karakter
          </h3>
          <span className="text-xs font-medium text-slate-400">
            Sumber: Sastra Wariga & Astrologi
          </span>
        </div>

        {/* Matriks 4 Kartu Pilar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* 1. Pancawara */}
          <PilarKarakterCard elemen={karakter.pancawara} pilarType="pancawara" />

          {/* 2. Saptawara */}
          <PilarKarakterCard elemen={karakter.saptawara} pilarType="saptawara" />

          {/* 3. Wuku */}
          <PilarKarakterCard elemen={karakter.wuku} pilarType="wuku" />

          {/* 4. Zodiak */}
          <PilarKarakterCard elemen={karakter.zodiak} pilarType="zodiak" />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* BLOK 3: FOOTER EDUKASI & DISCLAIMER BUDAYA (AGENTS.md)                */}
      {/* ===================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs text-xs text-slate-500">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Sisi Kiri: Dasar Interpretasi (md:col-span-5) */}
          <div className="md:col-span-5 space-y-1 md:border-r md:border-slate-100 md:pr-5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              DASAR INTERPRETASI
            </span>
            <p className="font-medium text-slate-700 leading-relaxed">
              Ringkasan watak disusun dari perpaduan matematis Wewaran (Pancawara & Saptawara),
              Pawukon (30 Wuku), Sasih penanggalan Bali, serta Rasi Bintang Zodiak.
            </p>
          </div>

          {/* Sisi Kanan: Penafian Refleksi Budaya (md:col-span-7) */}
          <div className="md:col-span-7 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              CATATAN REFLEKTIF
            </span>
            <p className="text-slate-500 leading-relaxed">
              Interpretasi wariga ini berfungsi sebagai pemantik mawas diri (mulat sarira)
              dan apresiasi sastra leluhur Bali. Sifat ini tidak menggantikan pengalaman hidup,
              pemahaman diri pribadi, maupun penilaian profesional kesehatan mental.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
