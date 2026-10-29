import { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  AlertCircle,
  Smartphone,
  Globe,
} from 'lucide-react';
import { adminService } from '../services/adminService';
import type { AdminPurchaseItem } from '../types/admin.types';

export default function AdminTransactionPage() {
  const [purchases, setPurchases] = useState<AdminPurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Ambil daftar riwayat transaksi dari backend Go
  const fetchPurchases = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = await adminService.getAllPurchases();
      setPurchases(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat data transaksi pengguna.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Filter daftar transaksi
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      const matchStatus =
        selectedStatusFilter === 'all' ||
        (p.transaction_status || '').toLowerCase() === selectedStatusFilter.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.order_id && p.order_id.toLowerCase().includes(q)) ||
        (p.user_name && p.user_name.toLowerCase().includes(q)) ||
        (p.user_email && p.user_email.toLowerCase().includes(q)) ||
        (p.product_id && p.product_id.toLowerCase().includes(q));

      return matchStatus && matchSearch;
    });
  }, [purchases, selectedStatusFilter, searchQuery]);

  // Statistik transaksi
  const stats = useMemo(() => {
    const total = purchases.length;
    const successful = purchases.filter(
      (p) =>
        (p.transaction_status || '').toLowerCase() === 'settlement' ||
        (p.transaction_status || '').toLowerCase() === 'success' ||
        (p.transaction_status || '').toLowerCase() === 'capture'
    );
    const totalRevenue = successful.reduce((sum, item) => sum + (Number(item.gross_amount) || 0), 0);
    return {
      total,
      successCount: successful.length,
      revenue: totalRevenue,
    };
  }, [purchases]);

  // Format mata uang Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
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
              <CreditCard size={14} /> ADMINISTRATOR
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
              Transaksi User
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
              Pantau seluruh riwayat transaksi langganan akun premium melalui Midtrans Payment Gateway dan Google Play Store.
            </p>
          </div>

          {/* Kotak Metrik Angka Ringkas */}
          <div className="flex items-center gap-3">
            <div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-4 text-center min-w-[130px] shrink-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                TOTAL PENDAPATAN
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                {formatRupiah(stats.revenue)}
              </span>
              <span className="text-[10px] text-teal-700 font-bold block">
                {stats.successCount} Berhasil
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 sm:p-4 text-center min-w-[100px] shrink-0">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">
                TRANSAKSI
              </span>
              <span className="text-2xl sm:text-3xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
                {stats.total}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block">
                Semua Status
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
            placeholder="Cari order ID, pelanggan, produk..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
          />
        </div>

        {/* Tab Status Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
          <div className="p-1 bg-slate-100 rounded-xl flex gap-1 text-xs">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'settlement', label: 'Berhasil' },
              { id: 'pending', label: 'Menunggu' },
              { id: 'expire', label: 'Kedaluwarsa' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer [touch-action:manipulation] ${
                  selectedStatusFilter === tab.id
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
            onClick={fetchPurchases}
            disabled={isLoading}
            className="min-w-10 min-h-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all cursor-pointer [touch-action:manipulation] shrink-0"
            title="Muat Ulang Transaksi"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-teal-600' : ''} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. TABEL DATA TRANSAKSI                                   */}
      {/* ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Error State */}
        {errorMsg && (
          <div className="p-6 text-center space-y-2">
            <AlertCircle size={32} className="text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{errorMsg}</p>
            <button
              onClick={fetchPurchases}
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
                <div className="w-10 h-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-100 rounded-md w-1/4" />
                  <div className="h-3 bg-slate-100 rounded-md w-1/3" />
                </div>
                <div className="w-24 h-6 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !errorMsg && filteredPurchases.length === 0 && (
          <div className="p-12 text-center space-y-2">
            <CreditCard size={36} className="text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">Belum ada riwayat transaksi</p>
            <p className="text-xs text-slate-400">Transaksi baru dari pengguna akan tercatat otomatis di sini.</p>
          </div>
        )}

        {/* Tabel Data */}
        {!isLoading && !errorMsg && filteredPurchases.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#f8fafc] border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Order ID & Produk</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Platform</th>
                  <th className="py-3.5 px-4">Nominal</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Tanggal Transaksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPurchases.map((purchase) => {
                  const status = (purchase.transaction_status || '').toLowerCase();
                  const isSuccess =
                    status === 'settlement' || status === 'success' || status === 'capture';
                  const isPending = status === 'pending';

                  return (
                    <tr key={purchase.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Order ID & Produk */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="space-y-0.5">
                          <span className="font-bold text-sm text-[#0f172a] block truncate">
                            {purchase.order_id || `#TX-${purchase.id}`}
                          </span>
                          <span className="text-[11px] text-teal-700 font-bold block truncate">
                            {purchase.product_name || purchase.product_id || 'Paket Premium'}
                          </span>
                        </div>
                      </td>

                      {/* Pelanggan */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block truncate">
                            {purchase.user_name || `User #${purchase.user_id}`}
                          </span>
                          <span className="text-[11px] text-slate-400 block truncate">
                            {purchase.user_email || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Platform Pembayaran */}
                      <td className="py-3.5 px-4">
                        {purchase.platform === 'google_play' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Smartphone size={12} /> Google Play
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                            <Globe size={12} /> Midtrans
                          </span>
                        )}
                      </td>

                      {/* Nominal Transaksi (Tabular Nums) */}
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-sm text-[#0f172a] tabular-nums">
                          {formatRupiah(purchase.gross_amount)}
                        </span>
                      </td>

                      {/* Status Transaksi */}
                      <td className="py-3.5 px-4">
                        {isSuccess ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <CheckCircle2 size={12} /> Berhasil
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full shadow-2xs">
                            <Clock size={12} /> Menunggu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full shadow-2xs capitalize">
                            <XCircle size={12} /> {status || 'Gagal'}
                          </span>
                        )}
                      </td>

                      {/* Tanggal Transaksi */}
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <span className="text-[11px] text-slate-500 font-semibold tabular-nums block">
                          {purchase.created_at
                            ? new Date(purchase.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '—'}
                        </span>
                        {purchase.expires_at && (
                          <span className="text-[10px] text-slate-400 block tabular-nums">
                            Aktif s.d.{' '}
                            {new Date(purchase.expires_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        )}
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
