import type { Level } from '../../core/html.js';

/** Cermin: sisi kiri = contoh (kotak berisi / titik kosong), sisi kanan harus menjadi bayangan cerminnya. */
export const SIZES: readonly number[] = [3, 4, 5];

export interface MirrorPuzzle {
  size: number;
  /** Sisi kiri, per baris dari kiri ke kanan (true = kotak, false = titik/kosong). */
  target: boolean[];
}

/** Petak kanan (baris r, kolom j dari sumbu) berpasangan dengan petak kiri di kolom size-1-j. */
export const mirrorOf = (size: number, i: number): number => {
  const r = Math.floor(i / size), j = i % size;
  return r * size + (size - 1 - j);
};

export interface Check { wrong: number[]; missing: number; solved: boolean }

/** `right` = isi sisi kanan. Salah = blok di tempat yang di cermin kosong; kurang = kotak cermin belum terisi. */
export function check(p: MirrorPuzzle, right: readonly boolean[]): Check {
  const wrong: number[] = [];
  let missing = 0;
  right.forEach((filled, i) => {
    const want = p.target[mirrorOf(p.size, i)] as boolean;
    if (filled && !want) wrong.push(i);
    if (!filled && want) missing++;
  });
  return { wrong, missing, solved: !wrong.length && !missing };
}

export function makePuzzle(level: Level, rnd: () => number = Math.random): MirrorPuzzle {
  const size = SIZES[level] as number, n = size * size;
  const lo = Math.max(3, Math.round(n * 0.3)), hi = Math.round(n * 0.6);
  let target: boolean[], count: number;
  do {
    target = Array.from({ length: n }, () => rnd() < 0.45);
    count = target.filter(Boolean).length;
  } while (count < lo || count > hi);
  return { size, target };
}
