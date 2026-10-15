import test from 'node:test';
import assert from 'node:assert/strict';
import { makeBoard, PENALTY_MS, SIZES } from '../src/games/tap/logic.js';

test('makeBoard: berisi 1..n*n tepat sekali dan tidak langsung terurut', () => {
  for (const n of SIZES) for (let i = 0; i < 100; i++) {
    const b = makeBoard(n);
    assert.equal(b.length, n * n);
    assert.deepEqual([...b].sort((x, y) => x - y), Array.from({ length: n * n }, (_, k) => k + 1));
    assert.ok(b.some((v, k) => v !== k + 1));
  }
  assert.equal(PENALTY_MS, 1000);
});
