import { hit } from '../../core/dom.js';
import { segment } from '../../core/html.js';
import { celebrate, clearBanner, layoutPos, slideFrom } from '../../core/banner.js';
import type { Mount } from '../../core/types.js';
import { adjacent, isSolved, scramble } from './logic.js';

let level = 0;

export const mountPuzzle15: Mount = (_id, el, info) => {
  let b: number[] = [];
  let z = 0, n = 4, moves = 0, wasSolved = false;

  const draw = (): void => {
    info('Langkah ' + moves);
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class="sq g4" style="--n:${n};grid-template:repeat(${n},minmax(0,1fr))/repeat(${n},minmax(0,1fr))">` +
      b.map((v, i) => (v ? `<button data-i=${i}>${v}</button>` : '<div class=em></div>')).join('') +
      `</div><div class=msg>${isSolved(b) ? 'Selesai!' : ''}</div><button class=cta id=re>Acak</button>`;
  };

  const status = (): void => {
    info('Langkah ' + moves);
    const done = isSolved(b);
    const msg = el.querySelector('.msg');
    if (msg) msg.textContent = done ? 'Selesai!' : '';
    const board = el.querySelector<HTMLElement>('.sq');
    if (board && done && !wasSolved) celebrate(board, `Selesai! ${moves} langkah`, 'win', { again: newGame });
    else if (board && !done) clearBanner(board);
    wasSolved = done;
  };

  const newGame = (): void => {
    ({ b, z, n } = scramble(level));
    moves = 0;
    wasSolved = false;
    draw();
    status();
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) {
      level = Number(l.dataset.l);
      return newGame();
    }
    if (hit(e, '#re')) return newGame();
  };
  // Petak digeser saat disentuh (pointerdown) agar ketukan cepat dengan dua jari tidak hilang.
  el.onpointerdown = (e) => {
    if (e.button !== 0) return;
    const x = hit(e, '[data-i]');
    if (!x || isSolved(b)) return;
    const i = Number(x.dataset.i);
    if (adjacent(i, z, n)) {
      const sq = x.parentElement as HTMLElement;
      const blank = sq.children[z] as HTMLElement;
      const from = layoutPos(x);
      const an = x.nextSibling, bn = blank.nextSibling;
      if (an === blank) sq.insertBefore(blank, x);
      else if (bn === x) sq.insertBefore(x, blank);
      else { sq.insertBefore(x, bn); sq.insertBefore(blank, an); }
      x.dataset.i = String(z);
      [b[i], b[z]] = [b[z] as number, b[i] as number];
      z = i;
      moves++;
      slideFrom(x, from, 130);
      status();
    }
  };
  newGame();
};
