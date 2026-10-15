import { hit } from '../../core/dom.js';
import { segment } from '../../core/html.js';
import { celebrate } from '../../core/banner.js';
import type { Mount } from '../../core/types.js';
import { buildLines, checkWin, chooseBotMove, type Cell, type Win } from './logic.js';

// Pilihan terakhir bertahan selama sesi (ukuran papan, lawan, level).
let size = 3, vsFriend = 0, level = 1;

export const mountXox: Mount = (_id, el, info) => {
  let b: Cell[] = [];
  let lines: number[][] = [];
  let over = false, firstMover = 0;
  let cw = 0, cd = 0, cl = 0;
  let turn: 'X' | 'O' = 'X';
  let winCells: number[] = [];
  let lastI = -1;

  const bot = (): void => {
    const i = chooseBotMove(b, size, level);
    if (i >= 0) { b[i] = 'O'; lastI = i; }
  };

  const draw = (): void => {
    const r: Win | null = checkWin(b, lines);
    const w = r?.w;
    const fresh = !!w && !over;
    if (w && !over) {
      if (w === 'X') cw++;
      else if (w === 'O') cl++;
      else cd++;
    }
    over = !!w;
    winCells = r ? r.l : [];
    info(vsFriend ? `X ${cw} · Seri ${cd} · O ${cl}` : `Menang ${cw} · Seri ${cd} · Kalah ${cl}`);
    const msg = vsFriend
      ? w === 'X' ? 'X menang!' : w === 'O' ? 'O menang!' : w === '-' ? 'Seri' : 'Giliran ' + turn
      : w === 'X' ? 'Kamu menang!' : w === 'O' ? 'Komputer menang' : w === '-' ? 'Seri' : 'Giliranmu';
    el.innerHTML =
      segment('s', ['3x3', '4x4', '5x5'], size, [3, 4, 5]) +
      segment('p', ['Bot', 'Teman'], vsFriend) +
      (vsFriend ? '' : segment('l', ['Mudah', 'Sedang', 'Sulit'], level)) +
      `<div class="sq t3x3" style="--n:${size};grid-template:repeat(${size},minmax(0,1fr))/repeat(${size},minmax(0,1fr))">` +
      b.map((v, i) => `<button data-i=${i} class="${v}${winCells.includes(i) ? ' win' : ''}${i === lastI && v ? ' nw' : ''}">${v}</button>`).join('') +
      `</div><div class=msg>${msg}</div><button class=cta id=re>Main lagi</button>`;
    const board = el.querySelector<HTMLElement>('.sq');
    if (board && w) {
      const text = vsFriend ? (w === '-' ? 'Seri!' : `${w} menang!`) : w === 'X' ? 'Kamu menang!' : w === 'O' ? 'Komputer menang' : 'Seri!';
      celebrate(board, text, w === '-' ? 'draw' : vsFriend || w === 'X' ? 'win' : 'lose', { still: !fresh });
    }
  };

  const newGame = (): void => {
    lines = buildLines(size);
    b = Array<Cell>(size * size).fill('');
    over = false;
    winCells = [];
    lastI = -1;
    turn = vsFriend && firstMover ? 'O' : 'X';
    if (!vsFriend && firstMover) bot();
    draw();
  };

  el.onclick = (e) => {
    const sb = hit(e, '[data-s]'), pb = hit(e, '[data-p]'), lb = hit(e, '[data-l]');
    if (sb || pb || lb) {
      if (sb) size = Number(sb.dataset.s);
      if (pb) vsFriend = Number(pb.dataset.p);
      if (lb) level = Number(lb.dataset.l);
      cw = cd = cl = 0;
      firstMover = 0;
      return newGame();
    }
    if (hit(e, '#re')) {
      firstMover ^= 1;
      return newGame();
    }
    const x = hit(e, '[data-i]');
    if (!x || over) return;
    const i = Number(x.dataset.i);
    if (b[i]) return;
    lastI = i;
    if (vsFriend) {
      b[i] = turn;
      turn = turn === 'X' ? 'O' : 'X';
    } else {
      b[i] = 'X';
      if (!checkWin(b, lines)) bot();
    }
    draw();
  };
  newGame();
};
