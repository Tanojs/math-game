import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { bestTime, fmtTime } from '../../app/records.js';
import { makeBoard, PENALTY_MS, SIZES } from './logic.js';

let level: Level = 0;

export const mountTap: Mount = (id, el, info) => {
  let n = 3, next = 1, penalty = 0, t0 = 0, iv = 0, ended = false, msg = '';
  let board: number[] = [];

  const elapsed = (): number => performance.now() - t0 + penalty;
  const tick = (): void => { if (!ended) info(fmtTime(elapsed())); };

  const draw = (): void => {
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class="sq tpg" style="--n:${n};grid-template:repeat(${n},minmax(0,1fr))/repeat(${n},minmax(0,1fr))">` +
      board.map((v) => `<button data-v=${v}>${v}</button>`).join('') +
      `</div><div class=msg>${msg}</div><button class=cta id=re>Main lagi</button>`;
  };

  const start = (): void => {
    clearInterval(iv);
    n = SIZES[level] as number;
    board = makeBoard(n);
    next = 1; penalty = 0; ended = false; msg = '';
    draw();
    t0 = performance.now();
    iv = window.setInterval(tick, 100);
    tick();
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; return start(); }
    if (hit(e, '#re')) return start();
  };

  // Petak diproses saat jari MENYENTUH (pointerdown), bukan saat jari diangkat (click):
  // peramban tidak mengirim "click" untuk sentuhan kedua yang tumpang tindih, sehingga ketukan cepat dengan dua jari hilang.
  el.onpointerdown = (e) => {
    if (e.button !== 0) return;
    const b = hit(e, '[data-v]');
    if (!b || ended || b.classList.contains('done')) return;
    if (Number(b.dataset.v) === next) {
      b.classList.add('done');
      if (++next > n * n) {
        ended = true;
        clearInterval(iv);
        const ms = elapsed();
        const record = bestTime(id + level, ms);
        info('Selesai ' + fmtTime(ms));
        const m = document.querySelector('.msg');
        if (m) m.textContent = `Waktu ${fmtTime(ms)}${record ? ' · rekor baru!' : ''}`;
      }
    } else {
      penalty += PENALTY_MS;
      b.classList.add('bad');
      window.setTimeout(() => b.classList.remove('bad'), 300);
    }
  };

  start();
  return () => clearInterval(iv);
};
