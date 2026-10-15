import test from 'node:test';
import assert from 'node:assert/strict';
import { check, makePuzzle, mirrorOf, SIZES } from '../src/games/mirror/logic.js';
import type { Level } from '../src/core/html.js';

test('pasangan cermin: kolom dekat sumbu kanan berpasangan dengan kolom dekat sumbu kiri', () => {
  // size 3: kanan baris 0 kolom 0 (dekat sumbu) <-> kiri baris 0 kolom 2; kolom 2 kanan <-> kolom 0 kiri
  assert.equal(mirrorOf(3, 0), 2);
  assert.equal(mirrorOf(3, 2), 0);
  assert.equal(mirrorOf(3, 4), 4);
  assert.equal(mirrorOf(3, 3), 5);
});

test('contoh dari gambar: kiri (titik,titik / kotak,titik / kotak,kotak), kanan harus kosong,kosong / kosong,kotak / kotak,kotak', () => {
  // kiri 2 kolom x 3 baris
  const p = { size: 2, target: [false, false, true, false, true, true] };
  const right = [false, false, false, true, true, true]; // baris2: kolom1 terisi (cermin dari kiri kolom0), baris3: dua-duanya
  const c = check({ ...p, size: 2 }, right);
  assert.deepEqual(c, { wrong: [], missing: 0, solved: true });
  const wrongOne = check(p, [true, false, false, true, true, true]);
  assert.deepEqual(wrongOne.wrong, [0]);
  assert.equal(wrongOne.solved, false);
  const missingOne = check(p, [false, false, false, true, false, true]);
  assert.equal(missingOne.missing, 1);
});

test('soal acak valid: bisa diselesaikan dan awalnya belum selesai', () => {
  for (const level of [0, 1, 2] as Level[]) {
    for (let k = 0; k < 40; k++) {
      const p = makePuzzle(level);
      const n = (SIZES[level] as number) ** 2;
      assert.equal(p.target.length, n);
      assert.ok(!check(p, Array<boolean>(n).fill(false)).solved);
      // jawaban sempurna = isi setiap petak yang cerminnya kotak
      const sol = Array.from({ length: n }, (_, i) => p.target[mirrorOf(p.size, i)] as boolean);
      assert.ok(check(p, sol).solved);
      const cnt = p.target.filter(Boolean).length;
      assert.ok(cnt >= 3 && cnt < n);
    }
  }
});
