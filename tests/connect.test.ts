import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_OPS, makeRound, PAIRS } from '../src/games/connect/logic.js';
import type { Level } from '../src/core/html.js';

test('Hubungkan: jumlah soal, jawaban unik, operasi sesuai level', () => {
  for (const d of [0, 1, 2] as Level[]) for (let i = 0; i < 200; i++) {
    const r = makeRound(d);
    assert.equal(r.left.length, PAIRS[d]);
    assert.equal(r.right.length, PAIRS[d]);
    assert.equal(new Set(r.left.map((e) => e.v)).size, PAIRS[d]);
    assert.deepEqual(r.right.map((x) => x.i).sort(), r.left.map((_, k) => k));
    for (const e of r.left) assert.ok(LEVEL_OPS[d]!.includes(e.o));
    for (const x of r.right) assert.equal(r.left[x.i]!.v, x.v);
  }
});
