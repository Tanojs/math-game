import { hit } from '../../core/dom.js';
import { resultBanner } from '../../core/banner.js';
import { segment } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { conflicts, generate, isComplete } from './logic.js';

export const mountSudoku: Mount = (_id, el, info) => {
  let level = 1;
  let g: number[] = [];
  let given: boolean[] = [];
  let sel = -1, t0 = 0, doneTime = '';
  let dead = false, fin = false;
  const rb = resultBanner();

  const clock = (): string => {
    const s = Math.floor((Date.now() - t0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const draw = (): void => {
    if (dead) return;
    if (!fin && isComplete(g)) { fin = true; doneTime = clock(); }
    info(fin ? 'Selesai ' + doneTime : clock());
    const sv = sel >= 0 ? (g[sel] as number) : 0;
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      '<div class="sq sd">' +
      g
        .map((v, i) => {
          const cls =
            (given[i] ? 'gv' : 'us') +
            (i === sel ? ' sel' : sv && v === sv ? ' hl' : '') +
            (conflicts(g, i) ? ' er' : '') +
            (((i % 9) % 3 === 2 && i % 9 < 8) ? ' c3' : '') +
            ((Math.floor(i / 9) % 3 === 2 && i < 72) ? ' r3' : '');
          return `<div data-i=${i} class="${cls}">${v || ''}</div>`;
        })
        .join('') +
      '</div><div class="pad sp">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫'].map((x) => `<button class=b data-k="${x}">${x}</button>`).join('') +
      '</div><button class="cta alt" id=nw>Soal baru</button>';
    if (fin) rb.show(el.querySelector<HTMLElement>('.sd'), `Selesai! ${doneTime}`, 'win', newPuzzle);
  };

  const newPuzzle = (): void => {
    rb.reset();
    ({ grid: g, given } = generate(level));
    sel = -1;
    fin = false;
    t0 = Date.now();
    draw();
  };

  const put = (v: number): void => {
    if (sel >= 0 && !given[sel] && !fin) { g[sel] = v; draw(); }
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]'), c = hit(e, '[data-i]'), k = hit(e, '[data-k]');
    if (l) { level = Number(l.dataset.l); return newPuzzle(); }
    if (hit(e, '#nw')) return newPuzzle();
    if (c) { sel = Number(c.dataset.i); draw(); }
    else if (k) put(k.dataset.k === '⌫' ? 0 : Number(k.dataset.k));
  };
  const onKey = (e: KeyboardEvent): void => {
    if (/^[1-9]$/.test(e.key)) put(+e.key);
    else if (e.key === 'Backspace' || e.key === 'Delete') put(0);
  };
  addEventListener('keydown', onKey);
  const iv = window.setInterval(() => { if (!fin && !dead) info(clock()); }, 1000);
  newPuzzle();
  return () => { dead = true; clearInterval(iv); removeEventListener('keydown', onKey); };
};
