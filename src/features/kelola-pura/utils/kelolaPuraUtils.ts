import type { PuraBackendItem } from '../types/kelolaPura.types';

/**
 * ==============================================================================
 * UTILITAS: Fitur Kelola Pura (Kalender Bali Digital)
 * ==============================================================================
 * Fungsi pembantu (helper) untuk pemformatan mata uang Rupiah, waktu WITA,
 * penentuan gaya visual badge semantik, serta daftar opsi filter wilayah.
 * ==============================================================================
 */

/**
 * getTodayWITA mengembalikan tanggal hari ini dalam format YYYY-MM-DD
 * yang dikunci secara absolut ke zona waktu WITA (Asia/Makassar / UTC+8).
 * Mencegah pergeseran tanggal akibat perbedaan offset UTC browser.
 */
export function getTodayWITA(): string {
  const now = new Date();
  const witaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Makassar' }));
  const year = witaTime.getFullYear();
  const month = String(witaTime.getMonth() + 1).padStart(2, '0');
  const day = String(witaTime.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Daftar 9 Kabupaten/Kota resmi di Provinsi Bali:
 */
export const BALI_OFFICIAL_REGENCIES = [
  'KABUPATEN BADUNG',
  'KABUPATEN BANGLI',
  'KABUPATEN BULELENG',
  'KABUPATEN GIANYAR',
  'KABUPATEN JEMBRANA',
  'KABUPATEN KARANGASEM',
  'KABUPATEN KLUNGKUNG',
  'KABUPATEN TABANAN',
  'KOTA DENPASAR',
] as const;

/**
 * Daftar opsi filter wilayah pada dropdown (9 Kabupaten/Kota di Bali + opsi khusus "Luar Bali"):
 */
export const BALI_REGENCIES = [
  ...BALI_OFFICIAL_REGENCIES,
  'Luar Bali',
] as const;

/**
 * isPuraLuarBali memeriksa apakah suatu pura berlokasi di luar 9 Kabupaten/Kota di Bali.
 * Pura dianggap berada di "Luar Bali" apabila:
 * 1. Negara tercatat dan bukan "Indonesia" (misalnya Belgia, Amerika Serikat, dsb).
 * 2. Atau provinsi tercatat dan bukan "BALI" (misalnya NTT, Kalimantan Timur, Kalimantan Selatan, Riau, dsb).
 * 3. Atau kabupaten/kota tercatat dan bukan salah satu dari 9 Kabupaten/Kota resmi di Bali.
 * 4. Atau kabupaten/kota kosong dan lokasinya berada di luar wilayah Bali.
 */
export function isPuraLuarBali(pura: PuraBackendItem): boolean {
  // 1. Cek negara: jika negara tercatat dan bukan Indonesia
  if (pura.country && pura.country.trim().toLowerCase() !== 'indonesia') {
    return true;
  }

  // 2. Cek provinsi: jika provinsi tercatat dan bukan Bali
  if (pura.province && pura.province.trim().toLowerCase() !== 'bali') {
    return true;
  }

  // 3. Cek kabupaten/kota jika ada
  if (pura.city) {
    const cityUpper = pura.city.trim().toUpperCase();
    const isBaliCity = (BALI_OFFICIAL_REGENCIES as readonly string[]).includes(cityUpper);
    return !isBaliCity;
  }

  // 4. Jika kabupaten/kota kosong: periksa provinsi dan negara
  const provUpper = (pura.province || '').trim().toUpperCase();
  if (provUpper && provUpper !== 'BALI') {
    return true;
  }

  return false;
}

/**
 * formatPuraLocation menyusun teks lokasi lengkap pura secara informatif dan rapi:
 * - Menampilkan alamat fisik, kota/kabupaten, provinsi (jika luar Bali), serta negara (jika luar Indonesia).
 * - Contoh pura Bali: "Sanggingan, Ubud, KABUPATEN GIANYAR"
 * - Contoh pura Luar Bali: "Jl.Gatot Subroto No.36 Banjarmasin, KOTA BANJARMASIN, KALIMANTAN SELATAN"
 * - Contoh pura Mancanegara: "Brussels, Belgium"
 */
export function formatPuraLocation(pura?: PuraBackendItem | null): string {
  if (!pura) return 'Lokasi belum diatur';

  const parts: string[] = [];

  // Alamat jalan / banjar
  if (pura.address && pura.address.trim()) {
    parts.push(pura.address.trim());
  }

  // Kabupaten / Kota
  if (pura.city && pura.city.trim()) {
    parts.push(pura.city.trim());
  }

  // Provinsi (tampilkan jika berada di luar Bali untuk kejelasan konteks)
  if (pura.province && pura.province.trim() && pura.province.trim().toLowerCase() !== 'bali') {
    parts.push(pura.province.trim());
  }

  // Negara (tampilkan jika berada di luar Indonesia)
  if (pura.country && pura.country.trim() && pura.country.trim().toLowerCase() !== 'indonesia') {
    parts.push(pura.country.trim());
  }

  return parts.length > 0 ? parts.join(', ') : 'Lokasi belum diatur';
}

/**
 * Daftar klasifikasi tipe pura resmi:
 */
export const PURA_TYPES = [
  'Kahyangan Jagat',
  'Kahyangan Tiga',
  'Kawitan',
  'Swagina',
  'Suka Duka',
] as const;

/**
 * formatRupiah memformat angka numerik ke format mata uang Rupiah standar Indonesia:
 * Contoh: 1500000 -> "Rp 1.500.000"
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * formatDateWITA memformat string tanggal ISO ke format bahasa Indonesia formal:
 * Contoh: "2026-10-29" -> "29 Oktober 2026"
 */
export function formatDateWITA(dateStr: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * formatTimeWITA memformat tanggal/jam ISO ke format jam WITA:
 * Contoh: "2026-10-29T10:00:00Z" -> "10:00 WITA"
 */
export function formatTimeWITA(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes} WITA`;
  } catch {
    return '';
  }
}

/**
 * getPuraTypeBadgeStyle mengembalikan kelas Tailwind semantik untuk tipe pura:
 * - Kahyangan Jagat: Teal Tirta Bali
 * - Kahyangan Tiga: Emerald Green
 * - Kawitan: Violet Purple
 * - Swagina: Sky Blue
 * - Suka Duka: Amber Gold
 */
export function getPuraTypeBadgeStyle(type?: string): {
  container: string;
  dot: string;
} {
  const normalized = (type || '').trim().toLowerCase();

  switch (normalized) {
    case 'kahyangan jagat':
      return {
        container: 'bg-teal-50 text-teal-800 border-teal-200/70',
        dot: 'bg-teal-500',
      };
    case 'kahyangan tiga':
      return {
        container: 'bg-emerald-50 text-emerald-800 border-emerald-200/70',
        dot: 'bg-emerald-500',
      };
    case 'kawitan':
      return {
        container: 'bg-violet-50 text-violet-800 border-violet-200/70',
        dot: 'bg-violet-500',
      };
    case 'swagina':
      return {
        container: 'bg-sky-50 text-sky-800 border-sky-200/70',
        dot: 'bg-sky-500',
      };
    case 'suka duka':
      return {
        container: 'bg-amber-50 text-amber-800 border-amber-200/70',
        dot: 'bg-amber-500',
      };
    default:
      return {
        container: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

/**
 * getObservationSummary menyusun label ringkas penanggalan piodalan suatu pura:
 * Contoh: "Wuku: Pahang (Buda Kliwon)" atau "Sasih: Kapat (Purnama)"
 */
export function getObservationSummary(pura: PuraBackendItem): string {
  // Observasi berbasis Pawukon (Wuku + Saptawara + Pancawara)
  if (pura.wuku) {
    const parts: string[] = [];
    if (pura.saptawara) parts.push(pura.saptawara);
    if (pura.pancawara) parts.push(pura.pancawara);
    const wewaran = parts.length > 0 ? parts.join(' ') : '';
    return wewaran ? `Wuku ${pura.wuku} · ${wewaran}` : `Wuku ${pura.wuku}`;
  }

  // Observasi berbasis Sasih & Fase Candra (Purnama/Tilem)
  if (pura.sasih) {
    const pt = pura.purnama_tilem ? ` (${pura.purnama_tilem})` : '';
    return `Sasih ${pura.sasih}${pt}`;
  }

  return 'Penanggalan piodalan belum diatur';
}

/**
 * getPuraBenchmarkDisplay menentukan label sistem acuan penanggalan piodalan pura:
 * - Menghindari kerancuan data jika kolom benchmark di database lama bernilai "Wuku"
 *   namun data riil piodalan belum diinput atau menggunakan Sasih.
 * - Berbasis Pawukon: Siklus wuku 210 hari
 * - Berbasis Sasih: Siklus peredaran bulan candra (~354/365 hari)
 * - Belum diatur: Jika tidak ada data wuku maupun sasih terdaftar
 */
export function getPuraBenchmarkDisplay(pura?: PuraBackendItem | null): string {
  if (!pura) return 'Belum diatur';

  // 1. Utamakan data riil piodalan yang tercatat
  if (pura.wuku) {
    return 'Pawukon (210 Hari)';
  }
  if (pura.sasih || pura.purnama_tilem) {
    return 'Sasih (Siklus Candra)';
  }

  // 2. Jika tidak ada wuku dan tidak ada sasih/purnama, berarti belum dikonfigurasi
  return 'Belum diatur';
}

/**
 * getPuraBenchmarkBadgeStyle menentukan kelas Tailwind semantik untuk badge acuan piodalan:
 * - Pawukon: Tema Teal Tirta Bali
 * - Sasih: Tema Emerald Green
 * - Belum diatur: Tema Slate Netral
 */
export function getPuraBenchmarkBadgeStyle(pura?: PuraBackendItem | null): {
  container: string;
  iconColor: string;
} {
  if (!pura || (!pura.wuku && !pura.sasih && !pura.purnama_tilem)) {
    return {
      container: 'bg-slate-100 text-slate-700 border-slate-200',
      iconColor: 'text-slate-400',
    };
  }
  if (pura.wuku) {
    return {
      container: 'bg-teal-50 text-teal-800 border-teal-200',
      iconColor: 'text-[#0e9f90]',
    };
  }
  return {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    iconColor: 'text-emerald-600',
  };
}

