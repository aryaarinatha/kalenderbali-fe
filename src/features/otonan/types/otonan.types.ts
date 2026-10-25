/**
 * ============================================================================
 * TIPE DATA & KONTRAK FITUR OTONAN (KALENDER BALI)
 * ============================================================================
 * Berkas ini mendefinisikan seluruh tipe data TypeScript untuk fitur Otonan.
 * Kontrak ini diselaraskan 100% dengan respons Backend Go (internal/domain/otonan.go)
 * serta kebutuhan penyajian antarmuka (UI) sesuai mockup.
 * ============================================================================
 */

// ============================================================================
// 1. Tipe Pencarian & Parameter Permintaan (Request)
// ============================================================================

/**
 * OtonanSearchType mendefinisikan dua metode pencarian otonan yang didukung:
 * - 'tanggal_lahir': Pencarian praktis menggunakan tanggal lahir Masehi.
 * - 'elemen_kalender': Pencarian manual menggunakan kombinasi Saptawara, Pancawara, dan Wuku.
 */
export type OtonanSearchType = 'tanggal_lahir' | 'elemen_kalender';

/**
 * OtonanSearchParams merangkum parameter yang dikirim ke endpoint:
 * GET /api/v1/search/otonan
 */
export interface OtonanSearchParams {
  /** Jalur pencarian yang dipilih oleh pengguna */
  tipe_pencarian: OtonanSearchType;

  /** Tanggal lahir format YYYY-MM-DD (wajib jika tipe = 'tanggal_lahir') */
  tanggal_lahir?: string;

  /** Menandai apakah lahir sebelum pukul 06.00 WITA (mempengaruhi pergantian hari Bali) */
  sebelum_jam_6?: boolean;

  /** Tahun Masehi target yang ingin dicari jadwal otonannya (contoh: 2026) */
  tahun_target: number;

  /** ID master Saptawara dari database (wajib jika tipe = 'elemen_kalender') */
  saptawara_id?: number | string;

  /** ID master Pancawara dari database (wajib jika tipe = 'elemen_kalender') */
  pancawara_id?: number | string;

  /** ID master Wuku dari database (wajib jika tipe = 'elemen_kalender') */
  wuku_id?: number | string;
}

// ============================================================================
// 2. Data Elemen Penanggalan Bali
// ============================================================================

/**
 * OtonanElemen merepresentasikan 3 pilar penentu otonan seseorang dalam siklus Pawukon.
 */
export interface OtonanElemen {
  /** Nama hari dalam siklus 7 harian (Redite, Soma, Anggara, dst) */
  saptawara: string;

  /** Nama hari dalam siklus 5 harian (Umanis, Paing, Pon, Wage, Kliwon) */
  pancawara: string;

  /** Nama wuku dalam siklus 30 wuku (Sinta, Landep, Ukir, dst) */
  wuku: string;
}

/**
 * OtonanDetailElemen memuat rincian elemen kalender pada tanggal jatuhnya otonan,
 * termasuk nama Sasih (bulan kalender Bali).
 */
export interface OtonanDetailElemen {
  saptawara: string;
  pancawara: string;
  wuku: string;
  sasih: string;
}

// ============================================================================
// 3. Respon Hasil Perhitungan Otonan dari Backend Go
// ============================================================================

/**
 * OtonanHasilItem merepresentasikan satu tanggal perayaan otonan yang ditemukan pada tahun target.
 * Dalam 1 tahun Masehi, seseorang umumnya memiliki 1 atau 2 kali otonan (karena siklusnya 210 hari).
 */
export interface OtonanHasilItem {
  /** Tanggal jatuhnya otonan dalam format Masehi "YYYY-MM-DD" */
  tanggal: string;

  /** Angka siklus otonan (contoh: 48 = otonan ke-48 sejak kelahiran) */
  perayaan_ke: number;

  /** Rincian elemen kalender Bali pada hari tersebut */
  detail_elemen: OtonanDetailElemen;
}

/**
 * OtonanNormalizedInput berisi ringkasan input pengguna setelah dinormalisasi oleh sistem backend.
 * Jika lahir sebelum pukul 06.00 WITA, tanggal lahir kalender akan bergeser H-1 dari tanggal sipil.
 */
export interface OtonanNormalizedInput {
  tipe_pencarian: OtonanSearchType;
  tanggal_lahir_sipil?: string;
  sebelum_jam_6: boolean;
  tanggal_lahir_kalender?: string;
  elemen: OtonanElemen;
}

/**
 * OtonanResponseData adalah isi payload utama dari respons API Otonan Backend Go.
 */
export interface OtonanResponseData {
  input_dinormalisasi: OtonanNormalizedInput;
  hasil: OtonanHasilItem[];
  penjelasan: string;
}

/**
 * OtonanAPIEnvelope adalah amplop (wrapper) JSON standar backend:
 * { "data": ..., "meta": ..., "error": ... }
 */
export interface OtonanAPIEnvelope {
  data: OtonanResponseData | null;
  meta: Record<string, any> | null;
  error: {
    code: string;
    message: string;
  } | null;
}

// ============================================================================
// 4. Tipe Data Pendukung Antarmuka (UI Model)
// ============================================================================

/**
 * MasterWewaranItem merepresentasikan satu elemen opsi dropdown
 * yang diambil dari endpoint master keterangan (Saptawara, Pancawara, Wuku).
 */
export interface MasterWewaranItem {
  id: string;
  name: string;
  description?: string;
}

/**
 * OtonanTimelineNode digunakan untuk merender horizontal stepper 4 titik siklus:
 * [Siklus N-2, Siklus N-1, Siklus N (Aktif/Berikutnya), Siklus N+1].
 */
export interface OtonanTimelineNode {
  /** Nomor perayaan siklus (contoh: 46, 47, 48, 49) */
  cycleNumber: number;

  /** Tanggal Masehi YYYY-MM-DD */
  date: string;

  /** Teks tanggal yang sudah diformat ke bahasa Indonesia (contoh: "18 Okt 2026") */
  formattedDate: string;

  /** Penanda apakah ini adalah siklus otonan terdekat yang sedang aktif disorot */
  isCurrent: boolean;

  /** Label status node (contoh: "Berikutnya" atau "Siklus 47") */
  label: string;
}

/**
 * OtonanFormValues merepresentasikan state internal form input sebelum disubmit oleh pengguna.
 */
export interface OtonanFormValues {
  tab: OtonanSearchType;
  birthDate: string;
  birthTime: 'before_06' | 'after_06';
  targetYear: number;
  saptawaraId: string;
  pancawaraId: string;
  wukuId: string;
}
