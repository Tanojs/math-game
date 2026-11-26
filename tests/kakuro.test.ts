import test from 'node:test';
import assert from 'node:assert/strict';
import { badCells, generate, groupOf, isComplete, runs, WHITE } from '../src/games/kakuro/logic.js';

test('generate: petak putih selalu berada di deret ≥2 (mendatar & menurun), dan isian memenuhi aturan', () => {
  for (const level of [0, 1, 2]) for (let k = 0; k < 4; k++) {
    const p = generate(level);
    assert.equal(p.n, (WHITE[level] ?? 0) + 1);
    // baris & kolom petunjuk wajib hitam
    for (let i = 0; i < p.n; i++) { assert.ok(p.black[i]); assert.ok(p.black[i * p.n]); }
    const rs = runs(p);
    // setiap petak putih tepat di satu deret mendatar dan satu menurun
    const count = new Array<number>(p.n * p.n).fill(0);
    for (const r of rs) {
      assert.ok(r.cells.length >= 2, 'deret minimal 2 petak');
      r.cells.forEach((j) => { count[j]! += 1; });
    }
    p.black.forEach((b, i) => { if (!b) assert.equal(count[i], 2, `petak ${i} harus di 2 deret`); });
    // isian asli: angka 1..9, tidak berulang dalam deret, jumlahnya sesuai petunjuk
    for (const r of rs) {
      const vals = r.cells.map((j) => p.ans[j] as number);
      assert.ok(vals.every((x) => x >= 1 && x <= 9));
      assert.equal(new Set(vals).size, vals.length, 'angka tidak boleh berulang dalam deret');
      assert.equal(vals.reduce((s, x) => s + x, 0), r.sum);
    }
    assert.ok(isComplete(p, p.ans), 'isian asli harus dianggap selesai');
    assert.equal(badCells(p, p.ans).size, 0);
  }
});

test('isComplete: kosong / sebagian belum selesai; deret salah ditandai', () => {
  const p = generate(0);
  const empty = new Array<number>(p.n * p.n).fill(0);
  assert.equal(isComplete(p, empty), false);
  const first = p.black.findIndex((b) => !b);
  const wrong = [...p.ans];
  wrong[first] = (p.ans[first] as number) === 9 ? 1 : 9;
  assert.equal(isComplete(p, wrong), false);
  assert.ok(badCells(p, wrong).has(first), 'petak yang salah harus ikut ditandai');
});

test('badCells: angka ganda dalam satu deret ditandai', () => {
  const p = generate(1);
  const r = runs(p).find((x) => x.cells.length >= 2);
  assert.ok(r);
  const v = new Array<number>(p.n * p.n).fill(0);
  const [a, b] = r.cells as [number, number];
  v[a] = 5; v[b] = 5;
  assert.ok(badCells(p, v).has(a) && badCells(p, v).has(b));
});

test('groupOf: memuat semua petak yang satu deret dengan petak yang dipilih', () => {
  const p = generate(2);
  const r = runs(p)[0];
  assert.ok(r);
  const g = groupOf(p, r.cells[0] as number);
  for (const j of r.cells) assert.ok(g.includes(j));
});
