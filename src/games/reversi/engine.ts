/** Reversi (Othello) 8x8. Hitam (1) jalan duluan, putih (2) kedua. Papan = 64 petak, indeks = baris*8 + kolom. */
export const N = 8;
export type Side = 1 | 2;
export type Cell = 0 | Side;
export type Board = Cell[];

export const opp = (s: Side): Side => (s === 1 ? 2 : 1);

const DIRS: ReadonlyArray<readonly [number, number]> = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

export function initialBoard(): Board {
  const b = Array<Cell>(N * N).fill(0);
  b[27] = 2; b[36] = 2; // d4, e5 putih
  b[28] = 1; b[35] = 1; // e4, d5 hitam
  return b;
}

/** Petak lawan yang terbalik jika `side` menaruh bidak di `i` (kosong jika langkah tidak sah). */
export function flipsFor(b: readonly Cell[], i: number, side: Side): number[] {
  if (b[i] !== 0) return [];
  const r0 = i >> 3, c0 = i & 7, out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let r = r0 + dr, c = c0 + dc;
    while (r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === opp(side)) { line.push(r * N + c); r += dr; c += dc; }
    if (line.length && r >= 0 && r < N && c >= 0 && c < N && b[r * N + c] === side) out.push(...line);
  }
  return out;
}

export const legalMoves = (b: readonly Cell[], side: Side): number[] => {
  const out: number[] = [];
  for (let i = 0; i < N * N; i++) if (b[i] === 0 && flipsFor(b, i, side).length) out.push(i);
  return out;
};

export const hasMoves = (b: readonly Cell[], side: Side): boolean => {
  for (let i = 0; i < N * N; i++) if (b[i] === 0 && flipsFor(b, i, side).length) return true;
  return false;
};

/** Menaruh bidak (diasumsikan sah). Mengembalikan papan baru + daftar petak yang terbalik. */
export function playMove(b: readonly Cell[], i: number, side: Side): { board: Board; flipped: number[] } {
  const flipped = flipsFor(b, i, side), board = [...b] as Board;
  board[i] = side;
  for (const f of flipped) board[f] = side;
  return { board, flipped };
}

export const count = (b: readonly Cell[]): { black: number; white: number } => {
  let black = 0, white = 0;
  for (const x of b) { if (x === 1) black++; else if (x === 2) white++; }
  return { black, white };
};

export const isOver = (b: readonly Cell[]): boolean => !hasMoves(b, 1) && !hasMoves(b, 2);

// ---------- bot ----------
const W = [
  100, -20, 10, 5, 5, 10, -20, 100,
  -20, -50, -2, -2, -2, -2, -50, -20,
  10, -2, -1, -1, -1, -1, -2, 10,
  5, -2, -1, -1, -1, -1, -2, 5,
  5, -2, -1, -1, -1, -1, -2, 5,
  10, -2, -1, -1, -1, -1, -2, 10,
  -20, -50, -2, -2, -2, -2, -50, -20,
  100, -20, 10, 5, 5, 10, -20, 100,
];

/** Nilai posisi dari sudut pandang `side`: bobot petak + selisih jumlah langkah (mobilitas). */
function evaluate(b: readonly Cell[], side: Side): number {
  let s = 0;
  for (let i = 0; i < N * N; i++) if (b[i]) s += (b[i] === side ? 1 : -1) * (W[i] as number);
  return s + 6 * (legalMoves(b, side).length - legalMoves(b, opp(side)).length);
}

function negamax(b: readonly Cell[], side: Side, depth: number, alpha: number, beta: number, exact: boolean): number {
  const moves = legalMoves(b, side);
  if (!moves.length) {
    if (!hasMoves(b, opp(side))) { const c = count(b); return ((side === 1 ? 1 : -1) * (c.black - c.white)) * 1000; }
    return -negamax(b, opp(side), depth, -beta, -alpha, exact);
  }
  if (!depth && !exact) return evaluate(b, side);
  moves.sort((x, y) => (W[y] as number) - (W[x] as number));
  let best = -1e9;
  for (const m of moves) {
    const s = -negamax(playMove(b, m, side).board, opp(side), depth - 1, -beta, -alpha, exact);
    if (s > best) best = s;
    if (best > alpha) alpha = best;
    if (alpha >= beta) break;
  }
  return best;
}

/** Langkah bot. Level 0 = Mudah (acak), 1 = Sedang (rakus + bobot petak), 2 = Sulit (alpha-beta, akhir permainan dihitung tuntas). */
export function chooseBotMove(b: readonly Cell[], side: Side, level: number): number | null {
  const moves = legalMoves(b, side);
  if (!moves.length) return null;
  if (level === 0) return moves[Math.floor(Math.random() * moves.length)] as number;
  if (level === 1) {
    let best = moves[0] as number, bv = -1e9;
    for (const m of moves) {
      const v = (W[m] as number) + flipsFor(b, m, side).length * 1.5 + Math.random() * 3;
      if (v > bv) { bv = v; best = m; }
    }
    return best;
  }
  const empties = b.filter((x) => x === 0).length, exact = empties <= 8;
  const depth = exact ? empties : empties > 40 ? 4 : 5;
  let best = moves[0] as number, bv = -1e9;
  for (const m of moves) {
    const v = -negamax(playMove(b, m, side).board, opp(side), depth - 1, -1e9, 1e9, exact) + Math.random() * 0.01;
    if (v > bv) { bv = v; best = m; }
  }
  return best;
}
