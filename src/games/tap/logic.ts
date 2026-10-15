import { shuf } from '../../core/rand.js';

/** Sisi papan per level: 3x3 (1-9), 4x4 (1-16), 5x5 (1-25). */
export const SIZES = [3, 4, 5] as const;
/** Tambahan waktu (ms) untuk setiap ketukan yang salah. */
export const PENALTY_MS = 1000;

/** Angka 1..n*n dalam urutan acak (papan tidak boleh sudah terurut). */
export function makeBoard(n: number): number[] {
  const sorted = Array.from({ length: n * n }, (_, i) => i + 1);
  for (;;) {
    const b = shuf([...sorted]);
    if (b.some((v, i) => v !== sorted[i])) return b;
  }
}
