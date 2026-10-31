import { $, $$ } from '../core/dom.js';
import type { Cleanup } from '../core/types.js';
import { GAMES } from '../games/registry.js';
import { renderScores } from './scores.js';
import { sfx } from '../core/sfx.js';
import { HOWTO } from './howto.js';
import { openSheet } from './sheet.js';

/** Putar ulang animasi masuk pada sebuah layar. */
const enter = (id: string): void => {
  const el = $(id);
  el.classList.remove('enter');
  void el.offsetWidth; // paksa reflow agar animasi mulai dari awal
  el.classList.add('enter');
};

export type Tab = 'home' | 'gm' | 'scr' | 'set';
const TABS: Tab[] = ['home', 'gm', 'scr', 'set'];
let stop: Cleanup | null = null;
let cur: Tab = 'home';
/** Layar yang sedang tampil ('gm' = sedang di dalam sebuah game). */
export const currentTab = (): Tab => cur;

const stopCurrent = (): void => { stop?.(); stop = null; };

/** Tinggi area game = sisa layar (di atas bar navigasi) supaya isi game bisa diletakkan di tengah / dekat jempol. */
const fitGame = (): void => {
  const gm = $('#gm');
  const nav = document.getElementById('nv');
  const navH = nav ? nav.getBoundingClientRect().height : 72;
  // tinggi bar navigasi dipakai CSS (.hw) supaya tombol "i" tetap di atasnya
  document.documentElement.style.setProperty('--nav-h', `${navH}px`);
  if (gm.classList.contains('hide')) return;
  const top = gm.getBoundingClientRect().top + window.scrollY;
  gm.style.minHeight = `${Math.max(0, window.innerHeight - top - navH - 32)}px`;
};
addEventListener('resize', fitGame);

export function showTab(t: Tab): void {
  cur = t;
  document.body.classList.toggle('ig', t === 'gm');
  document.dispatchEvent(new CustomEvent('mg-screen', { detail: t === 'gm' ? 'game' : 'menu' }));
  TABS.forEach((x) => $('#' + x).classList.toggle('hide', x !== t));
  $$('.nb').forEach((b) => b.classList.toggle('on', b.dataset.t === (t === 'gm' ? 'home' : t)));
  if (t === 'scr') renderScores();
  window.scrollTo(0, 0);
}

export function play(id: string): void {
  const game = GAMES.find((g) => g.id === id);
  if (!game) return;
  cur = 'gm';
  document.body.classList.add('ig');
  document.dispatchEvent(new CustomEvent('mg-screen', { detail: 'game' }));
  try { location.hash = id; } catch { /* diabaikan */ }
  $('#home').classList.add('hide');
  $('#gm').classList.remove('hide');
  enter('#gm');
  sfx('open');
  fitGame();
  $('#gt').textContent = game.name;
  $('#inf').textContent = '';
  // Tombol "i" di pojok kanan bawah: cara bermain game ini
  $('#hw').onclick = () => openSheet(game.name, HOWTO[id] ?? '<p>Belum ada penjelasan untuk game ini.</p>');
  const stage = $('#st');
  stage.innerHTML = '';
  // Bersihkan SEMUA pengendali dari game sebelumnya (area game dipakai ulang oleh tiap game).
  stage.onclick = null;
  stage.onpointerdown = null;
  stage.onpointermove = null;
  stage.onpointerup = null;
  stage.onpointercancel = null;
  stop = game.mount(id, stage, (text) => { $('#inf').textContent = text; }) ?? null;
}

export function goHome(): void {
  stopCurrent();
  $('#inf').textContent = '';
  showTab('home');
  enter('#home');
  sfx('back');
}

/** Pindah tab dari navigasi bawah (menghentikan game yang sedang berjalan). */
export function gotoTab(t: Tab): void {
  stopCurrent();
  try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch { /* diabaikan */ }
  $('#inf').textContent = '';
  showTab(t);
}

export function initRouter(): void {
  $('#bk').onclick = () => {
    try { if (location.hash) { history.back(); return; } } catch { /* diabaikan */ }
    goHome();
  };
  addEventListener('hashchange', () => { if (!location.hash) goHome(); });
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* diabaikan */ }
}
