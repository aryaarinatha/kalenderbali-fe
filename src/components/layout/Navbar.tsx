import { useState, useEffect, useRef, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sparkles,
  Maximize2,
  Minimize2,
  ChevronDown,
  WifiOff,
  Calendar,
  X,
  Info,
  ChevronRight,
  LogIn,
  LogOut,
  User as UserIcon,
  Crown,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/useSidebarStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';
import { getUserTier, authService } from '@/features/auth/services/authService';
import { useKalenderTahun } from '@/features/kalender/hooks/useKalender';
import {
  getTodayWITA,
  formatFullIndoDate,
  getHariRayaBadgeStyle,
} from '@/features/kalender/utils/calendarUtils';
import { HariRayaDetailModal } from '@/features/kalender/components/HariRayaDetailModal';
import type { HariRayaItem } from '@/features/kalender/types/kalender.types';

/**
 * Tipe data untuk item agenda notifikasi yang diekstrak dari backend Go
 */
interface UpcomingNotificationEvent {
  date: string;
  formattedDate: string;
  diffDays: number;
  diffLabel: string;
  holiday: HariRayaItem;
  wewaranText: string;
  sasihText: string;
}

export default function Navbar() {
  const navigate = useNavigate();

  // Mengambil action toggle sidebar dari global store Zustand
  const { toggleCollapse, toggleMobile } = useSidebarStore();

  // Mengambil status autentikasi dan data pengguna dari Auth Store
  const { user, isAuthenticated } = useAuthStore();

  // Sinkronisasi status langganan aktif dari tabel store_purchases saat pengguna membuka aplikasi
  useEffect(() => {
    if (isAuthenticated) {
      authService.syncUserSubscription().catch(() => {});
    }
  }, [isAuthenticated]);

  // Menghitung status tier tampilan antarmuka (Admin | Premium | Free)
  // Berdasarkan kueri tabel store_purchases tanpa merusak peran backend (guest/member/admin)
  const userTier = useMemo(() => {
    if (!user) return 'Free';
    return getUserTier(user.role, user.isPremium, user.premiumExpiresAt);
  }, [user]);

  // State untuk dropdown menu profil akun pengguna
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // State untuk melacak status fullscreen browser
  const [isFullscreen, setIsFullscreen] = useState(false);

  // State untuk melacak status koneksi internet (fe_strategy.md Bagian 8.4: Graceful Offline)
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // State untuk popover notifikasi rahina terdekat
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // State untuk modal penjelasan detail filosofi hari raya jika diklik
  const [selectedHoliday, setSelectedHoliday] = useState<HariRayaItem | null>(null);

  /**
   * Helper untuk mengambil 1-2 huruf inisial dari nama pengguna jika avatar belum tersedia
   */
  const getInitials = (name?: string): string => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // -------------------------------------------------------------------------
  // 1. Integrasi Data Riil Backend Go via TanStack Query (fe_strategy.md)
  // -------------------------------------------------------------------------
  // Ambil tanggal hari ini dalam zona WITA (UTC+8 / Asia/Makassar)
  const todayStr = useMemo(() => getTodayWITA(), []);

  // Ambil tahun Masehi aktif untuk chunking 1 tahun penuh
  const currentYear = useMemo(() => {
    const y = parseInt(todayStr.split('-')[0], 10);
    return isNaN(y) ? new Date().getFullYear() : y;
  }, [todayStr]);

  // Hook useKalenderTahun mengonsumsi cache TanStack Query dari endpoint GET /api/v1/kalender
  // Berbagi cache memori yang sama persis dengan modul Kalender tanpa request ganda (0ms overhead)
  const { kalenderData, isLoading } = useKalenderTahun(currentYear);

  // -------------------------------------------------------------------------
  // 2. Ekstraksi Agenda Rahina & Hari Raya Terdekat dari Data Riil
  // -------------------------------------------------------------------------
  const upcomingEvents = useMemo<UpcomingNotificationEvent[]>(() => {
    if (!kalenderData || kalenderData.length === 0) return [];

    // Filter tanggal mulai dari hari ini yang memiliki hari raya
    const futureDays = kalenderData.filter(
      (day) => day.tanggal >= todayStr && day.hari_raya && day.hari_raya.length > 0
    );

    const events: UpcomingNotificationEvent[] = [];
    const todayDateObj = new Date(todayStr + 'T00:00:00');

    for (const day of futureDays) {
      const dayDateObj = new Date(day.tanggal + 'T00:00:00');
      const diffTime = dayDateObj.getTime() - todayDateObj.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      let diffLabel = `${diffDays} hari lagi`;
      if (diffDays === 0) {
        diffLabel = 'Hari Ini';
      } else if (diffDays === 1) {
        diffLabel = 'Besok';
      }

      const wewaranText = `${day.wewaran.saptawara.nama} ${day.wewaran.pancawara.nama} · Wuku ${day.wewaran.wuku.nama}`;
      const sasihText = `Sasih ${day.sasih.nama_sasih}`;

      for (const hr of day.hari_raya) {
        events.push({
          date: day.tanggal,
          formattedDate: formatFullIndoDate(day.tanggal),
          diffDays,
          diffLabel,
          holiday: hr,
          wewaranText,
          sasihText,
        });
      }

      // Ambil 5 agenda terdekat agar notifikasi tetap ringkas
      if (events.length >= 5) break;
    }

    return events.slice(0, 5);
  }, [kalenderData, todayStr]);

  // Menentukan apakah ada rahina yang jatuh tepat pada hari ini
  const hasHolidayToday = upcomingEvents.some((ev) => ev.diffDays === 0);

  /**
   * Listener event online/offline browser untuk menampilkan indikator mode offline
   */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Menutup popover notifikasi saat pengguna mengklik di luar area popover
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  /**
   * Menutup dropdown menu profil pengguna saat mengklik di luar area menu
   */
  useEffect(() => {
    const handleClickOutsideUserMenu = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutsideUserMenu);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideUserMenu);
    };
  }, [showUserMenu]);

  /**
   * Handler tombol hamburger (responsive drawer di mobile vs mini-rail di desktop)
   */
  const handleToggleSidebar = () => {
    if (window.innerWidth < 1024) {
      toggleMobile();
    } else {
      toggleCollapse();
    }
  };

  /**
   * Mengaktifkan / menonaktifkan mode Fullscreen pada browser
   */
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  /**
   * Navigasi langsung ke tanggal kalender yang dipilih dari notifikasi
   */
  const handleSelectEventDate = (dateString: string) => {
    setShowNotifications(false);
    navigate(`/kalender?date=${dateString}`);
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. CONTAINER NAVBAR UTAMA (STICKY TOP HEADER)             */}
      {/* Mengikuti standar AGENTS.md Bagian 5.2:                    */}
      {/* Tinggi h-18 (72px), backdrop blur, border-slate-200/80    */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 select-none">
        {/* ========================================================= */}
        {/* SISI KIRI: TOMBOL HAMBURGER TOGGLE SIDEBAR                */}
        {/* Target sentuh min 44x44px & touch-action: manipulation    */}
        {/* ========================================================= */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleSidebar}
            className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all cursor-pointer [touch-action:manipulation]"
            title="Buka / Tutup Sidebar Navigasi"
            aria-label="Toggle Sidebar"
          >
            <Menu size={22} />
          </button>

          {/* Indikator Mode Offline (AGENTS.md Bagian 5.2 Offline Mode Pill) */}
          {!isOnline && (
            <div
              className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold rounded-full shadow-2xs"
              title="Koneksi terputus. Aplikasi menggunakan data cache lokal."
            >
              <WifiOff size={13} className="text-amber-600 shrink-0" />
              <span className="hidden sm:inline">Mode Offline</span>
              <span className="text-[10px] text-amber-600 sm:hidden">Offline</span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SISI KANAN: TOMBOL AKSI, NOTIFIKASI & PROFIL PENGGUNA     */}
        {/* ========================================================= */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Tombol Badge "★ Premium" (AGENTS.md Bagian 5.2: Pill Mint) */}
          <button
            type="button"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 active:bg-teal-200/60 text-teal-700 text-xs font-semibold rounded-full border border-teal-200/60 transition-all shadow-2xs cursor-pointer active:scale-95 [touch-action:manipulation]"
            title="Fitur Premium & Donasi Komunitas"
          >
            <Sparkles size={14} className="text-teal-600 fill-teal-500/20" />
            <span>Premium</span>
          </button>

          {/* Tombol Fullscreen Layar (AGENTS.md Bagian 4.4 Ghost Button) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all cursor-pointer [touch-action:manipulation]"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>

          {/* ======================================================= */}
          {/* TOMBOL LONCENG NOTIFIKASI RAHINA DENGAN DATA REAL GO    */}
          {/* ======================================================= */}
          <div className="relative" ref={notificationRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="min-w-11 min-h-11 flex items-center justify-center p-2 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/80 active:scale-95 rounded-xl transition-all cursor-pointer relative [touch-action:manipulation]"
              title="Pemberitahuan Rahina & Hari Raya Terdekat"
              aria-label="Lihat Notifikasi"
            >
              <Bell size={18} />

              {/* Titik Indikator Notifikasi:
                  - Merah (bg-rose-500) jika ada rahina hari ini
                  - Kuning/Amber (bg-amber-500) jika ada agenda mendatang */}
              {upcomingEvents.length > 0 && (
                <span
                  className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ring-2 ring-white ${
                    hasHolidayToday ? 'bg-rose-500' : 'bg-amber-500'
                  }`}
                />
              )}
            </button>

            {/* POPOVER DAFTAR RAHINA TERDEKAT (AGENTS.md Bagian 5.2: w-80 sm:w-96) */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* Header Popover dengan nuansa gradient halus & eyebrow */}
                <div className="p-4 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] block">
                      Agenda Notifikasi
                    </span>
                    <h4 className="font-extrabold text-[#0f172a] text-sm tracking-tight mt-0.5">
                      Rahina & Hari Raya Terdekat
                    </h4>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Sinkronisasi otomatis dengan Kalender Bali{' '}
                      <span className="tabular-nums font-semibold">{currentYear}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="min-w-8 min-h-8 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 active:scale-95 transition-all cursor-pointer [touch-action:manipulation] shrink-0"
                    aria-label="Tutup notifikasi"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Konten Daftar Rahina (Scrollable) */}
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {/* Status Loading Skeleton (AGENTS.md Bagian 4.8) */}
                  {isLoading && (
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-3/4" />
                      <div className="h-3 bg-slate-100 rounded-lg animate-pulse w-1/2" />
                      <div className="h-4 bg-slate-100 rounded-lg animate-pulse w-4/5" />
                    </div>
                  )}

                  {/* Status Jika Tidak Ada Rahina Mendatang */}
                  {!isLoading && upcomingEvents.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-medium text-slate-700">
                        Tidak ada perayaan terdekat dalam waktu dekat.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Perayaan berikutnya akan segera muncul pada pergantian siklus wuku.
                      </p>
                    </div>
                  )}

                  {/* Render Data Riil Hari Raya (AGENTS.md Palet Semantik & Tabular Nums) */}
                  {!isLoading &&
                    upcomingEvents.map((item, idx) => {
                      const badgeStyle = getHariRayaBadgeStyle(item.holiday.nama);

                      return (
                        <div
                          key={`${item.date}-${item.holiday.id || idx}`}
                          className="p-3.5 hover:bg-slate-50/80 transition-colors flex items-start justify-between gap-3 group"
                        >
                          {/* Sisi Kiri: Klik untuk Buka di Kalender */}
                          <div
                            onClick={() => handleSelectEventDate(item.date)}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-[#0f172a] group-hover:text-[#0d9488] transition-colors">
                                {item.holiday.nama}
                              </span>
                            </div>

                            {/* Konteks Wewaran & Sasih */}
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.wewaranText} · {item.sasihText}
                            </div>

                            {/* Tanggal Terformat Lengkap dengan Tabular Nums */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 tabular-nums">
                                {item.formattedDate}
                              </span>
                              <span className="text-[10px] text-[#0d9488] font-bold inline-flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span>Buka Kalender</span>
                                <ChevronRight size={11} />
                              </span>
                            </div>
                          </div>

                          {/* Sisi Kanan: Badge Jarak Waktu & Tombol Info Filosofi */}
                          <div className="flex flex-col items-end gap-1.5 shrink-0">
                            {/* Badge Jarak Hari dengan Warna Semantik Tradisi Bali & Tabular Nums */}
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs tabular-nums ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`}
                              />
                              <span className="tabular-nums">{item.diffLabel}</span>
                            </span>

                            {/* Tombol Buka Modal Detail Filosofi Hari Raya */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedHoliday(item.holiday);
                              }}
                              className="min-w-7 min-h-7 flex items-center justify-center text-slate-400 hover:text-[#0d9488] hover:bg-teal-50 active:scale-95 rounded-lg transition-all cursor-pointer [touch-action:manipulation]"
                              title="Baca Makna & Filosofi Hari Raya Ini"
                            >
                              <Info size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Footer Popover: Link ke Kalender Lengkap */}
                <div className="py-2.5 px-4 bg-slate-50/70 border-t border-slate-100 text-center">
                  <NavLink
                    to="/kalender"
                    onClick={() => setShowNotifications(false)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0d9488] hover:text-[#0c8a7d] transition-colors py-1"
                  >
                    <Calendar size={13} />
                    <span>
                      Lihat Kalender Lengkap{' '}
                      <span className="tabular-nums font-semibold">{currentYear}</span>
                    </span>
                  </NavLink>
                </div>
              </div>
            )}
          </div>

          {/* Garis Pembatas Vertikal Halus */}
          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* ======================================================= */}
          {/* BLOK OTENTIKASI & PROFIL PENGGUNA DINAMIS               */}
          {/* - Jika Belum Masuk: Tampilkan Tombol "Masuk"            */}
          {/* - Jika Sudah Masuk: Tampilkan Foto, Nama, Status & Menu */}
          {/* ======================================================= */}
          {!isAuthenticated || !user ? (
            /* TOMBOL "MASUK" (Kondisi Belum Login / Tamu) */
            <NavLink
              to="/login"
              className="h-10 px-3.5 sm:px-4.5 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5 sm:gap-2 cursor-pointer [touch-action:manipulation]"
              title="Masuk ke Akun Anda"
            >
              <LogIn size={16} className="shrink-0" />
              <span>Masuk</span>
            </NavLink>
          ) : (
            /* WIDGET PROFIL PENGGUNA DENGAN DROPDOWN (Kondisi Sudah Login) */
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex items-center gap-2.5 pl-1.5 pr-2 py-1.5 rounded-xl hover:bg-slate-100/80 transition-colors cursor-pointer group [touch-action:manipulation]"
                title="Buka Menu Akun Pengguna"
                aria-label="Menu Akun Pengguna"
              >
                {/* Foto Profil: Gambar Asli jika ada URL, atau Inisial jika tidak ada */}
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-100 shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-linear-to-br from-[#0e9f90] to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-teal-100">
                    {getInitials(user.name)}
                  </div>
                )}

                {/* Nama dan Status Pengguna */}
                <div className="hidden md:flex flex-col text-left leading-tight">
                  <span className="text-xs font-bold text-[#0f172a] group-hover:text-[#0d9488] transition-colors truncate max-w-[120px]">
                    {user.name}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider truncate max-w-[120px] flex items-center gap-1 ${
                      userTier === 'Admin'
                        ? 'text-slate-700'
                        : userTier === 'Premium'
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {userTier === 'Premium' && <Crown size={11} className="text-amber-500 shrink-0" />}
                    {userTier}
                  </span>
                </div>

                {/* Panah Indikator Dropdown */}
                <ChevronDown
                  size={14}
                  className={`text-slate-400 group-hover:text-slate-600 transition-transform duration-150 hidden md:block ${
                    showUserMenu ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Popover Dropdown Akun Pengguna */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-white rounded-2xl shadow-xl border border-slate-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                  {/* Header Profil Ringkas */}
                  <div className="p-3.5 bg-slate-50/70 border-b border-slate-100 flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-teal-100 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#0e9f90] to-emerald-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 ring-2 ring-teal-100">
                        {getInitials(user.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-[#0f172a] truncate">
                        {user.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 truncate">
                        {user.username ? `@${user.username}` : user.email || 'Akun Aktif'}
                      </p>
                      <span
                        className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider border shadow-2xs ${
                          userTier === 'Admin'
                            ? 'bg-slate-100 border-slate-300 text-slate-800'
                            : userTier === 'Premium'
                            ? 'bg-gradient-to-r from-amber-50 to-amber-100/70 border-amber-300 text-amber-800'
                            : 'bg-slate-100 border-slate-200/90 text-slate-600'
                        }`}
                      >
                        {userTier === 'Premium' && <Crown size={10} className="text-amber-600 shrink-0" />}
                        {userTier === 'Free' && <Sparkles size={10} className="text-slate-400 shrink-0" />}
                        {userTier}
                      </span>
                    </div>
                  </div>

                  {/* Menu Navigasi Profil */}
                  <div className="p-1.5 space-y-0.5">
                    <NavLink
                      to="/login"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-700 hover:text-[#0f172a] hover:bg-slate-100 transition-colors [touch-action:manipulation]"
                    >
                      <UserIcon size={15} className="text-slate-400 shrink-0" />
                      <span>Profil & Pengaturan Akun</span>
                    </NavLink>
                  </div>

                  {/* Footer: Tombol Keluar (Logout) */}
                  <div className="p-1.5 border-t border-slate-100 bg-slate-50/40">
                    <button
                      type="button"
                      onClick={() => {
                        authService.logout().catch(() => {});
                        setShowUserMenu(false);
                        useAlertStore.getState().showAlert('Berhasil logout!');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer [touch-action:manipulation]"
                    >
                      <LogOut size={15} className="shrink-0 text-rose-500" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 3. MODAL DETAIL FILOSOFI HARI RAYA DARI NOTIFIKASI       */}
      {/* ========================================================= */}
      {selectedHoliday && (
        <HariRayaDetailModal
          isOpen={Boolean(selectedHoliday)}
          onClose={() => setSelectedHoliday(null)}
          holidayId={selectedHoliday.id}
          holidayName={selectedHoliday.nama}
        />
      )}
    </>
  );
}
