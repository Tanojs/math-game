import test from 'node:test';
import assert from 'node:assert/strict';
import { BLANKS, build, cellCount, cellIndex, generate, propagate, relations, ROWS, violations } from '../src/games/pyramid/logic.js';
import type { Level } from '../src/core/html.js';

test('build menjumlahkan dua kotak di bawahnya', () => {
  const v = build([1, 2, 3]);
  assert.deepEqual(v, [6, 3, 3, 1, 2, 3].map((_, i) => v[i]));
  assert.equal(v[cellIndex(0, 0)], 1 + 2 + 2 + 3);
  assert.equal(cellCount(5), 15);
  assert.equal(relations(4).length, 6);
});

test('propagate menyimpulkan kotak kosong dan violations menandai kesalahan', () => {
  const full = build([2, 3, 4]);
  const partial: Array<number | null> = full.map((v, i) => (i === 0 || i === 1 ? null : v));
  assert.ok(propagate(partial, 3));
  assert.deepEqual(partial, full);
  const wrong = [...full];
  wrong[cellIndex(1, 0)] = (wrong[cellIndex(1, 0)] as number) + 1;
  assert.ok(violations(wrong, 3).length > 0);
  assert.deepEqual(violations(full, 3), []);
});

test('generate: soal konsisten, jawaban pasti tunggal (bisa disimpulkan), jumlah kosong sesuai level', () => {
  for (const level of [0, 1, 2] as Level[]) for (let i = 0; i < 60; i++) {
    const p = generate(level);
    assert.equal(p.rows, ROWS[level]);
    assert.deepEqual(violations(p.solution, p.rows), []);
    const blanks = p.given.filter((g) => !g).length;
    assert.ok(blanks >= 1 && blanks <= BLANKS[level]);
    const trial: Array<number | null> = p.solution.map((v, k) => (p.given[k] ? v : null));
    assert.ok(propagate(trial, p.rows), 'harus bisa diselesaikan hanya dengan logika');
    assert.deepEqual(trial, p.solution);
  }
});
