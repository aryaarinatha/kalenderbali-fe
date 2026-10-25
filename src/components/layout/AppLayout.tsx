import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Footer from './Footer';
import { useSidebarStore } from '@/stores/useSidebarStore';

export default function AppLayout() {
  // Mengambil state isCollapsed dari store agar margin konten utama
  // bisa menyesuaikan secara otomatis saat sidebar menciut atau melebar
  const { isCollapsed } = useSidebarStore();

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 flex font-sans antialiased">
      {/* ========================================================= */}
      {/* 1. SIDEBAR NAVIGASI KIRI                                 */}
      {/* Mengatur navigasi modul, sub-menu, serta drawer mobile   */}
      {/* ========================================================= */}
      <Sidebar />

      {/* ========================================================= */}
      {/* 2. AREA KONTEN KANAN (NAVBAR + HALAMAN AKTIF + FOOTER)    */}
      {/* Padding kiri (pl) disesuaikan secara dinamis:            */}
      {/* - Di mobile (< 1024px): pl-0 (sidebar berupa overlay)    */}
      {/* - Di desktop saat ciut: lg:pl-20 (80px)                  */}
      {/* - Di desktop saat penuh: lg:pl-64 (256px)                */}
      {/* ========================================================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Header / Top Navbar (Hamburger, aksi, notifikasi, profil) */}
        <Navbar />

        {/* Konten Utama Halaman (Tempat komponen halaman dari <Outlet /> ditampilkan) */}
        <main className="flex-1 w-full max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>

        {/* Footer Aplikasi Mandiri Sesuai Desain Mockup */}
        <Footer />
      </div>
    </div>
  );
}
