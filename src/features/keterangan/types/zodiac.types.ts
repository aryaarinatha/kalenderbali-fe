/**
 * ============================================================================
 * TIPE DATA DOMAIN: ZODIAK (KETERANGAN & ENSIKLOPEDIA)
 * ============================================================================
 * Berkas ini mendefinisikan kontrak data domain Zodiak.
 * Zodiak adalah salah satu dari 16 kategori referensi budaya di bawah domain Keterangan.
 * Bersumber dari endpoint Backend Go: GET /api/v1/keterangan/types/zodiak
 *
 * Dapat digunakan bersama oleh:
 *  - Fitur Kalender (Monthly Summary Widget)
 *  - Fitur Keterangan (Ensiklopedia Zodiak)
 *  - Fitur Ramalan Sifat Kelahiran (Weton & Karakter Kelahiran)
 * ============================================================================
 */

/**
 * Metadata detail rentang tanggal astronomis zodiak
 */
export interface BackendZodiacDetail {
  start_month: number;
  start_day: number;
  end_month: number;
  end_day: number;
}

/**
 * Format objek data Zodiak dari respons mentah Backend Go
 */
export interface BackendZodiacValue {
  id: string;
  reference_type_id: string;
  legacy_id?: number;
  type_code: string;
  type_name: string;
  name: string;
  description: string;
  aliases?: string[];
  zodiac_detail?: BackendZodiacDetail;
}

/**
 * Struktur respons pembungkus dari endpoint GET /api/v1/keterangan/types/zodiak
 */
export interface ZodiacApiResponse {
  data: {
    type: {
      id: string;
      code: string;
      name: string;
      description: string;
    };
    values: BackendZodiacValue[];
    total: number;
  };
  meta: {
    type_code: string;
  };
  error: string | null;
}

/**
 * Model Zodiak yang telah dinormalisasi dan siap dikonsumsi langsung oleh komponen UI
 */
export interface ZodiacItem {
  id: string;
  name: string;
  description: string;
  monthIndex: number; // 1 (Januari / Capricorn) s/d 12 (Desember / Sagitarius)
  dateRange: string;  // Contoh: "22 September - 21 Oktober"
  imagePath: string;  // Path file SVG lokal: "/assets/images/zodiak/Asset_10.svg"
  detail?: BackendZodiacDetail;
}
