import { HELP_BTN } from '../../app/howto.js';
import { hit } from '../../core/dom.js';
import { resultBanner } from '../../core/banner.js';
import { segment } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { badCells, generate, groupOf, isComplete, type Kakuro } from './logic.js';

export const mountKakuro: Mount = (_id, el, info) => {
  let level = 1;
  let p: Kakuro = generate(level);
  let g: number[] = new Array<number>(p.n * p.n).fill(0);
  let sel = -1, t0 = 0, doneTime = '';
  let dead = false, fin = false;
  const rb = resultBanner();

  const clock = (): string => {
    const s = Math.floor((Date.now() - t0) / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const draw = (): void => {
    if (dead) return;
    if (!fin && isComplete(p, g)) { fin = true; doneTime = clock(); }
    info(fin ? 'Selesai ' + doneTime : clock());
    const bad = badCells(p, g);
    const grp = sel >= 0 ? new Set(groupOf(p, sel)) : new Set<number>();
    const cells = p.black
      .map((b, i) => {
        if (b) {
          const a = p.across[i] ? `<i>${p.across[i]}</i>` : '';
          const d = p.down[i] ? `<u>${p.down[i]}</u>` : '';
          return `<div class="kb" data-b=${i}>${a}${d}</div>`;
        }
        const cls = (i === sel ? ' sel' : grp.has(i) ? ' hl' : '') + (bad.has(i) ? ' er' : '');
        return `<div class="kw${cls}" data-i=${i}>${g[i] || ''}</div>`;
      })
      .join('');
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class="sq kk" style="--n:${p.n}">${cells}</div>` +
      '<div class="pad sp">' +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫'].map((x) => `<button class=b data-k="${x}">${x}</button>`).join('') +
      '</div><div class=arow><button class="cta alt" id=nw>Soal baru</button>' + HELP_BTN + '</div>';
    if (fin) rb.show(el.querySelector<HTMLElement>('.kk'), `Selesai! ${doneTime}`, 'win', newPuzzle);
  };

  const newPuzzle = (): void => {
    rb.reset();
    p = generate(level);
    g = new Array<number>(p.n * p.n).fill(0);
    sel = -1;
    fin = false;
    t0 = Date.now();
    draw();
  };

  const put = (v: number): void => {
    if (sel >= 0 && !p.black[sel] && !fin) { g[sel] = v; draw(); }
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
