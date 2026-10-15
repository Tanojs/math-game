import { shuf } from '../../core/rand.js';

/** Banyak petunjuk (angka awal) per level. */
export const CLUES = [44, 34, 27] as const;

const popcount = (m: number): number => {
  let c = 0;
  while (m) { m &= m - 1; c++; }
  return c;
};

/** Bitmask angka 1..9 yang masih boleh dipakai di petak `i`. */
export function candidates(g: readonly number[], i: number): number {
  const r = Math.floor(i / 9), c = i % 9, br = r - (r % 3), bc = c - (c % 3);
  let m = 0;
  for (let k = 0; k < 9; k++) m |= (1 << (g[r * 9 + k] as number)) | (1 << (g[k * 9 + c] as number));
  for (let a = 0; a < 3; a++) for (let e = 0; e < 3; e++) m |= 1 << (g[(br + a) * 9 + bc + e] as number);
  return ~m & 1022;
}

/**
 * Hitung solusi (maksimal `limit`). Jika `randomize` dan solusi ditemukan,
 * `g` berisi satu solusi lengkap (dipakai untuk membuat papan acak).
 */
export function solve(g: number[], limit: number, randomize: boolean): number {
  let bi = -1, bm = 0, bc = 10;
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const m = candidates(g, i), c = popcount(m);
    if (c < bc) { bc = c; bi = i; bm = m; if (c < 2) break; }
  }
  if (bi < 0) return 1;
  let n = 0;
  const order = randomize ? shuf([1, 2, 3, 4, 5, 6, 7, 8, 9]) : [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (const v of order) {
    if (!((bm >> v) & 1)) continue;
    g[bi] = v;
    n += solve(g, limit - n, randomize);
    if (randomize && n) return n;
    g[bi] = 0;
    if (n >= limit) break;
  }
  return n;
}

/** Apakah angka di petak `i` bentrok dengan baris/kolom/kotak? */
export function conflicts(g: number[], i: number): boolean {
  const v = g[i] as number;
  if (!v) return false;
  g[i] = 0;
  const bad = !((candidates(g, i) >> v) & 1);
  g[i] = v;
  return bad;
}

export const isComplete = (g: number[]): boolean => g.every((v, i) => v && !conflicts(g, i));

export interface SudokuPuzzle { grid: number[]; given: boolean[]; solution: number[] }

/** Papan dengan tepat satu solusi. */
export function generate(level: number): SudokuPuzzle {
  const solution = Array<number>(81).fill(0);
  solve(solution, 1, true);
  const grid = [...solution];
  let remove = 81 - (CLUES[level] ?? 34);
  for (const i of shuf([...Array(81).keys()])) {
    if (remove <= 0) break;
    const v = grid[i] as number;
    grid[i] = 0;
    if (solve([...grid], 2, false) === 1) remove--;
    else grid[i] = v;
  }
  return { grid, given: grid.map((v) => v > 0), solution };
}
