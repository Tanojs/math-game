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
  if (gm.classList.contains('hide')) return;
  const nav = document.getElementById('nv');
  const top = gm.getBoundingClientRect().top + window.scrollY;
  gm.style.minHeight = `${Math.max(0, window.innerHeight - top - (nav ? nav.getBoundingClientRect().height : 72) - 32)}px`;
};
addEventListener('resize', fitGame);

/**
 * Tombol "Cara main" diletakkan sejajar di kanan baris tombol paling bawah game (mis. "?  Ulangi  [Cara main]").
 * Jika baris itu tidak punya tempat kosong di kanan, tombol turun ke bawah baris tersebut.
 */
const placeHelp = (): void => {
  helpQueued = 0;
  const hw = $('#hw'), gm = $('#gm'), st = $('#st');
  if (gm.classList.contains('hide')) return;
  const G = gm.getBoundingClientRect(), S = st.getBoundingClientRect();
  const btns = [...st.querySelectorAll<HTMLElement>('button')].filter((b) => {
    const r = b.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden';
  });
  hw.style.visibility = 'hidden';
  hw.style.width = 'auto';
  const w = hw.offsetWidth;
  // batas bawah: tidak boleh masuk ke bar navigasi (layar yang terlihat), juga tidak melewati area game
  const nav = document.getElementById('nv');
  const limit = Math.min(S.bottom, innerHeight - (nav ? nav.getBoundingClientRect().height : 72));
  let h = 48, top = limit - 48 - 8, bottom = S.top;
  let last: DOMRect | null = null;
  for (const b of btns) {
    const r = b.getBoundingClientRect();
    if (r.bottom > bottom) bottom = r.bottom;
    if (!last || r.bottom > last.bottom) last = r;
  }
  if (last) { h = last.height; top = last.top; }
  // sejajar di tepi kanan area game; hanya turun ke bawah baris bila benar-benar bertabrakan
  const left = S.right - w;
  const clash = (t: number): boolean => btns.some((b) => {
    const r = b.getBoundingClientRect();
    return left < r.right + 6 && left + w > r.left - 6 && t < r.bottom + 4 && t + h > r.top - 4;
  });
  // pilih posisi pertama yang tidak menabrak tombol/papan lain: baris terakhir, lalu di bawahnya, lalu di dasar layar
  const cands = [top, Math.min(bottom + 10, limit - h), limit - h];
  const ok = cands.find((t) => t + h <= limit + 0.5 && t >= S.top - 0.5 && !clash(t));
  top = ok ?? Math.min(top, limit - h);
  Object.assign(hw.style, { left: `${left - G.left}px`, top: `${top - G.top}px`, height: `${h}px`, width: `${w}px`, visibility: '' });
};
let helpQueued = 0;
const schedulePlace = (): void => { if (!helpQueued) helpQueued = requestAnimationFrame(placeHelp); };

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
  // Tombol "Cara main": penjelasan game ini
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
  schedulePlace();
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
  // posisi "Cara main" dihitung ulang setiap isi game berubah (digambar ulang, muncul/hilang tombol, ukuran layar)
  new MutationObserver(schedulePlace).observe($('#st'), { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'hidden', 'disabled'] });
  $('#gm').addEventListener('animationend', schedulePlace);
  addEventListener('resize', schedulePlace);
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* diabaikan */ }
}
