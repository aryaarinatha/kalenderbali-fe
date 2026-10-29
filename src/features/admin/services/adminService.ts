import { apiClient } from '@/lib/axios';
import type {
  AdminMemberItem,
  AdminPurchaseItem,
  UpdateRolePayload,
  ApproveContributorPayload,
} from '../types/admin.types';

/**
 * ==============================================================================
 * SERVICE: Admin HTTP API Handler
 * ==============================================================================
 * Mengelola komunikasi data administratif dengan backend Go:
 * 1. Manajemen User (/api/v1/admin/members)
 * 2. Transaksi User (/api/v1/admin/purchases)
 * 3. Persetujuan Pengajuan Kontribusi (/api/v1/admin/members/:id/approve-contributor)
 */
export const adminService = {
  /**
   * Mengambil seluruh daftar anggota pengguna dari backend
   */
  async getAllMembers(role?: string): Promise<AdminMemberItem[]> {
    const params = role ? { role } : undefined;
    const response = await apiClient.get<{ data: AdminMemberItem[] }>('/admin/members', {
      params,
    });
    return response.data?.data || [];
  },

  /**
   * Memperbarui peran hak akses anggota (Admin / Member)
   */
  async updateMemberRole(userId: string, role: 'Admin' | 'Member'): Promise<{ message: string }> {
    const payload: UpdateRolePayload = { role };
    const response = await apiClient.put<{ message: string }>(
      `/admin/members/${userId}/role`,
      payload
    );
    return response.data;
  },

  /**
   * Menyetujui atau menolak permohonan status kontributor pura / konten
   */
  async approveContributor(userId: string, approve: boolean): Promise<{ message: string }> {
    const payload: ApproveContributorPayload = { approve };
    const response = await apiClient.put<{ message: string }>(
      `/admin/members/${userId}/approve-contributor`,
      payload
    );
    return response.data;
  },

  /**
   * Mengambil riwayat seluruh transaksi pembelian dan langganan dari backend
   */
  async getAllPurchases(limit = 50, offset = 0): Promise<AdminPurchaseItem[]> {
    const response = await apiClient.get<{ data: AdminPurchaseItem[] }>('/admin/purchases', {
      params: { limit, offset },
    });
    return response.data?.data || [];
  },
};
