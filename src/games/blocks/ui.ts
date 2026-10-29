import { hit } from '../../core/dom.js';
import { resultBanner } from '../../core/banner.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { isSolved, N, pickPuzzle, slideRange, type BlocksPuzzle, type Pos } from './logic.js';
import { sfx } from '../../core/sfx.js';

let level: Level = 0;
const COLORS = ['--c', '--g', '--o', '--v', '--k', '--y'];

export const mountBlocks: Mount = (id, el, info) => {
  let puzzle: BlocksPuzzle;
  let pos: Pos = [];
  let moves = 0, solved = 0, msg = '';
  let done = false, lastKey = '';
  const rb = resultBanner();
  let drag: { i: number; x: number; y: number; start: number; lo: number; hi: number; real: number; cell: number; now: number } | null = null;

  const percent = (v: number): string => `${(v / N) * 100}%`;
  const place = (i: number, p: number, animate = true): void => {
    const b = puzzle.blocks[i]!, e = document.querySelector<HTMLElement>(`.blk[data-i="${i}"]`);
    if (!e) return;
    e.classList.toggle('drag', !animate);
    if (b.horiz) e.style.left = percent(p); else e.style.top = percent(p);
    e.dataset[b.horiz ? 'c' : 'r'] = String(Math.round(p));
  };

  const draw = (): void => {
    info('Langkah ' + moves);
    const blocks = puzzle.blocks.map((b, i) => {
      const p = pos[i] as number, r = b.horiz ? b.r : p, c = b.horiz ? p : b.c;
      const gone = i === 0 && done; // balok merah sudah keluar: tetap di luar papan, tidak balik lagi
      const w = b.horiz ? b.len : 1, h = b.horiz ? 1 : b.len;
      const color = i === 0 ? '--r' : (COLORS[(i - 1) % COLORS.length] as string);
      return `<div class="blk${i === 0 ? ' red' : ''}${gone ? ' gone' : ''}" data-i=${i} data-r=${r} data-c=${c} data-len=${b.len} data-h=${b.horiz ? 1 : 0} ` +
        `style="left:${percent(gone ? N : c)};top:${percent(r)};width:${percent(w)};height:${percent(h)};--bc:var(${color})"></div>`;
    }).join('');
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class=bkb id=bkb><div class=exit></div>${blocks}</div><div class=msg>${msg}</div>` +
      '<div class=rr><button class="cta alt" id=rs>Ulangi</button>' + (done ? '<button class=cta id=nx>Soal berikutnya</button>' : '<button class="cta alt" id=nw>Soal baru</button>') + '</div>';
    if (done) rb.show(el.querySelector<HTMLElement>('#bkb'), `Selesai! ${moves} langkah`, 'win', newPuzzle, { silent: true });
  };

  const newPuzzle = (): void => {
    rb.reset();
    puzzle = pickPuzzle(level, lastKey);
    lastKey = puzzle.pos.join('') + puzzle.blocks.length;
    pos = [...puzzle.pos];
    moves = 0; msg = ''; done = false;
    draw();
  };

  const finish = (): void => {
    sfx('win');
    done = true;
    solved++;
    best(id + level, solved);
    msg = `Selesai! ${moves} langkah (terbaik ${puzzle.min})`;
    info('Langkah ' + moves);
    const m = el.querySelector('.msg');
    if (m) m.textContent = msg;
    const red = document.querySelector<HTMLElement>('.blk.red');
    if (red) { red.classList.remove('drag'); red.classList.add('leave'); red.style.left = percent(N); }
    window.setTimeout(() => { if (done && el.isConnected) draw(); }, 480);
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; solved = 0; return newPuzzle(); }
    if (hit(e, '#nx') || hit(e, '#nw')) return newPuzzle();
    if (hit(e, '#rs')) { pos = [...puzzle.pos]; moves = 0; msg = ''; done = false; rb.reset(); draw(); }
  };

  el.onpointerdown = (e) => {
    const b = hit(e, '.blk');
    if (!b || done) return;
    const i = Number(b.dataset.i), bd = document.getElementById('bkb') as HTMLElement;
    const [lo, real] = slideRange(puzzle.blocks, pos, i);
    const hi = i === 0 && real === N - 2 ? real + 1.4 : real; // balok merah boleh diseret keluar lewat pintu
    drag = { i, x: e.clientX, y: e.clientY, start: pos[i] as number, lo, hi, real, cell: bd.clientWidth / N, now: pos[i] as number };
    b.setPointerCapture(e.pointerId);
    b.classList.add('drag');
  };
  el.onpointermove = (e) => {
    if (!drag) return;
    const horiz = (puzzle.blocks[drag.i] as { horiz: boolean }).horiz;
    const delta = (horiz ? e.clientX - drag.x : e.clientY - drag.y) / drag.cell;
    drag.now = Math.max(drag.lo, Math.min(drag.hi, drag.start + delta));
    place(drag.i, drag.now, false);
  };
  const release = (): void => {
    if (!drag) return;
    const d = drag;
    drag = null;
    const snap = Math.round(Math.min(d.now, d.real));
    place(d.i, snap, true);
    if (snap !== d.start) sfx('pop');
    if (snap !== d.start) {
      pos[d.i] = snap;
      moves++;
      info('Langkah ' + moves);
      if (isSolved(pos)) finish();
    }
  };
  el.onpointerup = release;
  el.onpointercancel = release;

  newPuzzle();
};
