import { R, shuf } from '../../core/rand.js';
import type { Level } from '../../core/html.js';

export type MathId = 'hc' | 'tf' | 'op' | 'ty' | 'cmp' | 'tb';
export type Op = '+' | '−' | '×' | '÷';
export const ALL_OPS: readonly Op[] = ['+', '−', '×', '÷'];

/** Batas angka per level (indeks 0 = Mudah). */
export const RANGE = {
  sum: [10, 30, 99], // batas operan + dan −
  factor: [6, 12, 20], // batas faktor ×
  divisor: [5, 9, 12], // batas pembagi ÷
  spread: [6, 10, 20], // sebaran pilihan jawaban palsu
} as const;

export interface Expr { a: number; b: number; o: Op; v: number; t: string }
export interface Choice { l: string | number; ok: boolean }
/** Soal pilihan ganda (`choices`) atau soal ketik (`answer`). */
export interface Question { q: string; choices?: Choice[]; answer?: number }

export const applyOp = (a: number, o: Op, b: number): number =>
  o === '+' ? a + b : o === '−' ? a - b : o === '×' ? a * b : a / b;

/** Hitungan acak — hasil selalu bilangan bulat ≥ 0 (pembagian selalu habis). */
export function makeExpr(d: Level, ops: readonly Op[] = ALL_OPS, factorMax: number = RANGE.factor[d]): Expr {
  const M = RANGE.sum[d];
  const o = ops[R(0, ops.length - 1)] as Op;
  let a: number, b: number, v: number;
  if (o === '+') { a = R(1, M); b = R(1, M); v = a + b; }
  else if (o === '−') { a = R(2, M); b = R(1, a); v = a - b; }
  else if (o === '×') { a = R(2, factorMax); b = R(2, factorMax); v = a * b; }
  else { b = R(2, RANGE.divisor[d]); v = R(2, factorMax); a = b * v; }
  return { a, b, o, v, t: `${a} ${o} ${b}` };
}

export function makeQuestion(id: MathId, d: Level): Question {
  const e = makeExpr(d);
  switch (id) {
    case 'hc': {
      const S = new Set<number>([e.v]);
      const sp = RANGE.spread[d];
      while (S.size < 4) {
        const x = e.v + R(-sp, sp);
        if (x >= 0) S.add(x);
      }
      return { q: `${e.t} = ?`, choices: shuf([...S]).map((x) => ({ l: x, ok: x === e.v })) };
    }
    case 'tf': {
      const truth = Math.random() < 0.5;
      let x = e.v;
      if (!truth) do x = e.v + R(-5, 5); while (x === e.v || x < 0);
      return { q: `${e.t} = ${x}`, choices: [{ l: 'Benar', ok: truth }, { l: 'Salah', ok: !truth }] };
    }
    case 'op':
      return {
        q: `${e.a} ? ${e.b} = ${e.v}`,
        choices: ALL_OPS.map((o) => ({ l: o, ok: applyOp(e.a, o, e.b) === e.v })),
      };
    case 'cmp': {
      let f = makeExpr(d);
      if (Math.random() < 0.25) for (let c = 0; f.v !== e.v && c < 60; c++) f = makeExpr(d);
      const x = e.v - f.v;
      return {
        q: `${e.t}\n○\n${f.t}`,
        choices: [{ l: '<', ok: x < 0 }, { l: '=', ok: x === 0 }, { l: '>', ok: x > 0 }],
      };
    }
    case 'tb': {
      const K = RANGE.factor[d];
      const a = R(2, K), b = R(2, K);
      return { q: `${a} × ${b} = ?`, answer: a * b };
    }
    default: // 'ty'
      return { q: `${e.t} = ?`, answer: e.v };
  }
}

/** Poin untuk jawaban benar dengan beruntun `streak` (bonus maksimal di 10). */
export const pointsFor = (streak: number): number => 10 + 2 * Math.min(streak, 10);
