import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Tipe data untuk mendefinisikan state dan action pada sidebar
 */
interface SidebarState {
  /**
   * Menandakan apakah sidebar di mode Desktop (layar lebar) sedang menciut
   * menjadi icon-only (rail) atau tampil penuh (full width).
   * - true  : hanya menampilkan ikon (lebar ~80px)
   * - false : menampilkan ikon + teks label (lebar ~256px)
   */
  isCollapsed: boolean;

  /**
   * Menandakan apakah sidebar di mode Mobile/Tablet (layar kecil) sedang terbuka.
   * State ini TIDAK dipersist ke localStorage agar drawer tidak menghalangi layar saat refresh di HP.
   * - true  : drawer terbuka di atas konten
   * - false : drawer tersembunyi
   */
  isMobileOpen: boolean;

  /**
   * Status terbuka/tertutup untuk masing-masing dropdown sub-menu di sidebar (misal: Layanan, Autentikasi).
   * Disimpan ke localStorage agar pilihan dropdown tetap terbuka/tertutup setelah refresh browser.
   */
  openMenus: Record<string, boolean>;

  /**
   * Membalik status collapse di desktop (buka <-> ciut)
   */
  toggleCollapse: () => void;

  /**
   * Mengatur status collapse di desktop secara eksplisit
   */
  setCollapsed: (collapsed: boolean) => void;

  /**
   * Membalik status drawer di mobile (buka <-> tutup)
   */
  toggleMobile: () => void;

  /**
   * Menutup drawer mobile (misal saat navigasi berpindah halaman atau klik backdrop overlay)
   */
  closeMobile: () => void;

  /**
   * Membuka drawer mobile secara eksplisit
   */
  openMobile: () => void;

  /**
   * Mengubah status buka / tutup dropdown sub-menu (Layanan, Autentikasi)
   */
  toggleSubmenu: (menuLabel: string) => void;
}

/**
 * Global Store Zustand untuk mengelola interaksi layout Sidebar di seluruh aplikasi
 * Menggunakan persist middleware agar preferensi status sidebar (isCollapsed & openMenus)
 * tersimpan di localStorage browser dan tidak hilang saat refresh halaman (F5).
 */
export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      // Nilai default awal
      isCollapsed: false,
      isMobileOpen: false,
      openMenus: {
        Layanan: false,
        Autentikasi: false,
      },

      // Mengubah status collapse desktop (true -> false atau sebaliknya)
      toggleCollapse: () =>
        set((state) => ({
          isCollapsed: !state.isCollapsed,
        })),

      // Menentukan status collapse desktop dengan nilai boolean pasti
      setCollapsed: (collapsed) =>
        set({
          isCollapsed: collapsed,
        }),

      // Mengubah status drawer mobile (buka -> tutup atau sebaliknya)
      toggleMobile: () =>
        set((state) => ({
          isMobileOpen: !state.isMobileOpen,
        })),

      // Menutup drawer mobile (biasa dipanggil saat klik backdrop overlay / link menu)
      closeMobile: () =>
        set({
          isMobileOpen: false,
        }),

      // Membuka drawer mobile
      openMobile: () =>
        set({
          isMobileOpen: true,
        }),

      // Mengubah status buka-tutup dropdown sub-menu
      toggleSubmenu: (menuLabel: string) =>
        set((state) => ({
          openMenus: {
            ...state.openMenus,
            [menuLabel]: !state.openMenus[menuLabel],
          },
        })),
    }),
    {
      name: 'kalenderbali_sidebar_state', // Kunci penyimpanan di localStorage browser
      // partialize: Hanya simpan isCollapsed dan openMenus ke localStorage.
      // isMobileOpen sengaja TIDAK disimpan agar saat refresh di HP, drawer tidak menutupi layar secara otomatis.
      partialize: (state) => ({
        isCollapsed: state.isCollapsed,
        openMenus: state.openMenus,
      }),
    }
  )
);
