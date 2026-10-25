import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_CFG, chord, emptyBoard, flagsUsed, isWon, neighbors, plant, recount, reveal, toggleFlag } from '../src/games/mines/logic.js';

/** Acak semu bersemai agar tes selalu menghasilkan papan yang sama. */
const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

test('neighbors: sudut 3, tepi 5, tengah 8', () => {
  assert.equal(neighbors(0, 5).length, 3);
  assert.equal(neighbors(2, 5).length, 5);
  assert.equal(neighbors(12, 5).length, 8);
  assert.deepEqual(neighbors(0, 3).sort(), [1, 3, 4]);
});

test('plant: jumlah ranjau tepat, ketukan pertama + tetangganya aman, angka konsisten (semua level)', () => {
  for (const { n, mines } of LEVEL_CFG) {
    for (let t = 0; t < 40; t++) {
      const cells = emptyBoard(n);
      const safe = (t * 7) % (n * n);
      plant(cells, n, mines, safe, seeded(t + 1));
      assert.equal(cells.filter((c) => c.mine).length, mines);
      for (const j of [safe, ...neighbors(safe, n)]) assert.equal(cells[j]?.mine, false);
      cells.forEach((c, i) => assert.equal(c.adj, neighbors(i, n).filter((j) => cells[j]?.mine).length));
    }
  }
  assert.ok(LEVEL_CFG.every((c) => c.mines < c.n * c.n - 9));
});

test('plant: papan sesak tetap menyisakan petak yang diketuk aman', () => {
  const cells = emptyBoard(3);
  plant(cells, 3, 8, 4, seeded(5));
  assert.equal(cells.filter((c) => c.mine).length, 8);
  assert.equal(cells[4]?.mine, false);
});

test('reveal: angka 0 membuka area; satu ranjau di sudut -> semua petak aman terbuka', () => {
  const n = 5, cells = emptyBoard(n);
  (cells[0] as { mine: boolean }).mine = true;
  recount(cells, n);
  const r = reveal(cells, n, 24);
  assert.equal(r.boom, -1);
  assert.equal(r.opened.length, 24);
  assert.ok(isWon(cells));
});

test('reveal: injak ranjau = boom; petak terbuka/berbendera diabaikan; bendera menahan perluasan', () => {
  const n = 3, cells = emptyBoard(n);
  (cells[0] as { mine: boolean }).mine = true;
  recount(cells, n);
  assert.deepEqual(reveal(cells, n, 0), { opened: [0], boom: 0 });
  assert.deepEqual(reveal(cells, n, 0), { opened: [], boom: -1 }); // sudah terbuka
  const b = emptyBoard(n);
  (b[0] as { mine: boolean }).mine = true;
  recount(b, n);
  toggleFlag(b[8] as never);
  assert.deepEqual(reveal(b, n, 8), { opened: [], boom: -1 }); // berbendera
  toggleFlag(b[8] as never);
  const r = reveal(b, n, 8);
  assert.ok(r.opened.includes(8));
});

test('bendera: tidak bisa memberi bendera pada petak terbuka; flagsUsed menghitung', () => {
  const cells = emptyBoard(3);
  assert.equal(toggleFlag(cells[1] as never), true);
  assert.equal(flagsUsed(cells), 1);
  assert.equal(toggleFlag(cells[1] as never), true);
  assert.equal(flagsUsed(cells), 0);
  (cells[2] as { open: boolean }).open = true;
  assert.equal(toggleFlag(cells[2] as never), false);
});

test('chord: angka terpenuhi membuka tetangga; bendera salah = boom; belum terpenuhi = tidak terjadi apa-apa', () => {
  const n = 3, mk = () => { const c = emptyBoard(n); (c[0] as { mine: boolean }).mine = true; recount(c, n); return c; };
  let cells = mk();
  reveal(cells, n, 4); // angka 1
  assert.equal(cells[4]?.adj, 1);
  assert.deepEqual(chord(cells, n, 4), { opened: [], boom: -1 }); // belum ada bendera
  toggleFlag(cells[0] as never);
  const ok = chord(cells, n, 4);
  assert.equal(ok.boom, -1);
  assert.equal(ok.opened.length, 7);
  assert.ok(isWon(cells));
  cells = mk();
  reveal(cells, n, 4);
  toggleFlag(cells[1] as never); // bendera salah, ranjau di 0 tak berbendera
  assert.equal(chord(cells, n, 4).boom, 0);
});

test('isWon: belum menang selama masih ada petak aman tertutup', () => {
  const cells = emptyBoard(3);
  (cells[0] as { mine: boolean }).mine = true;
  assert.equal(isWon(cells), false);
});
