/**
 * ============================================================================
 * TIPE DATA & KONTRAK MODEL: RAMALAN SIFAT (WATAK & KARAKTER KELAHIRAN)
 * ============================================================================
 * Berkas ini mendefinisikan seluruh kontrak data (TypeScript interfaces) untuk
 * fitur Ramalan Sifat Penanggalan Bali pada aplikasi frontend ReactJS.
 *
 * Prinsip Desain:
 *  1. 100% Real Data: Seluruh struktur diselaraskan secara presisi dengan
 *     DTO Go Backend (backend-go/kalenderbali-be/internal/domain/ramalan_sifat.go).
 *  2. Zero Dummy: Tanpa model rekaan/persentase buatan yang tidak didukung backend.
 *  3. Presisi ID 64-Bit: ID elemen kalender diserialisasikan sebagai string
 *     untuk mencegah isu pemotongan angka integer di atas 53-bit JavaScript.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: REQUEST DTO (PARAMETER PENCARIAN)
// ----------------------------------------------------------------------------
/**
 * Parameter masukan saat klien mengirimkan permintaan perhitungan watak kelahiran
 * ke endpoint POST /api/v1/search/ramalan-sifat.
 */
export interface RamalanSifatRequest {
  /**
   * Tanggal lahir Masehi berformat ISO "YYYY-MM-DD".
   * Contoh: "2005-05-24" atau "1998-12-22".
   */
  tanggal_lahir: string;

  /**
   * Penanda apakah kelahiran terjadi sebelum pukul 06.00 WITA (matahari terbit).
   * Dalam tradisi kalender Bali, pergantian hari adat wewaran terjadi saat fajar.
   * Jika true, wewaran kelahiran dimundurkan 1 hari kalender oleh backend Go.
   */
  sebelum_jam_6: boolean;
}

/**
 * Representasi parameter pencarian aktif di state halaman atau query string URL.
 */
export interface RamalanSifatSearchParams {
  tanggal_lahir: string;
  sebelum_jam_6: boolean;
}

// ----------------------------------------------------------------------------
// BLOK 2: IDENTITAS KELAHIRAN (WETON & KALENDER SAKA BALI)
// ----------------------------------------------------------------------------
/**
 * Merangkum hasil perhitungan penanggalan Bali untuk tanggal kelahiran pengguna,
 * termasuk hari dalam bahasa Indonesia, nama Sasih, dan tahun Saka resmi.
 */
export interface IdentitasKelahiranRamalan {
  /** Tanggal lahir sipil asli yang dimasukkan oleh pengguna ("YYYY-MM-DD") */
  tanggal_lahir_sipil: string;

  /** Status apakah lahir sebelum pergantian hari wewaran (06.00 WITA) */
  sebelum_jam_6: boolean;

  /** Tanggal kalender wewaran (mundur 1 hari jika sebelum_jam_6 bernilai true) */
  tanggal_lahir_kalender: string;

  /** Nama hari dalam bahasa Indonesia (contoh: "Selasa", "Minggu") */
  hari: string;

  /** Format tanggal panjang resmi Indonesia (contoh: "24 Mei 2005", "22 Desember 1998") */
  tanggal_format_indonesia: string;

  /** Tahun Saka penanggalan Bali saat kelahiran (contoh: 1927, 1920) */
  tahun_saka: number;

  /** Nama Sasih (bulan penanggalan Bali, contoh: "Menga", "Kepitu", "Kadasa") */
  sasih: string;

  /** Rangkuman weton kelahiran lengkap (contoh: "Anggara Umanis Uye, Sasih Menga, Saka 1927") */
  ringkasan_weton: string;
}

// ----------------------------------------------------------------------------
// BLOK 3: DETAIL ELEMEN KARAKTER DARI 4 PILAR
// ----------------------------------------------------------------------------
/**
 * Struktur tunggal untuk satu pilar karakter wariga.
 * Digunakan secara terpadu untuk Pancawara, Saptawara, Wuku, maupun Zodiak.
 */
export interface KarakterElemen {
  /** Identitas unik nilai di tabel calendar_reference_values (contoh: "430") */
  id: string;

  /** Nama resmi elemen (contoh: "Umanis", "Anggara", "Uye", "Gemini") */
  nama: string;

  /** Nilai urip/neptu matematis (khusus Saptawara dan Pancawara) */
  urip?: number;

  /** Nomor urut legacy (1..5 Pancawara, 1..7 Saptawara, 1..12 Zodiak) */
  nomor_urut?: number;

  /** Nomor urut wuku ke-1 s/d 30 (khusus kategori Wuku) */
  nomor_wuku?: number;

  /** Rentang tanggal astronomis kalender (khusus kategori Zodiak, contoh: "21 Mei - 20 Juni") */
  rentang_tanggal?: string;

  /** Nama berkas ikon vektor SVG lokal (khusus Zodiak, contoh: "Asset_06") */
  aset_gambar?: string;

  /** Judul representatif sifat (contoh: "Watak Berdasarkan Pancawara") */
  judul_sifat: string;

  /** Teks filosofis mendalam watak bawaan yang bersumber langsung dari basis data */
  penjelasan: string;
}

// ----------------------------------------------------------------------------
// BLOK 4: KOMPOSISI 4 PILAR PERWATAKAN
// ----------------------------------------------------------------------------
/**
 * Komposisi terpadu 4 pilar watak kelahiran yang dihitung secara deterministik:
 * 1. Pancawara: Menggambarkan watak batiniah terdalam dan kepekaan rasa.
 * 2. Saptawara: Menggambarkan watak sosial lahiriah dan perilaku interpersonal.
 * 3. Wuku: Menggambarkan takdir pawacakan wuku bawaan lahir.
 * 4. Zodiak: Karakteristik astrologis penyeimbang modern.
 */
export interface KomposisiKarakter {
  pancawara: KarakterElemen;
  saptawara: KarakterElemen;
  wuku: KarakterElemen;
  zodiak: KarakterElemen;
}

// ----------------------------------------------------------------------------
// BLOK 5: DATA RESPON UTAMA (DATA PAYLOAD)
// ----------------------------------------------------------------------------
/**
 * Payload data utama yang dikembalikan oleh backend Go di dalam properti `data`.
 */
export interface RamalanSifatData {
  /** Rangkuman identitas penanggalan kelahiran */
  identitas_kelahiran: IdentitasKelahiranRamalan;

  /** Uraian komprehensif 4 pilar watak */
  karakter: KomposisiKarakter;

  /** Narasi rangkuman umum persona watak individu dari perpaduan weton dan zodiak */
  ringkasan_umum: string;
}

// ----------------------------------------------------------------------------
// BLOK 6: RESPONSE ENVELOPE REST API RESMI
// ----------------------------------------------------------------------------
/**
 * Amplop standar API Backend Go yang memuat data, metadata eksekusi, dan informasi error.
 */
export interface RamalanSifatAPIEnvelope {
  /** Data hasil perhitungan, bernilai null jika terjadi error */
  data: RamalanSifatData | null;

  /** Metadata eksekusi server Go */
  meta: {
    zona_waktu: string;
    rule_version: string;
    waktu_proses_ms: number;
  } | null;

  /** Objek kesalahan jika HTTP status >= 400 */
  error: {
    code: string;
    message: string;
  } | null;
}

