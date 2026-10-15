import test from 'node:test';
import assert from 'node:assert/strict';
import { CLUES, conflicts, generate, isComplete, solve } from '../src/games/sudoku/logic.js';

test('generate: tepat satu solusi, petunjuk sesuai level, konsisten dengan solusi', () => {
  for (const level of [0, 1, 2]) for (let i = 0; i < 3; i++) {
    const p = generate(level);
    assert.equal(p.given.filter(Boolean).length, CLUES[level]);
    assert.ok(isComplete(p.solution), 'solusi harus lengkap & valid');
    assert.equal(solve([...p.grid], 2, false), 1, 'harus tepat satu solusi');
    p.grid.forEach((v, j) => { if (v) assert.equal(v, p.solution[j]); });
  }
});

test('conflicts mendeteksi angka ganda di baris/kolom/kotak', () => {
  const g = Array<number>(81).fill(0);
  g[0] = 5; g[1] = 5;       // satu baris
  g[9] = 7; g[18] = 7;      // satu kolom
  g[40] = 3; g[62] = 3;     // beda kotak, beda baris & kolom -> aman
  assert.ok(conflicts(g, 0) && conflicts(g, 1));
  assert.ok(conflicts(g, 9) && conflicts(g, 18));
  assert.ok(!conflicts(g, 40) && !conflicts(g, 62));
  const box = Array<number>(81).fill(0);
  box[0] = 4; box[10] = 4;  // satu kotak 3x3
  assert.ok(conflicts(box, 0));
});
