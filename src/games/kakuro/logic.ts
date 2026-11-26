import { shuf } from '../../core/rand.js';

/** Sisi area putih per level (di luar baris & kolom petunjuk). */
export const WHITE = [4, 6, 8] as const;
/** Peluang petak hitam di dalam area per level. */
const BLACK_P = [0.14, 0.2, 0.24] as const;

/**
 * Teka-teki Kakuro: papan n×n. Baris 0 dan kolom 0 selalu hitam (tempat petunjuk).
 * `across[i]` / `down[i]` = jumlah deret mendatar / menurun yang dimulai tepat di kanan / bawah petak hitam i (0 = tidak ada).
 * `ans` = isian asli (0 untuk petak hitam) — dipakai saat membuat soal, bukan untuk memeriksa jawaban pemain.
 */
export interface Kakuro {
  n: number;
  black: boolean[];
  across: number[];
  down: number[];
  ans: number[];
}

export interface Run { cells: number[]; sum: number }

/** Petak putih berurutan dari `s` (exclusive) ke arah (dr, dc) sampai bertemu hitam / tepi. */
function walk(n: number, black: boolean[], s: number, dr: number, dc: number): number[] {
  const out: number[] = [];
  let r = Math.floor(s / n) + dr, c = (s % n) + dc;
  while (r < n && c < n && !black[r * n + c]) {
    out.push(r * n + c);
    r += dr;
    c += dc;
  }
  return out;
}

/** Pola petak hitam acak. Setiap petak putih wajib punya deret mendatar & menurun minimal 2 petak. */
function pattern(n: number, p: number): boolean[] {
  const b = Array.from({ length: n * n }, (_, i) => {
    const r = Math.floor(i / n), c = i % n;
    return r === 0 || c === 0 || Math.random() < p;
  });
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < n * n; i++) {
      if (b[i]) continue;
      const left = leftCount(n, b, i), right = walk(n, b, i, 0, 1).length;
      const up = upCount(n, b, i), down = walk(n, b, i, 1, 0).length;
      if (left + right + 1 < 2 || up + down + 1 < 2) {
        b[i] = true;
        changed = true;
      }
    }
  }
  return b;
}

/** Jumlah petak putih ke kiri dari `i` sampai bertemu hitam. */
function leftCount(n: number, b: boolean[], i: number): number {
  let k = 0;
  for (let c = (i % n) - 1; c >= 0 && !b[Math.floor(i / n) * n + c]; c--) k++;
  return k;
}

/** Jumlah petak putih ke atas dari `i` sampai bertemu hitam. */
function upCount(n: number, b: boolean[], i: number): number {
  let k = 0;
  for (let r = Math.floor(i / n) - 1; r >= 0 && !b[r * n + (i % n)]; r--) k++;
  return k;
}

/** Isi petak putih dengan angka 1..9 sehingga tiap deret tidak berulang (backtracking, dengan batas langkah). */
function fill(n: number, black: boolean[]): number[] | null {
  const ans = new Array<number>(n * n).fill(0);
  const cells: number[] = [];
  for (let i = 0; i < n * n; i++) if (!black[i]) cells.push(i);
  let budget = 20000;

  const ok = (i: number, x: number): boolean => {
    const r = Math.floor(i / n), c = i % n;
    for (let j = c - 1; j >= 0 && !black[r * n + j]; j--) if (ans[r * n + j] === x) return false;
    for (let j = r - 1; j >= 0 && !black[j * n + c]; j--) if (ans[j * n + c] === x) return false;
    return true;
  };

  const go = (k: number): boolean => {
    if (k === cells.length) return true;
    if (--budget < 0) return false;
    const i = cells[k] as number;
    for (const x of shuf([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (!ok(i, x)) continue;
      ans[i] = x;
      if (go(k + 1)) return true;
      ans[i] = 0;
    }
    return false;
  };
  return go(0) ? ans : null;
}

/** Hitung petunjuk dari isian dan kembalikan teka-tekinya. */
function withClues(n: number, black: boolean[], ans: number[]): Kakuro {
  const across = new Array<number>(n * n).fill(0);
  const down = new Array<number>(n * n).fill(0);
  const sumOf = (cells: number[]): number => cells.reduce((s, j) => s + (ans[j] as number), 0);
  black.forEach((b, i) => {
    if (!b) return;
    const a = walk(n, black, i, 0, 1), d = walk(n, black, i, 1, 0);
    if (a.length) across[i] = sumOf(a);
    if (d.length) down[i] = sumOf(d);
  });
  return { n, black, across, down, ans };
}

/** Buat teka-teki baru untuk level 0..2. */
export function generate(level: number): Kakuro {
  const n = (WHITE[level] ?? WHITE[1]) + 1;
  const p = BLACK_P[level] ?? BLACK_P[1];
  for (;;) {
    const black = pattern(n, p);
    if (!black.some((b) => !b)) continue;
    const ans = fill(n, black);
    if (ans) return withClues(n, black, ans);
  }
}

/** Semua deret (mendatar dan menurun) beserta jumlah targetnya. */
export function runs(p: Kakuro): Run[] {
  const out: Run[] = [];
  p.black.forEach((b, i) => {
    if (!b) return;
    if (p.across[i]) out.push({ cells: walk(p.n, p.black, i, 0, 1), sum: p.across[i] as number });
    if (p.down[i]) out.push({ cells: walk(p.n, p.black, i, 1, 0), sum: p.down[i] as number });
  });
  return out;
}

/** Deret tidak sah: angka ganda, jumlah melebihi target, atau deret penuh yang jumlahnya salah. */
const runBad = (run: Run, v: number[]): boolean => {
  const vals = run.cells.map((j) => v[j] as number).filter((x) => x > 0);
  if (new Set(vals).size !== vals.length) return true;
  const sum = vals.reduce((s, x) => s + x, 0);
  if (sum > run.sum) return true;
  return vals.length === run.cells.length && sum !== run.sum;
};

/** Petak putih yang ikut dalam deret yang salah (untuk ditandai merah). */
export function badCells(p: Kakuro, v: number[]): Set<number> {
  const bad = new Set<number>();
  for (const run of runs(p)) if (runBad(run, v)) run.cells.forEach((j) => bad.add(j));
  return bad;
}

/** Semua petak yang berada satu deret dengan petak `i` (untuk menyorot deret yang dipilih). */
export function groupOf(p: Kakuro, i: number): number[] {
  const out = new Set<number>();
  for (const run of runs(p)) if (run.cells.includes(i)) run.cells.forEach((j) => out.add(j));
  return [...out];
}

/** Teka-teki selesai bila semua petak putih terisi dan setiap deret benar. Jawaban lain yang juga memenuhi aturan tetap diterima. */
export function isComplete(p: Kakuro, v: number[]): boolean {
  const whites = p.black.flatMap((b, i) => (b ? [] : [i]));
  if (whites.some((i) => !v[i])) return false;
  return runs(p).every((run) => !runBad(run, v));
}
