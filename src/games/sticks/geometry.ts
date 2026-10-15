import { FIXED_BAR } from './logic.js';

const THICK = 22; // tebal batang
const GAP = 4; // celah antar batang

/** Poligon segi-enam untuk satu batang (horizontal/vertikal). */
function bar(cx: number, cy: number, length: number, vertical: boolean): string {
  const a = length / 2, b = THICK / 2;
  const pts = vertical
    ? [[0, -a], [b, -a + b], [b, a - b], [0, a], [-b, a - b], [-b, -a + b]]
    : [[-a, 0], [-a + b, -b], [a - b, -b], [a, 0], [a - b, b], [-a + b, b]];
  return pts.map((p) => `${cx + (p[0] as number)},${cy + (p[1] as number)}`).join(' ');
}

/** Tujuh segmen (a..g) sebuah angka dengan sudut kiri-atas (x, y). */
function digit(x: number, y: number): string[] {
  const b = THICK / 2, vl = x + b, vr = x + 110 - b, ht = y + b, hb = y + 200 - b, hm = y + 100;
  const lh = vr - vl - 2 * GAP, lv = hm - ht - 2 * GAP;
  return [
    bar(x + 55, ht, lh, false), bar(vr, (ht + hm) / 2, lv, true), bar(vr, (hm + hb) / 2, lv, true),
    bar(x + 55, hb, lh, false), bar(vl, (hm + hb) / 2, lv, true), bar(vl, (ht + hm) / 2, lv, true),
    bar(x + 55, hm, lh, false),
  ];
}

/** Titik poligon untuk 23 slot (indeks 21 = batang tetap, tidak ditampilkan sebagai slot). */
export const SLOT_POINTS: string[] = [...digit(40, 40), ...digit(250, 40), ...digit(250, 290), bar(200, 140, 80, false), bar(200, 140, 80, true)];

/** Batang tetap: dua batang "=" dan batang horizontal operator. */
export const FIXED_POINTS: string[] = [bar(190, 360, 80, false), bar(190, 420, 80, false), bar(200, 140, 80, false)];

export { FIXED_BAR };
