import { getRecord } from './records.js';

export interface LevelInfo { name: string; desc: string; sample: string }

/** Rekor tertinggi dari semua level game ini (ditampilkan di bar atas). */
export function topRecord(id: string, count: number): number {
  let top = 0;
  for (let i = 0; i < count; i++) top = Math.max(top, getRecord(id + i));
  return top;
}

/** Kartu pilih level: nama, skor terbaik, aturan singkat, contoh soal, dan tombol Mulai. Kunci rekor = id game + indeks level. */
export function levelCards(id: string, levels: readonly LevelInfo[], intro: string): string {
  const cards = levels.map((l, i) => {
    const r = getRecord(id + i);
    return '<div class=lvc>' +
      `<span class=lvn>${l.name}</span>` +
      `<span class=lvd>${l.desc}</span>` +
      `<span class=lvr>Terbaik<b>${r || '–'}</b></span>` +
      `<span class=lvs>${l.sample}</span>` +
      `<button class=lvgo data-m=${i}>Mulai</button>` +
      '</div>';
  }).join('');
  return `<p class=lvi>${intro}</p><div class="modes lvcs">${cards}</div>`;
}
