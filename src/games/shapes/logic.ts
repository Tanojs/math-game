/**
 * Logika "Isi Bentuk": papan tidak beraturan harus dibagi habis menjadi area-area yang bentuknya
 * salah satu dari "bank bentuk" (boleh diputar/dicerminkan). Soal dibuat dengan memasang bentuk-bentuk
 * bank satu per satu sehingga hasilnya PASTI bisa diselesaikan.
 */
export type Pt = readonly [number, number]; // [baris, kolom]
export type Shape = readonly Pt[];

/** Pustaka bentuk (polyomino). */
export const LIB: Readonly<Record<string, Shape>> = {
  I3: [[0, 0], [1, 0], [2, 0]],
  L3: [[0, 0], [1, 0], [1, 1]],
  O4: [[0, 0], [0, 1], [1, 0], [1, 1]],
  T4: [[0, 0], [0, 1], [0, 2], [1, 1]],
  L4: [[0, 0], [1, 0], [2, 0], [2, 1]],
  S4: [[0, 1], [0, 2], [1, 0], [1, 1]],
  I4: [[0, 0], [1, 0], [2, 0], [3, 0]],
  PLUS: [[0, 1], [1, 0], [1, 1], [1, 2], [2, 1]],
  P5: [[0, 0], [0, 1], [1, 0], [1, 1], [2, 0]],
  T5: [[0, 0], [0, 1], [0, 2], [1, 1], [2, 1]],
  U5: [[0, 0], [0, 2], [1, 0], [1, 1], [1, 2]],
  L5: [[0, 0], [1, 0], [2, 0], [3, 0], [3, 1]],
};

export interface LevelCfg { rows: number; cols: number; nShapes: number; pool: readonly string[]; pieces: number }
/** Mudah / Sedang / Sulit. */
export const LEVEL_CFG: readonly LevelCfg[] = [
  { rows: 5, cols: 5, nShapes: 1, pool: ['L3', 'T4', 'O4', 'L4', 'S4'], pieces: 4 },
  { rows: 6, cols: 6, nShapes: 2, pool: ['T4', 'L4', 'S4', 'O4', 'P5', 'PLUS', 'T5', 'L5'], pieces: 6 },
  { rows: 6, cols: 8, nShapes: 3, pool: ['I3', 'L3', 'O4', 'T4', 'L4', 'S4', 'PLUS', 'P5', 'T5', 'U5'], pieces: 8 },
];

export interface Puzzle {
  rows: number;
  cols: number;
  /** true = petak itu bagian papan. */
  cells: boolean[];
  /** Bank bentuk (sudah dinormalkan). */
  bank: Pt[][];
  /** Kunci kanonik tiap bentuk bank (sama untuk semua rotasi/cermin). */
  keys: string[];
  /** Kunci jawaban: nomor potongan per petak (-1 = bukan papan) dan bentuk bank tiap potongan. */
  owner: number[];
  pieceShape: number[];
}

const rot = ([r, c]: Pt): Pt => [c, -r];
const mir = ([r, c]: Pt): Pt => [r, -c];

/** Geser ke pojok (0,0) dan urutkan. */
export function normalize(s: Shape): Pt[] {
  const mr = Math.min(...s.map((p) => p[0])), mc = Math.min(...s.map((p) => p[1]));
  return s.map(([r, c]): Pt => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}
const keyOf = (s: Shape): string => normalize(s).map((p) => p.join(',')).join(';');

/** Semua orientasi unik (rotasi + cermin), masing-masing sudah dinormalkan. */
export function variants(s: Shape): Pt[][] {
  const out = new Map<string, Pt[]>();
  let cur: Shape = s;
  for (let m = 0; m < 2; m++) {
    for (let k = 0; k < 4; k++) {
      const n = normalize(cur);
      out.set(keyOf(n), n);
      cur = cur.map(rot);
    }
    cur = cur.map(mir);
  }
  return [...out.values()];
}

/** Kunci yang sama untuk semua orientasi sebuah bentuk. */
export const canon = (s: Shape): string => variants(s).map(keyOf).sort()[0] as string;

/** Indeks bentuk bank yang cocok dengan kumpulan petak `cells` (indeks linear), atau -1. */
export function matchShape(cells: readonly number[], cols: number, keys: readonly string[]): number {
  return keys.indexOf(canon(cells.map((i): Pt => [Math.floor(i / cols), i % cols])));
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

/** Buat soal: pasang `pieces` potongan (tiap bentuk bank dipakai minimal sekali), tiap potongan menempel pada yang sudah ada. */
export function generate(cfg: LevelCfg, rnd: () => number = Math.random): Puzzle {
  const { rows, cols } = cfg;
  for (let pieces = cfg.pieces; pieces >= Math.max(2, cfg.nShapes); pieces--) {
    for (let attempt = 0; attempt < 120; attempt++) {
      const names = shuffle([...cfg.pool], rnd).slice(0, cfg.nShapes);
      const bank = names.map((n) => normalize(LIB[n] as Shape));
      const keys = bank.map(canon);
      const owner = new Array<number>(rows * cols).fill(-1);
      const pieceShape: number[] = [];
      let ok = true;
      for (let p = 0; p < pieces && ok; p++) {
        const si = p < bank.length ? p : Math.floor(rnd() * bank.length);
        const opts: number[][] = [];
        for (const v of variants(bank[si] as Shape)) {
          for (let r0 = 0; r0 < rows; r0++) {
            for (let c0 = 0; c0 < cols; c0++) {
              const cells: number[] = [];
              let fit = true;
              for (const [r, c] of v) {
                const rr = r0 + r, cc = c0 + c;
                if (rr >= rows || cc >= cols || owner[rr * cols + cc] !== -1) { fit = false; break; }
                cells.push(rr * cols + cc);
              }
              if (!fit) continue;
              if (p > 0 && !cells.some((i) => touches(owner, i, rows, cols))) continue;
              opts.push(cells);
            }
          }
        }
        if (!opts.length) { ok = false; break; }
        const cells = opts[Math.floor(rnd() * opts.length)] as number[];
        for (const i of cells) owner[i] = p;
        pieceShape.push(si);
      }
      if (ok) return { rows, cols, cells: owner.map((o) => o >= 0), bank, keys, owner, pieceShape };
    }
  }
  throw new Error('Gagal membuat soal Isi Bentuk');
}

/** Apakah petak `i` bertetangga (atas/bawah/kiri/kanan) dengan petak yang sudah terisi? */
function touches(owner: readonly number[], i: number, rows: number, cols: number): boolean {
  const r = Math.floor(i / cols), c = i % cols;
  return (r > 0 && owner[i - cols] !== -1) || (r < rows - 1 && owner[i + cols] !== -1) || (c > 0 && owner[i - 1] !== -1) || (c < cols - 1 && owner[i + 1] !== -1);
}

/** Selesai = setiap petak papan sudah masuk sebuah area. */
export const isDone = (cells: readonly boolean[], lock: readonly number[]): boolean => cells.every((on, i) => !on || (lock[i] as number) >= 0);
