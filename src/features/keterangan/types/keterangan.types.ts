/**
 * ============================================================================
 * MODUL DOMAIN: TIPE DATA KETERANGAN ELEMEN KALENDER BALI
 * ============================================================================
 * File ini mendefinisikan kontrak tipe data TypeScript (Interface & DTO)
 * untuk fitur Ensiklopedia & Keterangan Elemen Kalender Bali.
 *
 * Prinsip Arsitektur Kunci (fe_strategy.md & AGENTS.md):
 * 1. Keamanan ID 64-bit: Seluruh ID dari Backend Go didefinisikan sebagai
 *    `string` untuk mencegah pemotongan presisi angka oleh engine JavaScript
 *    (IEEE-754 floating point limit > 53-bit).
 * 2. Single Source of Truth: Menyesuaikan kontrak DTO persis dengan balikan
 *    JSON dari Backend Go (domain.KeteranganType & domain.KeteranganValue).
 * 3. Pemetaan Visual Semantik: Menghubungkan kode kategori dengan warna
 *    resmi 4 Pilar Wariga dan ikon Lucide yang konsisten.
 * ============================================================================
 */



// ============================================================================
// 1. KONTRAK DATA ENTITY & RESPONSE DARI BACKEND GO
// ============================================================================

/**
 * Representasi metadata satu kategori referensi Kalender Bali
 * (contoh: Wuku, Ingkel, Hari Raya, Ala Ayuning Dewasa, Zodiak).
 * Diterima dari endpoint GET /api/v1/keterangan/types
 */
export interface KeteranganType {
  /** ID unik kategori dari database, wajib string untuk keamanan 64-bit */
  id: string;

  /** Kode unik penanda kategori dalam format snake_case (misal: "wuku", "hari_raya") */
  code: string;

  /** Nama manusiawi untuk tampilan judul kartu/modal (misal: "Wuku", "Hari Raya") */
  name: string;

  /** Uraian penjelasan filosofis umum mengenai kategori ini */
  description: string;

  /**
   * Estimasi jumlah elemen dalam kategori ini (opsional, disuntikkan oleh frontend
   * atau backend untuk indikator jumlah entri pada kartu).
   */
  itemCount?: number;

  /**
   * Penanda apakah kategori ini sudah aktif di backend atau masih berstatus
   * menunggu pengisian data di database backend.
   */
  isPendingBackend?: boolean;
}

/**
 * Rentang tanggal astronomis kalender Masehi untuk 12 Zodiak
 * (hanya terisi pada kategori Zodiak / ID 13).
 */
export interface ZodiacDetail {
  /** Bulan mulai berlakunya zodiak (1 s/d 12) */
  start_month: number;
  /** Tanggal mulai berlakunya zodiak (1 s/d 31) */
  start_day: number;
  /** Bulan berakhirnya zodiak (1 s/d 12) */
  end_month: number;
  /** Tanggal berakhirnya zodiak (1 s/d 31) */
  end_day: number;
}

/**
 * Representasi data satu elemen nilai spesifik dari suatu kategori
 * (contoh: "Sinta" pada Wuku, "Hari Raya Galungan", "Redite" pada Saptawara).
 * Diterima dari endpoint GET /api/v1/keterangan/types/:type
 */
export interface KeteranganValue {
  /** ID unik elemen dari database, wajib bertipe string */
  id: string;

  /** ID kategori induk tempat elemen ini bernaung */
  reference_type_id: string;

  /** Kode pengenal urutan sistem lama (misal: 1 s/d 12 untuk Zodiak) */
  legacy_id?: number;

  /** Kode kategori induk (misal: "wuku", "hari_raya") */
  type_code?: string;

  /** Nama kategori induk (misal: "Wuku", "Hari Raya") */
  type_name?: string;

  /** Nama resmi elemen budaya Kalender Bali (misal: "Sinta", "Galungan") */
  name: string;

  /** Uraian makna filosofis, pantangan, urip, atau watak elemen */
  description: string;

  /** Daftar alias atau variasi ejaan alternatif untuk pencarian */
  aliases?: string[];

  /** Nilai angka urip budaya (jika ada, misal pada Saptawara/Pancawara) */
  urip?: number;

  /** Rentang tanggal zodiak (khusus kategori zodiak) */
  zodiac_detail?: ZodiacDetail;
}

/**
 * DTO agregasi detail kategori beserta seluruh daftar elemen bernilainya.
 * Balikan dari endpoint GET /api/v1/keterangan/types/:type
 */
export interface KeteranganTypeDetail {
  /** Informasi metadata kategori */
  type: KeteranganType;

  /** Array daftar seluruh elemen bernilai dalam kategori ini */
  values: KeteranganValue[];

  /** Total jumlah elemen dalam kategori ini */
  total: number;
}

/**
 * Amplop (envelope) respons standar dari Backend Go { data, meta, error }
 */
export interface KeteranganApiResponse<T> {
  data: T;
  meta: Record<string, unknown> | null;
  error: {
    code: string;
    message: string;
  } | null;
}

// ============================================================================
// 2. KONTRAK NAVIGASI TAB & TEMA VISUAL SEMANTIK (AGENTS.md)
// ============================================================================

/**
 * Pilihan kunci tab penyaring kategori di bagian atas halaman
 */
export type KeteranganTabKey =
  | 'semua'
  | 'wariga'
  | 'hari_raya'
  | 'dewasa'
  | 'astrologi';

/**
 * Definisi grup kategori untuk navigasi segmented tab
 */
export interface KeteranganTabItem {
  key: KeteranganTabKey;
  label: string;
  description: string;
}

/**
 * Skema warna dan ornamen visual semantik berdasarkan 4 Pilar Wariga (AGENTS.md)
 */
export interface CategoryVisualTheme {
  /** Kelas Tailwind untuk latar belakang dan teks lencana (badge) */
  badgeClass: string;
  /** Kelas Tailwind untuk ikon dan aksen kartu */
  iconClass: string;
  /** Kelas Tailwind untuk wadah ikon latar belakang halus */
  iconBgClass: string;
  /** Kelas Tailwind untuk border saat hover */
  hoverBorderClass: string;
  /** Nama kelompok tab tempat kategori ini bernaung */
  group: KeteranganTabKey;
}

// ============================================================================
// 3. DAFTAR MASTER SELURUH KATEGORI (AUDIT-READY)
// ============================================================================

/**
 * Definisi lengkap seluruh kategori dari sistem Kalender Bali lama.
 * Daftar ini digunakan agar SEMUA kategori lama tetap tampil sebagai kartu di FE,
 * sehingga kategori yang datanya di backend belum lengkap dapat langsung terdeteksi
 * sebagai bahan pengisian di database backend selanjutnya.
 */
export interface CategoryRegistryItem {
  code: string;
  name: string;
  defaultDescription: string;
  group: KeteranganTabKey;
  isCoreActive: boolean; // true = 16 kategori inti Go; false = pending di database Go
}

/**
 * Registri seluruh kategori kalender Bali untuk audit kelengkapan data.
 */
export const ALL_CATEGORY_REGISTRY: CategoryRegistryItem[] = [
  // --- GRUP 1: HARI RAYA & RAHINA SUCI ---
  {
    code: 'hari_raya',
    name: 'Hari Raya',
    defaultDescription:
      'Hari besar perayaan umat Hindu yang dilaksanakan berdasarkan perhitungan elemen-elemen Kalender Bali.',
    group: 'hari_raya',
    isCoreActive: true,
  },

  // --- GRUP 2: ALA AYUNING DEWASA ---
  {
    code: 'ala_ayuning_dewasa',
    name: 'Ala Ayuning Dewasa',
    defaultDescription:
      'Pedoman penentuan hari baik atau hari yang dihindari dalam penanggalan Bali sebagai acuan upacara yadnya dan kegiatan sehari-hari.',
    group: 'dewasa',
    isCoreActive: true,
  },

  // --- GRUP 3: WARIGA & PAWEWARAN INTI (AKTIF DI BACKEND GO) ---
  {
    code: 'wuku',
    name: 'Wuku',
    defaultDescription:
      'Siklus 30 wuku pawukon berumur masing-masing 7 hari yang berdaur ulang setiap 210 hari.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'saptawara',
    name: 'Saptawara',
    defaultDescription:
      'Siklus tujuh harian dalam pawewaran (Redite s/d Saniscara) dengan dewa dan nilai urip penentu watak.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'pancawara',
    name: 'Pancawara',
    defaultDescription:
      'Siklus lima harian dalam pawewaran (Umanis s/d Kliwon) yang menjadi poros penentuan hari suci dan neptu.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'ingkel',
    name: 'Ingkel',
    defaultDescription:
      'Daftar pantangan mingguan yang berjalan bersama wuku dan berlaku sepanjang wuku tersebut.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'jejepan',
    name: 'Jejepan',
    defaultDescription:
      'Karakter daur enam harian yang menjadi pedoman pantangan dan kehati-hatian harian.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'lintang',
    name: 'Lintang',
    defaultDescription:
      'Siklus 35 bintang pawukon berumur satu hari yang biasanya dihubungkan dengan abulan paweton.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'panca_sudha',
    name: 'Panca Sudha',
    defaultDescription:
      'Penggolongan sifat manusia yang dihitung dari kombinasi angka urip Saptawara dan Pancawara.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'pangarasan',
    name: 'Pangarasan',
    defaultDescription:
      'Penggolongan sifat dan karakter kepemimpinan manusia berdasarkan urip Saptawara dan Pancawara.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'rakam',
    name: 'Rakam',
    defaultDescription:
      'Perhitungan kepemimpinan dan peruntungan rezeki untuk menentukan kelancaran tugas seseorang.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'watek_madya',
    name: 'Watek Madya',
    defaultDescription:
      'Penggolongan watak tingkatan madya yang memengaruhi kecenderungan tabiat seseorang.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'watek_alit',
    name: 'Watek Alit',
    defaultDescription:
      'Penggolongan watak tingkatan alit yang memengaruhi sifat dasar kelahiran seseorang.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'eka_jala_rsi',
    name: 'Ekajalarsi',
    defaultDescription:
      '24 petunjuk keselamatan harian yang digunakan untuk memperkirakan tabiat atau peruntungan menurut kelahiran.',
    group: 'wariga',
    isCoreActive: true,
  },
  {
    code: 'pratiti',
    name: 'Pratiti',
    defaultDescription:
      '12 rantai hukum sebab akibat (karma) kelahiran yang memengaruhi kepribadian seseorang berdasarkan hari lahirnya.',
    group: 'wariga',
    isCoreActive: true,
  },

  // --- GRUP 4: ASTROLOGI & KEPRIBADIAN ---
  {
    code: 'zodiak',
    name: 'Zodiak',
    defaultDescription:
      '12 zodiak astronomis kalender Bali yang menentukan karakteristik kepribadian berdasarkan tanggal kelahiran Masehi.',
    group: 'astrologi',
    isCoreActive: true,
  },
  {
    code: 'neptu',
    name: 'Neptu',
    defaultDescription:
      'Jumlah nilai urip gabungan dari Saptawara dan Pancawara yang mendasari perhitungan ramalan watak dan otonan.',
    group: 'astrologi',
    isCoreActive: false, // Di database Go values-nya masih kosong
  },

  // --- GRUP 5: WEWARAN PELENGKAP (PENDING DI DATABASE BACKEND GO) ---
  {
    code: 'sadwara',
    name: 'Sadwara',
    defaultDescription:
      'Siklus 6 harian wewaran (Tungleh, Aryang, Urukung, Paniron, Was, Maulu).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'astawara',
    name: 'Astawara',
    defaultDescription:
      'Siklus 8 harian wewaran (Sri, Indra, Guru, Yama, Ludra, Brahma, Kala, Uma).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'sangawara',
    name: 'Sangawara',
    defaultDescription:
      'Siklus 9 harian wewaran (Dangu, Jangur, Gigis, Nohan, Ogan, Erangan, Urungan, Tulus, Dadi).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'dasawara',
    name: 'Dasawara',
    defaultDescription:
      'Siklus 10 harian wewaran (Pandita, Pati, Suka, Duka, Sri, Manuh, Manusa, Raja, Dewa, Raksasa).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'ekawara',
    name: 'Ekawara',
    defaultDescription: 'Siklus 1 harian wewaran (Luang, Menga).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'dwiwara',
    name: 'Dwiwara',
    defaultDescription: 'Siklus 2 harian wewaran (Menga, Pepet).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'triwara',
    name: 'Triwara',
    defaultDescription: 'Siklus 3 harian wewaran (Pasah, Beteng, Kajeng).',
    group: 'wariga',
    isCoreActive: false,
  },
  {
    code: 'caturwara',
    name: 'Caturwara',
    defaultDescription: 'Siklus 4 harian wewaran (Sri, Indra, Guru, Yama).',
    group: 'wariga',
    isCoreActive: false,
  },
];
