import { HELP_BTN } from '../../app/howto.js';
import { $ } from '../../core/dom.js';
import { celebrate, clearBanner } from '../../core/banner.js';
import { R } from '../../core/rand.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { canMove, moveTiles, SIZE, type Dir, type Tile } from './logic.js';

const COLORS: Record<number, string> = {
  2: '#FFF3B0', 4: '#FFE14D', 8: '#FFB347', 16: '#FF8A5B', 32: '#FF6B6B', 64: '#FF4D8D',
  128: '#B8A1FF', 256: '#8F7CFF', 512: '#5CE1E6', 1024: '#7BE495', 2048: '#000',
};
const MS = 130;

export const mount2048: Mount = (id, el, info) => {
  let tiles: Tile[] = [];
  let nextId = 1, score = 0, over = false, dead = false;
  const nodes = new Map<number, HTMLElement>(); // id ubin -> elemen (tetap hidup antar langkah => transisi CSS mulus)

  el.innerHTML =
    '<div class="sq g4" id="bd">' + '<div></div>'.repeat(SIZE * SIZE) + '<div class="tls"></div></div>' +
    '<div class=msg id=m48></div><div class=arow><button class=cta id=re>Main lagi</button>' + HELP_BTN + '</div>';
  const bd = $('#bd'), layer = bd.querySelector('.tls') as HTMLElement;

  const paint = (n: HTMLElement, v: number): void => {
    const inner = n.firstElementChild as HTMLElement;
    const fs = v > 999 ? 6.5 : v > 99 ? 8 : v > 9 ? 10 : 12;
    inner.textContent = String(v);
    inner.style.cssText = `background:${COLORS[v] ?? '#000'};color:${v > 2047 ? '#fff' : '#000'};font-size:${fs}cqw`;
  };
  const put = (n: HTMLElement, i: number): void => {
    n.style.setProperty('--r', String(Math.floor(i / SIZE)));
    n.style.setProperty('--c', String(i % SIZE));
  };
  const make = (t: Tile, cls = ''): HTMLElement => {
    const n = document.createElement('div');
    n.className = 'tl';
    n.innerHTML = `<div class="ti ${cls}"></div>`;
    paint(n, t.v);
    put(n, t.i);
    layer.appendChild(n);
    nodes.set(t.id, n);
    return n;
  };
  const replay = (n: HTMLElement, cls: string): void => {
    const inner = n.firstElementChild as HTMLElement;
    inner.classList.remove('pop', 'mg');
    void inner.offsetWidth;
    inner.classList.add(cls);
  };

  const spawn = (animate: boolean): void => {
    const used = new Set(tiles.map((t) => t.i));
    const free = Array.from({ length: SIZE * SIZE }, (_, i) => i).filter((i) => !used.has(i));
    if (!free.length) return;
    const t: Tile = { id: nextId++, v: Math.random() < 0.9 ? 2 : 4, i: free[R(0, free.length - 1)] as number };
    tiles.push(t);
    make(t, animate ? 'pop' : '');
  };

  const status = (): void => {
    info(`Skor ${score} · terbaik ${best(id, score)}`);
    over = !canMove(Array.from({ length: SIZE * SIZE }, (_, i) => tiles.find((t) => t.i === i)?.v ?? 0));
    $('#m48').textContent = over ? 'Game over' : '';
    if (over) celebrate(bd, 'Game over', 'lose', { again: start });
  };

  const move = (d: Dir): void => {
    if (over || dead) return;
    const r = moveTiles(tiles, d);
    if (!r.moved) return;
    score += r.gain;
    tiles = r.tiles;
    for (const t of tiles) {
      const n = nodes.get(t.id) as HTMLElement;
      put(n, t.i);
      if (r.merged.includes(t.id)) {
        n.style.zIndex = '2';
        window.setTimeout(() => { if (dead) return; paint(n, t.v); replay(n, 'mg'); n.style.zIndex = ''; }, MS - 20);
      }
    }
    for (const g of r.ghosts) {
      const n = nodes.get(g.id) as HTMLElement;
      put(n, g.i);
      nodes.delete(g.id);
      window.setTimeout(() => n.remove(), MS);
    }
    window.setTimeout(() => { if (dead) return; spawn(true); status(); }, MS * 0.8);
    status();
  };

  const start = (): void => {
    layer.innerHTML = '';
    nodes.clear();
    clearBanner(bd);
    tiles = []; score = 0; over = false;
    spawn(false); spawn(false);
    status();
  };
  $('#re').onclick = start;

  let x0 = 0, y0 = 0;
  bd.ontouchstart = (e) => { const t = e.touches[0]; if (t) { x0 = t.clientX; y0 = t.clientY; } };
  bd.ontouchend = (e) => {
    const t = e.changedTouches[0];
    if (!t) return;
    const dx = t.clientX - x0, dy = t.clientY - y0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
    move(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 1) : dy < 0 ? 2 : 3);
  };
  const onKey = (e: KeyboardEvent): void => {
    const i = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].indexOf(e.key);
    if (i >= 0) { e.preventDefault(); move(i as Dir); }
  };
  addEventListener('keydown', onKey);
  start();
  return () => { dead = true; removeEventListener('keydown', onKey); };
};
