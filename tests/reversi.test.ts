import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseBotMove, count, flipsFor, hasMoves, initialBoard, isOver, legalMoves, opp, playMove, type Board, type Side } from '../src/games/reversi/engine.js';

test('posisi awal: 2 hitam + 2 putih, hitam punya 4 langkah (d3, c4, f5, e6)', () => {
  const b = initialBoard();
  assert.deepEqual(count(b), { black: 2, white: 2 });
  assert.deepEqual(legalMoves(b, 1), [19, 26, 37, 44]);
  assert.deepEqual(legalMoves(b, 2), [20, 29, 34, 43]);
});

test('menaruh bidak membalik bidak lawan yang terjepit (semua arah)', () => {
  const r = playMove(initialBoard(), 19, 1); // d3 membalik d4
  assert.deepEqual(r.flipped, [27]);
  assert.deepEqual(count(r.board), { black: 4, white: 1 });
  // jepitan ke dua arah sekaligus: hitam di (1,1) dan (3,1), putih di (1,2) dan (2,2); taruh hitam di (1,3)
  const b: Board = Array(64).fill(0);
  b[9] = 1; b[10] = 2; b[18] = 2; b[25] = 1;
  assert.deepEqual(flipsFor(b, 11, 1).sort((x, y) => x - y), [10, 18]);
});

test('petak terisi atau tanpa jepitan bukan langkah sah; tepi papan tidak menyambung', () => {
  const b = initialBoard();
  assert.deepEqual(flipsFor(b, 27, 1), []);
  assert.deepEqual(flipsFor(b, 0, 1), []);
  const w: Board = Array(64).fill(0);
  w[7] = 2; w[8] = 1; // baris 0 kolom 7 putih; baris 1 kolom 0 hitam: tidak boleh "membungkus" lewat tepi
  assert.deepEqual(flipsFor(w, 6, 1), []);
});

test('lewat giliran dan akhir permainan', () => {
  const b: Board = Array(64).fill(0);
  b[0] = 1; b[1] = 2; // hitam bisa menjepit di (0,2); putih tidak bisa apa-apa
  assert.ok(hasMoves(b, 1)); assert.ok(!hasMoves(b, 2)); assert.ok(!isOver(b));
  const full: Board = Array(64).fill(1);
  assert.ok(isOver(full));
});

test('permainan acak selalu selesai dengan papan valid', () => {
  for (let g = 0; g < 20; g++) {
    let b = initialBoard(), turn: Side = 1, passes = 0, steps = 0;
    while (passes < 2 && steps++ < 200) {
      const m = chooseBotMove(b, turn, 0);
      if (m === null) { passes++; turn = opp(turn); continue; }
      passes = 0;
      b = playMove(b, m, turn).board;
      turn = opp(turn);
    }
    assert.ok(isOver(b));
    const c = count(b);
    assert.ok(c.black + c.white <= 64 && c.black + c.white >= 5);
  }
});

test('bot semua level hanya memilih langkah sah, dan Sulit mengalahkan acak', () => {
  for (const level of [0, 1, 2]) {
    const b = initialBoard();
    for (const side of [1, 2] as Side[]) assert.ok(legalMoves(b, side).includes(chooseBotMove(b, side, level) as number));
  }
  let wins = 0;
  for (let g = 0; g < 4; g++) {
    let b = initialBoard(), turn: Side = 1, passes = 0;
    while (passes < 2) {
      const m = chooseBotMove(b, turn, turn === 1 ? 2 : 0);
      if (m === null) { passes++; turn = opp(turn); continue; }
      passes = 0; b = playMove(b, m, turn).board; turn = opp(turn);
    }
    const c = count(b);
    if (c.black > c.white) wins++;
  }
  assert.ok(wins >= 3, `bot Sulit hanya menang ${wins}/4`);
});
