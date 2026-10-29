import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Landmark, Check } from 'lucide-react';
import { useAllPuras } from '../hooks/usePiodalan';

/**
 * ==============================================================================
 * KOMPONEN: PuraSearchableSelect (Dropdown Pencarian Pura Terpadu)
 * ==============================================================================
 * Komponen searchable combobox/dropdown untuk memilih pura:
 * 1. Menampilkan pilihan nama pura saat ini atau placeholder '-- Pilih Nama Pura --'
 * 2. Ketika diklik, membuka popover dropdown dengan search input di bagian atas
 * 3. Menampilkan daftar 461 pura yang terfilter secara instan saat pengguna mengetik
 * 4. Mendukung penutupan saat klik di luar (outside-click) dan tombol Escape
 * ==============================================================================
 */

interface PuraSearchableSelectProps {
  /** Nilai nama pura atau kata kunci yang dipilih saat ini */
  value: string;

  /** Callback ketika nilai berganti */
  onChange: (value: string) => void;

  /** Teks placeholder ketika belum ada pilihan */
  placeholder?: string;

  /** Status disabled */
  disabled?: boolean;
}

export const PuraSearchableSelect: React.FC<PuraSearchableSelectProps> = ({
  value,
  onChange,
  placeholder = '-- Pilih Nama Pura --',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Ambil daftar master 461 pura dari cache backend Go
  const { data: purasList = [] } = useAllPuras();

  // Hanya tampilkan pura yang memiliki penanggalan pasti (Pawukon lengkap atau Sasih lengkap)
  // Menghindari penyajian data tidak valid/palsu kepada pengguna
  const validPuras = useMemo(() => {
    return purasList.filter((p) => {
      const hasPawukon = Boolean(p.wuku && p.saptawara && p.pancawara);
      const hasSasih = Boolean(p.sasih && p.purnama_tilem);
      return hasPawukon || hasSasih;
    });
  }, [purasList]);

  // Urutkan pura secara alfabetis (A - Z)
  const sortedPuras = useMemo(() => {
    return [...validPuras].sort((a, b) =>
      a.name.localeCompare(b.name, 'id', { sensitivity: 'base' })
    );
  }, [validPuras]);

  // Filter daftar pura berdasarkan teks pencarian
  const filteredPuras = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) {
      return sortedPuras;
    }
    return sortedPuras.filter((p) => {
      const nameMatch = p.name?.toLowerCase().includes(query);
      const cityMatch = p.city?.toLowerCase().includes(query);
      const addressMatch = p.address?.toLowerCase().includes(query);
      return nameMatch || cityMatch || addressMatch;
    });
  }, [sortedPuras, searchTerm]);

  // Handler memilih pura
  const handleSelect = (selectedName: string) => {
    onChange(selectedName);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handler menghapus pilihan
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setSearchTerm('');
  };

  // Fokus otomatis ke search input saat dropdown terbuka
  useEffect(() => {
    if (isOpen) {
      // Delay sedikit agar elemen input ter-mount
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Listener outside-click & Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Cek apakah ada kecocokan persis antara search term dengan pura
  const hasExactMatch = filteredPuras.some(
    (p) => p.name.toLowerCase() === searchTerm.trim().toLowerCase()
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ==================================================================== */}
      {/* 1. TRIGGER BUTTON: MENAMPILKAN PILIHAN SAAT INI / PLACEHOLDER        */}
      {/* ==================================================================== */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`w-full h-11 px-4 pr-11 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
          isOpen
            ? 'border-[#0d9488] ring-2 ring-[#0d9488]/20 bg-white'
            : 'border-slate-200 bg-white hover:border-slate-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 pr-2">
          <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
          <span
            className={`block truncate text-sm font-semibold ${
              value ? 'text-[#0f172a]' : 'text-slate-400'
            }`}
          >
            {value || placeholder}
          </span>
        </div>

        {/* Tombol Hapus & Ikon Chevron */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              title="Hapus pilihan"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#0d9488]' : ''
            }`}
          />
        </div>
      </button>

      {/* ==================================================================== */}
      {/* 2. POPOVER DROPDOWN: INPUT CARI DI ATAS + DAFTAR PURA DI BAWAH       */}
      {/* ==================================================================== */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* A. Kotak Input Pencarian di Bagian Atas Dropdown */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ketik untuk mencari nama pura atau lokasi..."
                className="w-full h-9 pl-9 pr-8 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-[#0f172a] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d9488]/20 focus:border-[#0d9488] transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredPuras.length > 0) {
                      handleSelect(filteredPuras[0].name);
                    } else if (searchTerm.trim()) {
                      handleSelect(searchTerm.trim());
                    }
                  }
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="w-5 h-5 rounded-full text-slate-400 hover:text-slate-600 absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* B. Daftar Pura yang Dapat Digulir (Scrollable List) */}
          <div
            role="listbox"
            className="max-h-64 overflow-y-auto divide-y divide-slate-100/80 p-1 overscroll-contain"
          >
            {/* Opsi Custom: Gunakan kata kunci yang diketik pengguna */}
            {searchTerm.trim() && !hasExactMatch && (
              <button
                type="button"
                onClick={() => handleSelect(searchTerm.trim())}
                className="w-full px-3.5 py-2.5 text-left text-xs sm:text-sm text-teal-800 bg-teal-50/50 hover:bg-teal-50 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">
                  Cari piodalan dengan kata kunci: &quot;{searchTerm.trim()}&quot;
                </span>
              </button>
            )}

            {/* List Item Pura */}
            {filteredPuras.length > 0 ? (
              filteredPuras.map((pura) => {
                const isSelected =
                  pura.name.toLowerCase() === (value || '').toLowerCase();

                return (
                  <button
                    key={pura.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(pura.name)}
                    className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm transition-colors rounded-lg flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-slate-100 font-bold text-[#0f172a]'
                        : 'hover:bg-teal-50/60 text-slate-700 hover:text-teal-900 font-medium'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="block truncate">{pura.name}</span>
                      {(pura.city || pura.address) && (
                        <span className="block text-[11px] text-slate-400 truncate font-normal mt-0.5">
                          {pura.address
                            ? `${pura.address}, ${pura.city || 'Bali'}`
                            : pura.city}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0d9488] shrink-0" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                Tidak ada nama pura yang cocok dengan &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
