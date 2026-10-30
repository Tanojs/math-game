/**
 * Mesin catur (aturan resmi): rokade, en passant, promosi, skakmat/stalemat,
 * materi tidak cukup, aturan 50 langkah, dan posisi berulang 3 kali.
 * Papan: indeks 0 = a8 … 63 = h1. Huruf besar = putih, kecil = hitam, '' = kosong.
 */
import { searchBest, type BotOpts } from './search.js';

export type Promo = 'q' | 'r' | 'b' | 'n';
export type Move = [from: number, to: number, promo?: Promo];
export interface Position {
  sq: string[];
  /** hak rokade, mis. "KQkq" */
  cr: string;
  /** petak target en passant, -1 jika tidak ada */
  ep: number;
  /** jumlah setengah-langkah sejak pion/tangkapan terakhir */
  hm: number;
}

export const isWhitePiece = (s: string): boolean => s === s.toUpperCase();
const KN: ReadonlyArray<readonly [number, number]> = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
const DG: ReadonlyArray<readonly [number, number]> = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const OR: ReadonlyArray<readonly [number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const inb = (r: number, c: number): boolean => r >= 0 && r < 8 && c >= 0 && c < 8;

export function initialPosition(): Position {
  const sq = [...'rnbqkbnrpppppppp'.split(''), ...Array<string>(32).fill(''), ...'PPPPPPPPRNBQKBNR'.split('')];
  return { sq, cr: 'KQkq', ep: -1, hm: 0 };
}

/** Apakah petak `target` diserang oleh pihak `byWhite`? */
export function attacked(sq: readonly string[], target: number, byWhite: boolean): boolean {
  const r = target >> 3, c = target & 7, pd = byWhite ? 1 : -1;
  for (const e of [-1, 1]) if (inb(r + pd, c + e) && sq[(r + pd) * 8 + c + e] === (byWhite ? 'P' : 'p')) return true;
  for (const [a, e] of KN) if (inb(r + a, c + e) && sq[(r + a) * 8 + c + e] === (byWhite ? 'N' : 'n')) return true;
  for (let a = -1; a < 2; a++)
    for (let e = -1; e < 2; e++)
      if ((a || e) && inb(r + a, c + e) && sq[(r + a) * 8 + c + e] === (byWhite ? 'K' : 'k')) return true;
  for (const [a, e] of [...DG, ...OR]) {
    let rr = r + a, cc = c + e;
    while (inb(rr, cc)) {
      const q = sq[rr * 8 + cc] as string;
      if (q) {
        if (isWhitePiece(q) === byWhite) {
          const t = q.toLowerCase();
          if (t === 'q' || (a && e ? t === 'b' : t === 'r')) return true;
        }
        break;
      }
      rr += a;
      cc += e;
    }
  }
  return false;
}

/** Langkah pseudo-legal (belum memeriksa raja sendiri terkena skak). */
export function generate(p: Position, white: boolean): Move[] {
  const b = p.sq, m: Move[] = [];
  for (let i = 0; i < 64; i++) {
    const piece = b[i] as string;
    if (!piece || isWhitePiece(piece) !== white) continue;
    const t = piece.toLowerCase(), r = i >> 3, c = i & 7;
    const add = (rr: number, cc: number): number => {
      if (!inb(rr, cc)) return 0;
      const q = b[rr * 8 + cc] as string;
      if (q && isWhitePiece(q) === white) return 0;
      m.push([i, rr * 8 + cc]);
      return q ? 0 : 1;
    };
    if (t === 'p') {
      const d = white ? -1 : 1, lastRank = white ? 0 : 7;
      if (r + d < 0 || r + d > 7) continue;
      const push = (to: number): void => {
        if (to >> 3 === lastRank) for (const x of ['q', 'r', 'b', 'n'] as const) m.push([i, to, x]);
        else m.push([i, to]);
      };
      if (!b[(r + d) * 8 + c]) {
        push((r + d) * 8 + c);
        if (r === (white ? 6 : 1) && !b[(r + 2 * d) * 8 + c]) m.push([i, (r + 2 * d) * 8 + c]);
      }
      for (const e of [-1, 1]) {
        const cc = c + e;
        if (cc < 0 || cc > 7) continue;
        const to = (r + d) * 8 + cc, q = b[to] as string;
        if ((q && isWhitePiece(q) !== white) || (!q && to === p.ep)) push(to);
      }
    } else if (t === 'n') for (const [a, e] of KN) add(r + a, c + e);
    else if (t === 'k') {
      for (let a = -1; a < 2; a++) for (let e = -1; e < 2; e++) if (a || e) add(r + a, c + e);
      const rook = white ? 'R' : 'r', ks = white ? 'K' : 'k', qs = white ? 'Q' : 'q', h = (white ? 7 : 0) * 8;
      if (i === h + 4 && (p.cr.includes(ks) || p.cr.includes(qs)) && !attacked(b, i, !white)) {
        if (p.cr.includes(ks) && !b[h + 5] && !b[h + 6] && b[h + 7] === rook && !attacked(b, h + 5, !white) && !attacked(b, h + 6, !white))
          m.push([i, h + 6]);
        if (p.cr.includes(qs) && !b[h + 3] && !b[h + 2] && !b[h + 1] && b[h] === rook && !attacked(b, h + 3, !white) && !attacked(b, h + 2, !white))
          m.push([i, h + 2]);
      }
    } else {
      for (const [a, e] of t === 'b' ? DG : t === 'r' ? OR : [...DG, ...OR]) {
        let k = 1;
        while (add(r + a * k, c + e * k)) k++;
      }
    }
  }
  return m;
}

const CASTLE_RIGHTS_LOST: Record<number, string> = { 60: 'KQ', 4: 'kq', 63: 'K', 56: 'Q', 7: 'k', 0: 'q' };

/** Jalankan langkah dan kembalikan posisi baru (tidak mengubah yang lama). */
export function apply(p: Position, move: Move): Position {
  const [f, t, promo] = move;
  const sq = [...p.sq];
  const piece = sq[f] as string, white = isWhitePiece(piece), pt = piece.toLowerCase();
  let capture = !!sq[t];
  sq[t] = piece;
  sq[f] = '';
  if (pt === 'p') {
    if (t === p.ep && !capture && (f & 7) !== (t & 7)) { sq[(f >> 3) * 8 + (t & 7)] = ''; capture = true; } // en passant
    if (t >> 3 === (white ? 0 : 7)) { const y = promo ?? 'q'; sq[t] = white ? y.toUpperCase() : y; }
  }
  if (pt === 'k' && Math.abs(t - f) === 2) {
    if (t > f) { sq[f + 1] = sq[f + 3] as string; sq[f + 3] = ''; }
    else { sq[f - 1] = sq[f - 4] as string; sq[f - 4] = ''; }
  }
  const lost = (CASTLE_RIGHTS_LOST[f] ?? '') + (CASTLE_RIGHTS_LOST[t] ?? '');
  return {
    sq,
    cr: [...p.cr].filter((c) => !lost.includes(c)).join(''),
    ep: pt === 'p' && Math.abs(t - f) === 16 ? (f + t) / 2 : -1,
    hm: pt === 'p' || capture ? 0 : p.hm + 1,
  };
}

export const inCheck = (p: Position, white: boolean): boolean => {
  const k = p.sq.indexOf(white ? 'K' : 'k');
  return k < 0 || attacked(p.sq, k, !white);
};

/** Langkah legal (raja sendiri tidak boleh berakhir dalam skak). */
export const legalMoves = (p: Position, white: boolean): Move[] =>
  generate(p, white).filter((m) => !inCheck(apply(p, m), white));

export function perft(p: Position, white: boolean, depth: number): number {
  if (depth === 0) return 1;
  return legalMoves(p, white).reduce((s, m) => s + perft(apply(p, m), !white, depth - 1), 0);
}

// ---------- bot ----------
/** Langkah bot (hitam secara bawaan, putih jika `botWhite`). Level 0 = Mudah, 1 = Sedang, 2 = Sulit (lihat search.ts). */
export { ELO_STEPS, eloName } from './search.js';

export function chooseBotMove(p: Position, level: number, botWhite = false, opts?: BotOpts): Move | null {
  return searchBest(p, botWhite, level, opts);
}

// ---------- status permainan ----------
/** Kunci posisi untuk menghitung pengulangan (en passant hanya jika bisa dimakan). */
export function positionKey(p: Position, whiteToMove: boolean): string {
  const ep = p.ep >= 0 && legalMoves(p, whiteToMove).some((m) => (p.sq[m[0]] as string).toLowerCase() === 'p' && m[1] === p.ep) ? p.ep : -1;
  return p.sq.map((x) => x || '.').join('') + (whiteToMove ? 'w' : 'b') + p.cr + ep;
}

export function insufficientMaterial(p: Position): boolean {
  const rest: Array<[string, number]> = [];
  p.sq.forEach((x, i) => { if (x && x.toLowerCase() !== 'k') rest.push([x.toLowerCase(), i]); });
  if (!rest.length) return true;
  if (rest.length === 1 && (rest[0]![0] === 'b' || rest[0]![0] === 'n')) return true;
  if (rest.every((x) => x[0] === 'b')) {
    const colors = rest.map((x) => ((x[1] >> 3) + (x[1] & 7)) % 2);
    return colors.every((v) => v === colors[0]);
  }
  return false;
}

/** Status setelah sebuah langkah. `repetitions` = berapa kali posisi ini muncul. */
export function gameStatus(p: Position, whiteToMove: boolean, repetitions: number): { check: boolean; end: string } {
  const check = inCheck(p, whiteToMove);
  if (legalMoves(p, whiteToMove).length) {
    const end = insufficientMaterial(p)
      ? 'Seri (materi tidak cukup)'
      : p.hm >= 100 ? 'Seri (aturan 50 langkah)'
      : repetitions >= 3 ? 'Seri (posisi berulang 3 kali)' : '';
    return { check, end };
  }
  return { check, end: check ? (whiteToMove ? 'Skakmat, komputer menang' : 'Skakmat, kamu menang!') : 'Seri (stalemat)' };
}

/** Baca FEN (untuk pengujian). */
export function parseFen(fen: string): { pos: Position; white: boolean } {
  const [placement = '', side = 'w', cr = '-', ep = '-', hm = '0'] = fen.split(' ');
  const sq: string[] = [];
  for (const ch of placement) {
    if (ch === '/') continue;
    if (/\d/.test(ch)) for (let i = 0; i < +ch; i++) sq.push('');
    else sq.push(ch);
  }
  return {
    pos: { sq, cr: cr === '-' ? '' : cr, ep: ep === '-' ? -1 : (8 - Number(ep[1])) * 8 + 'abcdefgh'.indexOf(ep[0] as string), hm: Number(hm) || 0 },
    white: side === 'w',
  };
}
