/**
 * ==============================================================================
 * TIPE DATA: Admin Management (User, Transaksi, & Pengajuan Kontribusi)
 * ==============================================================================
 */

export interface AdminMemberItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'Admin' | 'Member' | 'Guest' | string;
  is_verified: boolean;
  avatar_url?: string | null;
  contribution_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at?: string;
}

export interface AdminPurchaseItem {
  id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  product_id: string;
  product_name?: string;
  order_id: string;
  platform: 'midtrans' | 'google_play' | string;
  gross_amount: number;
  transaction_status: string; // 'settlement' | 'pending' | 'expire' | 'cancel' | etc.
  expires_at?: string | null;
  created_at: string;
}

export interface UpdateRolePayload {
  role: 'Admin' | 'Member';
}

export interface ApproveContributorPayload {
  approve: boolean;
}
