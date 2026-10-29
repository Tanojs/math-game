import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVEL_CFG, LIB, REGION_COLORS, canon, generate, isDone, matchShape, pickColor, variants, type Pt } from '../src/games/shapes/logic.js';

const seeded = (seed: number) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

test('pustaka bentuk: kunci kanonik unik dan setiap bentuk terhubung', () => {
  const keys = Object.values(LIB).map(canon);
  assert.equal(new Set(keys).size, keys.length);
  for (const s of Object.values(LIB)) {
    const set = new Set(s.map((p) => p.join(',')));
    const seen = new Set<string>([s[0]?.join(',') as string]);
    const q: Pt[] = [s[0] as Pt];
    while (q.length) {
      const [r, c] = q.pop() as Pt;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        const k = `${r + dr},${c + dc}`;
        if (set.has(k) && !seen.has(k)) { seen.add(k); q.push([r + dr, c + dc]); }
      }
    }
    assert.equal(seen.size, s.length);
  }
});

test('variants: jumlah orientasi unik sesuai simetri bentuk', () => {
  const n = (k: string): number => variants(LIB[k] as never).length;
  assert.deepEqual([n('O4'), n('PLUS'), n('I3'), n('I4'), n('L3'), n('T4'), n('S4'), n('L4'), n('P5')], [1, 1, 2, 2, 4, 4, 4, 8, 8]);
});

test('matchShape: mengenali rotasi & cermin, menolak bentuk lain', () => {
  const keys = [canon(LIB.L4 as never), canon(LIB.PLUS as never)];
  const cols = 6;
  const at = (pts: [number, number][]): number[] => pts.map(([r, c]) => r * cols + c);
  assert.equal(matchShape(at([[0, 0], [1, 0], [2, 0], [2, 1]]), cols, keys), 0); // L tegak
  assert.equal(matchShape(at([[1, 1], [1, 2], [1, 3], [2, 1]]), cols, keys), 0); // L diputar
  assert.equal(matchShape(at([[0, 1], [1, 1], [2, 1], [2, 0]]), cols, keys), 0); // L dicermin (J)
  assert.equal(matchShape(at([[0, 2], [1, 1], [1, 2], [1, 3], [2, 2]]), cols, keys), 1); // plus
  assert.equal(matchShape(at([[0, 0], [0, 1], [1, 0], [1, 1]]), cols, keys), -1); // kotak 2x2
  assert.equal(matchShape(at([[0, 0], [1, 0], [2, 0]]), cols, keys), -1); // terlalu kecil
  assert.equal(matchShape(at([[0, 0], [1, 0], [2, 1], [2, 2]]), cols, keys), -1); // tidak terhubung
});

test('generate: papan = gabungan potongan, tiap potongan cocok dengan bank, semua bentuk bank terpakai (semua level)', () => {
  for (const cfg of LEVEL_CFG) {
    for (let t = 1; t <= 60; t++) {
      const p = generate(cfg, seeded(t));
      assert.equal(p.bank.length, cfg.nShapes);
      assert.equal(new Set(p.keys).size, p.keys.length);
      const byPiece = new Map<number, number[]>();
      p.owner.forEach((o, i) => { if (o >= 0) (byPiece.get(o) ?? byPiece.set(o, []).get(o))?.push(i); });
      assert.equal(p.cells.filter(Boolean).length, [...byPiece.values()].reduce((a, c) => a + c.length, 0));
      p.owner.forEach((o, i) => assert.equal(p.cells[i], o >= 0));
      for (const [pi, cells] of byPiece) assert.equal(matchShape(cells, p.cols, p.keys), p.pieceShape[pi]);
      assert.deepEqual([...new Set(p.pieceShape)].sort(), p.bank.map((_, k) => k));
      // papan terhubung
      const on = p.cells.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
      const seen = new Set([on[0] as number]);
      const q = [on[0] as number];
      while (q.length) {
        const i = q.pop() as number, r = Math.floor(i / p.cols), c = i % p.cols;
        for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const rr = r + dr, cc = c + dc;
          if (rr < 0 || cc < 0 || rr >= p.rows || cc >= p.cols) continue;
          const k = rr * p.cols + cc;
          if (p.cells[k] && !seen.has(k)) { seen.add(k); q.push(k); }
        }
      }
      assert.equal(seen.size, on.length);
    }
  }
});

test('isDone: selesai hanya bila semua petak papan terkunci', () => {
  const cells = [true, true, false, true];
  assert.equal(isDone(cells, [0, -1, -1, 0]), false);
  assert.equal(isDone(cells, [0, 0, -1, 1]), true);
});

test('pickColor: menghindari warna tetangga, memilih yang paling jarang dipakai, tetap menghasilkan warna bila semua terblokir', () => {
  assert.equal(pickColor(new Set(), [0, 0, 0, 0, 0, 0, 0]), 0);
  assert.equal(pickColor(new Set([0]), [0, 0, 0, 0, 0, 0, 0]), 1);
  assert.equal(pickColor(new Set(), [2, 1, 1, 0, 3, 3, 3]), 3);
  assert.equal(pickColor(new Set([3]), [2, 1, 1, 0, 3, 3, 3]), 1);
  assert.equal(pickColor(new Set([0, 1, 2, 3, 4, 5, 6]), new Array(7).fill(0)), 0);
  // pewarnaan serakah: 8 area berurutan yang saling menempel dengan 7 warna tidak pernah menabrak tetangga langsung
  const used: number[] = new Array(REGION_COLORS).fill(0), prev: number[] = [];
  for (let i = 0; i < 8; i++) {
    const c = pickColor(new Set(prev.slice(-2)), used);
    assert.ok(!prev.slice(-2).includes(c));
    used[c] = (used[c] ?? 0) + 1;
    prev.push(c);
  }
});
