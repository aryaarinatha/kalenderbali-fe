import type { MasterWewaranItem } from '../types/otonan.types';

/**
 * ============================================================================
 * MODUL: Pawukon Filter & Validator (Kalender Bali)
 * ============================================================================
 * Menghubungkan relasi matematis siklus Pawukon (210 hari) antar 3 elemen:
 *  - Saptawara (7 harian: Redite s.d. Saniscara)
 *  - Pancawara (5 harian: Umanis s.d. Kliwon)
 *  - Wuku (30 mingguan: Sinta s.d. Watugunung)
 *
 * Rumus Modular Pawukon:
 *  - saptawaraIndex = dayIndex % 7
 *  - pancawaraIndex = (dayIndex + 1) % 5  (hari pertama Sinta adalah Paing)
 *  - wukuIndex      = Math.floor(dayIndex / 7)
 * ============================================================================
 */

export interface PawukonDay {
  dayIndex: number;
  saptawaraId: string;
  pancawaraId: string;
  wukuId: string;
}

/**
 * Membangun tabel lookup 210 hari Pawukon berdasarkan ID master dari backend Go.
 */
export function buildPawukonDays(
  saptawaraList: MasterWewaranItem[],
  pancawaraList: MasterWewaranItem[],
  wukuList: MasterWewaranItem[]
): PawukonDay[] {
  if (saptawaraList.length < 7 || pancawaraList.length < 5 || wukuList.length < 30) {
    return [];
  }

  const days: PawukonDay[] = [];
  for (let dayIndex = 0; dayIndex < 210; dayIndex++) {
    const sIdx = dayIndex % 7;
    const pIdx = (dayIndex + 1) % 5;
    const wIdx = Math.floor(dayIndex / 7);

    const sItem = saptawaraList[sIdx];
    const pItem = pancawaraList[pIdx];
    const wItem = wukuList[wIdx];

    if (sItem && pItem && wItem) {
      days.push({
        dayIndex,
        saptawaraId: sItem.id,
        pancawaraId: pItem.id,
        wukuId: wItem.id,
      });
    }
  }

  return days;
}

/**
 * Mengambil satu-satunya Pancawara yang valid untuk pasangan (Wuku, Saptawara).
 */
export function getValidPancawara(
  wukuId: string,
  saptawaraId: string,
  pawukonDays: PawukonDay[]
): string | null {
  if (!wukuId || !saptawaraId || pawukonDays.length === 0) return null;
  const match = pawukonDays.find(
    (d) => d.wukuId === wukuId && d.saptawaraId === saptawaraId
  );
  return match ? match.pancawaraId : null;
}

/**
 * Mengambil daftar Saptawara yang valid untuk pasangan (Wuku, Pancawara).
 * Dalam satu Wuku, satu Pancawara bisa muncul 1 atau 2 kali (karena 7 hari / 5).
 */
export function getValidSaptawaras(
  wukuId: string,
  pancawaraId: string,
  pawukonDays: PawukonDay[]
): string[] {
  if (!wukuId || !pancawaraId || pawukonDays.length === 0) return [];
  const matches = pawukonDays.filter(
    (d) => d.wukuId === wukuId && d.pancawaraId === pancawaraId
  );
  return matches.map((d) => d.saptawaraId);
}

/**
 * Mengambil 6 Wuku yang valid untuk pasangan (Saptawara, Pancawara).
 * Contoh: Saniscara Kliwon (Tumpek) hanya ada di 6 Wuku.
 */
export function getValidWukus(
  saptawaraId: string,
  pancawaraId: string,
  pawukonDays: PawukonDay[]
): string[] {
  if (!saptawaraId || !pancawaraId || pawukonDays.length === 0) return [];
  const matches = pawukonDays.filter(
    (d) => d.saptawaraId === saptawaraId && d.pancawaraId === pancawaraId
  );
  return matches.map((d) => d.wukuId);
}

/**
 * Mengecek apakah triplet (Saptawara, Pancawara, Wuku) valid dalam siklus Pawukon.
 */
export function isCombinationValid(
  saptawaraId: string,
  pancawaraId: string,
  wukuId: string,
  pawukonDays: PawukonDay[]
): boolean {
  if (!saptawaraId || !pancawaraId || !wukuId || pawukonDays.length === 0) {
    return false;
  }
  return pawukonDays.some(
    (d) =>
      d.saptawaraId === saptawaraId &&
      d.pancawaraId === pancawaraId &&
      d.wukuId === wukuId
  );
}

/**
 * Menghitung opsi yang tersedia (possible) untuk masing-masing dropdown
 * berdasarkan status pilihan aktif pengguna.
 */
export function getFilteredOptions({
  saptawaraId,
  pancawaraId,
  wukuId,
  saptawaraList,
  pancawaraList,
  wukuList,
  pawukonDays,
}: {
  saptawaraId: string;
  pancawaraId: string;
  wukuId: string;
  saptawaraList: MasterWewaranItem[];
  pancawaraList: MasterWewaranItem[];
  wukuList: MasterWewaranItem[];
  pawukonDays: PawukonDay[];
}): {
  availableSaptawaras: MasterWewaranItem[];
  availablePancawaras: MasterWewaranItem[];
  availableWukus: MasterWewaranItem[];
} {
  // Default jika data master belum lengkap
  if (pawukonDays.length === 0) {
    return {
      availableSaptawaras: saptawaraList,
      availablePancawaras: pancawaraList,
      availableWukus: wukuList,
    };
  }

  // 1. Filter WUKU:
  // Jika Saptawara DAN Pancawara sudah dipilih (misal Buda Kliwon atau Tumpek),
  // hanya tampilkan 6 Wuku yang memiliki kombinasi tersebut.
  let availableWukus = wukuList;
  if (saptawaraId && pancawaraId) {
    const validWukuIds = getValidWukus(saptawaraId, pancawaraId, pawukonDays);
    if (validWukuIds.length > 0) {
      availableWukus = wukuList.filter((w) => validWukuIds.includes(w.id));
    }
  }

  // 2. Filter PANCAWARA:
  // Jika Wuku DAN Saptawara sudah dipilih (misal Sinta + Redite),
  // hanya ada 1 Pancawara yang mungkin (misal Paing).
  let availablePancawaras = pancawaraList;
  if (wukuId && saptawaraId) {
    const validPancaId = getValidPancawara(wukuId, saptawaraId, pawukonDays);
    if (validPancaId) {
      availablePancawaras = pancawaraList.filter((p) => p.id === validPancaId);
    }
  }

  // 3. Filter SAPTAWARA:
  // Jika Wuku DAN Pancawara sudah dipilih (misal Sinta + Umanis),
  // hanya tampilkan Saptawara yang memiliki Pancawara tersebut di Wuku tersebut (misal Wraspati).
  let availableSaptawaras = saptawaraList;
  if (wukuId && pancawaraId) {
    const validSaptaIds = getValidSaptawaras(wukuId, pancawaraId, pawukonDays);
    if (validSaptaIds.length > 0) {
      availableSaptawaras = saptawaraList.filter((s) => validSaptaIds.includes(s.id));
    }
  }

  return {
    availableSaptawaras,
    availablePancawaras,
    availableWukus,
  };
}
