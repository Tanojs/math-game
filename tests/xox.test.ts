import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLines, checkWin, chooseBotMove, type Cell } from '../src/games/xox/logic.js';

test('jumlah garis kemenangan', () => {
  assert.equal(buildLines(3).length, 8);
  assert.equal(buildLines(4).length, 10);
  assert.equal(buildLines(5).length, 28);
});

test('checkWin: menang, seri, dan permainan berjalan', () => {
  const L3 = buildLines(3);
  assert.equal(checkWin(['X', 'X', 'X', '', 'O', 'O', '', '', ''], L3)?.w, 'X');
  assert.equal(checkWin(['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'], L3)?.w, '-');
  assert.equal(checkWin(['X', '', '', '', '', '', '', '', ''], L3), null);
  const L4 = buildLines(4), b4 = Array<Cell>(16).fill('');
  [0, 5, 10, 15].forEach((i) => (b4[i] = 'O'));
  assert.deepEqual(checkWin(b4, L4)?.l, [0, 5, 10, 15]);
});

test('bot Sulit di 3x3 tidak pernah kalah (60 permainan lawan pemain acak)', () => {
  const L = buildLines(3);
  for (let g = 0; g < 60; g++) {
    const b = Array<Cell>(9).fill('');
    let turnX = g % 2 === 0;
    for (;;) {
      const r = checkWin(b, L);
      if (r) { assert.notEqual(r.w, 'X'); break; }
      if (turnX) { const e = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0); b[e[Math.floor(Math.random() * e.length)]!] = 'X'; }
      else b[chooseBotMove(b, 3, 2)] = 'O';
      turnX = !turnX;
    }
  }
});

test('bot Sulit di 5x5 menyelesaikan 4-berjajar dan memblokir ancaman lawan', () => {
  const L = buildLines(5);
  const win = Array<Cell>(25).fill('');
  [6, 7, 8].forEach((i) => (win[i] = 'O'));
  [20, 21].forEach((i) => (win[i] = 'X'));
  const m = chooseBotMove(win, 5, 2);
  win[m] = 'O';
  assert.equal(checkWin(win, L)?.w, 'O');

  // X punya 3 berjajar yang satu ujungnya sudah tertutup O -> bot wajib menutup ujung lainnya (petak 9)
  const block = Array<Cell>(25).fill('');
  [6, 7, 8].forEach((i) => (block[i] = 'X'));
  [5, 20].forEach((i) => (block[i] = 'O'));
  assert.equal(chooseBotMove(block, 5, 2), 9);
});
