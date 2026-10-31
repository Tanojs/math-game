const GAP = 4; // celah antar batang

/** Poligon segi-enam untuk satu batang (horizontal/vertikal) dengan tebal `t`. */
function bar(cx: number, cy: number, length: number, vertical: boolean, t: number): string {
  const a = length / 2, b = t / 2;
  const pts = vertical
    ? [[0, -a], [b, -a + b], [b, a - b], [0, a], [-b, a - b], [-b, -a + b]]
    : [[-a, 0], [-a + b, -b], [a - b, -b], [a, 0], [a - b, b], [-a + b, b]];
  return pts.map((p) => `${cx + (p[0] as number)},${cy + (p[1] as number)}`).join(' ');
}

/** Tujuh segmen (a..g) satu digit dengan sudut kiri-atas (x, y), ukuran w x h, tebal t. */
function digit(x: number, y: number, w: number, h: number, t: number): string[] {
  const b = t / 2, vl = x + b, vr = x + w - b, ht = y + b, hb = y + h - b, hm = y + h / 2;
  const lh = vr - vl - 2 * GAP, lv = hm - ht - 2 * GAP;
  return [
    bar(x + w / 2, ht, lh, false, t), bar(vr, (ht + hm) / 2, lv, true, t), bar(vr, (hm + hb) / 2, lv, true, t),
    bar(x + w / 2, hb, lh, false, t), bar(vl, (hm + hb) / 2, lv, true, t), bar(vl, (ht + hm) / 2, lv, true, t),
    bar(x + w / 2, hm, lh, false, t),
  ];
}

export interface Layout {
  /** poligon per slot (indeks sesuai logic.ts); slot operator horizontal ikut di sini tetapi tidak dipindah */
  slots: string[];
  /** batang yang selalu tampil: dua batang "=" dan batang horizontal operator */
  fixed: string[];
  /** pusat operator & tebal batang, untuk tanda "−" (batang vertikal tidak ada) */
  cx: number;
  cy: number;
  t: number;
}

/** Tata letak: 1 digit per angka (Mudah) atau 2 digit per angka (Sedang/Sulit). Kanvas 400 x 520. */
export function layoutFor(n: 1 | 2): Layout {
  let blocks: Array<[number, number]>, w: number, h: number, t: number, cx: number, cy: number, len: number, eq: string[];
  if (n === 1) {
    blocks = [[40, 40], [250, 40], [250, 290]];
    w = 110; h = 200; t = 22; cx = 200; cy = 140; len = 80;
    eq = [bar(190, 360, 80, false, t), bar(190, 420, 80, false, t)];
  } else {
    // A = dua digit kiri-atas, B = dua digit kanan-atas, "=" di tengah, C = dua digit kanan-bawah
    blocks = [[4, 40], [96, 40], [220, 40], [312, 40], [220, 262], [312, 262]];
    w = 84; h = 142; t = 18; cx = 200; cy = 111; len = 30;
    eq = [bar(200, 208, 30, false, t), bar(200, 236, 30, false, t)];
  }
  const opH = bar(cx, cy, len, false, t), opV = bar(cx, cy, len, true, t);
  const slots = blocks.flatMap(([x, y]) => digit(x, y, w, h, t));
  slots.push(opH, opV);
  return { slots, fixed: [...eq, opH], cx, cy, t };
}
