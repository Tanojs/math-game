import { R } from '../../core/rand.js';

/**
 * Slot batang: 3 angka x 7 segmen (indeks 0..20), lalu 21 = batang horizontal
 * operator (tetap, selalu ada) dan 22 = batang vertikal operator (ada = "+", tidak = "−").
 */
export type Slots = boolean[];
export const SLOT_COUNT = 23;
export const FIXED_BAR = 21;
export const PLUS_BAR = 22;

/** Segmen a..g yang menyala untuk angka 0..9. */
const PATTERNS = ['abcdef', 'bc', 'abdeg', 'abcdg', 'bcfg', 'acdfg', 'acdefg', 'abc', 'abcdefg', 'abcdfg'];
export const DIGITS: boolean[][] = PATTERNS.map((p) => [...'abcdefg'].map((c) => p.includes(c)));

const digitAt = (seven: readonly boolean[]): number => DIGITS.findIndex((m) => m.every((v, i) => v === seven[i]));

/** Tiga angka yang terbaca dari slot (-1 jika bentuknya bukan angka). */
export const readDigits = (s: readonly boolean[]): number[] => [0, 1, 2].map((i) => digitAt(s.slice(i * 7, i * 7 + 7)));

/** Apakah susunan batang membentuk persamaan yang benar? */
export function isEquation(s: readonly boolean[]): boolean {
  const d = readDigits(s) as [number, number, number];
  if (d.includes(-1) || !s[FIXED_BAR]) return false;
  return s[PLUS_BAR] ? d[0] + d[1] === d[2] : d[0] - d[1] === d[2];
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
  let frontier: Slots[] = [s];
  const seen = new Set<string>([s.join('')]);
  for (let depth = 0; depth < j; depth++) {
    const next: Slots[] = [];
    for (const x of frontier)
      for (let f = 0; f < SLOT_COUNT; f++) {
        if (!x[f] || f === FIXED_BAR) continue;
        for (let t = 0; t < SLOT_COUNT; t++) {
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

/**
 * Buat soal yang butuh tepat `k` pemindahan: mulai dari persamaan benar,
 * acak `k` pemindahan mundur, lalu pastikan tidak bisa selesai lebih cepat.
 * `loose` melonggarkan syarat (hanya tidak bisa selesai dalam 1 langkah).
 */
export function tryGenerate(k: number, maxTries: number, loose = false): Puzzle | null {
  for (let it = 0; it < maxTries; it++) {
    const a = R(0, 9), b = R(0, 9), plus = Math.random() < 0.5;
    const c = plus ? a + b : a - b;
    if (c < 0 || c > 9) continue;
    let s: Slots = [...(DIGITS[a] as boolean[]), ...(DIGITS[b] as boolean[]), ...(DIGITS[c] as boolean[]), true, plus];
    const plan: Array<[number, number]> = [];
    for (let i = 0; i < k; i++) {
      const lit: number[] = [], empty: number[] = [];
      s.forEach((v, j) => { if (j !== FIXED_BAR) (v ? lit : empty).push(j); });
      const f = lit[R(0, lit.length - 1)] as number, t = empty[R(0, empty.length - 1)] as number;
      s = moveStick(s, f, t);
      plan.unshift([t, f]);
    }
    if (readDigits(s).includes(-1) || !s[FIXED_BAR] || isEquation(s)) continue;
    if (k > 1 && solvableWithin(s, loose ? 1 : k - 1)) continue;
    return { start: s, plan };
  }
  return null;
}

/** Soal siap pakai untuk level sulit (dibuat di latar belakang agar tidak tersendat). */
export const pool: Record<2 | 3, Puzzle[]> = { 2: [], 3: [] };

export function nextPuzzle(k: number): Puzzle {
  if (k > 1) {
    const ready = pool[k as 2 | 3].pop();
    if (ready) return ready;
  }
  return tryGenerate(k, k === 3 ? 120000 : 30000) ?? (tryGenerate(k, 60000, true) as Puzzle);
}

/** Isi cadangan soal sedikit demi sedikit. Mengembalikan true jika menambah satu soal. */
export function refillPool(): boolean {
  for (const k of [2, 3] as const) {
    if (pool[k].length < 5) {
      const p = tryGenerate(k, 3000);
      if (p) pool[k].push(p);
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
