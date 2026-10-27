# FRONTEND UI & DESIGN SYSTEM RULES (REACTJS)

Aturan ini WAJIB dipatuhi oleh AI saat membuat, memodifikasi, atau meninjau halaman dan komponen antarmuka pengguna (UI) pada proyek `frontend-reactjs`. Aturan ini diselaraskan berdasarkan implementasi riil yang telah terbukti pada:
1. Shell Tata Letak: `Navbar`, `Sidebar`, `Footer`, `AppLayout`
2. Modul Utama: `Kalender Bali` (`CalendarHero`, `CalendarGrid`, `CalendarInspector`, `CalendarBottomSection`, `CalendarHeader`, Modals)
3. Modul Utama: `Cari Otonan` (`OtonanFormSection`, `OtonanResultSection`, `OtonanDetailModal`, `WarigaExplanationModal`)

---

## 1. ATURAN FONT & TIPOGRAFI

1. **Font Family**:
   - Font utama aplikasi adalah **Default Tailwind / System UI Sans** (`font-sans`).
   - Menggunakan font sistem bawaan OS (Apple System / BlinkMacSystemFont / Segoe UI / Roboto) tanpa web font eksternal untuk performa instan (0ms overhead) dan tampilan native yang bersih.
   - Hindari font serif kecuali untuk elemen judul dekoratif sakral jika diminta khusus.
2. **Tabular Numbers (Wajib)**:
   - SEMUA teks angka matematis penanggalan, jam, tanggal Masehi, tahun Saka, nomor siklus otonan, nilai neptu/urip, dan waktu hitung mundur (*countdown*) **WAJIB** menyertakan utilitas Tailwind: `tabular-nums` (`font-variant-numeric: tabular-nums`).
   - Hal ini untuk mencegah getaran tata letak (*layout shift/jitter*) saat angka berganti.

---

## 2. SKALA UKURAN FONT & HIERARKI TEKS

Setiap teks harus menggunakan salah satu dari hierarki standar berikut:

| Peran Teks | Utility Class Tailwind | Contoh Penggunaan |
| :--- | :--- | :--- |
| **Eyebrow / Kicker** | `text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488]` (atau `text-slate-400`) | Label modul di atas H1 ("PENCARIAN OTONAN", "DETAIL TANGGAL") |
| **Page Title (H1)** | `text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight` | Judul utama halaman di dalam Hero Banner |
| **Section Title (H2)** | `text-xl sm:text-2xl font-bold text-[#0f172a] tracking-tight` | Judul panel/bagian besar halaman |
| **Card / Widget Title (H3)** | `text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight` | Judul kartu, judul inspektur, header dialog modal |
| **Minor Heading (H4)** | `text-sm sm:text-base font-bold text-[#0f172a]` | Sub-judul di dalam kartu/tabel |
| **Giant Metric / Date** | `text-6xl sm:text-7xl font-extrabold tabular-nums leading-none text-[#0f172a]` | Angka tanggal besar di Calendar Inspector |
| **Card Metric / Counter** | `text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight text-[#0f172a]` | Angka tanggal Otonan Result & Siklus Ke-N |
| **Hero Description** | `text-xs sm:text-sm text-slate-500 font-medium leading-relaxed` | Teks penjelasan di bawah H1 |
| **Body Default** | `text-sm font-normal text-slate-600 leading-relaxed` | Paragraf narasi filosofi, keterangan wariga |
| **Form Label** | `text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5` | Label di atas input text, select, date picker |
| **Form Input / Select** | `text-sm font-semibold text-[#0f172a]` | Teks pilihan atau pengetikan di dalam form |
| **Footnote / Caption** | `text-xs text-slate-400 font-medium` | Keterangan tambahan di bawah input atau footer |
| **Micro Badge / Pill** | `text-[10px] sm:text-[11px] font-bold` | Teks di dalam pill badge wewaran dan status |

---

## 3. PALET WARNA RESMI (PRIMARY S.D. AKSEN)

Dilarang menggunakan sembarang hex baru di luar palet resmi berikut:

### A. Primary Brand (Teal Tirta Bali)
- **Tombol Utama (Default)**: `#0e9f90` (`bg-[#0e9f90] text-white`)
- **Tombol Utama (Hover)**: `#0c8a7d` (`hover:bg-[#0c8a7d]`)
- **Tombol Utama (Active/Pressed)**: `#0a756a` (`active:bg-[#0a756a]`)
- **Teks / Ikon Primer**: `#0d9488` (`text-[#0d9488]` / `text-teal-600`) atau `#0f766e` (`text-teal-700`)
- **Mint Subtle (Latar Lembut)**: `#e6f7f5` (`bg-[#e6f7f5]`)
- **Mint Border**: `#ccf0ea` (`border-[#ccf0ea]`) atau `border-teal-200/60`

### B. Kanvas & Bidang Netral (Surface & Neutral)
- **App Canvas (Latar Belakang Layar)**: `#f4f7f6` (`bg-[#f4f7f6]`)
- **Card Surface**: `#ffffff` (`bg-white border border-slate-200/90`)
- **Inner Surface / Box Tabel**: `#f8fafc` (`bg-[#f8fafc] border border-slate-200/70`)
- **Teks Gelap / Headings**: `#0f172a` (`text-[#0f172a]` / `text-slate-900`)
- **Teks Konten (Body)**: `text-slate-700` (`#334155`)
- **Teks Keterangan (Muted)**: `text-slate-500` (`#64748b`)
- **Teks Placeholder / Label**: `text-slate-400` (`#94a3b8`)
- **Garis Pembatas (Border)**: `border-slate-200/90` atau `border-slate-100`

### C. Aksen Semantik 4 Pilar Wariga & Hari Raya
Pewarnaan elemen kalender di Kalender, Otonan, dan modul mendatang **WAJIB KONSISTEN**:
1. **Saptawara (7 Hari)**: Mint Teal -> `bg-[#e6f7f5] text-[#0f766e] border border-teal-200/60`
2. **Pancawara (5 Hari)**: Emerald Green -> `bg-[#f0fdf4] text-[#15803d] border border-emerald-200/60`
3. **Wuku (30 Wuku)**: Violet Purple -> `bg-[#ede9fe] text-[#6d28d9] border border-violet-200/60`
4. **Sasih (12 Sasih)**: Amber Gold -> `bg-[#fffbeb] text-[#b45309] border border-amber-200/60`
5. **Purnama & Hari Raya Utama**: Surya Gold -> `bg-amber-50 text-amber-800 border border-amber-300` dengan dot kuning
6. **Tilem & Redite (Minggu) / Hari Libur**: Rose Crimson -> `text-rose-600`, badge `bg-rose-50 text-rose-800 border border-rose-200`
7. **Dewasa Ayu / Sukses**: Emerald -> `bg-emerald-50 text-emerald-800 border border-emerald-200`

---

## 4. ELEMEN UI YANG WAJIB SERAGAM DI SETIAP HALAMAN

### 1. Header Halaman Standar (Page Header & Breadcrumb)
Setiap halaman fitur layanan utama diawali header borderless standar dengan breadcrumb hierarkis:
```tsx
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
  <div className="space-y-1.5">
    {/* Breadcrumb navigasi hierarkis */}
    <nav
      aria-label="Breadcrumb"
      className="text-xs font-semibold text-slate-400 flex items-center gap-2 select-none"
    >
      <span>Wargabali</span>
      <span className="text-slate-300">/</span>
      <span>Layanan</span>
      <span className="text-slate-300">/</span>
      <span className="text-teal-700 font-bold">Nama Layanan</span>
    </nav>

    {/* Judul H1 Halaman */}
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#0f172a] tracking-tight">
      Judul Halaman
    </h1>

    {/* Deskripsi ringkas fungsi halaman */}
    <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed max-w-2xl">
      Deskripsi 1-2 kalimat fungsi halaman ini.
    </p>
  </div>

  {/* Aksi Cepat / Tombol Sudut Kanan (Opsional) */}
</div>
```

### 2. Standar Card Container
- Default: `bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-xs`
- Interaktif (dapat diklik): Tambahkan `hover:border-teal-500/40 hover:shadow-sm transition-all cursor-pointer active:scale-[0.99]`

### 3. Stat Counter Box (Kotak Metrik Angka Kanan)
Bentuk kotak statistik di Otonan Hero dan Result Card diseragamkan untuk semua widget counter:
```tsx
<div className="bg-[#e6f7f5] border border-[#ccf0ea] rounded-xl p-3 sm:p-4 text-center min-w-[125px] shrink-0">
  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
    LABEL METRIK
  </span>
  <span className="text-3xl sm:text-4xl font-extrabold text-[#0f172a] tabular-nums tracking-tight block my-0.5">
    {angka}
  </span>
  <span className="text-[10px] text-slate-500 font-medium block">
    keterangan singkat
  </span>
</div>
```

### 4. Standar Tombol (Buttons)
- **Primary Button**:
  `h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50`
- **Secondary / Outline Button**:
  `h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation]`
- **Ghost / Icon Button**:
  `min-w-11 min-h-11 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all flex items-center justify-center cursor-pointer [touch-action:manipulation]`

### 5. Form Input & Select
- Tinggi seragam `h-11` (44px), ergonomis sentuhan:
  `w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all`
- Khusus dropdown `<select>` tambahkan icon `ChevronDown` di kanan:
  `<ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />`

### 6. Segmented Tab Switcher
- Container: `p-1 bg-slate-100 rounded-xl flex gap-1`
- Tab Aktif: `bg-white text-slate-900 font-bold text-xs sm:text-sm shadow-2xs rounded-lg py-2 px-3`
- Tab Inaktif: `text-slate-500 hover:text-slate-800 text-xs sm:text-sm font-medium py-2 px-3 transition-colors`

### 7. Standar Modal Dialog Pop-up
Semua dialog pop-up wajib mengikuti template:
1. `createPortal(..., document.body)` dengan z-index `z-[100]`.
2. Backdrop: `fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4`.
3. Wadah Dialog: `bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden`.
4. Header: `p-6 sm:p-7 bg-gradient-to-r from-teal-50/60 via-slate-50/40 to-emerald-50/30 border-b border-slate-100 flex items-start justify-between gap-4`.
5. Tombol Tutup X di pojok kanan atas dengan ukuran sentuh min 36x36px.
6. Scrollable body: `overflow-y-auto p-6 sm:p-7 space-y-5`.
7. Kotak detail dalam: `bg-[#f8fafc] rounded-xl border border-slate-200/70 p-4`.
8. Accessibility: Wajib ada listener tombol `Escape` dan kunci overflow body.

### 8. Feedback States (Loading & Error)
- **Loading Skeleton**: Menggunakan `animate-pulse bg-slate-100 rounded-xl` berdimensi presisi menyamai layout data asli agar CLS = 0.
- **Error State**: Kartu putih dengan ikon `AlertCircle` merah/amber, judul tebal, deskripsi, dan tombol `Coba Lagi` (`onClick={() => refetch()}`).

---

## 5. STANDAR SHELL TATA LETAK (NAVBAR, SIDEBAR, FOOTER, APPLAYOUT)

Aturan ini mengunci anatomi dan interaktivitas shell tata letak navigasi global:

### 1. AppLayout (Wadah Utama)
- **Canvas Root**: `min-h-screen bg-[#f4f7f6] text-slate-800 flex font-sans antialiased`
- **Offset Konten Dinamis**: `isCollapsed ? 'lg:pl-20' : 'lg:pl-64'` dengan transisi halus `transition-all duration-300 ease-in-out`
- **Container Main Area**: `<main className="flex-1 w-full max-w-[1560px] mx-auto p-4 sm:p-6 lg:p-8">`

### 2. Navbar (Header Atas Sticky)
- **Header Container**: `sticky top-0 z-30 h-18 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-4 lg:px-6 select-none`
- **Tinggi Baku**: `h-18` (72px) sejajar presisi dengan header Sidebar.
- **Tombol Aksi & Hamburger**: Target sentuh min 44x44px (`min-w-11 min-h-11 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 active:scale-95 transition-all [touch-action:manipulation]`).
- **Offline Mode Pill**: `bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold rounded-full px-3 py-1 shadow-2xs`.
- **Premium Badge**: `bg-teal-50 hover:bg-teal-100 text-teal-700 text-xs font-semibold rounded-full border border-teal-200/60 px-3.5 py-2 shadow-2xs`.
- **Popover Notifikasi**: Wadah pop-up `w-80 sm:w-96 rounded-2xl bg-white border border-slate-200/90 shadow-xl overflow-hidden`.

### 3. Sidebar (Navigasi Kiri & Drawer Mobile)
- **Dimensi Lebar Desktop**: `w-64` (saat melebar) dan `w-20` (saat menciut/collapsed) dengan transisi `transition-all duration-300 ease-in-out`.
- **Drawer Mobile (< 1024px)**: `w-72 fixed top-0 bottom-0 left-0 z-50 shadow-2xl` dengan backdrop overlay `fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden`.
- **Header Logo Sidebar**: `h-18 px-4 border-b border-slate-100 flex items-center justify-between shrink-0`.
- **Label Grup Menu**: `text-[11px] font-bold tracking-wider text-slate-400 uppercase px-3 mb-2`.
- **Menu Navigasi Utama (Primary NavItem)**:
  - Tinggi tombol: `min-h-11` (44px, sentuhan ergonomis).
  - Keadaan Aktif: `bg-teal-50 text-teal-800 font-semibold border border-teal-200/60 shadow-2xs rounded-xl`.
  - Keadaan Inaktif: `text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-transparent rounded-xl`.
  - Ukuran Ikon: `size={20}` shrink-0.
- **Sub-Menu Layanan / Accordion**:
  - Container anak: `ml-5 pl-4 border-l border-slate-200/80 space-y-1`.
  - Sub-item Aktif: `text-teal-700 bg-teal-50/80 font-semibold border border-teal-200/40 text-xs min-h-9 px-3 py-1.5 rounded-lg`.
  - Sub-item Inaktif: `text-slate-500 hover:text-slate-900 hover:bg-slate-100/60 border-transparent text-xs min-h-9 px-3 py-1.5 rounded-lg`.
- **Floating Tooltip Desktop (Saat Collapsed)**:
  - `bg-slate-900 text-white text-xs font-medium rounded-lg shadow-lg px-2.5 py-1.5 whitespace-nowrap z-50 pointer-events-none`.

### 4. Footer (Kaki Halaman Global)
- **Container**: `border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto`.
- **Sisi Kiri**: Copyright (`font-semibold text-slate-700 text-xs`) + Slogan pelestarian budaya (`text-[11px] text-slate-400`).
- **Sisi Tengah**: Tautan legal (`text-xs text-slate-500 hover:text-teal-700 transition-colors font-medium`) dipisahkan titik `text-slate-300`.
- **Sisi Kanan**: Badge aplikasi / versi sistem dengan tampilan bersih dan proporsional.

