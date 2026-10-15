import { $, hit } from '../core/dom.js';
import { GAME_ICONS } from '../icons/game-icons.js';
import { UI_ICONS } from '../icons/ui-icons.js';
import { GAMES } from '../games/registry.js';
import { clearRecords } from './records.js';
import { applyIconStyle, setIconStyle, type IconStyle } from './iconStyle.js';
import { applyTheme, cycleTheme, setTheme, type Theme } from './theme.js';
import { gotoTab, initRouter, play, showTab, type Tab } from './router.js';

const SETTINGS_HTML = `<div id="scr" class="hide"></div>
<div id="set" class="hide"><h1 class="ttl">Pengaturan</h1>
<div class="card"><h3>Tema</h3><div class="seg" id="thm"><button data-th="system">Sistem</button><button data-th="light">Terang</button><button data-th="dark">Gelap</button></div></div>
<div class="card"><h3>Ikon</h3><div class="seg" id="ics"><button data-is="solid">Solid</button><button data-is="line">Garis</button><button data-is="white">Putih</button></div></div>
<div class="card"><h3>Rekor</h3><button class="cta alt" id="rs">Hapus semua rekor</button></div>
<div class="card"><h3>Tentang</h3><p>Ikon: Phosphor (MIT), Font Awesome Free (CC BY 4.0)</p></div></div>`;

function buildHome(): void {
  $('#hg').innerHTML = GAMES.map(
    (g) => `<button class="ic" data-k="${g.id}" aria-label="${g.name}" title="${g.name}"><span>${GAME_ICONS[g.id] ?? ''}</span>${g.name}</button>`,
  ).join('');
  $('#hg').onclick = (e) => {
    const b = hit(e, '.ic');
    if (b) play(b.dataset.k as string);
  };
}

function buildNav(): void {
  const items: Array<[Tab, string]> = [['home', 'Game'], ['scr', 'Rekor'], ['set', 'Atur']];
  document.body.insertAdjacentHTML(
    'beforeend',
    '<nav id="nv" aria-label="Navigasi">' +
      items.map(([t, label]) => `<button class="nb" data-t="${t}">${UI_ICONS[t === 'home' ? 'home' : t === 'scr' ? 'scr' : 'set']}${label}</button>`).join('') +
      '</nav>',
  );
  $('#nv').onclick = (e) => {
    const b = hit(e, '[data-t]');
    if (b) gotoTab(b.dataset.t as Tab);
  };
}

function wireSettings(): void {
  $('#thm').onclick = (e) => {
    const b = hit(e, '[data-th]');
    if (b) setTheme(b.dataset.th as Theme);
  };
  $('#tq').onclick = cycleTheme;
  $('#ics').onclick = (e) => {
    const b = hit(e, '[data-is]');
    if (b) setIconStyle(b.dataset.is as IconStyle);
  };
  // Hapus rekor: dua ketukan agar tidak terhapus tak sengaja
  let timer = 0;
  $('#rs').onclick = () => {
    const b = $('#rs');
    const reset = (): void => { delete b.dataset.c; b.textContent = 'Hapus semua rekor'; };
    clearTimeout(timer);
    if (b.dataset.c) {
      clearRecords();
      b.textContent = 'Rekor dihapus';
      delete b.dataset.c;
      timer = window.setTimeout(reset, 1500);
    } else {
      b.dataset.c = '1';
      b.textContent = 'Yakin? Ketuk sekali lagi';
      timer = window.setTimeout(reset, 3000);
    }
  };
}

export function initApp(): void {
  $('#app').insertAdjacentHTML('beforeend', SETTINGS_HTML);
  buildHome();
  buildNav();
  wireSettings();
  applyTheme();
  applyIconStyle();
  showTab('home');
  initRouter();
}
