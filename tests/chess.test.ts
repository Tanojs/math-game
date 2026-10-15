import test from 'node:test';
import assert from 'node:assert/strict';
import {
  apply, chooseBotMove, gameStatus, initialPosition, legalMoves, parseFen, perft, positionKey, type Move,
} from '../src/games/chess/engine.js';

const sq = (name: string): number => (8 - Number(name[1])) * 8 + 'abcdefgh'.indexOf(name[0]!);
const mv = (a: string, b: string, promo?: 'q' | 'r' | 'b' | 'n'): Move => (promo ? [sq(a), sq(b), promo] : [sq(a), sq(b)]);

test('perft: jumlah langkah legal sama dengan angka acuan (rokade, en passant, promosi)', () => {
  const cases: Array<[string, string, number[]]> = [
    ['awal', 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', [20, 400, 8902, 197281]],
    ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039, 97862]],
    ['posisi 3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812, 43238]],
    ['posisi 4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
    ['posisi 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486, 62379]],
    ['posisi 6', 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10', [46, 2079, 89890]],
  ];
  for (const [name, fen, expected] of cases) {
    const { pos, white } = parseFen(fen);
    expected.forEach((n, i) => assert.equal(perft(pos, white, i + 1), n, `${name} kedalaman ${i + 1}`));
  }
});

test('skakmat, stalemat, materi tidak cukup, aturan 50 langkah', () => {
  const st = (fen: string, reps = 1) => { const { pos, white } = parseFen(fen); return gameStatus(pos, white, reps).end; };
  assert.equal(st('rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3'), 'Skakmat, komputer menang');
  assert.equal(st('k7/2Q5/1K6/8/8/8/8/8 b - - 0 1'), 'Seri (stalemat)');
  assert.equal(st('k7/8/8/8/8/8/8/K1B5 w - - 0 1'), 'Seri (materi tidak cukup)');
  assert.equal(st('k7/8/8/8/8/8/8/KNn5 w - - 0 1'), '');
  assert.equal(st('k7/8/8/8/8/8/R7/K7 w - - 100 80'), 'Seri (aturan 50 langkah)');
  assert.equal(st('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 3), 'Seri (posisi berulang 3 kali)');
});

test('posisi berulang 3 kali dihitung lewat positionKey', () => {
  let p = initialPosition(), white = true;
  const seen = new Map<string, number>();
  const count = (): number => { const k = positionKey(p, white); seen.set(k, (seen.get(k) ?? 0) + 1); return seen.get(k)!; };
  count();
  let reps = 0;
  for (let r = 0; r < 2; r++)
    for (const m of [mv('g1', 'f3'), mv('g8', 'f6'), mv('f3', 'g1'), mv('f6', 'g8')]) { p = apply(p, m); white = !white; reps = count(); }
  assert.equal(reps, 3);
});

test('rokade: legal, memindah benteng, dan hak hilang setelah raja jalan', () => {
  let { pos } = parseFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
  const king = legalMoves(pos, true).filter((m) => m[0] === sq('e1')).map((m) => m[1]);
  assert.ok(king.includes(sq('g1')) && king.includes(sq('c1')));
  const after = apply(pos, mv('e1', 'g1'));
  assert.equal(after.sq[sq('f1')], 'R');
  assert.equal(after.sq[sq('h1')], '');
  assert.equal(after.cr, 'kq');
  // tidak boleh melewati petak yang diserang
  ({ pos } = parseFen('r3k2r/8/8/8/8/8/5r2/R3K2R w KQkq - 0 1'));
  const k2 = legalMoves(pos, true).filter((m) => m[0] === sq('e1')).map((m) => m[1]);
  assert.ok(!k2.includes(sq('g1')) && k2.includes(sq('c1')));
});

test('en passant dan promosi', () => {
  const { pos: ep } = parseFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  const after = apply(ep, mv('e5', 'd6'));
  assert.equal(after.sq[sq('d6')], 'P');
  assert.equal(after.sq[sq('d5')], '');
  const { pos: pr } = parseFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  const promos = legalMoves(pr, true).filter((m) => m[0] === sq('a7') && m[1] === sq('a8')).map((m) => m[2]).sort();
  assert.deepEqual(promos, ['b', 'n', 'q', 'r']);
  assert.equal(apply(pr, mv('a7', 'a8', 'n')).sq[sq('a8')], 'N');
});

test('bot selalu memilih langkah legal di semua level', () => {
  let p = initialPosition();
  p = apply(p, mv('e2', 'e4'));
  for (const level of [0, 1, 2]) {
    const m = chooseBotMove(p, level)!;
    assert.ok(legalMoves(p, false).some((x) => x[0] === m[0] && x[1] === m[1] && x[2] === m[2]));
  }
});
