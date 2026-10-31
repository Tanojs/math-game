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

/** Id game yang sedang berjalan (null = tidak ada game). */
let curId: string | null = null;
const stopCurrent = (): void => { stop?.(); stop = null; curId = null; };

/** Tinggi area game = sisa layar (di atas bar navigasi) supaya isi game bisa diletakkan di tengah / dekat jempol. */
const fitGame = (): void => {
  const gm = $('#gm');
  if (gm.classList.contains('hide')) return;
  const nav = document.getElementById('nv');
  const top = gm.getBoundingClientRect().top + window.scrollY;
  gm.style.minHeight = `${Math.max(0, window.innerHeight - top - (nav ? nav.getBoundingClientRect().height : 72) - 32)}px`;
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
  stopCurrent(); // hentikan game yang masih berjalan sebelum game baru dibuka, supaya tidak ada game lama yang ikut menggambar
  cur = 'gm';
  curId = id;
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
  placeInfo();
}

/**
 * Tombol "i" (cara bermain) ditaruh di baris tombol paling bawah setiap game, sejajar dengan tombol ? dan Lanjut.
 * Game yang tidak punya baris tombol mendapat satu baris sendiri di bawah isi game.
 */
const INFO_ROWS = '.rr, .rc, .cact, .rrs';
let infoRow: HTMLElement | null = null;
const placeInfo = (): void => {
  const hw = document.getElementById('hw'), st = document.getElementById('st');
  if (!hw || !st) return;
  const rows = st.querySelectorAll<HTMLElement>(INFO_ROWS);
  let row = rows[rows.length - 1] ?? null;
  if (!row) {
    if (!infoRow) { infoRow = document.createElement('div'); infoRow.className = 'rr hwr'; }
    if (infoRow.parentElement !== st) st.appendChild(infoRow);
    row = infoRow;
  }
  if (hw.parentElement !== row) row.appendChild(hw);
};

export function goHome(): void {
  stopCurrent();
  try { if (location.hash) history.replaceState(null, '', location.pathname + location.search); } catch { /* diabaikan */ }
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
  // Game yang menggambar ulang layarnya (innerHTML) membuat tombol "i" lepas dari barisnya: pasang lagi
  new MutationObserver(() => placeInfo()).observe($('#st'), { childList: true, subtree: true });
  // Tombol "i" tidak boleh ikut memicu klik game di bawahnya (stage punya penangan klik sendiri)
  const hw = $('#hw');
  hw.addEventListener('click', (e) => e.stopPropagation());
  hw.addEventListener('pointerdown', (e) => e.stopPropagation());
  // ← langsung kembali ke menu (tidak bergantung pada riwayat browser yang bisa salah sasaran)
  $('#bk').onclick = () => goHome();
  // Tombol Back browser/HP: hash kosong = menu; hash game lain = buka game itu
  addEventListener('hashchange', () => {
    const h = location.hash.slice(1);
    if (!h) { goHome(); return; }
    if (h !== curId && GAMES.some((g) => g.id === h)) play(h);
  });
  try { history.replaceState(null, '', location.pathname + location.search); } catch { /* diabaikan */ }
}
