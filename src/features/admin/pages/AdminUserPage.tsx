import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  Clock,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminMemberItem } from '../types/admin.types';

export default function AdminUserPage() {
  const [members, setMembers] = useState<AdminMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<'all' | 'Admin' | 'Member' | 'Guest'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Ambil daftar pengguna dari backend Go
  const fetchMembers = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminService.getAllMembers();
      setMembers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat daftar pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter daftar pengguna berdasarkan input pencarian dan tab role
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchRole =
        selectedRoleFilter === 'all' ||
        (m.role || '').toLowerCase() === selectedRoleFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      return matchRole && matchSearch;
    });
  }, [members, selectedRoleFilter, searchQuery]);

  // Statistik ringkas pengguna
  const stats = useMemo(() => {
    const total = members.length;
    const admins = members.filter((m) => (m.role || '').toLowerCase() === 'admin').length;
    const verified = members.filter((m) => m.is_verified).length;
    const pendingContrib = members.filter((m) => m.contribution_status === 'pending').length;
    return { total, admins, verified, pendingContrib };
  }, [members]);

  // Handler ubah peran hak akses
  const handleToggleRole = async (member: AdminMemberItem) => {
    const targetRole = (member.role || '').toLowerCase() === 'admin' ? 'Member' : 'Admin';
    const confirmText = `Ubah peran "${member.name}" menjadi "${targetRole}"?`;
    if (!window.confirm(confirmText)) return;

    setUpdatingId(member.id);
    try {
      await adminService.updateMemberRole(member.id, targetRole);
      // Perbarui state lokal secara instan
      setMembers((prev) =>
        prev.map((item) => (item.id === member.id ? { ...item, role: targetRole } : item))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui peran pengguna.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. HERO BANNER HALAMAN (Sesuai AGENTS.md Bagian 4.1)       */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] flex items-center gap-1.5">
              <Users size={14} /> ADMINISTRATOR
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Manajemen User
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Kelola seluruh akun pengguna terdaftar, peran akses sistem (Admin & Member), serta status verifikasi akun.
            </p>
          </div>

          {/* Kotak Metrik Angka Ringkas (AGENTS.md Bagian 4.3) */}
          <div className="flex items-center gap-3">
            <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-4 text-center min-w-[110px] shrink-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                TOTAL USER
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                {stats.total}
              </span>
              <span className="text-[10px] text-teal-700 font-bold block">
                Terdaftar
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 text-center min-w-[110px] shrink-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                ADMIN
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                {stats.admins}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Pengelola
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. FILTER & PENCARIAN                                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Kolom Pencarian */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, email, nomor HP..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
          />
        </div>

        {/* Tab Switcher Role Filter (AGENTS.md Bagian 4.6) */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
            {(['all', 'Admin', 'Member', 'Guest'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer [touch-action:manipulation] ${
                  selectedRoleFilter === role
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {role === 'all' ? 'Semua' : role}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchMembers}
            disabled={isLoading}
            className="min-w-10 min-h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer [touch-action:manipulation] shrink-0"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-teal-600' : ''} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABEL DATA ANGGOTA                                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Error State */}
        {errorMsg && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle size={32} className="text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{errorMsg}</p>
            <button
              onClick={fetchMembers}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !errorMsg && (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                </div>
                <div className="w-20 h-6 bg-slate-100 rounded-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMsg && filteredMembers.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <Users size={36} className="text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-slate-400">Coba ubah kata kunci pencarian atau filter role Anda.</p>
          </div>
        )}

        {/* Tabel Data */}
        {!isLoading && !errorMsg && filteredMembers.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Peran Hak Akses</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map((member) => {
                  const isAdminRole = (member.role || '').toLowerCase() === 'admin';
                  const isUpdating = updatingId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Kolom Profil */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-teal-500 to-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-teal-50">
                              {member.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#0f172a] block truncate">
                              {member.name}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium block truncate">
                              ID: #{member.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Kontak */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-700 block truncate">
                            {member.email}
                          </span>
                          <span className="text-[11px] text-slate-400 block tabular-nums">
                            {member.phone || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Kolom Peran */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-2xs ${
                            isAdminRole
                              ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                              : 'bg-teal-50 text-teal-800 border-teal-200/60'
                          }`}
                        >
                          {isAdminRole ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          <span>{member.role || 'Member'}</span>
                        </span>
                      </td>

                      {/* Kolom Status */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {member.is_verified ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md">
                              <CheckCircle2 size={11} /> Terverifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                              <Clock size={11} /> Belum Verif
                            </span>
                          )}

                          {member.contribution_status && (
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              Kontributor: {member.contribution_status}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kolom Aksi */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleRole(member)}
                          disabled={isUpdating}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer [touch-action:manipulation] disabled:opacity-50 ${
                            isAdminRole
                              ? 'border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                              : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                          }`}
                        >
                          {isUpdating ? (
                            'Menyimpan...'
                          ) : isAdminRole ? (
                            'Jadikan Member'
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <ShieldAlert size={12} /> Jadikan Admin
                            </span>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
