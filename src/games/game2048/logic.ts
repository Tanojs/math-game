import { R } from '../../core/rand.js';

/** 0 = kiri, 1 = kanan, 2 = atas, 3 = bawah */
export type Dir = 0 | 1 | 2 | 3;
export const SIZE = 4;

/** Geser & gabungkan satu baris ke kiri. `gain` = poin dari penggabungan. */
export function slideRow(row: readonly number[]): { row: number[]; gain: number } {
  const a = row.filter((x) => x);
  const out: number[] = [];
  let gain = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === a[i + 1]) {
      const v = (a[i] as number) * 2;
      out.push(v);
      gain += v;
      i++;
    } else out.push(a[i] as number);
  }
  while (out.length < SIZE) out.push(0);
  return { row: out, gain };
}

/** Indeks petak untuk garis `i` menurut arah (berurutan menuju sisi tujuan). */
export function lineIndexes(i: number, d: Dir): number[] {
  const ix = [0, 1, 2, 3].map((j) => (d < 2 ? i * SIZE + j : j * SIZE + i));
  return d % 2 ? ix.reverse() : ix;
}

export function moveBoard(board: readonly number[], d: Dir): { board: number[]; gain: number; moved: boolean } {
  const b = [...board];
  let gain = 0;
  for (let i = 0; i < SIZE; i++) {
    const ix = lineIndexes(i, d);
    const r = slideRow(ix.map((k) => b[k] as number));
    gain += r.gain;
    ix.forEach((k, j) => (b[k] = r.row[j] as number));
  }
  return { board: b, gain, moved: b.some((v, i) => v !== board[i]) };
}

export const canMove = (b: readonly number[]): boolean =>
  b.some((v, i) => !v || (i % SIZE < SIZE - 1 && v === b[i + 1]) || (i < SIZE * (SIZE - 1) && v === b[i + SIZE]));

/** Tambah ubin 2 (90%) atau 4 (10%) di petak kosong acak. */
export function addTile(b: number[]): void {
  const empty = b.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
  if (empty.length) b[empty[R(0, empty.length - 1)] as number] = Math.random() < 0.9 ? 2 : 4;
}

/** Ubin yang punya identitas tetap (supaya bisa dianimasikan geser per ubin). */
export interface Tile { id: number; v: number; i: number }

/**
 * Geser semua ubin menurut arah. `tiles` = posisi akhir ubin yang bertahan (yang menggabung sudah bernilai ganda),
 * `ghosts` = ubin yang tertelan penggabungan (meluncur ke petak tujuan lalu dihapus). Hasilnya selalu sama dengan `moveBoard`.
 */
export function moveTiles(tiles: readonly Tile[], d: Dir): { tiles: Tile[]; ghosts: Tile[]; merged: number[]; gain: number; moved: boolean } {
  const at = new Map(tiles.map((t) => [t.i, t]));
  const out: Tile[] = [], ghosts: Tile[] = [], merged: number[] = [];
  let gain = 0, moved = false;
  for (let line = 0; line < SIZE; line++) {
    const ix = lineIndexes(line, d);
    const seq = ix.map((k) => at.get(k)).filter((t): t is Tile => !!t);
    let j = 0;
    for (let k = 0; k < seq.length; k++, j++) {
      const a = seq[k] as Tile, b = seq[k + 1], dest = ix[j] as number;
      if (a.i !== dest) moved = true;
      if (b && b.v === a.v) {
        const v = a.v * 2;
        out.push({ id: a.id, v, i: dest });
        ghosts.push({ id: b.id, v: b.v, i: dest });
        merged.push(a.id);
        gain += v;
        moved = true;
        k++;
      } else out.push({ id: a.id, v: a.v, i: dest });
    }
  }
  return { tiles: out, ghosts, merged, gain, moved };
}
