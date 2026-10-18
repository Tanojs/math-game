import test from 'node:test';
import assert from 'node:assert/strict';
import { apply, chooseBotMove, gameStatus, legalMoves, parseFen, perft } from '../src/games/chess/engine.js';
import { perftFast } from '../src/games/chess/search.js';

const FEN = {
  awal: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  kiwipete: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
  pos3: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
  pos4: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
  pos5: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
};

test('perft cepat (make/unmake) = angka acuan: rokade, en passant, promosi, skak', () => {
  const ref: Array<[keyof typeof FEN, number[]]> = [
    ['awal', [20, 400, 8902]], ['kiwipete', [48, 2039, 97862]], ['pos3', [14, 191, 2812]], ['pos4', [6, 264, 9467]], ['pos5', [44, 1486, 62379]],
  ];
  for (const [k, counts] of ref) {
    const { pos, white } = parseFen(FEN[k]);
    counts.forEach((c, i) => assert.equal(perftFast(pos, white, i + 1), c, `${k} kedalaman ${i + 1}`));
  }
});

test('perft cepat sama dengan engine resmi pada posisi hasil permainan acak', () => {
  let seed = 12345;
  const rnd = (n: number): number => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % n; };
  for (let g = 0; g < 6; g++) {
    const { pos: p0, white: w0 } = parseFen(FEN.awal);
    let p = p0, white = w0;
    for (let i = 0; i < 10 + g * 6; i++) {
      const ms = legalMoves(p, white);
      if (!ms.length) break;
      p = apply(p, ms[rnd(ms.length)]!); white = !white;
    }
    assert.equal(perftFast(p, white, 2), perft(p, white, 2));
  }
});

test('bot semua level memilih langkah legal; promosi & rokade ikut terbaca', () => {
  for (const fen of Object.values(FEN)) {
    const { pos, white } = parseFen(fen);
    for (const level of [0, 1, 2]) {
      const mv = chooseBotMove(pos, level, white, { timeMs: 40, maxDepth: 3 });
      assert.ok(mv && legalMoves(pos, white).some((x) => x[0] === mv[0] && x[1] === mv[1] && x[2] === mv[2]), `${fen} level ${level}`);
    }
  }
});

test('bot Sulit menemukan skakmat dalam 1 langkah dan tidak membiarkan menterinya dimakan', () => {
  // putih: Qh5# tersedia? (posisi klasik "mat sederhana"): raja hitam di h8 terkunci, rook putih mat di a8
  const mate = parseFen('6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1');
  const m = chooseBotMove(mate.pos, 2, true, { timeMs: 300 })!;
  const after = apply(mate.pos, m);
  assert.equal(gameStatus(after, false, 1).end.startsWith('Skakmat'), true, 'harus Ra8#');
  // menteri putih bisa mengambil menteri hitam yang tak terlindungi: harus diambil
  const free = parseFen('k7/8/8/3q4/8/8/8/K2Q4 w - - 0 1');
  const cap = chooseBotMove(free.pos, 2, true, { timeMs: 100 })!;
  assert.deepEqual([cap[0], cap[1]], [59, 27], 'Qxd5');
  // jangan menaruh menteri di petak yang diserang pion (a5 diserang pion b6)
  const trap = parseFen('k7/8/1p6/8/Q7/8/8/K7 w - - 0 1');
  const safe = chooseBotMove(trap.pos, 2, true, { timeMs: 100 })!;
  assert.notEqual(safe[1], 24, 'Qa5?? kehilangan menteri');
});

test('bot Sulit jauh lebih kuat daripada Mudah (adu cepat 4 permainan)', () => {
  let strongPoints = 0;
  for (let g = 0; g < 4; g++) {
    let { pos, white } = parseFen(FEN.awal);
    const strongWhite = g % 2 === 0;
    let result = 0.5;
    for (let ply = 0; ply < 160; ply++) {
      const lvl = white === strongWhite ? 2 : 0;
      const m = chooseBotMove(pos, lvl, white, { timeMs: 25, maxDepth: 4 });
      if (!m) break;
      pos = apply(pos, m); white = !white;
      const st = gameStatus(pos, white, 1);
      if (st.end.startsWith('Skakmat')) { result = (!white) === strongWhite ? 1 : 0; break; }
      if (st.end) break;
    }
    strongPoints += result;
  }
  assert.ok(strongPoints >= 3, `Sulit hanya meraih ${strongPoints}/4 melawan Mudah`);
});
