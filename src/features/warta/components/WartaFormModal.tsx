/**
 * ==============================================================================
 * KOMPONEN: WartaFormModal (Modal Formulir Tulis & Edit Warta Budaya)
 * ==============================================================================
 * Menyediakan antarmuka input formulir untuk menerbitkan warta baru atau
 * memperbarui artikel yang sudah ada.
 *
 * Menerapkan prinsip AGENTS.md & fe_strategy.md:
 * 1. Ergonomi Form: Tinggi input standar h-11 (44px) [touch-action:manipulation].
 * 2. Unggah Gambar & Preview: Pratinjau langsung sebelum berkas dikirim ke server Go.
 * 3. Validasi Presisi: Mencegah pengiriman data kosong atau file > 5MB.
 * 4. Aksesibilitas: Tombol Escape untuk membatalkan dan penanganan fokus.
 * 5. Standar React 19: Inisialisasi state via component key tanpa setState di useEffect.
 * ==============================================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { ArticleBackendItem, CreateArticlePayload, UpdateArticlePayload, WartaFormMode } from '../types/warta.types';
import { getArticleImageUrl } from '../api/wartaApi';

interface WartaFormModalProps {
  /** Penanda apakah modal form sedang terbuka */
  isOpen: boolean;

  /** Mode operasi: 'create' untuk warta baru, 'edit' untuk memperbarui warta */
  mode: WartaFormMode;

  /** Data artikel lama jika dalam mode edit */
  initialData?: ArticleBackendItem | null;

  /** Status loading pengiriman data ke server */
  isSubmitting?: boolean;

  /** Callback ketika modal ditutup / dibatalkan */
  onClose: () => void;

  /** Callback ketika form disubmit dan lolos validasi */
  onSubmit: (payload: CreateArticlePayload | UpdateArticlePayload) => Promise<void> | void;
}

/**
 * Komponen internal dialog form yang di-mount dengan key dinamis:
 * Menginisialisasi state form langsung dari initialData tanpa cascading render.
 */
const WartaFormDialogContent: React.FC<Omit<WartaFormModalProps, 'isOpen'>> = ({
  mode,
  initialData,
  isSubmitting = false,
  onClose,
  onSubmit,
}) => {
  // Inisialisasi nilai awal formulir secara langsung
  const [title, setTitle] = useState(mode === 'edit' && initialData ? initialData.title || '' : '');
  const [content, setContent] = useState(mode === 'edit' && initialData ? initialData.content || '' : '');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(
    mode === 'edit' && initialData?.image ? getArticleImageUrl(initialData.image) : ''
  );
  const [validationError, setValidationError] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Listener tombol Escape dan kunci scroll layar
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSubmitting, onClose]);

  // Handler pemilihan berkas gambar lokal
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValidationError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran berkas maksimum 5MB (sesuai backend Go)
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('Ukuran berkas gambar maksimal 5 MB.');
      return;
    }

    // Validasi format ekstensi gambar
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validTypes.includes(file.type)) {
      setValidationError('Format gambar harus JPG, PNG, WEBP, atau SVG.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  // Handler submit formulir
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || trimmedTitle.length < 3) {
      setValidationError('Judul warta wajib diisi minimal 3 karakter.');
      return;
    }

    if (!trimmedContent || trimmedContent.length < 10) {
      setValidationError('Isi warta wajib diisi minimal 10 karakter.');
      return;
    }

    onSubmit({
      title: trimmedTitle,
      content: trimmedContent,
      imageFile: selectedFile,
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => {
        if (!isSubmitting) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ==================================================================== */}
        {/* 1. HEADER MODAL: JUDUL OPERASI & TOMBOL TUTUP                        */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-50/70 via-slate-50/50 to-emerald-50/40 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#0d9488] block">
              {mode === 'create' ? 'TULIS WARTA BARU' : 'EDIT WARTA BUDAYA'}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0f172a] tracking-tight">
              {mode === 'create' ? 'Publikasikan Kabar & Wawasan' : 'Perbarui Konten Warta'}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-9 min-h-9 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
            aria-label="Tutup Form"
          >
            <X size={18} />
          </button>
        </div>

        {/* ==================================================================== */}
        {/* 2. BODY FORMULIR INPUT (SCROLLABLE)                                  */}
        {/* ==================================================================== */}
        <form id="warta-form" onSubmit={handleSubmit} className="overflow-y-auto p-5 sm:p-7 space-y-5 flex-1">
          {/* Pesan Kesalahan Validasi */}
          {validationError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Input Judul Warta */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
              JUDUL WARTA <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Hari Raya Galungan dan Makna Dharma"
              disabled={isSubmitting}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all disabled:opacity-50"
            />
          </div>

          {/* Unggah Berkas Cover Gambar */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
              FOTO SAMPUL WARTA (OPSIONAL, MAKS 5MB)
            </label>

            {/* Area Unggah & Pratinjau Gambar */}
            <div className="space-y-3">
              {previewUrl ? (
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 group">
                  <img
                    src={previewUrl}
                    alt="Pratinjau Sampul"
                    className="w-full h-full object-cover object-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-2 right-2 min-w-8 min-h-8 rounded-lg bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center transition-all cursor-pointer"
                    title="Hapus foto ini"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSubmitting}
                  className="w-full aspect-video sm:aspect-21/9 rounded-xl border-2 border-dashed border-slate-200 hover:border-teal-400 bg-slate-50/60 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-2 p-4 cursor-pointer text-slate-500 hover:text-teal-700 disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-teal-600">
                    <Upload size={18} />
                  </div>
                  <div className="text-center">
                    <span className="text-xs font-bold block text-slate-700">
                      Klik untuk memilih berkas foto sampul
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Format JPG, PNG, WEBP, atau SVG (Maksimal 5 MB)
                    </span>
                  </div>
                </button>
              )}

              {/* Input Berkas Tersembunyi */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Input Konten Isi Warta */}
          <div>
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
              ISI KONTEN WARTA <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={8}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tuliskan ulasan, sejarah, atau pedoman budaya Bali secara lengkap di sini..."
              disabled={isSubmitting}
              className="w-full p-4 rounded-xl border border-slate-200 bg-white text-sm font-normal text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all resize-y leading-relaxed disabled:opacity-50"
            />
            <span className="text-[11px] text-slate-400 font-medium block mt-1">
              Gunakan baris baru (Enter) untuk memisahkan paragraf agar nyaman dibaca.
            </span>
          </div>
        </form>

        {/* ==================================================================== */}
        {/* 3. FOOTER MODAL: TOMBOL BATAL & SIMPAN                               */}
        {/* ==================================================================== */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm transition-all cursor-pointer inline-flex items-center justify-center [touch-action:manipulation] disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            form="warta-form"
            disabled={isSubmitting}
            className="h-11 px-6 rounded-xl bg-[#0e9f90] hover:bg-[#0c8a7d] active:bg-[#0a756a] text-white font-bold text-sm shadow-xs transition-all active:scale-98 cursor-pointer inline-flex items-center justify-center gap-2 [touch-action:manipulation] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                <span>{mode === 'create' ? 'Terbitkan Warta' : 'Simpan Perubahan'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export const WartaFormModal: React.FC<WartaFormModalProps> = (props) => {
  if (!props.isOpen) return null;

  // Mount konten form dengan key unik agar state terinisialisasi bersih tanpa efek samping
  const formKey = props.mode === 'edit' && props.initialData?.id ? `edit-${props.initialData.id}` : 'create';

  return createPortal(
    <WartaFormDialogContent key={formKey} {...props} />,
    document.body
  );
};
