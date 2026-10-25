/**
 * ============================================================================
 * TIPE DATA: HARI RAYA KETERANGAN (ENSIKLOPEDIA HARI RAYA)
 * ============================================================================
 * Kontrak data untuk penjelasan filosofis dan makna perayaan Hari Raya / Rahinan.
 * Bersumber dari Backend Go: GET /api/v1/keterangan/types/hari_raya
 * ============================================================================
 */

export interface HariRayaKeterangan {
  id: string;
  name: string;
  description: string;
  aliases?: string[];
}
