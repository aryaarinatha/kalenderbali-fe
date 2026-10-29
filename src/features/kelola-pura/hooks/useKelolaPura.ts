import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PuraBackendItem,
  PuraFinanceCategory,
  PuraFinanceEntry,
  PuraFinanceSummary,
  CreateFinanceEntryPayload,
  UpdateFinanceEntryPayload,
  FinanceSubmission,
  PuraPiodalanRecord,
  PuraAcaraItem,
  PuraViewMode,
  CreatePiodalanPayload,
  CreateAcaraPayload,
  PiodalanSubmission,
  AcaraSubmission,
} from '../types/kelolaPura.types';
import {
  fetchPuraList,
  fetchPuraDetail,
  fetchPuraPiodalans,
  fetchPiodalanAcaras,
  createPuraPiodalan,
  deletePuraPiodalan,
  createPiodalanAcara,
  deletePiodalanAcara,
  fetchFinanceCategories,
  fetchPuraFinance,
  fetchPuraFinanceSummary,
  createFinanceEntry,
  updateFinanceEntry,
  deleteFinanceEntry,
} from '../api/kelolaPuraApi';
import { useAlertStore } from '@/stores/useAlertStore';

/**
 * ==============================================================================
 * CUSTOM HOOKS: Fitur Kelola Pura (TanStack Query + URL State)
 * ==============================================================================
 * Berkas ini mengelola seluruh state asynchronous (server state) dan sinkronisasi
 * navigasi antarmuka untuk fitur Kelola Pura.
 *
 * Menerapkan prinsip:
 * 1. Zero Duplicate Logic: Berbagi memori cache TanStack Query ['piodalan', 'puras', 'all'].
 * 2. Caching Berlapis: Stale time optimal (24 jam untuk data master, mutasi kas invalidation).
 * 3. URL-as-State: Parameter ?view=..., ?pura_id=..., ?q=... tersinkron otomatis.
 * ==============================================================================
 */

// ==============================================================================
// 1. HOOK MASTER DAFTAR PURA (RE-USE CACHE TANSTACK QUERY)
// ==============================================================================

/**
 * usePurasData mengambil 461 master pura resmi dari backend Go.
 * Menggunakan query key yang sama persis dengan modul Piodalan & Dashboard
 * sehingga data langsung tersedia dari memori RAM browser dalam 0 milidetik (Zero-Loading UX).
 */
export function usePurasData() {
  return useQuery<PuraBackendItem[]>({
    queryKey: ['piodalan', 'puras', 'all'],
    queryFn: () => fetchPuraList(),
    staleTime: 1000 * 60 * 60 * 24, // 24 jam di memori
    gcTime: 1000 * 60 * 60 * 48,
    refetchOnWindowFocus: false,
  });
}

/**
 * usePuraDetailData mengambil rincian data satu pura tertentu berdasarkan ID:
 * GET /api/v1/puras/:id
 */
export function usePuraDetailData(puraId: number | string | null) {
  return useQuery<PuraBackendItem | null>({
    queryKey: ['pura', 'detail', String(puraId)],
    queryFn: () => (puraId ? fetchPuraDetail(puraId) : null),
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 30, // 30 menit
    refetchOnWindowFocus: false,
  });
}

// ==============================================================================
// 2. HOOK PIODALAN & SUSUNAN ACARA PURA
// ==============================================================================

/**
 * usePuraPiodalansData mengambil riwayat dan jadwal piodalan resmi pura:
 * GET /api/v1/puras/:id/piodalans
 */
export function usePuraPiodalansData(puraId: number | string | null) {
  return useQuery<PuraPiodalanRecord[]>({
    queryKey: ['pura', 'piodalans', String(puraId)],
    queryFn: () => (puraId ? fetchPuraPiodalans(puraId) : []),
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}

/**
 * usePiodalanAcarasData mengambil rincian tahapan jam acara (Melasti, Puncak, Nyineb):
 * GET /api/v1/piodalans/:id/acaras
 */
export function usePiodalanAcarasData(piodalanId: number | string | null) {
  return useQuery<PuraAcaraItem[]>({
    queryKey: ['piodalan', 'acaras', String(piodalanId)],
    queryFn: () => (piodalanId ? fetchPiodalanAcaras(piodalanId) : []),
    enabled: Boolean(piodalanId),
    staleTime: 1000 * 60 * 15,
    refetchOnWindowFocus: false,
  });
}

/**
 * usePiodalanMutations mengelola mutasi CRUD data piodalan (khusus Administrator)
 */
export function usePiodalanMutations(puraId: number | string) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  const invalidatePiodalans = () => {
    queryClient.invalidateQueries({ queryKey: ['pura', 'piodalans', String(puraId)] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreatePiodalanPayload) => createPuraPiodalan(puraId, payload),
    onSuccess: () => {
      invalidatePiodalans();
      showAlert('Jadwal piodalan baru berhasil ditambahkan!');
    },
    onError: (err: unknown) => {
      console.error('Gagal menambah piodalan:', err);
      showAlert('Gagal menambah jadwal piodalan. Pastikan Anda memiliki hak akses admin.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (piodalanId: number | string) => deletePuraPiodalan(piodalanId),
    onSuccess: () => {
      invalidatePiodalans();
      showAlert('Jadwal piodalan berhasil dihapus!');
    },
    onError: (err: unknown) => {
      console.error('Gagal menghapus piodalan:', err);
      showAlert('Gagal menghapus jadwal piodalan.');
    },
  });

  return {
    createPiodalan: createMutation.mutateAsync,
    deletePiodalan: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * useAcaraMutations mengelola mutasi CRUD tahapan susunan acara piodalan (khusus Administrator)
 */
export function useAcaraMutations(piodalanId: number | string | null) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  const invalidateAcaras = () => {
    if (piodalanId) {
      queryClient.invalidateQueries({ queryKey: ['piodalan', 'acaras', String(piodalanId)] });
    }
  };

  const createMutation = useMutation({
    mutationFn: (payload: CreateAcaraPayload) => {
      if (!piodalanId) throw new Error('ID Piodalan belum dipilih');
      return createPiodalanAcara(piodalanId, payload);
    },
    onSuccess: () => {
      invalidateAcaras();
      showAlert('Tahapan susunan acara berhasil ditambahkan!');
    },
    onError: (err: unknown) => {
      console.error('Gagal menambah susunan acara:', err);
      showAlert('Gagal menambah susunan acara. Pastikan Anda memiliki hak akses admin.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (acaraId: number | string) => deletePiodalanAcara(acaraId),
    onSuccess: () => {
      invalidateAcaras();
      showAlert('Tahapan acara berhasil dihapus!');
    },
    onError: (err: unknown) => {
      console.error('Gagal menghapus acara:', err);
      showAlert('Gagal menghapus tahapan acara.');
    },
  });

  return {
    createAcara: createMutation.mutateAsync,
    deleteAcara: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 3. HOOK KEUANGAN PURA (SUMMARY & MUTASI KAS RIIL)
// ==============================================================================

/**
 * useFinanceCategoriesData mengambil master kategori kas (Punia, Banten, Renovasi, dll):
 * GET /api/v1/finance/categories
 */
export function useFinanceCategoriesData() {
  return useQuery<PuraFinanceCategory[]>({
    queryKey: ['finance', 'categories'],
    queryFn: () => fetchFinanceCategories(),
    staleTime: Infinity, // Kategori master tidak berubah selama sesi
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
}

/**
 * usePuraFinanceData mengambil data mutasi kas sekaligus kalkulasi summary saldo kas pura:
 * GET /api/v1/puras/:id/finance & GET /api/v1/puras/:id/finance/summary
 */
export function usePuraFinanceData(
  puraId: number | string | null,
  year?: string | number,
  categoryId?: string | number,
  entryType?: string
) {
  const queryClient = useQueryClient();

  // 1. Query seluruh baris mutasi kas
  const entriesQuery = useQuery<PuraFinanceEntry[]>({
    queryKey: ['pura', 'finance', 'entries', String(puraId), String(year), String(categoryId), String(entryType)],
    queryFn: () => (puraId ? fetchPuraFinance(puraId, year, categoryId, entryType) : []),
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 5, // Fresh 5 menit
    refetchOnWindowFocus: false,
  });

  // 2. Query kalkulasi ringkasan (Total Debit, Kredit, Saldo, % Kategori)
  const summaryQuery = useQuery<PuraFinanceSummary | null>({
    queryKey: ['pura', 'finance', 'summary', String(puraId), String(year), String(categoryId)],
    queryFn: () => (puraId ? fetchPuraFinanceSummary(puraId, year, categoryId) : null),
    enabled: Boolean(puraId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  // Fungsi helper untuk menyegarkan cache kas pura secara instan
  const refetchFinance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pura', 'finance', 'entries', String(puraId)] });
    queryClient.invalidateQueries({ queryKey: ['pura', 'finance', 'summary', String(puraId)] });
  }, [queryClient, puraId]);

  return {
    entries: entriesQuery.data || [],
    summary: summaryQuery.data,
    isLoading: entriesQuery.isLoading || summaryQuery.isLoading,
    isError: entriesQuery.isError || summaryQuery.isError,
    error: entriesQuery.error || summaryQuery.error,
    refetchFinance,
    refetch: refetchFinance,
  };
}

// ==============================================================================
// 4. HOOK MUTASI KAS ADMINISTRATOR (CREATE, UPDATE, DELETE LANGSUNG)
// ==============================================================================

/**
 * useFinanceMutations menyediakan fungsi eksekusi langsung ke backend Go untuk Role Admin.
 * Otomatis melakukan invalidasi cache agar antarmuka kas terbarui seketika.
 */
export function useFinanceMutations(puraId: number | string) {
  const queryClient = useQueryClient();
  const { showAlert } = useAlertStore();

  // Invalidate seluruh query keuangan untuk pura ini
  const invalidateAllFinance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['pura', 'finance'] });
  }, [queryClient]);

  // Mutasi 1: Tambah Transaksi Kas Baru
  const createMutation = useMutation({
    mutationFn: (payload: CreateFinanceEntryPayload) => createFinanceEntry(puraId, payload),
    onSuccess: () => {
      invalidateAllFinance();
      showAlert('Transaksi kas pura berhasil dicatat!');
    },
  });

  // Mutasi 2: Ubah Transaksi Kas
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number | string; payload: UpdateFinanceEntryPayload }) =>
      updateFinanceEntry(id, payload),
    onSuccess: () => {
      invalidateAllFinance();
      showAlert('Transaksi kas pura berhasil diperbarui!');
    },
  });

  // Mutasi 3: Hapus Transaksi Kas
  const deleteMutation = useMutation({
    mutationFn: (entryId: number | string) => deleteFinanceEntry(entryId),
    onSuccess: () => {
      invalidateAllFinance();
      showAlert('Transaksi kas pura berhasil dihapus!');
    },
  });

  return {
    createEntry: createMutation.mutateAsync,
    updateEntry: updateMutation.mutateAsync,
    deleteEntry: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

// ==============================================================================
// 5. HOOK ANTREAN USULAN KAS (UNTUK MEMBER PREMIUM & ADMIN APPROVAL)
// ==============================================================================

const SUBMISSIONS_STORAGE_KEY = 'kalenderbali_finance_submissions';

/**
 * useFinanceSubmissions mengelola usulan perubahan kas yang dikirimkan oleh Member (Premium):
 * - Member: Mengajukan usulan (tersimpan ke antrean 'pending')
 * - Admin: Melihat daftar usulan, dapat menyetujui (Approve) atau menolak (Reject)
 */
export function useFinanceSubmissions(puraId?: number | string | null) {
  const [submissions, setSubmissions] = useState<FinanceSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Simpan perubahan antrean ke localStorage
  const saveSubmissions = useCallback((newList: FinanceSubmission[]) => {
    setSubmissions(newList);
    try {
      localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Gagal menyimpan usulan kas ke localStorage:', e);
    }
  }, []);

  // Filter usulan sesuai pura yang sedang dibuka (jika ada puraId)
  const filteredSubmissions = useMemo(() => {
    if (!puraId) return submissions;
    return submissions.filter((s) => String(s.pura_id) === String(puraId));
  }, [submissions, puraId]);

  // Hitung jumlah usulan yang statusnya masih 'pending'
  const pendingCount = useMemo(() => {
    return filteredSubmissions.filter((s) => s.status === 'pending').length;
  }, [filteredSubmissions]);

  // Aksi 1: Member mengajukan usulan kas baru
  const addSubmission = useCallback(
    (submission: Omit<FinanceSubmission, 'id' | 'status' | 'created_at'>) => {
      const newEntry: FinanceSubmission = {
        ...submission,
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const updated = [newEntry, ...submissions];
      saveSubmissions(updated);
      return newEntry;
    },
    [submissions, saveSubmissions]
  );

  // Aksi 2: Admin menyetujui usulan (Approve)
  const markApproved = useCallback(
    (submissionId: string) => {
      const updated = submissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'approved' as const } : s
      );
      saveSubmissions(updated);
    },
    [submissions, saveSubmissions]
  );

  // Aksi 3: Admin menolak usulan (Reject)
  const markRejected = useCallback(
    (submissionId: string) => {
      const updated = submissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected' as const } : s
      );
      saveSubmissions(updated);
    },
    [submissions, saveSubmissions]
  );

  return {
    submissions: filteredSubmissions,
    allSubmissions: submissions,
    pendingCount,
    addSubmission,
    markApproved,
    markRejected,
  };
}

// ==============================================================================
// 6. HOOK ANTREAN USULAN PIODALAN & ACARA (MEMBER SUBMISSION & ADMIN APPROVAL)
// ==============================================================================

const PIODALAN_SUBMISSIONS_STORAGE_KEY = 'kalenderbali_piodalan_submissions';
const ACARA_SUBMISSIONS_STORAGE_KEY = 'kalenderbali_acara_submissions';

/**
 * usePiodalanSubmissions mengelola usulan siklus piodalan dan susunan acara yang diajukan oleh Member:
 * - Member: Mengajukan usulan odalan baru atau tahapan acara baru
 * - Admin: Meninjau daftar usulan komunitas, dapat menyetujui (Approve) atau menolak (Reject)
 */
export function usePiodalanSubmissions(puraId?: number | string | null) {
  const [piodalanSubmissions, setPiodalanSubmissions] = useState<PiodalanSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(PIODALAN_SUBMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [acaraSubmissions, setAcaraSubmissions] = useState<AcaraSubmission[]>(() => {
    try {
      const raw = localStorage.getItem(ACARA_SUBMISSIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Simpan perubahan usulan piodalan ke localStorage
  const savePiodalanSubmissions = useCallback((newList: PiodalanSubmission[]) => {
    setPiodalanSubmissions(newList);
    try {
      localStorage.setItem(PIODALAN_SUBMISSIONS_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Gagal menyimpan usulan piodalan ke localStorage:', e);
    }
  }, []);

  // Simpan perubahan usulan acara ke localStorage
  const saveAcaraSubmissions = useCallback((newList: AcaraSubmission[]) => {
    setAcaraSubmissions(newList);
    try {
      localStorage.setItem(ACARA_SUBMISSIONS_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.error('Gagal menyimpan usulan acara ke localStorage:', e);
    }
  }, []);

  // Filter usulan sesuai pura yang sedang aktif
  const filteredPiodalanSubmissions = useMemo(() => {
    if (!puraId) return piodalanSubmissions;
    return piodalanSubmissions.filter((s) => String(s.pura_id) === String(puraId));
  }, [piodalanSubmissions, puraId]);

  const filteredAcaraSubmissions = useMemo(() => {
    if (!puraId) return acaraSubmissions;
    return acaraSubmissions.filter((s) => String(s.pura_id) === String(puraId));
  }, [acaraSubmissions, puraId]);

  // Hitung jumlah usulan yang masih 'pending'
  const pendingPiodalanCount = useMemo(() => {
    return filteredPiodalanSubmissions.filter((s) => s.status === 'pending').length;
  }, [filteredPiodalanSubmissions]);

  const pendingAcaraCount = useMemo(() => {
    return filteredAcaraSubmissions.filter((s) => s.status === 'pending').length;
  }, [filteredAcaraSubmissions]);

  // Aksi: Member mengajukan usulan odalan baru
  const addPiodalanSubmission = useCallback(
    (submission: Omit<PiodalanSubmission, 'id' | 'status' | 'created_at'>) => {
      const newEntry: PiodalanSubmission = {
        ...submission,
        id: `sub_pio_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const updated = [newEntry, ...piodalanSubmissions];
      savePiodalanSubmissions(updated);
      return newEntry;
    },
    [piodalanSubmissions, savePiodalanSubmissions]
  );

  // Aksi: Member mengajukan usulan susunan acara baru
  const addAcaraSubmission = useCallback(
    (submission: Omit<AcaraSubmission, 'id' | 'status' | 'created_at'>) => {
      const newEntry: AcaraSubmission = {
        ...submission,
        id: `sub_aca_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        status: 'pending',
        created_at: new Date().toISOString(),
      };
      const updated = [newEntry, ...acaraSubmissions];
      saveAcaraSubmissions(updated);
      return newEntry;
    },
    [acaraSubmissions, saveAcaraSubmissions]
  );

  // Aksi: Admin menyetujui usulan odalan (Approve)
  const markPiodalanApproved = useCallback(
    (submissionId: string) => {
      const updated = piodalanSubmissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'approved' as const } : s
      );
      savePiodalanSubmissions(updated);
    },
    [piodalanSubmissions, savePiodalanSubmissions]
  );

  // Aksi: Admin menolak usulan odalan (Reject)
  const markPiodalanRejected = useCallback(
    (submissionId: string) => {
      const updated = piodalanSubmissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected' as const } : s
      );
      savePiodalanSubmissions(updated);
    },
    [piodalanSubmissions, savePiodalanSubmissions]
  );

  // Aksi: Admin menyetujui usulan acara (Approve)
  const markAcaraApproved = useCallback(
    (submissionId: string) => {
      const updated = acaraSubmissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'approved' as const } : s
      );
      saveAcaraSubmissions(updated);
    },
    [acaraSubmissions, saveAcaraSubmissions]
  );

  // Aksi: Admin menolak usulan acara (Reject)
  const markAcaraRejected = useCallback(
    (submissionId: string) => {
      const updated = acaraSubmissions.map((s) =>
        s.id === submissionId ? { ...s, status: 'rejected' as const } : s
      );
      saveAcaraSubmissions(updated);
    },
    [acaraSubmissions, saveAcaraSubmissions]
  );

  return {
    piodalanSubmissions: filteredPiodalanSubmissions,
    acaraSubmissions: filteredAcaraSubmissions,
    pendingPiodalanCount,
    pendingAcaraCount,
    totalPendingCount: pendingPiodalanCount + pendingAcaraCount,
    addPiodalanSubmission,
    addAcaraSubmission,
    markPiodalanApproved,
    markPiodalanRejected,
    markAcaraApproved,
    markAcaraRejected,
  };
}

// ==============================================================================
// 6. HOOK SINKRONISASI NAVIGASI URL PARAMETERS (URL-AS-STATE)
// ==============================================================================

/**
 * useKelolaPuraUrlState menyelaraskan status tampilan antarmuka ke query URL browser:
 * - ?view=list / ?view=piodalan / ?view=keuangan
 * - ?pura_id=...
 * - ?q=... (pencarian teks)
 * - ?type=... (filter tipe pura)
 * - ?city=... (filter kabupaten)
 */
export function useKelolaPuraUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Mode tampilan saat ini
  const rawView = searchParams.get('view') as PuraViewMode | null;
  const viewMode: PuraViewMode =
    rawView === 'piodalan' || rawView === 'keuangan' ? rawView : 'list';

  // ID Pura terpilih
  const puraIdParam = searchParams.get('pura_id');
  const selectedPuraId = puraIdParam ? parseInt(puraIdParam, 10) : null;

  // Filter teks pencarian & kategori
  const searchQuery = searchParams.get('q') || '';
  const selectedType = searchParams.get('type') || 'Semua';
  const selectedCity = searchParams.get('city') || 'Semua';
  const selectedYear = searchParams.get('year') || String(new Date().getFullYear());

  // Handler: Beralih mode tampilan (misal klik tombol Piodalan atau Keuangan)
  const navigateToView = useCallback(
    (mode: PuraViewMode, puraId?: number | null) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (mode === 'list') {
          next.delete('view');
          next.delete('pura_id');
        } else {
          next.set('view', mode);
          if (puraId) {
            next.set('pura_id', String(puraId));
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Handler: Mengubah filter pencarian
  const setFilters = useCallback(
    (filters: { q?: string; type?: string; city?: string; year?: string }) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (filters.q !== undefined) {
          if (filters.q.trim()) next.set('q', filters.q.trim());
          else next.delete('q');
        }
        if (filters.type !== undefined) {
          if (filters.type && filters.type !== 'Semua') next.set('type', filters.type);
          else next.delete('type');
        }
        if (filters.city !== undefined) {
          if (filters.city && filters.city !== 'Semua') next.set('city', filters.city);
          else next.delete('city');
        }
        if (filters.year !== undefined) {
          if (filters.year && filters.year !== 'Semua') next.set('year', filters.year);
          else next.delete('year');
        }
        return next;
      });
    },
    [setSearchParams]
  );

  // Handler: Reset seluruh filter ke keadaan awal
  const resetFilters = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('q');
      next.delete('type');
      next.delete('city');
      return next;
    });
  }, [setSearchParams]);

  return {
    viewMode,
    selectedPuraId,
    searchQuery,
    selectedType,
    selectedCity,
    selectedYear,
    navigateToView,
    setFilters,
    resetFilters,
  };
}

