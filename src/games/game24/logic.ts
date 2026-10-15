import { R } from '../../core/rand.js';
import type { Level } from '../../core/html.js';

export type Op = '+' | '−' | '×' | '÷';
export const OPS: readonly Op[] = ['+', '−', '×', '÷'];
export const TARGET = 24;

/** Pecahan (n/d, d > 0, sudah disederhanakan) supaya pembagian tidak kena galat desimal. */
export interface Frac { n: number; d: number }
const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const frac = (n: number, d = 1): Frac => {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1;
  return { n: n / g, d: d / g };
};
export const fracText = (f: Frac): string => (f.d === 1 ? String(f.n) : `${f.n}/${f.d}`);
export const isTarget = (f: Frac): boolean => f.d === 1 && f.n === TARGET;

/** Hitung `a op b`; null jika membagi dengan nol. */
export function combine(a: Frac, op: Op, b: Frac): Frac | null {
  switch (op) {
    case '+': return frac(a.n * b.d + b.n * a.d, a.d * b.d);
    case '−': return frac(a.n * b.d - b.n * a.d, a.d * b.d);
    case '×': return frac(a.n * b.n, a.d * b.d);
    case '÷': return b.n === 0 ? null : frac(a.n * b.d, a.d * b.n);
  }
}

interface Item { f: Frac; e: string }

/** Semua ekspresi (berbeda) dari angka-angka itu yang bernilai 24. */
export function solutions(nums: readonly number[], limit = Infinity): string[] {
  const found = new Set<string>();
  const rec = (items: Item[]): void => {
    if (found.size >= limit) return;
    if (items.length === 1) {
      const it = items[0] as Item;
      if (isTarget(it.f)) found.add(it.e);
      return;
    }
    for (let i = 0; i < items.length; i++)
      for (let j = i + 1; j < items.length; j++) {
        const x = items[i] as Item, y = items[j] as Item;
        const rest = items.filter((_, k) => k !== i && k !== j);
        for (const op of OPS) {
          const orders: Array<[Item, Item]> = op === '+' || op === '×' ? [[x, y]] : [[x, y], [y, x]];
          for (const [a, b] of orders) {
            const r = combine(a.f, op, b.f);
            if (r) rec([...rest, { f: r, e: `(${a.e} ${op} ${b.e})` }]);
          }
        }
      }
  };
  rec(nums.map((n) => ({ f: frac(n), e: String(n) })));
  return [...found];
}

/** Batas angka dan jumlah cara menyelesaikan per level: makin sedikit cara, makin sulit. */
export const CONFIG: ReadonlyArray<{ max: number; minWays: number; maxWays: number }> = [
  { max: 9, minWays: 12, maxWays: Infinity },
  { max: 10, minWays: 4, maxWays: 11 },
  { max: 13, minWays: 1, maxWays: 3 },
];

export interface Puzzle24 { nums: number[]; answer: string }

/** Soal 4 angka yang pasti bisa jadi 24, dengan tingkat kesulitan sesuai level. */
export function makePuzzle(level: Level): Puzzle24 {
  const cfg = CONFIG[level] as (typeof CONFIG)[number];
  for (let tries = 0; tries < 5000; tries++) {
    const nums = Array.from({ length: 4 }, () => R(1, cfg.max));
    const all = solutions(nums);
    if (all.length >= cfg.minWays && all.length <= cfg.maxWays) return { nums, answer: all[R(0, all.length - 1)] as string };
  }
  // cadangan: soal klasik yang pasti punya jawaban
  return { nums: [3, 3, 8, 8], answer: '(8 ÷ (3 − (8 ÷ 3)))' };
}
