import type { KomposisiKarakter } from '../types/ramalanSifat.types';

/**
 * ============================================================================
 * MODUL UTILITAS: RAMALAN SIFAT (SINTESIS KESIMPULAN BAHASA INDONESIA)
 * ============================================================================
 * Modul ini menyusun kesimpulan watak 1 paragraf ringkas yang mudah dipahami
 * dalam bahasa Indonesia sehari-hari tanpa membebani pembaca dengan istilah
 * adat yang berat (seperti nama-nama teknis wewaran).
 *
 * Nama teknis wewaran & wuku tetap tersedia secara lengkap dan terstruktur
 * pada 4 kartu pilar di bawahnya untuk pembaca yang ingin mendalami sastra wariga.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// BLOK 1: INTISARI SIFAT BATINIAH (PANCAWARA) DALAM BAHASA INDONESIA
// ----------------------------------------------------------------------------
const PANCAWARA_TRAITS: Record<string, string> = {
  Umanis: 'teguh pada prinsip, pantang menyerah, dan cermat dalam bertutur kata',
  Paing: 'penuh semangat, berani bersikap, dan berjiwa pelindung',
  Pon: 'berpikir matang, tenang, sabar, dan bijaksana dalam mengambil sikap',
  Wage: 'ulet, tekun, pandai menjaga amanah, dan hemat',
  Kliwon: 'ramah, peka terhadap sesama, dan pandai merangkul orang di sekitar',
};

// ----------------------------------------------------------------------------
// BLOK 2: INTISARI SIFAT SOSIAL (SAPTAWARA) DALAM BAHASA INDONESIA
// ----------------------------------------------------------------------------
const SAPTAWARA_TRAITS: Record<string, string> = {
  Redite: 'mandiri, berwibawa, dan terbuka terhadap ide-ide baru',
  Soma: 'santun, cinta damai, dan mengutamakan keharmonisan hubungan',
  Anggara: 'lugas, tegas menyuarakan pendapat, dan berpendirian kuat',
  Buda: 'komunikatif, berwawasan luas, dan cekatan mencari jalan keluar',
  Wraspati: 'menjunjung kebenaran, bijak membimbing, dan adil',
  Sukra: 'mudah berempati, menghargai keindahan, dan menyukai ketenteraman',
  Saniscara: 'cermat, bertanggung jawab, dan tahan uji menghadapi kesulitan',
};

// ----------------------------------------------------------------------------
// BLOK 3: INTISARI PEMBAWAAN BUDI (30 WUKU) DALAM BAHASA INDONESIA
// ----------------------------------------------------------------------------
const WUKU_TRAITS: Record<string, string> = {
  Sinta: 'berbudi luhur, berwibawa, dan teduh pembawaannya',
  Landep: 'tanggap, terampil, dan tajam dalam berpikir',
  Ukir: 'santun bertutur kata, bersahaja, dan disegani',
  Kulantir: 'lincah, berani mengambil langkah, dan cekatan',
  Tolu: 'waspada, cermat, dan kokoh dalam pendirian',
  Gumbreg: 'ramah, mudah bergaul, dan gemar menolong',
  Wariga: 'penuh perhitungan, teliti, dan berhati-hati',
  Warigadean: 'luwes beradaptasi, sopan, dan pantang menyerah',
  Julungwangi: 'menyenangkan, ramah, dan berjiwa sosial',
  Sungsang: 'pemberani, tegas, dan setia pada komitmen',
  Dungulan: 'pantang mundur, berjiwa ksatria, dan gigih berjuang',
  Kuningan: 'berbudi halus, tekun, dan mengutamakan ketenteraman',
  Langkir: 'berani mengambil sikap, disiplin, dan jujur',
  Medangsia: 'peka, hemat, dan sabar dalam berproses',
  Pujut: 'terbuka, jujur, dan menjunjung tinggi keadilan',
  Pahang: 'penuh energi, lugas bertindak, dan pekerja keras',
  Krulut: 'berjiwa seni, ramah, memikat hati, dan pemaaf',
  Merakih: 'cermat, berhati-hati, dan pandai menjaga martabat diri',
  Tambir: 'tenang menghadapi masalah, bijak, dan teratur',
  Medangkungan: 'berpikir mendalam, waspada, dan berhati luhur',
  Matal: 'percaya diri, berani berkorban, dan bertanggung jawab',
  Uye: 'cerdas, memikat hati, dan bersahaja tanpa suka pamer',
  Menail: 'adaptif, cekatan, dan mandiri menyelesaikan tugas',
  Prangbakat: 'tegas, berjiwa ksatria, dan teguh pada pendirian',
  Bala: 'setia kawan, suka membantu, dan berjiwa pelindung',
  Ugu: 'tenang, berwibawa, dan matang pertimbangannya',
  Wayang: 'berjiwa seni, peka rasa, dan supel bergaul',
  Klawu: 'tekun, tabah, ulet, dan tahan banting',
  Dukut: 'gigih berikhtiar, berpendirian teguh, dan pekerja keras',
  Watugunung: 'berwibawa tinggi, teguh memimpin, dan disegani',
};

// ----------------------------------------------------------------------------
// BLOK 4: INTISARI POLA PIKIR & DAYA EKSPRESI (12 ZODIAK)
// ----------------------------------------------------------------------------
const ZODIAK_TRAITS: Record<string, string> = {
  Aries: 'penuh inisiatif, berani, dan berjiwa perintis yang dinamis',
  Taurus: 'sabar, setia, tekun, dan menyukai kestabilan',
  Gemini: 'luwes, komunikatif, dan selalu terbuka terhadap wawasan baru',
  Cancer: 'penyayang, intuitif, dan memiliki kepedulian mendalam',
  Leo: 'percaya diri, berjiwa pemimpin, dan berhati dermawan',
  Virgo: 'analitis, teratur, dan teliti dalam berkarya',
  Libra: 'adil, diplomatis, dan mengutamakan keseimbangan',
  Scorpio: 'bertekad tangguh, setia, dan tajam analisanya',
  Sagitarius: 'optimis, mandiri, dan berjiwa bebas yang antusias',
  Capricorn: 'disiplin, terarah, dan fokus pada tujuan jangka panjang',
  Aquarius: 'inovatif, berpikiran maju, dan menghargai kemandirian',
  Pisces: 'penuh empati, imajinatif, dan berkepekaan rasa tinggi',
};

// ----------------------------------------------------------------------------
// BLOK 5: FALLBACK EKSTRAKSI TEKS BERSIH JIKA DATA TIDAK DITEMUKAN
// ----------------------------------------------------------------------------
/**
 * Membersihkan kalimat penjelasan menjadi bahasa Indonesia yang luwes
 * jika suatu hari ditemukan variasi data baru.
 */
function extractFallbackTrait(text: string): string {
  if (!text) return 'memiliki budi pekerti yang khas';
  const clean = text
    .replace(/^([A-Za-z]+[,:]?\s*)/i, '') // Menghilangkan nama hari/elemen di awal
    .replace(/[;.]/g, ',')
    .trim();

  const parts = clean.split(',');
  const selected = parts.slice(0, 2).join(',').trim();
  return selected ? selected.toLowerCase() : 'memiliki budi pekerti yang khas';
}

// ----------------------------------------------------------------------------
// BLOK 6: FUNGSI UTAMA PEMBANGKIT 1 PARAGRAF KESIMPULAN RINGKAS
// ----------------------------------------------------------------------------
/**
 * Menyusun 1 paragraf kesimpulan ringkas yang mudah dipahami dalam bahasa Indonesia.
 * Menghilangkan istilah teknis/adat yang berat sehingga pembaca dapat langsung
 * memahami karakter intinya dengan cepat dan tepat tanpa rasa bertele-tele.
 *
 * @param karakter Komposisi 4 pilar watak kelahiran
 * @returns 1 paragraf narasi kesimpulan dalam bahasa Indonesia lugas
 */
export function buildRingkasanSintesis(karakter: KomposisiKarakter): string {
  const pancaNama = karakter.pancawara.nama || '';
  const saptaNama = karakter.saptawara.nama || '';
  const wukuNama = karakter.wuku.nama || '';
  const zodiakNama = karakter.zodiak.nama || '';

  const pancaTrait =
    PANCAWARA_TRAITS[pancaNama] || extractFallbackTrait(karakter.pancawara.penjelasan);
  const saptaTrait =
    SAPTAWARA_TRAITS[saptaNama] || extractFallbackTrait(karakter.saptawara.penjelasan);
  const wukuTrait =
    WUKU_TRAITS[wukuNama] || extractFallbackTrait(karakter.wuku.penjelasan);
  const zodiakTrait =
    ZODIAK_TRAITS[zodiakNama] || extractFallbackTrait(karakter.zodiak.penjelasan);

  return `Anda adalah pribadi yang ${pancaTrait}. Dalam kehidupan sosial, Anda cenderung ${saptaTrait}. Karakter ini diimbangi dengan kepribadian yang ${wukuTrait}, serta daya pikir yang ${zodiakTrait}.`;
}
