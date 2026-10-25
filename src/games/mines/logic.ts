/** Logika Ranjau (Minesweeper): papan n×n. Ranjau baru diletakkan SETELAH ketukan pertama, jadi ketukan pertama selalu aman. */
export interface Cfg { n: number; mines: number }
/** Mudah / Sedang / Sulit. */
export const LEVEL_CFG: readonly Cfg[] = [{ n: 8, mines: 10 }, { n: 10, mines: 18 }, { n: 12, mines: 30 }];

export interface Cell { mine: boolean; adj: number; open: boolean; flag: boolean }
export interface Opened { opened: number[]; boom: number }

/** Indeks tetangga (maks. 8) dari petak `i` pada papan n×n. */
export function neighbors(i: number, n: number): number[] {
  const r = Math.floor(i / n), c = i % n, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      const rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
  }
  return out;
}

export const emptyBoard = (n: number): Cell[] => Array.from({ length: n * n }, () => ({ mine: false, adj: 0, open: false, flag: false }));

/** Hitung ulang angka (jumlah ranjau tetangga) tiap petak. */
export function recount(cells: Cell[], n: number): void {
  cells.forEach((c, i) => { c.adj = neighbors(i, n).filter((j) => (cells[j] as Cell).mine).length; });
}

/** Letakkan `mines` ranjau acak. Petak `safe` beserta tetangganya dikosongkan (bila ruang cukup) supaya ketukan pertama membuka area. */
export function plant(cells: Cell[], n: number, mines: number, safe: number, rnd: () => number = Math.random): void {
  const ban = new Set([safe, ...neighbors(safe, n)]);
  const all = cells.map((_, i) => i);
  let pool = all.filter((i) => !ban.has(i));
  if (pool.length < mines) pool = all.filter((i) => i !== safe);
  for (let k = pool.length - 1; k > 0; k--) {
    const j = Math.floor(rnd() * (k + 1));
    [pool[k], pool[j]] = [pool[j] as number, pool[k] as number];
  }
  for (const i of pool.slice(0, mines)) (cells[i] as Cell).mine = true;
  recount(cells, n);
}

/** Buka petak `i`; angka 0 membuka area di sekitarnya. `boom` = indeks ranjau yang terinjak (-1 jika aman). Petak berbendera tidak ikut terbuka. */
export function reveal(cells: Cell[], n: number, i: number): Opened {
  const c = cells[i] as Cell;
  if (c.open || c.flag) return { opened: [], boom: -1 };
  if (c.mine) { c.open = true; return { opened: [i], boom: i }; }
  const opened: number[] = [], stack = [i];
  while (stack.length) {
    const k = stack.pop() as number, x = cells[k] as Cell;
    if (x.open || x.flag || x.mine) continue;
    x.open = true;
    opened.push(k);
    if (x.adj === 0) stack.push(...neighbors(k, n));
  }
  return { opened, boom: -1 };
}

/** Ketuk angka yang jumlah benderanya sudah sama dengan angkanya: buka semua tetangga yang belum berbendera (bendera salah = kena ranjau). */
export function chord(cells: Cell[], n: number, i: number): Opened {
  const c = cells[i] as Cell, none: Opened = { opened: [], boom: -1 };
  if (!c.open || c.adj === 0) return none;
  const nb = neighbors(i, n);
  if (nb.filter((j) => (cells[j] as Cell).flag).length !== c.adj) return none;
  const opened: number[] = [];
  let boom = -1;
  for (const j of nb) {
    const r = reveal(cells, n, j);
    opened.push(...r.opened);
    if (r.boom >= 0) boom = r.boom;
  }
  return { opened, boom };
}

/** Pasang/lepas bendera. Mengembalikan false bila petak sudah terbuka (tidak bisa diberi bendera). */
export function toggleFlag(c: Cell): boolean {
  if (c.open) return false;
  c.flag = !c.flag;
  return true;
}

export const flagsUsed = (cells: readonly Cell[]): number => cells.filter((c) => c.flag).length;

/** Menang = semua petak tanpa ranjau sudah terbuka. */
export const isWon = (cells: readonly Cell[]): boolean => cells.every((c) => c.mine || c.open);
