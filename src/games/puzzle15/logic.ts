import { R } from '../../core/rand.js';

/** Ukuran papan per level: 4x4 (15 angka), 5x5 (24 angka), 6x6 (35 angka). */
export const SIZES = [4, 5, 6] as const;
/** Banyak langkah pengacakan per level. */
export const SCRAMBLE_STEPS = [80, 150, 250] as const;

export interface PuzzleState { b: number[]; z: number; n: number }

export const solvedBoard = (n: number): number[] => Array.from({ length: n * n }, (_, i) => (i + 1) % (n * n));
export const isSolved = (b: readonly number[]): boolean => b.every((v, i) => v === (i + 1) % b.length);

/** Petak yang bertetangga dengan kotak kosong `z`. */
export function neighbors(z: number, n: number): number[] {
  return [z - n, z + n, z % n ? z - 1 : -1, z % n < n - 1 ? z + 1 : -1].filter((x) => x >= 0 && x < n * n);
}

/** Acak dengan langkah legal dari keadaan selesai (selalu bisa diselesaikan). */
export function scramble(level: number): PuzzleState {
  const n = SIZES[level] ?? 4;
  const steps = SCRAMBLE_STEPS[level] ?? 80;
  for (;;) {
    const b = solvedBoard(n);
    let z = n * n - 1, prev = -1;
    for (let i = 0; i < steps; i++) {
      const opts = neighbors(z, n).filter((x) => x !== prev);
      const y = opts[R(0, opts.length - 1)] as number;
      [b[z], b[y]] = [b[y] as number, b[z] as number];
      prev = z;
      z = y;
    }
    if (!isSolved(b)) return { b, z, n };
  }
}

/** Apakah petak `i` bersebelahan dengan kotak kosong `z`? */
export const adjacent = (i: number, z: number, n: number): boolean =>
  Math.abs(Math.floor(i / n) - Math.floor(z / n)) + Math.abs((i % n) - (z % n)) === 1;
