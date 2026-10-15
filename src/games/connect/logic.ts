import { shuf } from '../../core/rand.js';
import type { Level } from '../../core/html.js';
import { makeExpr, type Expr, type Op } from '../math/logic.js';

/** Banyak pasangan per ronde. */
export const PAIRS = [3, 4, 5] as const;
/** Jenis soal per level: Mudah +−, Sedang +−×, Sulit +−×÷. */
export const LEVEL_OPS: ReadonlyArray<readonly Op[]> = [['+', '−'], ['+', '−', '×'], ['+', '−', '×', '÷']];
const FACTOR = [6, 9, 15] as const;

export interface Round {
  /** soal di kolom kiri */
  left: Expr[];
  /** jawaban di kolom kanan (teracak); `i` = indeks soal pasangannya */
  right: Array<{ v: number; i: number }>;
}

/** Ronde baru: hasil tiap soal dijamin berbeda supaya tidak ada pasangan ganda. */
export function makeRound(d: Level): Round {
  const left: Expr[] = [];
  const seen = new Set<number>();
  while (left.length < (PAIRS[d] as number)) {
    const e = makeExpr(d, LEVEL_OPS[d] as readonly Op[], FACTOR[d]);
    if (seen.has(e.v)) continue;
    seen.add(e.v);
    left.push(e);
  }
  return { left, right: shuf(left.map((e, i) => ({ v: e.v, i }))) };
}
