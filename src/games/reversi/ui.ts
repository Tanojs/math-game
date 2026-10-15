import { hit } from '../../core/dom.js';
import { segment, LEVELS } from '../../core/html.js';
import { celebrate, clearBanner, type BannerKind } from '../../core/banner.js';
import type { Mount } from '../../core/types.js';
import { chooseBotMove, count, flipsFor, initialBoard, isOver, legalMoves, hasMoves, opp, playMove, type Board, type Side } from './engine.js';

const BOT_DELAY = 650;
const FLIP_STEP = 70;

let level = 1, vsFriend = 0, humanBlack = true; // bertahan selama sesi

interface Snap { board: Board; turn: Side; last: number; msg: string }

/** Reversi: DOM dibangun sekali; piringan punya dua sisi (hitam/putih) yang dibalik lewat transisi CSS 3D. */
export const mountReversi: Mount = (_id, el, info) => {
  let board: Board = initialBoard();
  let turn: Side = 1, last = -1, msg = '', over = false, thinking = false, dead = false;
  let timer = 0, endTimer = 0, clearTimer = 0;
  const hist: Snap[] = [];

  el.innerHTML =
    '<div class=cwrap><div id=rctl></div><div class=rsbar id=rb0></div>' +
    '<div class=rsb id=rsb></div><div class=rsbar id=rb1></div><div class=cst id=rst></div>' +
    '<div class=cact><button class=b id=run>Urungkan</button><button class=b id=rre>Main lagi</button></div></div>';
  const q = <T extends HTMLElement>(s: string): T => el.querySelector(s) as T;
  const bd = q('#rsb');
  const cells: HTMLElement[] = [];
  for (let i = 0; i < 64; i++) {
    const c = document.createElement('div');
    c.className = 'rcl' + (((i >> 3) + (i & 7)) % 2 ? ' a' : '');
    c.dataset.i = String(i);
    c.innerHTML = '<span class=dc><b class=fb></b><b class=fw></b></span>';
    bd.appendChild(c);
    cells.push(c);
  }

  const human = (): Side => (humanBlack ? 1 : 2);
  const topSide = (): Side => (vsFriend ? 1 : opp(human()));
  const name = (s: Side): string => (vsFriend ? (s === 1 ? 'Hitam' : 'Putih') : s === human() ? 'Kamu' : `Bot · ${LEVELS[level]}`);
  const canAct = (): boolean => !dead && !over && !thinking && (vsFriend === 1 || turn === human());

  const paint = (): void => {
    const hints = canAct() ? new Set(legalMoves(board, turn)) : new Set<number>();
    cells.forEach((c, i) => {
      c.dataset.v = String(board[i]);
      c.classList.toggle('hint', hints.has(i));
      c.classList.toggle('lm', i === last);
    });
    bd.classList.toggle('pw', turn === 2);
  };
  const bars = (): void => {
    const n = count(board);
    [q('#rb0'), q('#rb1')].forEach((bar, k) => {
      const side: Side = k === 0 ? topSide() : opp(topSide());
      bar.className = 'rsbar' + (turn === side && !over ? ' on' : '');
      bar.innerHTML = `<span class="dot ${side === 1 ? 'k' : 'w'}"></span><b>${name(side)}</b><i>${side === 1 ? n.black : n.white}</i>`;
    });
  };
  const resultText = (): { text: string; kind: BannerKind } => {
    const n = count(board), score = `${Math.max(n.black, n.white)}–${Math.min(n.black, n.white)}`;
    if (n.black === n.white) return { text: `Seri ${n.black}–${n.white}`, kind: 'draw' };
    const winner: Side = n.black > n.white ? 1 : 2;
    if (vsFriend) return { text: `${winner === 1 ? 'Hitam' : 'Putih'} menang! ${score}`, kind: 'win' };
    return winner === human() ? { text: `Kamu menang! ${score}`, kind: 'win' } : { text: `Bot menang ${score}`, kind: 'lose' };
  };
  const statusText = (): string => {
    if (over) return resultText().text;
    if (thinking) return 'Bot berpikir…';
    const base = vsFriend ? `Giliran ${name(turn)}` : 'Giliranmu';
    return msg ? `${msg}` : base;
  };
  const status = (): void => {
    const t = statusText(), s = q('#rst');
    s.textContent = t;
    s.className = 'cst' + (over ? ' end' : thinking ? ' think' : msg ? ' chk' : '');
    info(over ? '' : t);
    const floor = !vsFriend && !humanBlack ? 1 : 0; // langkah pertama bot (putih jalan kedua) tidak bisa diurungkan
    (q('#run') as HTMLButtonElement).disabled = hist.length <= floor || thinking;
  };
  const controls = (): void => {
    q('#rctl').innerHTML = segment('o', ['Lawan Bot', 'Main Bareng Teman'], vsFriend) +
      (vsFriend ? '' : segment('l', LEVELS, level) + segment('s', ['Main Hitam', 'Main Putih'], humanBlack ? 0 : 1));
  };
  const refresh = (): void => { paint(); bars(); status(); };

  const showEnd = (): void => {
    clearTimeout(endTimer);
    clearBanner(bd);
    if (!over) return;
    const { text, kind } = resultText();
    endTimer = window.setTimeout(() => { if (!dead && over) celebrate(bd, text, kind); }, 700);
  };

  const animate = (i: number, flipped: number[]): void => {
    const r0 = i >> 3, c0 = i & 7;
    const order = [...flipped].sort((a, b) => Math.max(Math.abs((a >> 3) - r0), Math.abs((a & 7) - c0)) - Math.max(Math.abs((b >> 3) - r0), Math.abs((b & 7) - c0)));
    order.forEach((f, k) => { (cells[f]!.firstElementChild as HTMLElement).style.transitionDelay = `${140 + k * FLIP_STEP}ms`; });
    clearTimeout(clearTimer);
    clearTimer = window.setTimeout(() => cells.forEach((c) => { (c.firstElementChild as HTMLElement).style.transitionDelay = ''; }), 140 + order.length * FLIP_STEP + 600);
  };

  const play = (i: number): void => {
    hist.push({ board, turn, last, msg });
    const side = turn, r = playMove(board, i, side);
    animate(i, r.flipped);
    if (navigator.vibrate) navigator.vibrate(10);
    board = r.board; last = i; msg = '';
    const next = opp(side);
    if (hasMoves(board, next)) turn = next;
    else if (hasMoves(board, side)) msg = `${name(next)} tidak punya langkah — ${vsFriend ? name(side) + ' ' : ''}jalan lagi`;
    else over = isOver(board);
    refresh();
    showEnd();
    maybeBot();
  };
  const maybeBot = (): void => {
    if (over || vsFriend || turn === human()) return;
    thinking = true;
    status();
    paint();
    timer = window.setTimeout(() => {
      timer = 0;
      if (dead || !thinking) return;
      thinking = false;
      const m = chooseBotMove(board, turn, level);
      if (m === null) { over = true; refresh(); showEnd(); } else play(m);
    }, BOT_DELAY);
  };
  const undo = (): void => {
    if (dead || !hist.length) return;
    clearTimeout(timer);
    thinking = false;
    do {
      const s = hist.pop() as Snap;
      ({ board, turn, last, msg } = s);
      over = false;
    } while (!vsFriend && turn !== human() && hist.length);
    clearBanner(bd); clearTimeout(endTimer);
    refresh();
    maybeBot();
  };
  const reset = (): void => {
    clearTimeout(timer); clearTimeout(endTimer);
    board = initialBoard(); turn = 1; last = -1; msg = ''; over = false; thinking = false;
    hist.length = 0;
    clearBanner(bd);
    controls();
    refresh();
    maybeBot(); // jika pemain memilih putih, bot (hitam) jalan duluan
  };

  bd.addEventListener('click', (e) => {
    const c = hit(e, '.rcl');
    if (!c || !canAct()) return;
    const i = Number(c.dataset.i);
    if (flipsFor(board, i, turn).length) play(i);
  });
  const onClick = (e: MouseEvent): void => {
    const o = hit(e, '[data-o]'), l = hit(e, '[data-l]'), s = hit(e, '[data-s]');
    if (o) { vsFriend = Number(o.dataset.o); return reset(); }
    if (l) { level = Number(l.dataset.l); return reset(); }
    if (s) { humanBlack = s.dataset.s === '0'; return reset(); }
    if (hit(e, '#run')) return undo();
    if (hit(e, '#rre')) return reset();
  };
  el.addEventListener('click', onClick);

  reset();
  return () => { dead = true; el.removeEventListener('click', onClick); clearTimeout(timer); clearTimeout(endTimer); clearTimeout(clearTimer); };
};
