import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DIGITS, fixedBar, isEquation, LEVELS, moveStick, plusBar, readTerms, solvableWithin, statesAlongPlan, tryGenerate, type Level, type Slots,
} from '../src/games/sticks/logic.js';
import { layoutFor } from '../src/games/sticks/geometry.js';

/** Persamaan a ? b = c; `n` = digit per angka (1 atau 2). */
const equation = (a: number, b: number, c: number, plus: boolean, n: 1 | 2 = 1): Slots => {
  const dig = (v: number): boolean[] => (n === 1 ? [...DIGITS[v]!] : [...DIGITS[Math.floor(v / 10)]!, ...DIGITS[v % 10]!]);
  return [...dig(a), ...dig(b), ...dig(c), true, plus];
};

test('angka 0..9 dan puluhan terbaca balik dari segmennya', () => {
  for (let d = 0; d < 10; d++) assert.deepEqual(readTerms(equation(d, 0, 0, true))[0], d);
  assert.deepEqual(readTerms(equation(83, 49, 34, false, 2)), [83, 49, 34]);
});

test('isEquation: satu digit', () => {
  assert.ok(isEquation(equation(3, 4, 7, true)));
  assert.ok(isEquation(equation(9, 4, 5, false)));
  assert.ok(!isEquation(equation(3, 4, 8, true)));
  assert.ok(!isEquation(equation(3, 4, 7, false)));
  const broken = equation(3, 4, 7, true);
  broken[fixedBar(broken)] = false;
  assert.ok(!isEquation(broken));
  assert.equal(plusBar(broken), 22);
});

test('isEquation: puluhan (contoh 83-49=34), angka diawali 0 tidak sah', () => {
  assert.ok(isEquation(equation(83, 49, 34, false, 2)));
  assert.ok(isEquation(equation(40, 25, 65, true, 2)));
  assert.ok(!isEquation(equation(83, 49, 35, false, 2)));
  // puluhan "05": digit pertama 0 -> tidak sah
  const leadingZero: Slots = [...DIGITS[0]!, ...DIGITS[5]!, ...DIGITS[1]!, ...DIGITS[1]!, ...DIGITS[1]!, ...DIGITS[2]!, true, true];
  assert.equal(readTerms(leadingZero)[0], -1);
});

test('tata letak: jumlah slot sesuai, batang tetap & operator ada di tempat yang benar', () => {
  assert.equal(layoutFor(1).slots.length, 23);
  assert.equal(layoutFor(2).slots.length, 44);
  assert.equal(fixedBar(equation(1, 2, 3, true)), 21);
  assert.equal(fixedBar(equation(10, 20, 30, true, 2)), 42);
});

test('setiap level: butuh tepat `moves` pemindahan, rencana valid, batang tetap tak disentuh', () => {
  LEVELS.forEach((lv: Level, li) => {
    for (let i = 0; i < 8; i++) {
      const p = tryGenerate(lv, 200000)!;
      assert.ok(p, `gagal membuat soal level ${li}`);
      const F = fixedBar(p.start), P = plusBar(p.start);
      assert.ok(!isEquation(p.start), 'soal awal tidak boleh sudah benar');
      assert.ok(p.start[F], 'batang tetap tidak boleh hilang');
      assert.ok(readTerms(p.start).every((v) => v >= 0), 'semua angka harus terbaca');
      if (lv.digits === 2) assert.ok(readTerms(p.start).every((v) => v >= 10 && v <= 99), `level ${li}: angka harus puluhan`);
      assert.equal(p.plan.length, lv.moves);
      if (lv.moves > 1) assert.ok(!solvableWithin(p.start, lv.moves - 1), 'tidak boleh selesai lebih cepat');
      assert.ok(solvableWithin(p.start, lv.moves));
      let s = p.start;
      for (const [f, t] of p.plan) {
        assert.ok(f !== F && t !== F && s[f] && !s[t], 'langkah harus dari batang terisi ke tempat kosong');
        if (lv.digitOnly) assert.ok(f !== P && t !== P, 'mode digit-saja: operator tidak boleh dipindah');
        s = moveStick(s, f, t);
      }
      assert.ok(isEquation(s), 'setelah rencana, persamaan harus benar');
      assert.deepEqual(statesAlongPlan(p).at(-1), s);
    }
  });
});

test('mode digit-saja: soal Mudah tidak bisa diselesaikan hanya dengan membalik tanda', () => {
  const lv = LEVELS[0]!;
  for (let i = 0; i < 20; i++) {
    const p = tryGenerate(lv, 200000)!;
    const flipped = p.start.map((v, j) => (j === plusBar(p.start) ? !v : v));
    assert.ok(!isEquation(flipped));
  }
});
