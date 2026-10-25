import { apiClient } from '@/lib/axios';
import type { HariRayaKeterangan } from '../types/hariRaya.types';

/**
 * ============================================================================
 * LAPISAN API: HARI RAYA KETERANGAN
 * ============================================================================
 * Mengambil master data makna dan filosofi 106 Hari Raya dari Backend Go:
 * GET /api/v1/keterangan/types/hari_raya
 * ============================================================================
 */

export async function fetchHariRayaKeteranganList(): Promise<HariRayaKeterangan[]> {
  const response = await apiClient.get('/keterangan/types/hari_raya');

  if (response.data.error) {
    throw new Error(response.data.error);
  }

  const values = response.data?.data?.values || [];

  return values.map((val: any) => ({
    id: String(val.id),
    name: val.name,
    description: val.description ? val.description.trim() : '',
    aliases: val.aliases || [],
  }));
}
