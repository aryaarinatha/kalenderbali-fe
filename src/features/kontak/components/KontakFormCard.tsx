import React, { useState, useEffect } from 'react';
import { Send, ChevronDown, CheckCircle2, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ============================================================================
 * KOMPONEN: KontakFormCard (Formulir Masukan & Pertanyaan Pengguna)
 * ============================================================================
 * Mengikuti AGENTS.md Bagian 4.4 & 4.5, fe_strategy.md Bab 8.4 & 8.8:
 *  1. Otomasi Akun: Jika pengguna sudah login, alamat email diambil otomatis
 *     dari akun aktif (user.email) tanpa perlu mengetik ulang form email.
 *  2. Pengguna Non-Login: Form input email ditampilkan secara dinamis.
 *  3. Input form seragam h-11 (44px) untuk sentuhan ergonomis [touch-action:manipulation].
 *  4. Dropdown pilihan kategori dengan icon ChevronDown di kanan.
 *  5. Integrasi feedback notifikasi sukses via useAlertStore.
 * ============================================================================
 */
export const KontakFormCard: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { showAlert } = useAlertStore();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    category: 'Pertanyaan Umum',
    subject: '',
    message: '',
  });

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // Sinkronkan nama dan email secara otomatis jika pengguna dalam sesi login
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: user.email || '',
      }));
    }
  }, [isAuthenticated, user]);

  const categories = [
    'Pertanyaan Umum',
    'Koreksi Perhitungan Wariga / Kalender',
    'Pengajuan / Pembaruan Data Pura (Piodalan)',
    'Saran Fitur Baru Aplikasi',
    'Kerja Sama & Kemitraan',
    'Kendala Teknis / Bug Report',
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Tentukan email aktif: ambil dari user login jika ada, atau dari form input jika tamu
    const effectiveEmail =
      isAuthenticated && user?.email ? user.email.trim() : formData.email.trim();

    if (!formData.name.trim() || !effectiveEmail || !formData.message.trim()) {
      showAlert('Mohon lengkapi nama, email, dan isi pesan Anda.');
      return;
    }

    // Bangun subjek dan isi email terstruktur
    const mailSubject = encodeURIComponent(
      `[Wargabali - ${formData.category}] ${formData.subject.trim() || 'Pesan dari Pengguna'}`
    );
    const mailBody = encodeURIComponent(
      `Nama Pengirim: ${formData.name}\n` +
      `Email Pengirim: ${effectiveEmail}\n` +
      (isAuthenticated ? `Status Akun: Terdaftar (${user?.role || 'Member'})\n` : 'Status Akun: Tamu (Non-Login)\n') +
      `Kategori: ${formData.category}\n` +
      `-----------------------------------------\n\n` +
      `${formData.message}\n\n` +
      `---\nDikirim melalui Portal Kontak Kalender Bali Digital (Wargabali)`
    );

    // Buka aplikasi email pengguna dengan parameter yang terisi
    const mailtoUrl = `mailto:bali.integrated.solution@gmail.com?subject=${mailSubject}&body=${mailBody}`;
    window.location.href = mailtoUrl;

    setIsSubmitted(true);
    showAlert('Pesan siap dikirim! Membuka aplikasi email Anda...');

    // Reset formulir setelah jeda singkat
    setTimeout(() => {
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        category: 'Pertanyaan Umum',
        subject: '',
        message: '',
      });
      setIsSubmitted(false);
    }, 4000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs">
      {/* Header Formulir */}
      <div className="space-y-1 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#e6f7f5] text-[#0d9488] flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight">
            Kirim Masukan atau Pertanyaan
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed pl-10">
          Ada saran fitur baru, ralat data wariga, atau ingin mendaftarkan piodalan pura?
          Tulis pesan Anda melalui formulir di bawah ini.
        </p>
      </div>

      {isSubmitted ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-[#0f172a]">
            Pesan Berhasil Diproses!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Aplikasi email Anda telah dibuka dengan format pesan lengkap. Pastikan untuk menekan tombol kirim di aplikasi email Anda.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 pt-5">
          {/* Baris 1: Nama & Email (Kondisional Login) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Nama Lengkap */}
            <div>
              <label
                htmlFor="name"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Nama Lengkap <span className="text-rose-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="Contoh: I Made Suardana"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
            </div>

            {/* Kolom Alamat Email: Otomatis dari Akun jika Login, atau Input Form jika Tamu */}
            {isAuthenticated && user?.email ? (
              <div>
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5 select-none">
                  Alamat Email (Otomatis dari Akun)
                </label>
                <div
                  className="w-full h-11 px-4 rounded-xl border border-teal-200/80 bg-teal-50/50 text-sm font-semibold text-teal-900 flex items-center justify-between gap-2 select-none"
                  title={`Email terhubung dengan akun ${user.name || user.email}`}
                >
                  <span className="font-mono text-xs sm:text-sm text-teal-800 truncate">
                    {user.email}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-800 bg-teal-100 border border-teal-200 px-2 py-0.5 rounded-full shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-[#0d9488]" />
                    Akun Aktif
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="email"
                  className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
                >
                  Alamat Email <span className="text-rose-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="nama@contoh.com"
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                />
              </div>
            )}
          </div>

          {/* Baris 2: Kategori & Subjek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="category"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Kategori Pesan
              </label>
              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full h-11 pl-4 pr-10 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] appearance-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all cursor-pointer"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label
                htmlFor="subject"
                className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
              >
                Subjek Pesan
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Ringkasan topik bahasan"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
              />
            </div>
          </div>

          {/* Baris 3: Isi Pesan */}
          <div>
            <label
              htmlFor="message"
              className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5"
            >
              Isi Pesan / Masukan <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="message"
              name="message"
              required
              rows={4}
              value={formData.message}
              onChange={handleChange}
              placeholder="Tuliskan secara lengkap pertanyaan, saran perbaikan, atau rincian pura/piodalan yang ingin diajukan..."
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm font-normal text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all resize-y leading-relaxed"
            />
          </div>

          {/* Tombol Submit Form */}
          <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
            <span className="text-xs text-slate-400 font-medium">
              Data Anda dirahasiakan &amp; langsung dikirim ke tim pengembang.
            </span>

            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] select-none"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Pesan</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
