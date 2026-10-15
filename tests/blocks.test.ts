import test from 'node:test';
import assert from 'node:assert/strict';
import { BANK } from '../src/games/blocks/bank.js';
import { decodePuzzle, isSolved, minMoves, moves, N, occupancy, pickPuzzle, RANGE, slideRange, solvePath } from '../src/games/blocks/logic.js';
import type { Level } from '../src/core/html.js';

test('bank: tiap soal valid (tanpa tumpang tindih), belum selesai, dan langkah minimum cocok dengan BFS', () => {
  for (const level of [0, 1, 2] as Level[]) {
    assert.ok(BANK[level]!.length >= 25);
    const [lo, hi] = RANGE[level]!;
    for (const entry of BANK[level]!) {
      const p = decodePuzzle(entry);
      // tidak ada tumpang tindih
      const g = occupancy(p.blocks, p.pos);
      const cells = p.blocks.reduce((s, b) => s + b.len, 0);
      assert.equal(g.filter(Boolean).length, cells, 'balok tumpang tindih');
      assert.ok(!isSolved(p.pos));
      assert.ok(p.min >= lo && p.min <= hi, `level ${level}: ${p.min} di luar [${lo},${hi}]`);
      assert.equal(minMoves(p.blocks, p.pos), p.min);
    }
  }
});

test('solvePath: jalur sepanjang langkah minimum, tiap langkah legal, berakhir selesai', () => {
  for (const level of [0, 1, 2] as Level[]) {
    const entry = BANK[level]![0]!, p = decodePuzzle(entry);
    const path = solvePath(p.blocks, p.pos)!;
    assert.equal(path.length, p.min);
    let pos = [...p.pos];
    for (const [i, q] of path) {
      assert.ok(moves(p.blocks, pos).some(([a, b]) => a === i && b === q));
      pos = [...pos]; pos[i] = q;
    }
    assert.ok(isSolved(pos));
  }
});

test('slideRange & pickPuzzle', () => {
  const p = pickPuzzle(1);
  p.blocks.forEach((b, i) => {
    const [lo, hi] = slideRange(p.blocks, p.pos, i);
    assert.ok(lo <= (p.pos[i] as number) && (p.pos[i] as number) <= hi && lo >= 0 && hi + b.len <= N);
  });
  const many = new Set(Array.from({ length: 40 }, () => pickPuzzle(0).pos.join('')));
  assert.ok(many.size > 5, 'soal harus bervariasi');
});
