import test from 'node:test';
import assert from 'node:assert/strict';
import { DIGITS, FIXED_BAR, isEquation, PLUS_BAR, readDigits, solvableWithin, statesAlongPlan, tryGenerate, type Slots } from '../src/games/sticks/logic.js';

const equation = (a: number, b: number, c: number, plus: boolean): Slots => [...DIGITS[a]!, ...DIGITS[b]!, ...DIGITS[c]!, true, plus];

test('angka 0..9 terbaca balik dari segmennya', () => {
  for (let d = 0; d < 10; d++) assert.deepEqual(readDigits([...DIGITS[d]!, ...DIGITS[0]!, ...DIGITS[0]!, true, true]).slice(0, 1), [d]);
});

test('isEquation', () => {
  assert.ok(isEquation(equation(3, 4, 7, true)));
  assert.ok(isEquation(equation(9, 4, 5, false)));
  assert.ok(!isEquation(equation(3, 4, 8, true)));
  assert.ok(!isEquation(equation(3, 4, 7, false)));
  const broken = equation(3, 4, 7, true);
  broken[FIXED_BAR] = false;
  assert.ok(!isEquation(broken));
  assert.equal(PLUS_BAR, 22);
});

test('soal 1/2/3 batang: butuh tepat k pemindahan, rencana valid, batang tetap tak disentuh', () => {
  for (const k of [1, 2, 3]) {
    for (let i = 0; i < (k === 3 ? 4 : 15); i++) {
      const p = tryGenerate(k, 200000)!;
      assert.ok(p, `gagal membuat soal k=${k}`);
      assert.ok(!isEquation(p.start));
      assert.ok(!readDigits(p.start).includes(-1) && p.start[FIXED_BAR]);
      assert.equal(p.plan.length, k);
      if (k > 1) assert.ok(!solvableWithin(p.start, k - 1), 'tidak boleh selesai lebih cepat');
      assert.ok(solvableWithin(p.start, k));
      let s = p.start;
      for (const [f, t] of p.plan) { assert.ok(f !== FIXED_BAR && t !== FIXED_BAR && s[f] && !s[t]); s = statesAlongPlan({ start: p.start, plan: [[f, t]] })[1]!; }
      assert.ok(isEquation(statesAlongPlan(p).at(-1)!));
    }
  }
});
