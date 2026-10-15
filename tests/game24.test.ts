import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, combine, frac, fracText, isTarget, makePuzzle, solutions } from '../src/games/game24/logic.js';
import type { Level } from '../src/core/html.js';

test('pecahan: penyederhanaan, tanda, dan pembagian nol', () => {
  assert.deepEqual(frac(6, 4), { n: 3, d: 2 });
  assert.deepEqual(frac(1, -2), { n: -1, d: 2 });
  assert.equal(fracText(frac(8, 3)), '8/3');
  assert.equal(combine(frac(8), '÷', frac(3)) !== null && fracText(combine(frac(8), '÷', frac(3))!), '8/3');
  assert.equal(combine(frac(5), '÷', frac(0)), null);
  assert.ok(isTarget(combine(frac(8), '÷', combine(frac(3), '−', combine(frac(8), '÷', frac(3))!)!)!));
});

test('solutions: soal klasik 3 3 8 8 hanya bisa lewat pecahan; 1 2 3 4 punya banyak cara', () => {
  assert.equal(solutions([3, 3, 8, 8]).length >= 1, true);
  assert.ok(solutions([1, 2, 3, 4]).length >= 12);
  assert.equal(solutions([1, 1, 1, 1]).length, 0);
});

test('makePuzzle: angka dalam batas, jumlah cara sesuai level, jawaban benar-benar 24', () => {
  for (const level of [0, 1, 2] as Level[]) for (let i = 0; i < 8; i++) {
    const p = makePuzzle(level), cfg = CONFIG[level]!;
    assert.equal(p.nums.length, 4);
    assert.ok(p.nums.every((n) => n >= 1 && n <= cfg.max));
    const all = solutions(p.nums);
    assert.ok(all.length >= cfg.minWays && all.length <= cfg.maxWays, `level ${level}: ${all.length} cara`);
    assert.ok(all.includes(p.answer));
  }
});
