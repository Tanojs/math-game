/**
 * Otak bot catur: papan bilangan bulat (Int8Array) + make/unmake, pencarian alpha-beta (PVS) dengan
 * iterative deepening, tabel transposisi (Zobrist), null-move, late-move reduction, quiescence, dan evaluasi
 * (materi + tabel posisi + pasangan gajah + pion lolos/ganda). Terpisah dari engine.ts (aturan resmi) agar cepat.
 * Papan: indeks 0 = a8 … 63 = h1. Putih = +1..+6, hitam = -1..-6 (P N B R Q K).
 */
import type { Move, Position, Promo } from './engine.js';

const CODE: Record<string, number> = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6, p: -1, n: -2, b: -3, r: -4, q: -5, k: -6 };
const MAT = [0, 100, 320, 330, 500, 900, 0];
const INF = 30000, MATE = 29000;
const FL_EP = 1, FL_CASTLE = 2, FL_DBL = 4;
const MAX_PLY = 64;

// ---------- tabel posisi (sudut pandang putih, baris pertama = rank 8) ----------
const PST: number[][] = [[],
  [0, 0, 0, 0, 0, 0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 10, 10, 20, 30, 30, 20, 10, 10, 5, 5, 10, 25, 25, 10, 5, 5, 0, 0, 0, 20, 20, 0, 0, 0, 5, -5, -10, 0, 0, -10, -5, 5, 5, 10, 10, -20, -20, 10, 10, 5, 0, 0, 0, 0, 0, 0, 0, 0],
  [-50, -40, -30, -30, -30, -30, -40, -50, -40, -20, 0, 0, 0, 0, -20, -40, -30, 0, 10, 15, 15, 10, 0, -30, -30, 5, 15, 20, 20, 15, 5, -30, -30, 0, 15, 20, 20, 15, 0, -30, -30, 5, 10, 15, 15, 10, 5, -30, -40, -20, 0, 5, 5, 0, -20, -40, -50, -40, -30, -30, -30, -30, -40, -50],
  [-20, -10, -10, -10, -10, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 10, 10, 5, 0, -10, -10, 5, 5, 10, 10, 5, 5, -10, -10, 0, 10, 10, 10, 10, 0, -10, -10, 10, 10, 10, 10, 10, 10, -10, -10, 5, 0, 0, 0, 0, 5, -10, -20, -10, -10, -10, -10, -10, -10, -20],
  [0, 0, 0, 0, 0, 0, 0, 0, 5, 10, 10, 10, 10, 10, 10, 5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, -5, 0, 0, 0, 0, 0, 0, -5, 0, 0, 0, 5, 5, 0, 0, 0],
  [-20, -10, -10, -5, -5, -10, -10, -20, -10, 0, 0, 0, 0, 0, 0, -10, -10, 0, 5, 5, 5, 5, 0, -10, -5, 0, 5, 5, 5, 5, 0, -5, 0, 0, 5, 5, 5, 5, 0, -5, -10, 5, 5, 5, 5, 5, 0, -10, -10, 0, 5, 0, 0, 0, 0, -10, -20, -10, -10, -5, -5, -10, -10, -20],
  [-30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -30, -40, -40, -50, -50, -40, -40, -30, -20, -30, -30, -40, -40, -30, -30, -20, -10, -20, -20, -20, -20, -20, -20, -10, 20, 20, 0, 0, 0, 0, 20, 20, 20, 30, 10, 0, 0, 10, 30, 20]];
const KING_END = [-50, -40, -30, -20, -20, -30, -40, -50, -30, -20, -10, 0, 0, -10, -20, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 30, 40, 40, 30, -10, -30, -30, -10, 20, 30, 30, 20, -10, -30, -30, -30, 0, 0, 0, 0, -30, -30, -50, -30, -30, -30, -30, -30, -30, -50];
const PASSED = [0, 10, 15, 25, 45, 80, 130, 0];

// ---------- tabel geometri ----------
const KN: number[][] = [], KG: number[][] = [], DIAG: number[][][] = [], ORTH: number[][][] = [], PATT_W: number[][] = [], PATT_B: number[][] = [];
const inb = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;
for (let s = 0; s < 64; s++) {
  const r = s >> 3, c = s & 7;
  KN[s] = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]].filter(([a, e]) => inb(r + a!, c + e!)).map(([a, e]) => (r + a!) * 8 + c + e!);
  KG[s] = [[1, 1], [1, 0], [1, -1], [0, 1], [0, -1], [-1, 1], [-1, 0], [-1, -1]].filter(([a, e]) => inb(r + a!, c + e!)).map(([a, e]) => (r + a!) * 8 + c + e!);
  const ray = (dr: number, dc: number): number[] => { const o: number[] = []; let rr = r + dr, cc = c + dc; while (inb(rr, cc)) { o.push(rr * 8 + cc); rr += dr; cc += dc; } return o; };
  DIAG[s] = [ray(1, 1), ray(1, -1), ray(-1, 1), ray(-1, -1)];
  ORTH[s] = [ray(1, 0), ray(-1, 0), ray(0, 1), ray(0, -1)];
  PATT_W[s] = [[1, -1], [1, 1]].filter(([a, e]) => inb(r + a!, c + e!)).map(([a, e]) => (r + a!) * 8 + c + e!); // pion putih yang menyerang s
  PATT_B[s] = [[-1, -1], [-1, 1]].filter(([a, e]) => inb(r + a!, c + e!)).map(([a, e]) => (r + a!) * 8 + c + e!);
}
const CRM = new Int8Array(64).fill(15);
CRM[60] = 12; CRM[63] = 14; CRM[56] = 13; CRM[4] = 3; CRM[7] = 11; CRM[0] = 7; // hak rokade: 1=K 2=Q 4=k 8=q

// ---------- Zobrist ----------
let zs = 0x9e3779b9;
const rnd = (): number => { zs ^= zs << 13; zs ^= zs >>> 17; zs ^= zs << 5; return zs | 0; };
const ZL = new Int32Array(13 * 64), ZH = new Int32Array(13 * 64), ZCL = new Int32Array(16), ZCH = new Int32Array(16), ZEL = new Int32Array(65), ZEH = new Int32Array(65);
for (let i = 0; i < ZL.length; i++) { ZL[i] = rnd(); ZH[i] = rnd(); }
for (let i = 0; i < 16; i++) { ZCL[i] = rnd(); ZCH[i] = rnd(); }
for (let i = 0; i < 65; i++) { ZEL[i] = rnd(); ZEH[i] = rnd(); }
const ZSL = rnd(), ZSH = rnd();
const zi = (piece: number, sq: number): number => (piece + 6) * 64 + sq;

// ---------- keadaan ----------
const S = {
  b: new Int8Array(64), side: 1, cr: 0, ep: -1, hm: 0, ksq: [60, 4], lo: 0, hi: 0,
  nodes: 0, deadline: 0, abort: false,
};
const STK = 1024;
const capS = new Int8Array(STK), crS = new Int8Array(STK), epS = new Int16Array(STK), hmS = new Int16Array(STK), loS = new Int32Array(STK), hiS = new Int32Array(STK), mvS = new Int32Array(STK);
let sp = 0;
const MOVES: Int32Array[] = Array.from({ length: MAX_PLY + 2 }, () => new Int32Array(256));
const MSCORE: Int32Array[] = Array.from({ length: MAX_PLY + 2 }, () => new Int32Array(256));
const KILL: Int32Array[] = [new Int32Array(MAX_PLY + 2), new Int32Array(MAX_PLY + 2)];
const HIST = new Int32Array(13 * 64);

// tabel transposisi
const TT_BITS = 18, TT_MASK = (1 << TT_BITS) - 1;
const ttHi = new Int32Array(1 << TT_BITS), ttMove = new Int32Array(1 << TT_BITS), ttScore = new Int16Array(1 << TT_BITS), ttDepth = new Int8Array(1 << TT_BITS), ttFlag = new Int8Array(1 << TT_BITS);

function attacked(b: Int8Array, s: number, byWhite: boolean): boolean {
  const g = byWhite ? 1 : -1;
  for (const p of byWhite ? PATT_W[s]! : PATT_B[s]!) if (b[p] === g) return true;
  for (const t of KN[s]!) if (b[t] === 2 * g) return true;
  for (const t of KG[s]!) if (b[t] === 6 * g) return true;
  for (const ray of DIAG[s]!) for (const t of ray) { const q = b[t]!; if (q) { if (q === 3 * g || q === 5 * g) return true; break; } }
  for (const ray of ORTH[s]!) for (const t of ray) { const q = b[t]!; if (q) { if (q === 4 * g || q === 5 * g) return true; break; } }
  return false;
}

function setup(p: Position, whiteToMove: boolean): void {
  const b = S.b; b.fill(0);
  p.sq.forEach((x, i) => { b[i] = x ? CODE[x]! : 0; });
  S.side = whiteToMove ? 1 : -1;
  S.cr = (p.cr.includes('K') ? 1 : 0) | (p.cr.includes('Q') ? 2 : 0) | (p.cr.includes('k') ? 4 : 0) | (p.cr.includes('q') ? 8 : 0);
  S.ep = p.ep; S.hm = p.hm;
  S.ksq = [b.indexOf(6), b.indexOf(-6)];
  let lo = 0, hi = 0;
  for (let i = 0; i < 64; i++) if (b[i]) { lo ^= ZL[zi(b[i]!, i)]!; hi ^= ZH[zi(b[i]!, i)]!; }
  lo ^= ZCL[S.cr]! ^ ZEL[S.ep + 1]!; hi ^= ZCH[S.cr]! ^ ZEH[S.ep + 1]!;
  if (S.side < 0) { lo ^= ZSL; hi ^= ZSH; }
  S.lo = lo; S.hi = hi; sp = 0;
}

function make(m: number): boolean {
  const f = m & 63, t = (m >> 6) & 63, promo = (m >> 12) & 15, fl = (m >> 16) & 7, b = S.b, side = S.side;
  const piece = b[f]!, cap = b[t]!;
  capS[sp] = cap; crS[sp] = S.cr; epS[sp] = S.ep; hmS[sp] = S.hm; loS[sp] = S.lo; hiS[sp] = S.hi; mvS[sp] = m; sp++;
  let lo = S.lo ^ ZEL[S.ep + 1]! ^ ZCL[S.cr]! ^ ZL[zi(piece, f)]!, hi = S.hi ^ ZEH[S.ep + 1]! ^ ZCH[S.cr]! ^ ZH[zi(piece, f)]!;
  if (cap) { lo ^= ZL[zi(cap, t)]!; hi ^= ZH[zi(cap, t)]!; }
  b[f] = 0;
  const placed = promo ? side * promo : piece;
  b[t] = placed; lo ^= ZL[zi(placed, t)]!; hi ^= ZH[zi(placed, t)]!;
  if (fl === FL_EP) {
    const cs = t + (side > 0 ? 8 : -8), cp = b[cs]!;
    b[cs] = 0; capS[sp - 1] = cp; lo ^= ZL[zi(cp, cs)]!; hi ^= ZH[zi(cp, cs)]!;
  } else if (fl === FL_CASTLE) {
    const rf = t > f ? f + 3 : f - 4, rt = t > f ? f + 1 : f - 1, rook = b[rf]!;
    b[rf] = 0; b[rt] = rook;
    lo ^= ZL[zi(rook, rf)]! ^ ZL[zi(rook, rt)]!; hi ^= ZH[zi(rook, rf)]! ^ ZH[zi(rook, rt)]!;
  }
  if (piece === 6) S.ksq[0] = t; else if (piece === -6) S.ksq[1] = t;
  S.cr &= CRM[f]! & CRM[t]!;
  S.ep = fl === FL_DBL ? (f + t) >> 1 : -1;
  S.hm = piece === 1 || piece === -1 || cap !== 0 || fl === FL_EP ? 0 : S.hm + 1;
  S.side = -side;
  lo ^= ZSL ^ ZEL[S.ep + 1]! ^ ZCL[S.cr]!; hi ^= ZSH ^ ZEH[S.ep + 1]! ^ ZCH[S.cr]!;
  S.lo = lo; S.hi = hi;
  if (attacked(b, S.ksq[side > 0 ? 0 : 1]!, S.side > 0)) { unmake(); return false; }
  return true;
}

function unmake(): void {
  sp--;
  const m = mvS[sp]!, f = m & 63, t = (m >> 6) & 63, promo = (m >> 12) & 15, fl = (m >> 16) & 7, b = S.b;
  S.side = -S.side;
  const side = S.side, cap = capS[sp]!;
  const piece = promo ? side : b[t]!;
  b[f] = piece;
  if (fl === FL_EP) { b[t] = 0; b[t + (side > 0 ? 8 : -8)] = cap; }
  else { b[t] = cap; }
  if (fl === FL_CASTLE) {
    const rf = t > f ? f + 3 : f - 4, rt = t > f ? f + 1 : f - 1;
    b[rf] = b[rt]!; b[rt] = 0;
  }
  if (piece === 6) S.ksq[0] = f; else if (piece === -6) S.ksq[1] = f;
  S.cr = crS[sp]!; S.ep = epS[sp]!; S.hm = hmS[sp]!; S.lo = loS[sp]!; S.hi = hiS[sp]!;
}

function makeNull(): void {
  crS[sp] = S.cr; epS[sp] = S.ep; hmS[sp] = S.hm; loS[sp] = S.lo; hiS[sp] = S.hi; sp++;
  S.lo ^= ZSL ^ ZEL[S.ep + 1]! ^ ZEL[0]!; S.hi ^= ZSH ^ ZEH[S.ep + 1]! ^ ZEH[0]!;
  S.ep = -1; S.side = -S.side; S.hm++;
}
function unmakeNull(): void {
  sp--; S.side = -S.side; S.cr = crS[sp]!; S.ep = epS[sp]!; S.hm = hmS[sp]!; S.lo = loS[sp]!; S.hi = hiS[sp]!;
}

/** Hasilkan langkah pseudo-legal ke MOVES[ply]; `caps` = hanya tangkapan & promosi (untuk quiescence). */
function gen(ply: number, caps: boolean): number {
  const list = MOVES[ply]!, b = S.b, side = S.side, white = side > 0;
  let n = 0;
  const mine = (q: number): boolean => (q > 0) === white;
  for (let f = 0; f < 64; f++) {
    const p = b[f]!;
    if (!p || !mine(p)) continue;
    const a = p > 0 ? p : -p;
    if (a === 1) {
      const dir = white ? -1 : 1, r = f >> 3, c = f & 7, promoRow = white ? 0 : 7, t1 = f + dir * 8;
      if (!b[t1]) {
        if (t1 >> 3 === promoRow) { list[n++] = f | (t1 << 6) | (5 << 12); list[n++] = f | (t1 << 6) | (2 << 12); list[n++] = f | (t1 << 6) | (4 << 12); list[n++] = f | (t1 << 6) | (3 << 12); }
        else if (!caps) {
          list[n++] = f | (t1 << 6);
          if (r === (white ? 6 : 1) && !b[f + dir * 16]) list[n++] = f | ((f + dir * 16) << 6) | (FL_DBL << 16);
        }
      }
      for (const dc of [-1, 1]) {
        const cc = c + dc;
        if (cc < 0 || cc > 7) continue;
        const t = t1 + dc, q = b[t]!;
        if (q && !mine(q)) {
          if (t >> 3 === promoRow) { list[n++] = f | (t << 6) | (5 << 12); list[n++] = f | (t << 6) | (2 << 12); list[n++] = f | (t << 6) | (4 << 12); list[n++] = f | (t << 6) | (3 << 12); }
          else list[n++] = f | (t << 6);
        } else if (!q && t === S.ep) list[n++] = f | (t << 6) | (FL_EP << 16);
      }
    } else if (a === 2 || a === 6) {
      for (const t of a === 2 ? KN[f]! : KG[f]!) { const q = b[t]!; if (!q) { if (!caps) list[n++] = f | (t << 6); } else if (!mine(q)) list[n++] = f | (t << 6); }
      if (a === 6 && !caps) {
        const h = white ? 56 : 0, ks = white ? 1 : 4, qs = white ? 2 : 8, rook = white ? 4 : -4;
        if (f === h + 4 && (S.cr & (ks | qs)) && !attacked(b, f, !white)) {
          if ((S.cr & ks) && !b[h + 5] && !b[h + 6] && b[h + 7] === rook && !attacked(b, h + 5, !white) && !attacked(b, h + 6, !white)) list[n++] = f | ((h + 6) << 6) | (FL_CASTLE << 16);
          if ((S.cr & qs) && !b[h + 3] && !b[h + 2] && !b[h + 1] && b[h] === rook && !attacked(b, h + 3, !white) && !attacked(b, h + 2, !white)) list[n++] = f | ((h + 2) << 6) | (FL_CASTLE << 16);
        }
      }
    } else {
      if (a !== 4) for (const ray of DIAG[f]!) for (const t of ray) { const q = b[t]!; if (!q) { if (!caps) list[n++] = f | (t << 6); } else { if (!mine(q)) list[n++] = f | (t << 6); break; } }
      if (a !== 3) for (const ray of ORTH[f]!) for (const t of ray) { const q = b[t]!; if (!q) { if (!caps) list[n++] = f | (t << 6); } else { if (!mine(q)) list[n++] = f | (t << 6); break; } }
    }
  }
  return n;
}

function orderMoves(ply: number, n: number, ttm: number): void {
  const list = MOVES[ply]!, sc = MSCORE[ply]!, b = S.b, kl = KILL[0]![ply]!, k2 = KILL[1]![ply]!;
  for (let i = 0; i < n; i++) {
    const m = list[i]!, f = m & 63, t = (m >> 6) & 63, promo = (m >> 12) & 15, victim = b[t]!;
    let s: number;
    if (m === ttm) s = 2_000_000;
    else if (victim || (m >> 16 & 7) === FL_EP) s = 1_000_000 + 10 * (MAT[Math.abs(victim)] || 100) - MAT[Math.abs(b[f]!)]! / 10 + (promo ? 5000 : 0);
    else if (promo) s = 900_000 + promo;
    else if (m === kl) s = 800_000;
    else if (m === k2) s = 700_000;
    else s = HIST[zi(b[f]!, t)]!;
    sc[i] = s;
  }
}
function pick(ply: number, i: number, n: number): number {
  const list = MOVES[ply]!, sc = MSCORE[ply]!;
  let bi = i;
  for (let j = i + 1; j < n; j++) if (sc[j]! > sc[bi]!) bi = j;
  const m = list[bi]!, s = sc[bi]!;
  list[bi] = list[i]!; sc[bi] = sc[i]!; list[i] = m; sc[i] = s;
  return m;
}

// ---------- evaluasi (sudut pandang pihak yang jalan) ----------
function evaluate(): number {
  const b = S.b;
  let score = 0, npm = 0, kMgW = 0, kMgB = 0, kEgW = 0, kEgB = 0, bw = 0, bb = 0;
  const pawnsW = new Int8Array(8), pawnsB = new Int8Array(8);
  for (let s = 0; s < 64; s++) {
    const p = b[s]!;
    if (!p) continue;
    const w = p > 0, a = w ? p : -p, idx = w ? s : s ^ 56;
    if (a === 6) { if (w) { kMgW = PST[6]![idx]!; kEgW = KING_END[idx]!; } else { kMgB = PST[6]![idx]!; kEgB = KING_END[idx]!; } continue; }
    const v = MAT[a]! + PST[a]![idx]!;
    score += w ? v : -v;
    if (a === 1) { if (w) pawnsW[s & 7]!++; else pawnsB[s & 7]!++; }
    else { npm += MAT[a]!; if (a === 3) { if (w) bw++; else bb++; } }
  }
  const phase = Math.min(1, npm / 6400);
  score += (kMgW - kMgB) * phase + (kEgW - kEgB) * (1 - phase);
  if (bw >= 2) score += 30;
  if (bb >= 2) score -= 30;
  for (let c = 0; c < 8; c++) {
    if (pawnsW[c]! > 1) score -= 12 * (pawnsW[c]! - 1);
    if (pawnsB[c]! > 1) score += 12 * (pawnsB[c]! - 1);
  }
  // pion lolos
  for (let s = 8; s < 56; s++) {
    const p = b[s]!;
    if (p !== 1 && p !== -1) continue;
    const c = s & 7, r = s >> 3;
    let free = true;
    if (p === 1) {
      for (let rr = r - 1; rr > 0 && free; rr--) for (let cc = Math.max(0, c - 1); cc <= Math.min(7, c + 1); cc++) if (b[rr * 8 + cc] === -1) { free = false; break; }
      if (free) score += PASSED[6 - r]! * (1 + (1 - phase) * 0.6);
    } else {
      for (let rr = r + 1; rr < 7 && free; rr++) for (let cc = Math.max(0, c - 1); cc <= Math.min(7, c + 1); cc++) if (b[rr * 8 + cc] === 1) { free = false; break; }
      if (free) score -= PASSED[r - 1]! * (1 + (1 - phase) * 0.6);
    }
  }
  return (S.side > 0 ? score : -score) + 8;
}

const hasPieces = (side: number): boolean => {
  for (let s = 0; s < 64; s++) { const p = S.b[s]!; if (p * side > 1) return true; }
  return false;
};
const repeated = (): boolean => {
  const lim = Math.max(0, sp - S.hm);
  for (let i = sp - 2; i >= lim; i -= 2) if (loS[i] === S.lo && hiS[i] === S.hi) return true;
  return false;
};

function quiesce(alpha: number, beta: number, ply: number): number {
  S.nodes++;
  if ((S.nodes & 2047) === 0 && performance.now() > S.deadline) S.abort = true;
  if (S.abort) return 0;
  const stand = evaluate();
  if (ply >= MAX_PLY - 1) return stand;
  if (stand >= beta) return stand;
  if (stand + 1000 < alpha) return alpha; // sangat jauh di bawah: pangkas
  if (stand > alpha) alpha = stand;
  const n = gen(ply, true);
  orderMoves(ply, n, 0);
  for (let i = 0; i < n; i++) {
    const m = pick(ply, i, n);
    const victim = Math.abs(S.b[(m >> 6) & 63]!);
    if (!((m >> 12) & 15) && stand + MAT[victim]! + 200 < alpha && (m >> 16 & 7) !== FL_EP) continue; // delta pruning
    if (!make(m)) continue;
    const s = -quiesce(-beta, -alpha, ply + 1);
    unmake();
    if (S.abort) return 0;
    if (s >= beta) return s;
    if (s > alpha) alpha = s;
  }
  return alpha;
}

function negamax(depth: number, alpha: number, beta: number, ply: number, nullOk: boolean): number {
  S.nodes++;
  if ((S.nodes & 2047) === 0 && performance.now() > S.deadline) S.abort = true;
  if (S.abort) return 0;
  if (ply > 0 && (S.hm >= 100 || repeated())) return 0;
  const white = S.side > 0, inChk = attacked(S.b, S.ksq[white ? 0 : 1]!, !white);
  if (inChk) depth++;
  if (depth <= 0 || ply >= MAX_PLY - 1) return quiesce(alpha, beta, ply);
  const origAlpha = alpha, idx = S.lo & TT_MASK;
  let ttm = 0;
  if (ttHi[idx] === S.hi) {
    ttm = ttMove[idx]!;
    if (ply > 0 && ttDepth[idx]! >= depth) {
      const sc = ttScore[idx]!, fl = ttFlag[idx]!;
      if (fl === 0 || (fl === 1 && sc >= beta) || (fl === 2 && sc <= alpha)) return sc;
    }
  }
  if (nullOk && !inChk && depth >= 3 && ply > 0 && hasPieces(S.side) && evaluate() >= beta) {
    makeNull();
    const s = -negamax(depth - 3, -beta, -beta + 1, ply + 1, false);
    unmakeNull();
    if (S.abort) return 0;
    if (s >= beta) return beta;
  }
  const n = gen(ply, false);
  orderMoves(ply, n, ttm);
  let legal = 0, bestM = 0, best = -INF;
  for (let i = 0; i < n; i++) {
    const m = pick(ply, i, n);
    const quiet = !S.b[(m >> 6) & 63] && !((m >> 12) & 15) && (m >> 16 & 7) !== FL_EP;
    const mover = S.b[m & 63]!;
    if (!make(m)) continue;
    legal++;
    let s: number;
    if (legal === 1) s = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
    else {
      const red = depth >= 3 && legal > 4 && quiet && !inChk ? 1 : 0;
      s = -negamax(depth - 1 - red, -alpha - 1, -alpha, ply + 1, true);
      if (s > alpha && red) s = -negamax(depth - 1, -alpha - 1, -alpha, ply + 1, true);
      if (s > alpha && s < beta) s = -negamax(depth - 1, -beta, -alpha, ply + 1, true);
    }
    unmake();
    if (S.abort) return 0;
    if (s > best) { best = s; bestM = m; }
    if (s > alpha) alpha = s;
    if (alpha >= beta) {
      if (quiet) {
        if (KILL[0]![ply] !== m) { KILL[1]![ply] = KILL[0]![ply]!; KILL[0]![ply] = m; }
        HIST[zi(mover, (m >> 6) & 63)]! += depth * depth;
      }
      break;
    }
  }
  if (!legal) return inChk ? -MATE + ply : 0;
  if (!S.abort) {
    ttHi[idx] = S.hi; ttMove[idx] = bestM; ttScore[idx] = Math.max(-32000, Math.min(32000, best)); ttDepth[idx] = depth;
    ttFlag[idx] = best >= beta ? 1 : best > origAlpha ? 0 : 2;
  }
  return best;
}

export interface BotOpts {
  timeMs?: number;
  maxDepth?: number;
  /** Langkah yang akan mengulang posisi yang sudah pernah muncul: dihindari bila ada pilihan lain (bot tidak mudah berakhir seri). */
  avoid?: Move[];
}
interface Params { depth: number; time: number; noise: number }
const LEVEL: Params[] = [
  { depth: 2, time: 250, noise: 130 },   // Mudah: pemula, sering salah langkah
  { depth: 5, time: 600, noise: 22 },    // Sedang
  { depth: 14, time: 1700, noise: 0 },   // Sulit
];

const letter: Record<number, Promo> = { 5: 'q', 4: 'r', 3: 'b', 2: 'n' };
const toMove = (m: number): Move => { const pr = (m >> 12) & 15; return pr ? [m & 63, (m >> 6) & 63, letter[pr]!] : [m & 63, (m >> 6) & 63]; };

/** Pilih langkah terbaik untuk pihak yang jalan. `level` 0 = Mudah, 1 = Sedang, 2 = Sulit. */
export function searchBest(p: Position, whiteToMove: boolean, level: number, opts: BotOpts = {}): Move | null {
  setup(p, whiteToMove);
  const prm = LEVEL[Math.max(0, Math.min(2, level))]!;
  const maxDepth = Math.min(opts.maxDepth ?? 99, prm.depth), budget = opts.timeMs ?? prm.time;
  // langkah legal di akar
  const n0 = gen(0, false), root: number[] = [];
  for (let i = 0; i < n0; i++) { const m = MOVES[0]![i]!; if (make(m)) { unmake(); root.push(m); } }
  if (!root.length) return null;
  if (root.length === 1) return toMove(root[0]!);
  if (opts.avoid?.length && level >= 1) {
    const keep = root.filter((m) => !opts.avoid!.some((a) => a[0] === (m & 63) && a[1] === ((m >> 6) & 63) && (a[2] ?? 0) === (letter[(m >> 12) & 15] ?? 0)));
    if (keep.length) { root.length = 0; root.push(...keep); }
  }
  S.deadline = performance.now() + budget; S.abort = false; S.nodes = 0;
  KILL[0]!.fill(0); KILL[1]!.fill(0); HIST.fill(0);
  const scores = new Array<number>(root.length).fill(0);
  const exact = new Array<boolean>(root.length).fill(false); // skor tepat (jendela penuh) — selain itu hanya batas atas
  let bestMove = root[0]!;
  for (let depth = 1; depth <= maxDepth; depth++) {
    // urutkan akar: terbaik dari iterasi sebelumnya di depan
    const order = root.map((m, i) => ({ m, s: scores[i]! })).sort((x, y) => y.s - x.s);
    const cur: number[] = [], curExact: boolean[] = [];
    let alpha = -INF, curBest = order[0]!.m, ok = true;
    for (let i = 0; i < order.length; i++) {
      const m = order[i]!.m;
      make(m);
      // noise > 0: skor penuh tiap langkah (jendela penuh); Sulit: pencarian PVS biasa
      let isExact = true;
      const s = prm.noise > 0 || i === 0 ? -negamax(depth - 1, -INF, INF, 1, true)
        : (() => { let v = -negamax(depth - 1, -alpha - 1, -alpha, 1, true); if (v > alpha && !S.abort) v = -negamax(depth - 1, -INF, -alpha, 1, true); else isExact = false; return v; })();
      unmake();
      if (S.abort && depth > 1) { ok = false; break; }
      cur.push(s); curExact.push(isExact);
      if (s > alpha || i === 0) { alpha = Math.max(alpha, s); if (s >= alpha) curBest = m; }
    }
    if (!ok) break;
    order.forEach((o, i) => { const k = root.indexOf(o.m); scores[k] = cur[i]!; exact[k] = curExact[i]!; });
    bestMove = curBest;
    if (Math.abs(alpha) > MATE - 100) break; // mat ditemukan
    if (depth === 1 && S.abort) break;
  }
  if (prm.noise > 0) {
    let bv = -Infinity;
    root.forEach((m, i) => { const v = scores[i]! + (Math.random() * 2 - 1) * prm.noise; if (v > bv) { bv = v; bestMove = m; } });
  } else {
    // seri nilai: acak kecil agar permainan tidak selalu sama
    const bi = root.indexOf(bestMove), top = scores[bi]!, ties = root.filter((_, i) => exact[i] && scores[i]! >= top - 3);
    if (ties.length > 1) bestMove = ties[Math.floor(Math.random() * ties.length)]!;
  }
  return toMove(bestMove);
}

/** Hitung langkah legal sampai kedalaman tertentu (untuk membandingkan dengan engine.ts). */
export function perftFast(p: Position, whiteToMove: boolean, depth: number): number {
  setup(p, whiteToMove);
  const rec = (d: number, ply: number): number => {
    if (d === 0) return 1;
    const n = gen(ply, false), list = Array.from(MOVES[ply]!.subarray(0, n));
    let tot = 0;
    for (const m of list) { if (make(m)) { tot += rec(d - 1, ply + 1); unmake(); } }
    return tot;
  };
  return rec(depth, 0);
}
