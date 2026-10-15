import { R } from '../../core/rand.js';
import type { Level } from '../../core/html.js';
import { BANK } from './bank.js';

/** Papan 6x6. Balok merah (id 0) mendatar di baris 2 dan harus keluar lewat kanan. */
export const N = 6;
export const EXIT_ROW = 2;

export interface Block { id: number; r: number; c: number; len: number; horiz: boolean }
/** Posisi tiap balok sepanjang sumbunya (kolom untuk mendatar, baris untuk menurun). */
export type Pos = number[];

/** Rentang jumlah langkah minimum per level. */
export const RANGE: ReadonlyArray<readonly [number, number]> = [[4, 8], [9, 13], [14, 99]];

export const startPos = (blocks: readonly Block[]): Pos => blocks.map((b) => (b.horiz ? b.c : b.r));

/** Papan hunian: id balok + 1 per petak (0 = kosong). */
export function occupancy(blocks: readonly Block[], pos: Pos): number[] {
  const g = Array<number>(N * N).fill(0);
  blocks.forEach((b, i) => {
    for (let k = 0; k < b.len; k++) {
      const r = b.horiz ? b.r : (pos[i] as number) + k, c = b.horiz ? (pos[i] as number) + k : b.c;
      g[r * N + c] = i + 1;
    }
  });
  return g;
}

/** Rentang posisi [min, max] yang bisa dicapai balok `i` dengan menggeser (balok lain diam). */
export function slideRange(blocks: readonly Block[], pos: Pos, i: number): [number, number] {
  const g = occupancy(blocks, pos), b = blocks[i] as Block, p = pos[i] as number;
  const at = (q: number): number => (b.horiz ? g[b.r * N + q] : g[q * N + b.c]) as number;
  let lo = p, hi = p;
  while (lo > 0 && at(lo - 1) === 0) lo--;
  while (hi + b.len < N && at(hi + b.len) === 0) hi++;
  return [lo, hi];
}

/** Semua langkah (geser berapa petak pun = 1 langkah). */
export function moves(blocks: readonly Block[], pos: Pos): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  blocks.forEach((_, i) => {
    const [lo, hi] = slideRange(blocks, pos, i);
    for (let q = lo; q <= hi; q++) if (q !== pos[i]) out.push([i, q]);
  });
  return out;
}

export const isSolved = (pos: Pos): boolean => pos[0] === N - 2;

/** Jarak (langkah minimum) dari tiap keadaan ke keadaan selesai terdekat, untuk satu komponen terhubung. */
export function distances(blocks: readonly Block[], start: Pos, cap: number): Map<string, { pos: Pos; d: number }> | null {
  const key = (p: Pos): string => p.join('');
  const all = new Map<string, Pos>();
  const queue: Pos[] = [start];
  all.set(key(start), start);
  for (let h = 0; h < queue.length; h++) {
    for (const [i, q] of moves(blocks, queue[h] as Pos)) {
      const np = [...(queue[h] as Pos)];
      np[i] = q;
      const k = key(np);
      if (!all.has(k)) {
        if (all.size >= cap) return null;
        all.set(k, np);
        queue.push(np);
      }
    }
  }
  const dist = new Map<string, { pos: Pos; d: number }>();
  const q2: Pos[] = [];
  for (const [k, p] of all) if (isSolved(p)) { dist.set(k, { pos: p, d: 0 }); q2.push(p); }
  for (let h = 0; h < q2.length; h++) {
    const cur = q2[h] as Pos, d = (dist.get(key(cur)) as { d: number }).d;
    for (const [i, q] of moves(blocks, cur)) {
      const np = [...cur];
      np[i] = q;
      const k = key(np);
      if (!dist.has(k)) { dist.set(k, { pos: np, d: d + 1 }); q2.push(np); }
    }
  }
  return dist;
}

/** Jumlah langkah minimum menyelesaikan keadaan `pos` (null jika mustahil). */
export function minMoves(blocks: readonly Block[], pos: Pos): number | null {
  const d = distances(blocks, pos, 200000);
  return d?.get(pos.join(''))?.d ?? null;
}

/** Jalur langkah minimum [id, posisi baru] dari `pos` sampai selesai (untuk uji/bantuan). */
export function solvePath(blocks: readonly Block[], pos: Pos): Array<[number, number]> | null {
  const dist = distances(blocks, pos, 200000);
  if (!dist) return null;
  let cur = pos, d = dist.get(cur.join(''))?.d;
  if (d === undefined) return null;
  const path: Array<[number, number]> = [];
  while (d > 0) {
    let next: [number, number] | null = null;
    for (const [i, q] of moves(blocks, cur)) {
      const np = [...cur];
      np[i] = q;
      if ((dist.get(np.join(''))?.d ?? Infinity) === d - 1) { next = [i, q]; break; }
    }
    if (!next) return null;
    path.push(next);
    cur = [...cur];
    cur[next[0]] = next[1];
    d--;
  }
  return path;
}

export interface BlocksPuzzle { blocks: Block[]; pos: Pos; min: number }

/** Ubah satu entri bank menjadi soal. */
export function decodePuzzle(entry: readonly [number, string, string]): BlocksPuzzle {
  const [min, layout, p] = entry;
  const blocks: Block[] = [{ id: 0, r: EXIT_ROW, c: N - 2, len: 2, horiz: true }];
  for (let i = 0; i < layout.length; i += 4)
    blocks.push({ id: blocks.length, r: Number(layout[i]), c: Number(layout[i + 1]), len: Number(layout[i + 2]), horiz: layout[i + 3] === '1' });
  return { blocks, pos: [...p].map(Number), min };
}

/** Soal acak dari bank untuk level tersebut (langkah minimum sudah terverifikasi). */
export function pickPuzzle(level: Level, avoid?: string): BlocksPuzzle {
  const list = BANK[level] as ReadonlyArray<readonly [number, string, string]>;
  let entry = list[R(0, list.length - 1)] as readonly [number, string, string];
  for (let i = 0; i < 5 && avoid && entry[1] + entry[2] === avoid; i++) entry = list[R(0, list.length - 1)] as typeof entry;
  return decodePuzzle(entry);
}
