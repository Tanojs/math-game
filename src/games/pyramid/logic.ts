import { R, shuf } from '../../core/rand.js';
import type { Level } from '../../core/html.js';

/** Baris per level dan target banyak kotak kosong. */
export const ROWS = [3, 4, 5] as const;
export const BLANKS = [3, 6, 10] as const;
const BASE_MAX = [9, 9, 12] as const;

/** Indeks kotak baris r (0 = puncak), kolom c (0..r). */
export const cellIndex = (r: number, c: number): number => (r * (r + 1)) / 2 + c;
export const cellCount = (rows: number): number => (rows * (rows + 1)) / 2;

/** Hubungan [atas, kiri-bawah, kanan-bawah]: atas = kiri + kanan. */
export function relations(rows: number): Array<[number, number, number]> {
  const out: Array<[number, number, number]> = [];
  for (let r = 0; r < rows - 1; r++)
    for (let c = 0; c <= r; c++) out.push([cellIndex(r, c), cellIndex(r + 1, c), cellIndex(r + 1, c + 1)]);
  return out;
}

/** Isi piramida penuh dari baris dasar. */
export function build(base: readonly number[]): number[] {
  const rows = base.length;
  const v = Array<number>(cellCount(rows)).fill(0);
  base.forEach((x, c) => (v[cellIndex(rows - 1, c)] = x));
  for (let r = rows - 2; r >= 0; r--)
    for (let c = 0; c <= r; c++) v[cellIndex(r, c)] = (v[cellIndex(r + 1, c)] as number) + (v[cellIndex(r + 1, c + 1)] as number);
  return v;
}

/** Isi kotak kosong yang bisa disimpulkan secara logis. Mengembalikan true jika semuanya terisi. */
export function propagate(values: Array<number | null>, rows: number): boolean {
  const rel = relations(rows);
  for (let changed = true; changed; ) {
    changed = false;
    for (const [t, l, r] of rel) {
      const [a, b, c] = [values[t], values[l], values[r]];
      const unknown = [a, b, c].filter((x) => x === null).length;
      if (unknown !== 1) continue;
      if (a === null) values[t] = (b as number) + (c as number);
      else if (b === null) values[l] = a - (c as number);
      else values[r] = a - (b as number);
      changed = true;
    }
  }
  return values.every((x) => x !== null);
}

export interface PyramidPuzzle { rows: number; solution: number[]; given: boolean[] }

/** Soal: kotak dikosongkan satu per satu selama masih bisa disimpulkan (jadi jawabannya pasti tunggal). */
export function generate(level: Level): PyramidPuzzle {
  const rows = ROWS[level], solution = build(Array.from({ length: rows }, () => R(1, BASE_MAX[level])));
  const given = Array<boolean>(solution.length).fill(true);
  let blanks = 0;
  for (const i of shuf([...solution.keys()])) {
    if (blanks >= BLANKS[level]) break;
    const trial: Array<number | null> = solution.map((v, k) => (given[k] && k !== i ? v : null));
    if (propagate(trial, rows)) { given[i] = false; blanks++; }
  }
  return { rows, solution, given };
}

/** Kotak yang melanggar hubungan atas = kiri + kanan (hanya jika ketiganya terisi). */
export function violations(values: ReadonlyArray<number | null>, rows: number): number[] {
  const bad = new Set<number>();
  for (const [t, l, r] of relations(rows)) {
    const [a, b, c] = [values[t], values[l], values[r]];
    if (a !== null && b !== null && c !== null && a !== (b as number) + (c as number)) [t, l, r].forEach((i) => bad.add(i));
  }
  return [...bad];
}
