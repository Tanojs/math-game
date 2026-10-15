import test from 'node:test';
import assert from 'node:assert/strict';
import { adjacent, isSolved, neighbors, SIZES, scramble, solvedBoard } from '../src/games/puzzle15/logic.js';

/** Papan n x n bisa diselesaikan jika paritas inversi + baris kosong benar. */
function solvable(b: number[], n: number): boolean {
  const flat = b.filter((v) => v);
  let inv = 0;
  for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) if (flat[i]! > flat[j]!) inv++;
  const rowFromBottom = n - 1 - Math.floor(b.indexOf(0) / n);
  return n % 2 ? inv % 2 === 0 : (inv + rowFromBottom) % 2 === 0;
}

test('ukuran per level: 15, 24, dan 35 angka', () => {
  assert.deepEqual(SIZES.map((n) => n * n - 1), [15, 24, 35]);
});

test('scramble: bisa diselesaikan, tidak langsung selesai, kotak kosong benar', () => {
  for (const level of [0, 1, 2]) for (let i = 0; i < 100; i++) {
    const { b, z, n } = scramble(level);
    assert.equal(n, SIZES[level]);
    assert.equal(b[z], 0);
    assert.ok(!isSolved(b));
    assert.ok(solvable(b, n), `level ${level}`);
  }
});

test('adjacent & neighbors', () => {
  assert.ok(adjacent(14, 15, 4));
  assert.ok(!adjacent(11, 15, 4) === false || adjacent(11, 15, 4)); // 11 di atas 15 -> bertetangga
  assert.ok(!adjacent(0, 15, 4));
  assert.deepEqual(neighbors(0, 4).sort((a, b) => a - b), [1, 4]);
  assert.equal(neighbors(5, 4).length, 4);
  assert.ok(isSolved(solvedBoard(5)));
});
