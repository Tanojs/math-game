import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import { celebrate } from '../../core/banner.js';
import { sfx } from '../../core/sfx.js';
import type { Mount } from '../../core/types.js';
import { bestTime, fmtTime } from '../../app/records.js';
import { LEVEL_CFG, chord, emptyBoard, flagsUsed, isWon, plant, reveal, toggleFlag, type Cell, type Opened } from './logic.js';

const FLAG = '<svg viewBox="0 0 24 24"><path d="M6.5 3v18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M7.5 4.2l12 4.6-12 4.6z" style="fill:var(--r)" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>';
const MINE = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M18.7 5.3l-2.8 2.8M8.1 15.9l-2.8 2.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="10" cy="10" r="1.8" fill="#fff"/></svg>';
const HOLD_MS = 380; // tahan selama ini = aksi kebalikan dari mode saat ini (buka <-> bendera)

let level: Level = 0;

export const mountMines: Mount = (id, el, info) => {
  let n = 8, mines = 10, cells: Cell[] = [], cellEls: HTMLElement[] = [];
  let planted = false, lost = false, won = false, boomAt = -1;
  let t0 = 0, iv = 0, elapsed = 0, flagMode = false;
  let hold: { i: number; x: number; y: number; timer: number; long: boolean } | null = null;

  const over = (): boolean => lost || won;
  const hud = (): void => info(`Ranjau ${mines - flagsUsed(cells)} · ${fmtTime(planted && !over() ? performance.now() - t0 : elapsed)}`);
  const hint = (): string => `Ketuk = ${flagMode ? 'bendera' : 'buka'} · tahan = ${flagMode ? 'buka' : 'bendera'}`;
  const say = (t: string): void => { const m = el.querySelector('#mnm'); if (m) m.textContent = t; };
  const board = (): HTMLElement => el.querySelector('.mnb') as HTMLElement;

  const draw = (): void => {
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      segment('m', ['Buka', 'Bendera'], flagMode ? 1 : 0) +
      `<div class="mnb" data-nosnd style="--n:${n};grid-template:repeat(${n},minmax(0,1fr))/repeat(${n},minmax(0,1fr))">` +
      cells.map((_, i) => `<button class=mnc data-i=${i}></button>`).join('') +
      '</div><div class=msg id=mnm></div><button class=cta id=re>Main lagi</button>';
    cellEls = [...el.querySelectorAll<HTMLElement>('.mnc')];
    const b = board();
    b.oncontextmenu = (e) => e.preventDefault();
    b.ondragstart = (e) => e.preventDefault();
  };

  const paint = (i: number): void => {
    const c = cells[i] as Cell, b = cellEls[i] as HTMLElement;
    let cls = 'mnc', html = '', num = '';
    if (c.open && c.mine) { cls += ' mno mnx' + (i === boomAt ? ' mnq' : ''); html = MINE; }
    else if (c.open) { cls += ' mno'; if (c.adj) { num = String(c.adj); html = num; } }
    else if (lost && c.mine && !c.flag) { cls += ' mno mnx'; html = MINE; }
    else if (c.flag) { cls += ' mnf' + (lost && !c.mine ? ' mnw' : ''); html = FLAG; }
    else if (won && c.mine) { cls += ' mnf'; html = FLAG; }
    b.className = cls;
    if (num) b.dataset.n = num; else delete b.dataset.n;
    b.innerHTML = html;
  };
  const paintAll = (): void => cells.forEach((_, i) => paint(i));

  const stop = (): void => { clearInterval(iv); elapsed = planted ? performance.now() - t0 : 0; };

  const lose = (boom: number): void => {
    stop();
    lost = true;
    boomAt = boom;
    paintAll();
    hud();
    say('Kena ranjau! Tekan Main lagi.');
    celebrate(board(), 'Meledak!', 'lose', { again: newGame });
  };

  const win = (): void => {
    stop();
    won = true;
    paintAll();
    const record = bestTime(id + level, elapsed);
    info('Selesai ' + fmtTime(elapsed));
    say(`Waktu ${fmtTime(elapsed)}${record ? ' · rekor baru!' : ''}`);
    celebrate(board(), `Menang! ${fmtTime(elapsed)}`, 'win', { again: newGame });
  };

  const apply = (r: Opened): void => {
    if (!r.opened.length) return;
    r.opened.forEach(paint);
    if (r.boom >= 0) return lose(r.boom);
    if (isWon(cells)) return win();
    sfx(r.opened.length > 3 ? 'good' : 'tap');
    hud();
  };

  /** Satu aksi pada petak `i`: `flag` = pasang/lepas bendera, selain itu buka (atau "chord" bila angka sudah terpenuhi). */
  const act = (i: number, flag: boolean): void => {
    if (over()) return;
    const c = cells[i] as Cell;
    if (flag) {
      if (!toggleFlag(c)) return;
      sfx('pop');
      paint(i);
      hud();
      return;
    }
    if (c.flag) return; // petak berbendera aman dari ketukan tidak sengaja
    if (c.open) return apply(chord(cells, n, i));
    if (!planted) {
      plant(cells, n, mines, i);
      planted = true;
      t0 = performance.now();
      iv = window.setInterval(hud, 200);
    }
    apply(reveal(cells, n, i));
  };

  const newGame = (): void => {
    clearInterval(iv);
    ({ n, mines } = LEVEL_CFG[level] as { n: number; mines: number });
    cells = emptyBoard(n);
    planted = lost = won = false;
    boomAt = -1;
    elapsed = 0;
    hold = null;
    draw();
    say(hint());
    hud();
  };

  const cancelHold = (): void => { if (hold) clearTimeout(hold.timer); hold = null; };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; return newGame(); }
    const m = hit(e, '[data-m]');
    if (m) {
      flagMode = m.dataset.m === '1';
      el.querySelectorAll('[data-m]').forEach((b) => b.classList.toggle('on', (b as HTMLElement).dataset.m === m.dataset.m));
      if (!over()) say(hint());
      return;
    }
    if (hit(e, '#re')) newGame();
  };

  // Petak diproses lewat pointer (bukan click) supaya "tahan lama" = aksi kebalikan mode saat ini.
  el.onpointerdown = (e) => {
    if (e.button !== 0) return;
    const b = hit(e, '.mnc');
    if (!b || over()) return;
    cancelHold();
    const i = Number(b.dataset.i);
    const h = { i, x: e.clientX, y: e.clientY, long: false, timer: 0 };
    h.timer = window.setTimeout(() => {
      h.long = true;
      try { navigator.vibrate?.(12); } catch { /* diabaikan */ }
      act(i, !flagMode);
    }, HOLD_MS);
    hold = h;
  };
  el.onpointermove = (e) => { if (hold && !hold.long && Math.hypot(e.clientX - hold.x, e.clientY - hold.y) > 14) cancelHold(); };
  el.onpointerup = () => {
    if (!hold) return;
    const h = hold;
    cancelHold();
    if (!h.long) act(h.i, flagMode);
  };
  el.onpointercancel = cancelHold;

  newGame();
  return () => { clearInterval(iv); cancelHold(); };
};
