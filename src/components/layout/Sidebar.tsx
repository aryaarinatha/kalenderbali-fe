import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  FileText,
  Landmark,
  Newspaper,
  User,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { useSidebarStore } from '@/stores/useSidebarStore';

/**
 * Tipe data untuk struktur item navigasi tunggal
 */
interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: string;
}

/**
 * Tipe data untuk grup navigasi yang memiliki sub-menu (dropdown/collapsible)
 */
interface NavGroup {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: { to: string; label: string }[];
}

export default function Sidebar() {
  // Mengambil state, status menu persisten, dan fungsi navigasi dari Zustand store
  const { isCollapsed, isMobileOpen, closeMobile, openMenus, toggleSubmenu } =
    useSidebarStore();

  /**
   * Definisi daftar menu navigasi utama sesuai dengan desain mockup
   */
  const primaryNavItems: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/kalender', label: 'Kalender Bali', icon: Calendar },
  ];

  /**
   * Definisi menu Layanan dengan sub-fitur wariga
   */
  const layananGroup: NavGroup = {
    label: 'Layanan',
    icon: Layers,
    children: [
      { to: '/ala-ayuning-dewasa', label: 'Ala Ayuning Dewasa' },
      { to: '/otonan', label: 'Cari Otonan' },
      { to: '/piodalan', label: 'Piodalan' },
      { to: '/hari-raya', label: 'Hari Raya' },
      { to: '/wariga-personal', label: 'Wariga Personal' },
      { to: '/ramalan-sifat', label: 'Ramalan Sifat' },
    ],
  };

  /**
   * Definisi menu informasi & fitur tambahan
   */
  const secondaryNavItems: NavItem[] = [
    { to: '/keterangan', label: 'Keterangan', icon: FileText },
    { to: '/kelola-pura', label: 'Kelola Pura', icon: Landmark },
    { to: '/info-kita', label: 'Info Kita', icon: Newspaper },
  ];

  /**
   * Definisi menu Autentikasi / Akun
   */
  const authGroup: NavGroup = {
    label: 'Autentikasi',
    icon: User,
    children: [
      { to: '/kelola-pengguna', label: 'Kelola Pengguna' },
      { to: '/login', label: 'Masuk / Profil' },
    ],
  };

  return (
    <>
      {/* ========================================================= */}
      {/* 1. BACKDROP OVERLAY KHUSUS MOBILE (< 1024px)              */}
      {/* Muncul saat drawer mobile terbuka; jika diklik akan menutup*/}
      {/* ========================================================= */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ========================================================= */}
      {/* 2. CONTAINER UTAMA SIDEBAR                                */}
      {/* - Di desktop: lebar w-64 atau w-20 sesuai isCollapsed      */}
      {/* - Di mobile: fixed drawer meluncur dari kiri             */}
      {/* ========================================================= */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out select-none ${
          isMobileOpen
            ? 'translate-x-0 w-72 shadow-2xl'
            : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}
      >
        {/* ========================================================= */}
        {/* 3. HEADER SIDEBAR (LOGO & IDENTITAS APLIKASI)             */}
        {/* Mengikuti AGENTS.md Bagian 5.3: Tinggi h-18 (72px) baku  */}
        {/* ========================================================= */}
        <div className="h-18 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
          <NavLink
            to="/"
            onClick={closeMobile}
            className="flex items-center gap-3 group overflow-hidden [touch-action:manipulation]"
            title="Kembali ke Beranda"
          >
            {/* Logo Ikon Tirta Bali (AGENTS.md Primary Brand #0e9f90 to Emerald) */}
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-[#0e9f90] via-teal-600 to-emerald-600 flex items-center justify-center text-white font-extrabold text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <span className="font-extrabold tracking-tight text-white">KB</span>
            </div>

            {/* Nama & Tagline Aplikasi (Disembunyikan saat Desktop Collapsed) */}
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 transition-opacity duration-200">
                <span className="font-extrabold text-[#0f172a] text-base leading-tight tracking-tight truncate">
                  Kalender Bali
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase truncate">
                  Waktu, Tradisi, & Hari Baik
                </span>
              </div>
            )}
          </NavLink>

          {/* Tombol Tutup Silang di HP (Target sentuh ergonomis min 44x44px) */}
          <button
            type="button"
            onClick={closeMobile}
            className="min-w-11 min-h-11 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:scale-95 rounded-xl lg:hidden [touch-action:manipulation] cursor-pointer transition-all"
            aria-label="Tutup menu navigasi"
          >
            <X size={20} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* 4. DAFTAR MENU NAVIGASI (SCROLLABLE AREA)                 */}
        {/* Mengikuti AGENTS.md Bagian 5.3: min-h-11, ergonomis      */}
        {/* Semua menu tergabung dalam satu kesatuan navigasi utuh   */}
        {/* ========================================================= */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-3">
          <nav className="space-y-1">
            {/* Menu Navigasi: Dashboard & Kalender Bali */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-sm font-medium border transition-colors duration-150 outline-none focus:outline-none [touch-action:manipulation] ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-semibold border-teal-200/60 shadow-2xs'
                        : 'border-transparent text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/70'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Floating Tooltip saat Desktop Collapsed (AGENTS.md Bagian 5.3) */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Menu Accordion: Layanan */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu(layananGroup.label)}
                className={`group relative w-full flex items-center justify-between px-3.5 min-h-11 rounded-xl text-sm font-medium border border-transparent transition-colors duration-150 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/70 outline-none focus:outline-none [touch-action:manipulation] cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <layananGroup.icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{layananGroup.label}</span>}
                </div>

                {!isCollapsed && (
                  <span className="text-slate-400 transition-transform duration-200">
                    {openMenus[layananGroup.label] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}

                {/* Tooltip untuk collapsed mode */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {layananGroup.label}
                  </span>
                )}
              </button>

              {/* Sub-item Layanan dengan Smooth Grid Accordion */}
              {!isCollapsed && (
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    openMenus[layananGroup.label]
                      ? 'grid-rows-[1fr] opacity-100 mt-1'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden ml-5 pl-4 border-l border-slate-200/80 space-y-1">
                    {layananGroup.children.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `flex items-center min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150 outline-none focus:outline-none [touch-action:manipulation] ${
                            isActive
                              ? 'text-teal-700 bg-teal-50/80 font-semibold border-teal-200/40'
                              : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:bg-slate-100/60'
                          }`
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Menu Item Tambahan: Keterangan, Kelola Pura, Info Kita */}
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3.5 min-h-11 rounded-xl text-sm font-medium border transition-colors duration-150 outline-none focus:outline-none [touch-action:manipulation] ${
                      isActive
                        ? 'bg-teal-50 text-teal-800 font-semibold border-teal-200/60 shadow-2xs'
                        : 'border-transparent text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/70'
                    } ${isCollapsed ? 'justify-center px-0' : ''}`
                  }
                >
                  <Icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}

                  {/* Tooltip collapsed */}
                  {isCollapsed && (
                    <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                      {item.label}
                    </span>
                  )}
                </NavLink>
              );
            })}

            {/* Menu Accordion: Autentikasi */}
            <div>
              <button
                type="button"
                onClick={() => toggleSubmenu(authGroup.label)}
                className={`group relative w-full flex items-center justify-between px-3.5 min-h-11 rounded-xl text-sm font-medium border border-transparent transition-colors duration-150 text-slate-600 hover:text-[#0f172a] hover:bg-slate-100/70 outline-none focus:outline-none [touch-action:manipulation] cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <authGroup.icon size={20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{authGroup.label}</span>}
                </div>

                {!isCollapsed && (
                  <span className="text-slate-400 transition-transform duration-200">
                    {openMenus[authGroup.label] ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </span>
                )}

                {/* Tooltip collapsed */}
                {isCollapsed && (
                  <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                    {authGroup.label}
                  </span>
                )}
              </button>

              {/* Sub-item Autentikasi dengan Smooth Grid Accordion */}
              {!isCollapsed && (
                <div
                  className={`grid transition-all duration-200 ease-in-out ${
                    openMenus[authGroup.label]
                      ? 'grid-rows-[1fr] opacity-100 mt-1'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden ml-5 pl-4 border-l border-slate-200/80 space-y-1">
                    {authGroup.children.map((subItem) => (
                      <NavLink
                        key={subItem.to}
                        to={subItem.to}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `flex items-center min-h-9 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors duration-150 outline-none focus:outline-none [touch-action:manipulation] ${
                            isActive
                              ? 'text-teal-700 bg-teal-50/80 font-semibold border-teal-200/40'
                              : 'border-transparent text-slate-500 hover:text-[#0f172a] hover:bg-slate-100/60'
                          }`
                        }
                      >
                        {subItem.label}
                      </NavLink>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}
