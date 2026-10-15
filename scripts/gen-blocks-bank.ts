/**
 * Membuat ulang bank soal Geser Balok (src/games/blocks/bank.ts).
 * Cara kerja: acak susunan balok yang padat, telusuri SEMUA keadaan yang bisa dicapai (BFS), hitung langkah
 * minimum tiap keadaan sampai balok merah bisa keluar, lalu simpan beberapa soal per level.
 *
 *   npm run gen:blocks            # mencari selama 120 detik
 *   npm run gen:blocks -- 600     # mencari selama 600 detik (hasil Sulit lebih banyak)
 *
 * Soal Sulit jarang ditemukan, jadi makin lama mencari makin banyak pilihan.
 */
import { writeFileSync } from 'node:fs';
import { R } from '../src/core/rand.js';
import { distances, EXIT_ROW, N, RANGE, startPos, type Block } from '../src/games/blocks/logic.js';

const seconds = Number(process.argv[2] ?? 120);
const QUOTA: Array<Record<number, number> | null> = [{ 4: 8, 5: 8, 6: 8, 7: 8, 8: 8 }, { 9: 10, 10: 10, 11: 8, 12: 8, 13: 5 }, null];

function denseLayout(): Block[] {
  const blocks: Block[] = [{ id: 0, r: EXIT_ROW, c: N - 2, len: 2, horiz: true }];
  const used = Array<boolean>(N * N).fill(false);
  used[EXIT_ROW * N + N - 2] = used[EXIT_ROW * N + N - 1] = true;
  for (let t = 0; t < 400; t++) {
    const horiz = Math.random() < 0.5, len = Math.random() < 0.7 ? 2 : 3;
    const r = R(0, horiz ? N - 1 : N - len), c = R(0, horiz ? N - len : N - 1);
    const cells = Array.from({ length: len }, (_, k) => (horiz ? r * N + c + k : (r + k) * N + c));
    if (cells.some((x) => used[x])) continue;
    cells.forEach((x) => (used[x] = true));
    blocks.push({ id: blocks.length, r, c, len, horiz });
  }
  return blocks;
}

const found = new Map<string, { level: number; min: number; layout: string; pos: string }>();
const t0 = Date.now();
let layouts = 0;
while (Date.now() - t0 < seconds * 1000) {
  const blocks = denseLayout();
  if (blocks.length < 9) continue;
  layouts++;
  const dist = distances(blocks, startPos(blocks), 30000);
  if (!dist) continue;
  const states = [...dist.values()].filter((v) => v.d > 0);
  const layout = blocks.slice(1).map((b) => `${b.r}${b.c}${b.len}${b.horiz ? 1 : 0}`).join('');
  RANGE.forEach(([lo, hi], level) => {
    const cands = states.filter((v) => v.d >= lo && v.d <= hi);
    if (!cands.length) return;
    const pick = cands[R(0, cands.length - 1)]!;
    found.set(`${layout}|${pick.pos.join('')}`, { level, min: pick.d, layout, pos: pick.pos.join('') });
  });
}

const bank = [0, 1, 2].map((level) => {
  const byMin = new Map<number, typeof found extends Map<string, infer V> ? V[] : never>();
  for (const f of found.values()) if (f.level === level) byMin.set(f.min, [...(byMin.get(f.min) ?? []), f]);
  const out: Array<{ min: number; layout: string; pos: string }> = [];
  for (const min of [...byMin.keys()].sort((a, b) => a - b)) {
    const quota = QUOTA[level]?.[min] ?? 99;
    out.push(...[...(byMin.get(min) as Array<{ min: number; layout: string; pos: string }>)].sort(() => Math.random() - 0.5).slice(0, quota));
  }
  return out;
});

const lines = bank.map((list) => '  [\n' + list.map((o) => `    [${o.min}, '${o.layout}', '${o.pos}'],\n`).join('') + '  ],\n').join('');
writeFileSync(
  new URL('../src/games/blocks/bank.ts', import.meta.url),
  `/**
 * Bank soal Geser Balok (dibuat oleh \`npm run gen:blocks\`, lalu diverifikasi oleh tes).
 * Tiap soal: [langkah minimum, balok selain merah, posisi semua balok].
 * Balok = 4 karakter: baris, kolom, panjang, mendatar(1)/menurun(0). Posisi = posisi tiap balok pada sumbunya (balok merah di awal).
 */
export const BANK: ReadonlyArray<ReadonlyArray<readonly [number, string, string]>> = [
${lines}];
`,
);
console.log(`Selesai: ${layouts} susunan diperiksa. Soal per level: ${bank.map((b) => b.length).join(' / ')}`);
