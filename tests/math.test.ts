import test from 'node:test';
import assert from 'node:assert/strict';
import { ALL_OPS, applyOp, makeExpr, makeQuestion, pointsFor, type MathId, type Op } from '../src/games/math/logic.js';
import type { Level } from '../src/core/html.js';

const LEVELS: Level[] = [0, 1, 2];

test('makeExpr: hasil bulat tak negatif, pembagian habis, operasi sesuai', () => {
  for (const d of LEVELS) for (let i = 0; i < 500; i++) {
    const e = makeExpr(d);
    assert.ok(Number.isInteger(e.v) && e.v >= 0, e.t);
    assert.equal(applyOp(e.a, e.o, e.b), e.v);
  }
  for (let i = 0; i < 200; i++) assert.ok((['+', '−'] as Op[]).includes(makeExpr(0, ['+', '−']).o));
});

test('Hitung Cepat: 4 pilihan unik, tepat satu benar', () => {
  for (const d of LEVELS) for (let i = 0; i < 300; i++) {
    const q = makeQuestion('hc', d);
    const ch = q.choices!;
    assert.equal(ch.length, 4);
    assert.equal(new Set(ch.map((c) => c.l)).size, 4);
    assert.equal(ch.filter((c) => c.ok).length, 1);
    assert.ok(ch.every((c) => Number(c.l) >= 0));
  }
});

test('Benar/Salah: jawaban benar sesuai kebenaran persamaan', () => {
  for (const d of LEVELS) for (let i = 0; i < 300; i++) {
    const q = makeQuestion('tf', d);
    const [a, o, b, , x] = q.q.split(' ');
    const truth = applyOp(Number(a), o as Op, Number(b)) === Number(x);
    const right = q.choices!.find((c) => c.ok)!;
    assert.equal(right.l, truth ? 'Benar' : 'Salah');
  }
});

test('Operator: setiap pilihan bertanda benar memang memenuhi persamaan, dan ada minimal satu', () => {
  for (const d of LEVELS) for (let i = 0; i < 300; i++) {
    const q = makeQuestion('op', d);
    const m = /^(\d+) \? (\d+) = (\d+)$/.exec(q.q)!;
    const [a, b, v] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const oks = q.choices!.filter((c) => c.ok);
    assert.ok(oks.length >= 1);
    for (const c of q.choices!) assert.equal(c.ok, applyOp(a, c.l as Op, b) === v);
    assert.equal(q.choices!.length, ALL_OPS.length);
  }
});

test('Bandingkan: pilihan <, =, > konsisten dengan nilai kedua hitungan', () => {
  for (const d of LEVELS) for (let i = 0; i < 300; i++) {
    const q = makeQuestion('cmp', d);
    const [l, , r] = q.q.split('\n') as [string, string, string];
    const ev = (t: string): number => { const [a, o, b] = t.split(' '); return applyOp(Number(a), o as Op, Number(b)); };
    const diff = ev(l) - ev(r);
    const right = q.choices!.find((c) => c.ok)!.l;
    assert.equal(right, diff < 0 ? '<' : diff === 0 ? '=' : '>');
  }
});

test('Ketik Jawaban & Tabel Kali: jawaban bilangan bulat benar', () => {
  for (const d of LEVELS) for (let i = 0; i < 300; i++) {
    const t = makeQuestion('tb' as MathId, d), m = /^(\d+) × (\d+) = \?$/.exec(t.q)!;
    assert.equal(t.answer, Number(m[1]) * Number(m[2]));
    const y = makeQuestion('ty', d), [a, o, b] = y.q.split(' ');
    assert.equal(y.answer, applyOp(Number(a), o as Op, Number(b)));
  }
});

test('pointsFor: bonus beruntun maksimal di 10', () => {
  assert.equal(pointsFor(1), 12);
  assert.equal(pointsFor(10), 30);
  assert.equal(pointsFor(50), 30);
});
