/**
 * Bahasa antarmuka: Indonesia (default) dan English.
 * Teks yang tampil (termasuk yang dirender ulang oleh game) diterjemahkan langsung di DOM berdasarkan kamus ini,
 * sehingga semua game ikut berganti bahasa tanpa mengubah kode masing-masing game.
 */
import { getStr, setStr } from './storage.js';

export type Lang = 'id' | 'en';

/** Pasangan [Indonesia, English]. Teks yang tidak ada di sini tetap tampil apa adanya. */
const PAIRS: ReadonlyArray<readonly [string, string]> = [
  // navigasi & pengaturan
  ['Game', 'Games'], ['Rekor', 'Records'], ['Setting', 'Settings'], ['Ganti tema', 'Change theme'], ['Kembali', 'Back'],
  ['Tampilan', 'Display'], ['Tema', 'Theme'], ['Sistem', 'System'], ['Terang', 'Light'], ['Gelap', 'Dark'],
  ['Ikon', 'Icons'], ['Solid', 'Solid'], ['Garis', 'Outline'], ['Putih', 'White'],
  ['Bahasa', 'Language'],
  ['Suara', 'Sound'], ['Efek suara', 'Sound effects'], ['Musik', 'Music'], ['Pilihan lagu', 'Song choice'],
  ['Semua bergantian', 'All in turn'], ['Lainnya', 'More'], ['Bagikan game ini', 'Share this game'],
  ['Kebijakan privasi', 'Privacy policy'], ['Tentang', 'About'], ['Hapus semua rekor', 'Clear all records'],
  ['Rekor dihapus', 'Records cleared'], ['Yakin? Ketuk sekali lagi', 'Sure? Tap once more'],
  ['Cara main', 'How to play'], ['Cara bermain', 'How to play'], ['Petunjuk', 'Hint'],
  // nama game
  ['Hitung Cepat', 'Quick Count'], ['Benar/Salah', 'True/False'], ['Operator', 'Operator'], ['Ketik Jawaban', 'Type Answer'],
  ['Bandingkan', 'Compare'], ['Tabel Kali', 'Times Table'], ['Hubungkan', 'Connect'], ['Game 24', 'Game 24'],
  ['Piramida Angka', 'Number Pyramid'], ['Pindahkan Batang', 'Move Sticks'], ['XOX', 'XOX'], ['15 Puzzle', '15 Puzzle'],
  ['2048', '2048'], ['Sudoku', 'Sudoku'], ['Catur', 'Chess'], ['Reversi', 'Reversi'], ['Rubik', 'Rubik'],
  ['Ketuk Berurutan', 'Tap in Order'], ['Tebak Kode', 'Code Guess'], ['Geser Balok', 'Slide Blocks'], ['Cermin', 'Mirror'],
  ['Ranjau', 'Mines'], ['Isi Bentuk', 'Fill Shapes'],
  // tombol & status umum
  ['Ulangi', 'Retry'], ['Soal baru', 'New puzzle'], ['Soal berikutnya', 'Next puzzle'], ['Main lagi', 'Play again'],
  ['Ganti level', 'Change level'], ['Acak', 'Scramble'], ['Urungkan', 'Undo'], ['Balikkan semua', 'Flip all'],
  ['Reset', 'Reset'], ['Huruf warna', 'Color letters'], ['Lanjut', 'Continue'], ['Coba lagi', 'Try again'],
  ['Putar', 'Rotate'], ['Lawan Bot', 'vs Bot'], ['Main Bareng Teman', 'Play with a Friend'],
  ['Mudah', 'Easy'], ['Sedang', 'Medium'], ['Sulit', 'Hard'], ['Bot', 'Bot'], ['Teman', 'Friend'],
  ['Giliranmu', 'Your turn'], ['Buka', 'Open'], ['Bendera', 'Flag'], ['Waktu habis', 'Time is up'],
  ['Selesai!', 'Done!'], ['Benar!', 'Correct!'], ['Salah', 'Wrong'], ['Seri', 'Draw'],
  ['Kamu menang!', 'You win!'], ['Komputer menang', 'Computer wins'], ['Pilih tempat kosong', 'Pick an empty spot'],
  ['Semua area harus salah satu bentuk ini:', 'Every area must be one of these shapes:'], ['Tutup', 'Close'],
  ['Ulangi', 'Retry'],
];

const TO_EN = new Map<string, string>(PAIRS);
const TO_ID = new Map<string, string>(PAIRS.map(([id, en]) => [en, id] as const));

let lang: Lang = getStr('lang') === 'en' ? 'en' : 'id';
export const getLang = (): Lang => lang;

const tr = (s: string): string | undefined => (lang === 'en' ? TO_EN : TO_ID).get(s);

/** Terjemahkan teks dan atribut aria-label/title yang cocok dengan kamus (dua arah, tergantung bahasa aktif). */
function walk(): void {
  const root = document.body;
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const v = n.nodeValue ?? '';
    const key = v.trim();
    if (!key) continue;
    const to = tr(key);
    if (to !== undefined && to !== key) n.nodeValue = v.replace(key, to);
  }
  root.querySelectorAll<HTMLElement>('[aria-label],[title]').forEach((el) => {
    for (const a of ['aria-label', 'title']) {
      const v = el.getAttribute(a);
      if (!v) continue;
      const to = tr(v);
      if (to !== undefined && to !== v) el.setAttribute(a, to);
    }
  });
}

let queued = 0;
const schedule = (): void => {
  if (!queued) queued = requestAnimationFrame(() => { queued = 0; walk(); });
};

/** Ganti bahasa; seluruh tampilan (termasuk game yang sedang terbuka) langsung ikut berganti. */
export function setLang(l: Lang): void {
  lang = l;
  setStr('lang', l);
  document.documentElement.lang = l;
  walk();
}

/** Dipanggil sekali saat aplikasi siap: menerjemahkan tampilan awal dan memantau perubahan berikutnya. */
export function initLang(): void {
  document.documentElement.lang = lang;
  walk();
  new MutationObserver(schedule).observe(document.body, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'title'],
  });
}
