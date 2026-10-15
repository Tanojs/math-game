import test from 'node:test';
import assert from 'node:assert/strict';
import { addTile, canMove, lineIndexes, moveBoard, moveTiles, slideRow, type Dir } from '../src/games/game2048/logic.js';

test('slideRow', () => {
  assert.deepEqual(slideRow([2, 2, 2, 2]), { row: [4, 4, 0, 0], gain: 8 });
  assert.deepEqual(slideRow([2, 2, 4, 0]), { row: [4, 4, 0, 0], gain: 4 });
  assert.deepEqual(slideRow([0, 2, 0, 2]), { row: [4, 0, 0, 0], gain: 4 });
  assert.deepEqual(slideRow([4, 2, 4, 2]), { row: [4, 2, 4, 2], gain: 0 });
  assert.deepEqual(slideRow([2, 4, 4, 8]), { row: [2, 8, 8, 0], gain: 8 }); // tiap ubin hanya menggabung sekali
});

/** Referensi sederhana: putar papan agar arah apa pun jadi "geser kiri". */
function reference(b: number[], d: Dir): number[] {
  const g = [0, 1, 2, 3].map((r) => b.slice(r * 4, r * 4 + 4));
  const rot = (m: number[][]): number[][] => m[0]!.map((_, c) => m.map((row) => row[c]!).reverse());
  let turns = d === 0 ? 0 : d === 2 ? 3 : d === 1 ? 2 : 1;
  let m = g;
  for (let i = 0; i < turns; i++) m = rot(m);
  m = m.map((row) => slideRow(row).row);
  for (let i = 0; i < (4 - turns) % 4; i++) m = rot(m);
  return m.flat();
}

test('moveBoard sama dengan implementasi referensi (acak, 4 arah)', () => {
  for (let i = 0; i < 500; i++) {
    const b = Array.from({ length: 16 }, () => [0, 0, 2, 4, 8][Math.floor(Math.random() * 5)]!);
    for (const d of [0, 1, 2, 3] as Dir[]) {
      const r = moveBoard(b, d);
      assert.deepEqual(r.board, reference(b, d), `arah ${d}`);
      assert.equal(r.moved, r.board.join() !== b.join());
    }
  }
});

test('lineIndexes mencakup 4 petak berbeda per garis', () => {
  for (const d of [0, 1, 2, 3] as Dir[]) for (let i = 0; i < 4; i++) assert.equal(new Set(lineIndexes(i, d)).size, 4);
});

test('canMove & addTile', () => {
  assert.ok(!canMove([2, 4, 2, 4, 4, 2, 4, 2, 2, 4, 2, 4, 4, 2, 4, 2]));
  assert.ok(canMove([2, 2, 4, 8, 4, 8, 16, 32, 2, 4, 8, 16, 32, 64, 128, 256]));
  const b = Array<number>(16).fill(0);
  addTile(b);
  assert.equal(b.filter(Boolean).length, 1);
  assert.ok([2, 4].includes(b.find(Boolean)!));
});

test('moveTiles konsisten dengan moveBoard (acak) dan mencatat penggabungan', () => {
  for (let n = 0; n < 300; n++) {
    const board = Array.from({ length: 16 }, () => ([0, 0, 2, 2, 4, 8][Math.floor(Math.random() * 6)] as number));
    const tiles = board.flatMap((v, i) => (v ? [{ id: i, v, i }] : []));
    for (const d of [0, 1, 2, 3] as Dir[]) {
      const a = moveBoard(board, d);
      const b = moveTiles(tiles, d);
      const flat = Array<number>(16).fill(0);
      b.tiles.forEach((t) => { assert.equal(flat[t.i], 0); flat[t.i] = t.v; });
      assert.deepEqual(flat, a.board);
      assert.equal(b.gain, a.gain);
      assert.equal(b.moved, a.moved);
      assert.equal(b.tiles.length + b.ghosts.length, tiles.length);
    }
  }
});
