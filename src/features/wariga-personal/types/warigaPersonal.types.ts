/**
 * ============================================================================
 * TIPE DATA: WARIGA PERSONAL (KALENDER BALI)
 * ============================================================================
 * Berkas ini mendefinisikan seluruh kontrak tipe data (DTO), parameter request,
 * respon API, dan struktur model untuk fitur Wariga Personal di Frontend React.
 *
 * Seluruh tipe disinkronisasikan 100% dengan backend Go (domain/wariga_personal.go)
 * untuk menjamin keamanan tipe (type-safety) dan bebas dari bug runtime.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: KATEGORI & STATUS WARIGA PERSONAL
// ----------------------------------------------------------------------------

/**
 * 4 Arketipe Wariga Personal berdasarkan sisa bagi modulo 4 (Total Urip % 4):
 *  - 1 -> Guru (Hari Baik)  : Kebijaksanaan rohani, kelancaran usaha, & pendidikan
 *  - 2 -> Ratu (Hari Baik)  : Kewibawaan, kepemimpinan, kemakmuran, & negosiasi
 *  - 3 -> Lara (Hari Buruk) : Potensi rintangan, kelelahan, atau kesedihan
 *  - 0/4 -> Pati (Hari Buruk): Penghentian, pantangan untuk hajatan krusial
 */
export type WarigaCategory = 'Guru' | 'Ratu' | 'Lara' | 'Pati';

/** Status umum hari: 'baik' (Guru/Ratu) atau 'buruk' (Lara/Pati) */
export type WarigaStatusHari = 'baik' | 'buruk';

/** Filter status wariga untuk kontrol dropdown di antarmuka kalender */
export type WarigaFilterType =
  | 'all'
  | 'Guru'
  | 'Ratu'
  | 'Lara'
  | 'Pati'
  | 'baik'
  | 'buruk';

// ----------------------------------------------------------------------------
// BLOK 2: MODEL ELEMEN WEWARAN & IDENTITAS KELAHIRAN
// ----------------------------------------------------------------------------

/**
 * WewaranRingkas memuat wewaran pembentuk neptu (Saptawara & Pancawara)
 * beserta nama Wuku saat kelahiran atau pada tanggal kalender yang dievaluasi.
 */
export interface WewaranRingkas {
  /** Nama Saptawara (Redite, Soma, Anggara, Buda, Wraspati, Sukra, Saniscara) */
  saptawara: string;
  /** Nilai urip Saptawara (Redite: 5, Soma: 4, Anggara: 3, Buda: 7, Wraspati: 8, Sukra: 6, Saniscara: 9) */
  urip_saptawara: number;
  /** Nama Pancawara (Umanis, Paing, Pon, Wage, Kliwon) */
  pancawara: string;
  /** Nilai urip Pancawara (Umanis: 5, Paing: 9, Pon: 7, Wage: 4, Kliwon: 8) */
  urip_pancawara: number;
  /** Nama Wuku ke-1 s.d. 30 (Sinta s.d. Watugunung) */
  wuku: string;
}

/**
 * ElemenKalenderRef mewakili satu entitas nilai referensi kalender Bali (ID & Nama)
 */
export interface ElemenKalenderRef {
  id?: string;
  nama: string;
}

/**
 * ElemenWarigaLengkap merangkum 12 dimensi penanggalan wariga adat lanjutan
 * yang melengkapi 10 wewaran dasar Bali (Ekawara s.d. Dasawara).
 */
export interface ElemenWarigaLengkap {
  ingkel: ElemenKalenderRef;
  jejepan: ElemenKalenderRef;
  lintang: ElemenKalenderRef;
  panca_sudha: ElemenKalenderRef;
  pangarasan: ElemenKalenderRef;
  rakam: ElemenKalenderRef;
  watek_madya: ElemenKalenderRef;
  watek_alit: ElemenKalenderRef;
  neptu: number;
  eka_jala_rsi: ElemenKalenderRef;
  zodiak: ElemenKalenderRef;
  pratiti: ElemenKalenderRef;
}

/**
 * IdentitasKelahiran menyajikan rangkuman weton kelahiran pengguna
 * yang dihitung oleh backend Go dengan penyesuaian adat jam lahir (< 06.00 WITA).
 */
export interface IdentitasKelahiran {
  /** Tanggal lahir asli yang diisi pengguna (format YYYY-MM-DD) */
  tanggal_lahir_sipil: string;
  /** Status penanda apakah lahir sebelum pukul 06.00 WITA */
  sebelum_jam_6: boolean;
  /** Tanggal kalender perhitungan (mundur 1 hari jika sebelum_jam_6 = true) */
  tanggal_lahir_kalender: string;
  /** Wewaran kelahiran (Saptawara, Pancawara, Wuku) */
  wewaran: WewaranRingkas;
  /** Penjumlahan urip Saptawara + Pancawara kelahiran */
  total_urip_kelahiran: number;
  /** 12 dimensi penanggalan wariga adat lanjutan saat kelahiran */
  wariga_lengkap?: ElemenWarigaLengkap;
}

// ----------------------------------------------------------------------------
// BLOK 3: METADATA PERIODE & STATISTIK BULANAN
// ----------------------------------------------------------------------------

/**
 * PeriodeInfo merangkum rentang waktu kalender yang sedang aktif
 * dan status hak akses pengguna (Guest vs Member/Admin).
 */
export interface PeriodeInfo {
  /** Tanggal awal periode evaluasi (YYYY-MM-DD) */
  tanggal_mulai: string;
  /** Tanggal akhir periode evaluasi (YYYY-MM-DD) */
  tanggal_selesai: string;
  /** Jumlah total hari yang dievaluasi (28 s.d. 31 hari penuh) */
  total_hari: number;
  /** Bernilai true jika akun pengguna memiliki limitasi tertentu */
  is_limited: boolean;
  /** Pesan informatif ajakan upgrade jika is_limited bernilai true */
  upgrade_message?: string;
}

/**
 * RingkasanStatistik merekapitulasi total kemunculan 4 status wariga
 * dalam 1 bulan kalender untuk kartu ringkasan visual.
 */
export interface RingkasanStatistik {
  /** Total hari berkategori Guru dalam bulan aktif */
  total_guru: number;
  /** Total hari berkategori Ratu dalam bulan aktif */
  total_ratu: number;
  /** Total hari berkategori Lara dalam bulan aktif */
  total_lara: number;
  /** Total hari berkategori Pati dalam bulan aktif */
  total_pati: number;
}

/**
 * RekomendasiHari menyajikan tanggal-tanggal berenergi terbaik (Guru & Ratu)
 * yang dihitung otomatis oleh backend Go untuk pengguna Member/Admin.
 */
export interface RekomendasiHari {
  /** Tanggal Masehi ("YYYY-MM-DD") */
  tanggal: string;
  /** Kategori energi hari ("Guru" atau "Ratu") */
  wariga: WarigaCategory;
  /** Anjuran jenis kegiatan yang cocok dilakukan */
  keterangan: string;
}

// ----------------------------------------------------------------------------
// BLOK 4: BUTIR HASIL EVALUASI HARIAN KALENDER
// ----------------------------------------------------------------------------

/**
 * WarigaPersonalItem menyajikan rincian hasil komputasi matematis budaya
 * untuk SATU tanggal kalender Masehi.
 */
export interface WarigaPersonalItem {
  /** Tanggal Masehi yang dievaluasi ("YYYY-MM-DD") */
  tanggal: string;
  /** Wewaran pada tanggal tersebut */
  wewaran: WewaranRingkas;
  /** Total urip Saptawara + Pancawara pada tanggal target */
  total_urip_hari: number;
  /** Urip Kelahiran + Urip Hari Target */
  total_urip_kumulatif: number;
  /** Sisa bagi Total Urip Kumulatif % 4 (0, 1, 2, atau 3) */
  modulo: number;
  /** Hasil klasifikasi arketipe budaya ("Guru", "Ratu", "Lara", "Pati") */
  wariga: WarigaCategory;
  /** Angka simbolik budaya (Guru=1, Ratu=2, Lara=3, Pati=4) */
  angka_perwakilan: number;
  /** Sifat hari: "baik" atau "buruk" */
  status_hari: WarigaStatusHari;
  /** Penjelasan filosofis makna hari tersebut bagi subjek weton */
  keterangan: string;
}

// ----------------------------------------------------------------------------
// BLOK 5: REQUEST & RESPONSE ENVELOPE DTO
// ----------------------------------------------------------------------------

/**
 * Parameter input pencarian Wariga Personal
 * Dikirim via POST /api/v1/search/wariga-personal
 */
export interface WarigaPersonalRequest {
  /** Tanggal lahir Masehi (format YYYY-MM-DD, Wajib) */
  tanggal_lahir: string;
  /** Waktu lahir sebelum 06.00 WITA (Default: false) */
  sebelum_jam_6?: boolean;
  /** Bulan Masehi yang dicari (1 s.d. 12) */
  bulan_target: number;
  /** Tahun Masehi yang dicari (contoh: 2026) */
  tahun_target: number;
  /** Rentang eksplisit tanggal awal (opsional) */
  tanggal_mulai?: string;
  /** Rentang eksplisit tanggal akhir (opsional) */
  tanggal_selesai?: string;
}

/**
 * Respon payload data dari endpoint POST /api/v1/search/wariga-personal
 */
export interface WarigaPersonalResponse {
  identitas_kelahiran: IdentitasKelahiran;
  periode: PeriodeInfo;
  ringkasan_statistik: RingkasanStatistik;
  rekomendasi_hari_terbaik: RekomendasiHari[];
  hasil: WarigaPersonalItem[];
}

/** Amplop standar respon API Kalender Bali */
export interface WarigaPersonalAPIEnvelope {
  data: WarigaPersonalResponse;
  meta?: {
    request_id?: string;
    rule_version?: string;
    timezone?: string;
  };
  error?: {
    code: string;
    message: string;
  } | null;
}

// ----------------------------------------------------------------------------
// BLOK 6: MODEL DEWASA TANGGAL LAHIR (PADEWASAN)
// ----------------------------------------------------------------------------

/**
 * PadewasanItem merepresentasikan satu kriteria Ala Ayuning Dewasa
 * yang aktif pada tanggal kelahiran pengguna (untuk modal Dewasa Tanggal Lahir).
 */
export interface PadewasanItem {
  /** ID referensi numerik 64-bit yang diserialisasikan sebagai string */
  id: string;
  /** Nama kriteria padewasan (contoh: "Asuajeg Munggah", "Carik Walangati") */
  nama: string;
  /** Penjelasan anjuran yadnya atau pantangan pekerjaan */
  keterangan?: string;
  /** Tingkat keparahan pembatalan hari (1=Sasih, 2=Penanggal, 3=Dauh, 4=Wuku) */
  severity_code?: string;
}

/** Respons harian dari API Ala Ayuning Dewasa */
export interface PadewasanHarianResponse {
  tanggal: string;
  padewasan: PadewasanItem[];
  total: number;
}

