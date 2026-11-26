import test from 'node:test';
import assert from 'node:assert/strict';
import {
  commit, createCubies, dragToMove, DIRS, faceMove, inverse, isSolved, layerCoords, mulVec, resetCubies, scrambleMoves,
  type FaceKey, type FaceName,
} from '../src/games/rubik/model.js';

const COLORS: Record<FaceKey, string> = { x: 'red', X: 'orange', y: 'white', Y: 'yellow', z: 'green', Z: 'blue' };
const FACES: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];

test('jumlah cubie & koordinat', () => {
  for (const n of [2, 3, 4]) assert.equal(createCubies(n).length, n ** 3);
  assert.deepEqual(layerCoords(3), [-2, 0, 2]);
  assert.deepEqual(layerCoords(4), [-3, -1, 1, 3]);
  assert.deepEqual(layerCoords(2), [-1, 1]);
});

test('setiap putaran sisi 4 kali = kembali, dan dibatalkan oleh kebalikannya', () => {
  for (const n of [2, 3, 4]) for (const f of FACES) for (const prime of [false, true]) {
    const c = createCubies(n), m = faceMove(f, prime, n);
    for (let i = 0; i < 4; i++) commit(c, m);
    assert.ok(isSolved(c, COLORS) && c.every((x) => x.p.join() === x.p0.join()));
    commit(c, m); commit(c, inverse(m));
    assert.ok(c.every((x) => x.p.join() === x.p0.join()));
  }
});

test('arah putaran benar: R searah jarum jam memindah kolom depan-kanan ke atas', () => {
  const c = createCubies(3);
  commit(c, faceMove('R', false, 3));
  // stiker hijau (sisi depan z) di kolom kanan sekarang menghadap atas (normal 0,-1,0)
  const greens = c.filter((x) => x.s.includes('z') && x.p0[0] === 2 && mulVec(x.m, DIRS.z).join() === '0,-1,0');
  assert.equal(greens.length, 3);
});

test('acak lalu urungkan semua = selesai; solved terdeteksi', () => {
  for (const n of [2, 3, 4]) for (let r = 0; r < 20; r++) {
    const c = createCubies(n), seq = scrambleMoves(n);
    assert.equal(seq.length, [12, 22, 40][n - 2]);
    seq.forEach((m) => commit(c, m));
    assert.ok(!isSolved(c, COLORS) || n === 2 && seq.length === 0);
    [...seq].reverse().forEach((m) => commit(c, inverse(m)));
    assert.ok(isSolved(c, COLORS));
    resetCubies(c);
    assert.ok(c.every((x) => x.p.join() === x.p0.join()));
  }
});

test('dragToMove: geseran pada stiker menghasilkan putaran lapisan yang berisi cubie itu', () => {
  const c = createCubies(4);
  const front = c.filter((x) => x.p[2] === 3);
  for (const cub of front) for (const [dx, dy] of [[30, 0], [-30, 0], [0, 30], [0, -30]] as const) {
    const m = dragToMove(cub, 'z', dx, dy, -28, -38);
    if (!m) throw new Error('harus ada putaran');
    assert.equal(cub.p[m.a], m.l);
    assert.ok(Math.abs(m.d) === 1);
  }
  // baris tengah 4x4 menghasilkan lapisan dalam
  const inner = front.find((x) => x.p[1] === -1)!;
  const mv = dragToMove(inner, 'z', 30, 0, -28, -38)!;
  assert.equal(Math.abs(mv.l), 1);
});
