import React, { useState } from 'react';
import {
  Sparkles,
  CalendarDays,
  Clock,
  User,
  Check,
  X,
} from 'lucide-react';
import type { PiodalanSubmission, AcaraSubmission } from '../types/kelolaPura.types';
import { formatDateWITA } from '../utils/kelolaPuraUtils';

/**
 * ==============================================================================
 * PROPS: PiodalanSubmissionsDrawer
 * ==============================================================================
 */
export interface PiodalanSubmissionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  piodalanSubmissions: PiodalanSubmission[];
  acaraSubmissions: AcaraSubmission[];
  onApprovePiodalan: (sub: PiodalanSubmission) => Promise<void>;
  onRejectPiodalan: (id: string) => void;
  onApproveAcara: (sub: AcaraSubmission) => Promise<void>;
  onRejectAcara: (id: string) => void;
}

/**
 * ==============================================================================
 * KOMPONEN: PiodalanSubmissionsDrawer (Panel Peninjauan Usulan Khusus Admin)
 * ==============================================================================
 * Tempat Administrator meninjau usulan dari warga / krama pura:
 * 1. Tab Usulan Piodalan
 * 2. Tab Usulan Susunan Acara
 * 3. Tombol Setujui (Approve) yang langsung menuliskan data ke database Go riil
 * 4. Tombol Tolak (Reject)
 * ==============================================================================
 */
export const PiodalanSubmissionsDrawer: React.FC<PiodalanSubmissionsDrawerProps> = ({
  isOpen,
  onClose,
  piodalanSubmissions,
  acaraSubmissions,
  onApprovePiodalan,
  onRejectPiodalan,
  onApproveAcara,
  onRejectAcara,
}) => {
  const [activeTab, setActiveTab] = useState<'piodalan' | 'acara'>('piodalan');
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const pendingPiodalanCount = piodalanSubmissions.filter((s) => s.status === 'pending').length;
  const pendingAcaraCount = acaraSubmissions.filter((s) => s.status === 'pending').length;

  return (
    <section
      aria-label="Tinjauan Usulan Piodalan dan Acara Member"
      className="bg-amber-50/70 rounded-2xl border border-amber-200/90 p-5 shadow-xs space-y-4 animate-in fade-in duration-150"
    >
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-600" aria-hidden="true" />
          <h3 className="text-sm font-bold text-amber-950">
            Peninjauan Usulan Komunitas ({piodalanSubmissions.length + acaraSubmissions.length})
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="inline-flex rounded-xl bg-amber-100/70 p-1 border border-amber-200/80">
            <button
              type="button"
              onClick={() => setActiveTab('piodalan')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'piodalan'
                  ? 'bg-white text-amber-950 shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Usulan Odalan
              {pendingPiodalanCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                  {pendingPiodalanCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acara')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'acara'
                  ? 'bg-white text-amber-950 shadow-2xs'
                  : 'text-amber-800 hover:text-amber-950'
              }`}
            >
              Usulan Acara
              {pendingAcaraCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
                  {pendingAcaraCount}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-amber-800 hover:text-amber-950 px-2 py-1 cursor-pointer"
          >
            Tutup Panel
          </button>
        </div>
      </div>

      {/* Konten Tab 1: Usulan Piodalan */}
      {activeTab === 'piodalan' && (
        <div className="space-y-3">
          {piodalanSubmissions.length === 0 ? (
            <p className="text-xs text-amber-800/80 font-medium py-3 text-center">
              Belum ada usulan jadwal piodalan yang diajukan oleh krama untuk pura ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {piodalanSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl border border-amber-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200/60">
                      Usulan Odalan
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                      <strong className="text-slate-900 font-bold">
                        {formatDateWITA(sub.ceremony_date)}
                      </strong>
                      {sub.level_name && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md">
                          {sub.level_name}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-semibold">{sub.description}</p>
                    {sub.reason && (
                      <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        &ldquo;{sub.reason}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 pt-1">
                      Diajukan oleh: <span className="font-semibold text-slate-600">{sub.user_name}</span> ({sub.user_email})
                    </p>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectPiodalan(sub.id)}
                        disabled={processingId === sub.id}
                        className="min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 inline mr-1" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setProcessingId(sub.id);
                          try {
                            await onApprovePiodalan(sub);
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        disabled={processingId === sub.id}
                        className="min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg bg-[#0e9f90] text-white hover:bg-[#0c8a7d] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        <span>{processingId === sub.id ? 'Menyimpan...' : 'Setujui & Tambah'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Konten Tab 2: Usulan Susunan Acara */}
      {activeTab === 'acara' && (
        <div className="space-y-3">
          {acaraSubmissions.length === 0 ? (
            <p className="text-xs text-amber-800/80 font-medium py-3 text-center">
              Belum ada usulan susunan tahapan acara yang diajukan oleh krama untuk pura ini.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-1">
              {acaraSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white rounded-xl border border-amber-200 p-4 space-y-2.5 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                      Usulan Tahapan Acara
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#0e9f90]" aria-hidden="true" />
                      <strong className="text-slate-900 font-bold">
                        {sub.name}
                      </strong>
                      {sub.level_name && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-md">
                          {sub.level_name}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-700 font-medium">
                      Waktu: <strong>{formatDateWITA(sub.event_at)}</strong> (WITA)
                    </p>
                    {sub.pic_name && (
                      <p className="text-slate-600 flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>PIC: {sub.pic_name} {sub.pic_phone ? `(${sub.pic_phone})` : ''}</span>
                      </p>
                    )}
                    {sub.reason && (
                      <p className="text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                        &ldquo;{sub.reason}&rdquo;
                      </p>
                    )}
                    <p className="text-[11px] text-slate-400 pt-1">
                      Diajukan oleh: <span className="font-semibold text-slate-600">{sub.user_name}</span> ({sub.user_email})
                    </p>
                  </div>

                  {sub.status === 'pending' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onRejectAcara(sub.id)}
                        disabled={processingId === sub.id}
                        className="min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5 inline mr-1" />
                        <span>Tolak</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setProcessingId(sub.id);
                          try {
                            await onApproveAcara(sub);
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        disabled={processingId === sub.id}
                        className="min-h-[32px] px-3 py-1 text-xs font-semibold rounded-lg bg-[#0e9f90] text-white hover:bg-[#0c8a7d] transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5 inline mr-1" />
                        <span>{processingId === sub.id ? 'Menyimpan...' : 'Setujui & Tambah'}</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
