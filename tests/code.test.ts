import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, isValidGuess, makeSecret, remainingCodes, score } from '../src/games/code/logic.js';

test('score: tepat dan geser', () => {
  assert.deepEqual(score('1234', '1234'), { exact: 4, near: 0 });
  assert.deepEqual(score('1234', '4321'), { exact: 0, near: 4 });
  assert.deepEqual(score('1234', '1243'), { exact: 2, near: 2 });
  assert.deepEqual(score('1234', '5678'), { exact: 0, near: 0 });
  assert.deepEqual(score('123', '145'), { exact: 1, near: 0 });
});

test('makeSecret & isValidGuess', () => {
  for (const cfg of CONFIG) for (let i = 0; i < 100; i++) {
    const s = makeSecret(cfg);
    assert.ok(isValidGuess(cfg, s));
    assert.equal(s.length, cfg.len);
  }
  assert.ok(!isValidGuess(CONFIG[1]!, '1123'));
  assert.ok(!isValidGuess(CONFIG[0]!, '127'));
  assert.ok(!isValidGuess(CONFIG[1]!, '123'));
});

test('soal selalu bisa dipecahkan dalam batas tebakan dengan strategi eliminasi', () => {
  for (const cfg of CONFIG) for (let g = 0; g < 25; g++) {
    const secret = makeSecret(cfg), hist: Array<{ guess: string; exact: number; near: number }> = [];
    let ok = false;
    for (let t = 0; t < cfg.tries && !ok; t++) {
      const pool = remainingCodes(cfg, hist);
      assert.ok(pool.includes(secret));
      const guess = pool[Math.floor(Math.random() * pool.length)]!;
      const s = score(secret, guess);
      hist.push({ guess, ...s });
      ok = s.exact === cfg.len;
    }
    assert.ok(ok, `len ${cfg.len}: tidak terpecahkan dalam ${cfg.tries} tebakan`);
  }
});
