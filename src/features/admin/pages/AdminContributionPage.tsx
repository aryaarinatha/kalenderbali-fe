import { useState, useEffect, useMemo } from 'react';
import {
  FileCheck2,
  Search,
  Check,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
  User,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminMemberItem } from '../types/admin.types';

export default function AdminContributionPage() {
  const [members, setMembers] = useState<AdminMemberItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Ambil seluruh data pengguna untuk memfilter yang memiliki riwayat pengajuan kontribusi
  const fetchContributors = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminService.getAllMembers();
      setMembers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat data pengajuan kontributor.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors();
  }, []);

  // Filter anggota yang memiliki status kontribusi
  const filteredContributors = useMemo(() => {
    return members.filter((m) => {
      // Jika status tab bukan 'all', cocokkan status kontribusi
      const status = m.contribution_status || null;
      if (selectedTab !== 'all') {
        if (selectedTab === 'pending' && status !== 'pending') return false;
        if (selectedTab === 'approved' && status !== 'approved') return false;
        if (selectedTab === 'rejected' && status !== 'rejected') return false;
      } else {
        // Pada tab 'all', hanya tampilkan pengguna yang pernah mengajukan status kontributor
        if (!status) return false;
      }

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q));

      return matchSearch;
    });
  }, [members, selectedTab, searchQuery]);

  // Statistik ringkas kontribusi
  const stats = useMemo(() => {
    const pending = members.filter((m) => m.contribution_status === 'pending').length;
    const approved = members.filter((m) => m.contribution_status === 'approved').length;
    const rejected = members.filter((m) => m.contribution_status === 'rejected').length;
    return { pending, approved, rejected };
  }, [members]);

  // Handler persetujuan pengajuan kontributor
  const handleReview = async (member: AdminMemberItem, approve: boolean) => {
    const actionLabel = approve ? 'Menyetujui' : 'Menolak';
    const confirmText = `${actionLabel} permohonan kontributor dari "${member.name}"?`;
    if (!window.confirm(confirmText)) return;

    setProcessingId(member.id);
    try {
      await adminService.approveContributor(member.id, approve);
      const newStatus = approve ? 'approved' : 'rejected';
      // Perbarui state lokal secara instan
      setMembers((prev) =>
        prev.map((item) =>
          item.id === member.id ? { ...item, contribution_status: newStatus } : item
        )
      );
    } catch (err: any) {
      alert(err.message || 'Gagal memproses permohonan kontributor.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* ========================================================= */}
      {/* 1. HERO BANNER HALAMAN                                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
          <div className="space-y-1">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] flex items-center gap-1.5">
              <FileCheck2 size={14} /> ADMINISTRATOR
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Pengajuan Kontribusi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Verifikasi permohonan anggota yang ingin menjadi kontributor data pura, piodalan, artikel, dan wariga kebudayaan Bali.
            </p>
          </div>

          {/* Kotak Metrik Ringkas */}
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 sm:p-4 text-center min-w-[110px] shrink-0">
              <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest block">
                MENUNGGU
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-900 tabular-nums tracking-tight block my-0.5">
                {stats.pending}
              </span>
              <span className="text-[10px] text-amber-600 font-semibold block">
                Perlu Review
              </span>
            </div>

            <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-4 text-center min-w-[110px] shrink-0">
              <span className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest block">
                DISETUJUI
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                {stats.approved}
              </span>
              <span className="text-[10px] text-teal-700 font-semibold block">
                Kontributor Aktif
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
            placeholder="Cari nama, email pemohon..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
          />
        </div>

        {/* Tab Switcher Status */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
            {[
              { id: 'pending', label: `Menunggu (${stats.pending})` },
              { id: 'approved', label: `Disetujui (${stats.approved})` },
              { id: 'rejected', label: `Ditolak (${stats.rejected})` },
              { id: 'all', label: 'Semua' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer [touch-action:manipulation] ${
                  selectedTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={fetchContributors}
            disabled={isLoading}
            className="min-w-10 min-h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer [touch-action:manipulation] shrink-0"
            title="Muat Ulang Data"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-teal-600' : ''} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABEL DATA PENGAJUAN KONTRIBUTOR                       */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Error State */}
        {errorMsg && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle size={32} className="text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{errorMsg}</p>
            <button
              onClick={fetchContributors}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-bold rounded-lg cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !errorMsg && (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                </div>
                <div className="w-32 h-8 bg-slate-100 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMsg && filteredContributors.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <User size={36} className="text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">
              {selectedTab === 'pending'
                ? 'Tidak ada permohonan kontributor yang sedang menunggu persetujuan.'
                : 'Tidak ada data pengajuan kontributor.'}
            </p>
            <p className="text-xs text-slate-400">
              Permohonan baru akan muncul ketika anggota menekan tombol ajukan kontributor.
            </p>
          </div>
        )}

        {/* Tabel Data */}
        {!isLoading && !errorMsg && filteredContributors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Pemohon</th>
                  <th className="py-3.5 px-4">Kontak</th>
                  <th className="py-3.5 px-4">Peran Pengguna</th>
                  <th className="py-3.5 px-4">Status Pengajuan</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Keputusan Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContributors.map((member) => {
                  const status = member.contribution_status;
                  const isProcessing = processingId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Pemohon */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          {member.avatar_url ? (
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-linear-to-br from-amber-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 ring-2 ring-amber-50">
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

                      {/* Kontak */}
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

                      {/* Peran Pengguna */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {member.role || 'Member'}
                        </span>
                      </td>

                      {/* Status Pengajuan */}
                      <td className="py-3.5 px-4">
                        {status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <CheckCircle2 size={12} /> Disetujui
                          </span>
                        ) : status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <XCircle size={12} /> Ditolak
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <Clock size={12} /> Menunggu Review
                          </span>
                        )}
                      </td>

                      {/* Tombol Keputusan */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleReview(member, true)}
                            disabled={isProcessing || status === 'approved'}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 transition-all cursor-pointer inline-flex items-center gap-1 [touch-action:manipulation] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Setujui sebagai Kontributor"
                          >
                            <Check size={13} />
                            <span>Setujui</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReview(member, false)}
                            disabled={isProcessing || status === 'rejected'}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 transition-all cursor-pointer inline-flex items-center gap-1 [touch-action:manipulation] disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Tolak Permohonan"
                          >
                            <X size={13} />
                            <span>Tolak</span>
                          </button>
                        </div>
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
