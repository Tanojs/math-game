import { R } from '../../core/rand.js';

export type Cell = '' | 'X' | 'O';
export interface Win { w: 'X' | 'O' | '-'; l: number[] }

/** Panjang garis kemenangan: 3 di papan 3x3, 4 di papan 4x4 dan 5x5. */
export const winLength = (n: number): number => (n === 3 ? 3 : 4);

const cache = new Map<number, number[][]>();

/** Semua garis kemenangan (baris, kolom, diagonal) untuk papan n x n. */
export function buildLines(n: number): number[][] {
  const hit = cache.get(n);
  if (hit) return hit;
  const w = winLength(n);
  const lines: number[][] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++)
      for (const [dr, dc] of [[0, 1], [1, 0], [1, 1], [1, -1]] as const) {
        const er = r + dr * (w - 1), ec = c + dc * (w - 1);
        if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
        lines.push(Array.from({ length: w }, (_, i) => (r + dr * i) * n + c + dc * i));
      }
  cache.set(n, lines);
  return lines;
}

/** Pemenang, seri ('-'), atau null jika permainan masih berjalan. */
export function checkWin(b: readonly Cell[], lines: number[][]): Win | null {
  for (const l of lines) {
    const v = b[l[0] as number];
    if (v && l.every((i) => b[i] === v)) return { w: v, l };
  }
  return b.includes('') ? null : { w: '-', l: [] };
}

/** Minimax penuh (khusus 3x3). Nilai: +1 menang O, -1 menang X. */
function minimax(b: Cell[], p: 'X' | 'O', lines: number[][]): number {
  const r = checkWin(b, lines);
  if (r) return r.w === 'O' ? 1 : r.w === 'X' ? -1 : 0;
  let v = p === 'O' ? -2 : 2;
  for (let i = 0; i < b.length; i++) {
    if (b[i]) continue;
    b[i] = p;
    const x = minimax(b, p === 'O' ? 'X' : 'O', lines);
    b[i] = '';
    v = p === 'O' ? Math.max(v, x) : Math.min(v, x);
  }
  return v;
}

/** Skor heuristik untuk O: peluang garis O dikurangi peluang garis X. */
function evaluate(b: readonly Cell[], lines: number[][]): number {
  let s = 0;
  for (const l of lines) {
    let a = 0, o = 0;
    for (const i of l) {
      if (b[i] === 'O') a++;
      else if (b[i] === 'X') o++;
    }
    if (a && o) continue;
    if (a) s += 10 ** a;
    else if (o) s -= 10 ** o * 1.2;
  }
  return s;
}

/** Peluang bot asal-asalan per level (Mudah, Sedang, Sulit). */
export const RANDOMNESS = [0.75, 0.3, 0] as const;

/** Pilih petak untuk 'O'. Mengembalikan -1 jika papan penuh. */
export function chooseBotMove(board: readonly Cell[], n: number, level: number): number {
  const b = [...board];
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (!empty.length) return -1;
  if (Math.random() < (RANDOMNESS[level] ?? 0)) return empty[R(0, empty.length - 1)] as number;
  const lines = buildLines(n);

  if (n === 3) {
    let bi = -1, bv = -2;
    for (const i of empty) {
      b[i] = 'O';
      const v = minimax(b, 'X', lines) + Math.random() * 0.1;
      b[i] = '';
      if (v > bv) { bv = v; bi = i; }
    }
    return bi;
  }

  const near = (i: number): boolean => {
    const r = Math.floor(i / n), c = i % n;
    for (let a = -1; a < 2; a++)
      for (let e = -1; e < 2; e++) {
        const rr = r + a, cc = c + e;
        if (rr >= 0 && rr < n && cc >= 0 && cc < n && b[rr * n + cc]) return true;
      }
    return false;
  };
  const near0 = empty.filter(near);
  const cands = near0.length ? near0 : empty;
  let bi = cands[0] as number, bv = -1e18;
  for (const i of cands) {
    b[i] = 'O';
    let v: number;
    const r = checkWin(b, lines);
    if (r && r.w === 'O') v = 1e12;
    else {
      v = 1e18;
      for (const j of empty) {
        if (j === i) continue;
        b[j] = 'X';
        const r2 = checkWin(b, lines);
        const x = r2 && r2.w === 'X' ? -1e11 : evaluate(b, lines);
        b[j] = '';
        if (x < v) v = x;
      }
      if (v === 1e18) v = evaluate(b, lines);
    }
    b[i] = '';
    v += Math.random();
    if (v > bv) { bv = v; bi = i; }
  }
  return bi;
}
