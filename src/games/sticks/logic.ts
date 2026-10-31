import { R } from '../../core/rand.js';

/**
 * Susunan batang: tiap angka (A, B, C) terdiri dari `n` digit 7-segmen (n = 1 atau 2), jadi ada 3n digit.
 * Slot 0..21n-1 = segmen digit (7 per digit, berurutan A lalu B lalu C; digit puluhan lebih dulu).
 * Slot 21n     = batang horizontal operator (tetap, selalu ada, tidak bisa dipindah).
 * Slot 21n + 1 = batang vertikal operator (ada = "+", tidak = "−").
 * Jumlah slot = 21n + 2, sehingga n bisa dibaca dari panjang array.
 */
export type Slots = boolean[];

/** Level: `digits` = digit per angka, `moves` = jumlah batang yang harus dipindah, `digitOnly` = pemindahan hanya antar-digit (tidak mengubah tanda). */
export interface Level { digits: 1 | 2; moves: number; digitOnly: boolean }
export const LEVELS: readonly Level[] = [
  { digits: 1, moves: 1, digitOnly: true },  // Mudah: 1 angka satu digit, 1 batang pindah antar-angka
  { digits: 2, moves: 1, digitOnly: false }, // Sedang: angka puluhan, 1 batang
  { digits: 2, moves: 2, digitOnly: false }, // Sulit: angka puluhan, 2 batang
];

/** Segmen a..g yang menyala untuk angka 0..9. */
const PATTERNS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
export const DIGITS: boolean[][] = PATTERNS.map((p) => [...'abcdefg'].map((c) => p.includes(c)));

const digitAt = (seven: readonly boolean[]): number => DIGITS.findIndex((m) => m.every((v, i) => v === seven[i]));

/** Jumlah digit per angka (1 atau 2), dibaca dari panjang susunan. */
export const digitCount = (s: readonly boolean[]): number => (s.length - 2) / 21;
/** Indeks batang horizontal operator (tetap). */
export const fixedBar = (s: readonly boolean[]): number => 21 * digitCount(s);
/** Indeks batang vertikal operator ("+" bila ada). */
export const plusBar = (s: readonly boolean[]): number => fixedBar(s) + 1;

/** Nilai satu angka (term 0 = A, 1 = B, 2 = C), -1 jika bentuknya tidak valid (segmen tak membentuk digit, atau puluhan 0). */
export function termValue(s: readonly boolean[], term: number): number {
  const n = digitCount(s);
  let v = 0;
  for (let d = 0; d < n; d++) {
    const g = term * n + d;
    const dig = digitAt(s.slice(g * 7, g * 7 + 7));
    if (dig < 0) return -1;
    v = v * 10 + dig;
  }
  return n === 2 && v < 10 ? -1 : v; // angka dua digit tidak boleh diawali 0
}

/** Ketiga angka (A, B, C); -1 jika ada yang tidak valid. */
export const readTerms = (s: readonly boolean[]): number[] => [0, 1, 2].map((t) => termValue(s, t));

/** Apakah susunan batang membentuk persamaan yang benar? */
export function isEquation(s: readonly boolean[]): boolean {
  if (!s[fixedBar(s)]) return false;
  const [a, b, c] = readTerms(s) as [number, number, number];
  if (a < 0 || b < 0 || c < 0) return false;
  return s[plusBar(s)] ? a + b === c : a - b === c;
}

/** Pindahkan batang dari slot `f` ke slot kosong `t`. */
export const moveStick = (s: readonly boolean[], f: number, t: number): Slots => {
  const n = [...s];
  n[f] = false;
  n[t] = true;
  return n;
};

/** Apakah persamaan benar bisa dicapai dalam paling banyak `j` pemindahan? */
export function solvableWithin(s: Slots, j: number): boolean {
  const F = fixedBar(s);
  let frontier: Slots[] = [s];
  const seen = new Set<string>([s.join('')]);
  for (let depth = 0; depth < j; depth++) {
    const next: Slots[] = [];
    for (const x of frontier)
      for (let f = 0; f < s.length; f++) {
        if (!x[f] || f === F) continue;
        for (let t = 0; t < s.length; t++) {
          if (x[t]) continue;
          const y = moveStick(x, f, t), key = y.join('');
          if (seen.has(key)) continue;
          seen.add(key);
          if (isEquation(y)) return true;
          next.push(y);
        }
      }
    frontier = next;
  }
  return false;
}

export interface Puzzle {
  start: Slots;
  /** urutan pemindahan [dari, ke] yang menyelesaikan soal */
  plan: Array<[number, number]>;
}

/** Susunan 7-segmen untuk satu angka (1 atau 2 digit). */
const digitsOf = (v: number, n: number): boolean[] =>
  n === 1 ? [...(DIGITS[v] as boolean[])] : [...(DIGITS[Math.floor(v / 10)] as boolean[]), ...(DIGITS[v % 10] as boolean[])];

/**
 * Buat soal yang butuh tepat `lv.moves` pemindahan: mulai dari persamaan benar,
 * acak pemindahan mundur, lalu pastikan tidak bisa selesai lebih cepat.
 * `loose` melonggarkan syarat (hanya tidak bisa selesai dalam 1 langkah lebih awal).
 */
export function tryGenerate(lv: Level, maxTries: number, loose = false): Puzzle | null {
  const n = lv.digits, k = lv.moves;
  const lo = n === 1 ? 0 : 10, hi = n === 1 ? 9 : 99;
  const F = 21 * n, P = F + 1;
  for (let it = 0; it < maxTries; it++) {
    const a = R(lo, hi), b = R(lo, hi), plus = Math.random() < 0.5;
    const c = plus ? a + b : a - b;
    if (c < lo || c > hi) continue;
    let s: Slots = [...digitsOf(a, n), ...digitsOf(b, n), ...digitsOf(c, n), true, plus];
    const plan: Array<[number, number]> = [];
    for (let i = 0; i < k; i++) {
      const lit: number[] = [], empty: number[] = [];
      s.forEach((v, j) => {
        if (j === F || (lv.digitOnly && j === P)) return;
        (v ? lit : empty).push(j);
      });
      const f = lit[R(0, lit.length - 1)] as number, t = empty[R(0, empty.length - 1)] as number;
      s = moveStick(s, f, t);
      plan.unshift([t, f]);
    }
    if (readTerms(s).some((v) => v < 0) || !s[F] || isEquation(s)) continue;
    // Mode digit-saja: soal tidak boleh bisa diselesaikan hanya dengan membalik tanda operator.
    if (lv.digitOnly && isEquation(s.map((v, j) => (j === P ? !v : v)))) continue;
    if (k > 1 && solvableWithin(s, loose ? 1 : k - 1)) continue;
    return { start: s, plan };
  }
  return null;
}

/** Soal siap pakai per level (dibuat di latar belakang agar tidak tersendat). */
export const pool: Puzzle[][] = LEVELS.map(() => []);

/** Ambil soal untuk level `li` (indeks ke LEVELS). */
export function nextPuzzle(li: number): Puzzle {
  const lv = LEVELS[li] as Level;
  const ready = pool[li]?.pop();
  if (ready) return ready;
  return tryGenerate(lv, lv.moves > 1 ? 120000 : 30000) ?? (tryGenerate(lv, 60000, true) as Puzzle);
}

let turn = 0;
/** Isi cadangan soal sedikit demi sedikit (bergilir antar level). Mengembalikan true jika menambah satu soal. */
export function refillPool(): boolean {
  for (let j = 0; j < LEVELS.length; j++) {
    const li = turn++ % LEVELS.length;
    if ((pool[li]?.length ?? 0) < 5) {
      const p = tryGenerate(LEVELS[li] as Level, 3000);
      if (p) pool[li]?.push(p);
      return !!p;
    }
  }
  return false;
}

/** Keadaan setelah 0..k langkah mengikuti rencana. */
export function statesAlongPlan(p: Puzzle): Slots[] {
  const path: Slots[] = [p.start];
  for (const [f, t] of p.plan) path.push(moveStick(path[path.length - 1] as Slots, f, t));
  return path;
}
