import { HELP_BTN } from '../../app/howto.js';
import { hit } from '../../core/dom.js';
import { resultBanner } from '../../core/banner.js';
import { segment } from '../../core/html.js';
import { getStr, setStr } from '../../core/storage.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { layoutFor } from './geometry.js';
import { digitCount, fixedBar, isEquation, LEVELS, type Level, nextPuzzle, plusBar, refillPool, statesAlongPlan, type Puzzle, type Slots } from './logic.js';

const PALETTE: ReadonlyArray<readonly [string, string]> = [['Pink', '#FF7AB6'], ['Biru', '#5A7BA0'], ['Ungu', '#9C86F2'], ['Teal', '#3FB6C0']];
let level = 0; // indeks ke LEVELS: 0 = Mudah (1 digit, 1 batang), 1 = Sedang (puluhan, 1 batang), 2 = Sulit (puluhan, 2 batang)
let color = getStr('mgs') ?? '#FF7AB6';
const movesOf = (): number => (LEVELS[level] as Level).moves;

export const mountSticks: Mount = (id, el, info) => {
  let s: Slots = [], puzzle!: Puzzle, path: Slots[] = [];
  let moves = 0, K = movesOf(), held = -1, solved = 0;
  let done = false, busy = false, dead = false;
  let hint: number[] = [];
  let msg = '', hintTimer = 0, refillTimer = 0;
  const rb = resultBanner();

  const label = (): string => `Pindahkan ${K} batang`;

  const draw = (): void => {
    if (dead) return;
    info('Benar ' + solved);
    const L = layoutFor(digitCount(s) === 1 ? 1 : 2), F = fixedBar(s);
    const slots = L.slots.map((p, i) => [i, p] as const)
      .filter(([i]) => i !== F)
      // batang kosong digambar di bawah batang terisi
      .sort((a, b) => (s[a[0]] ? 1 : 0) - (s[b[0]] ? 1 : 0))
      .map(([i, p]) => `<polygon data-i="${i}" points="${p}" class="${s[i] ? 'l' : i === held ? 'e o' : 'e'}${hint.includes(i) ? ' h' : ''}"/>`)
      .join('');
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      // palet warna di atas papan, sama seperti game Cermin (kelas .mpal / .msw)
      '<div class=mpal>' + PALETTE.map(([n, c]) => `<button class="msw${c === color ? ' on' : ''}" data-c="${c}" aria-label="Warna ${n}" style="--bc:${c}"></button>`).join('') + '</div>' +
      `<div class="stk${done ? ' ok' : busy ? ' bad' : ''}" style="--sk:${color}"><svg viewBox="0 20 400 480">` +
      slots +
      L.fixed.map((p) => `<polygon points="${p}" class="f"/>`).join('') +
      (s[plusBar(s)] ? `<rect class="x" x="${L.cx - L.t / 2}" y="${L.cy - L.t / 2}" width="${L.t}" height="${L.t}"/>` : '') +
      // baris bawah: petunjuk (kiri), ulangi/lanjut (tengah); tombol cara bermain ada di bingkai game (pojok kanan bawah)
      `</svg></div><div class=msg>${msg}</div><div class="rr rrs"><button class=help id=hp aria-label="Petunjuk">?</button>` +
      (done ? '<button class=cta id=nx>Lanjut</button>' : '<button class="cta alt" id=rs>Ulangi</button>') + HELP_BTN + '</div>';
    if (done) rb.show(el.querySelector<HTMLElement>('.stk'), 'Benar!', 'win', newPuzzle, { inset: 48 });
  };

  const restart = (): void => { s = [...puzzle.start]; moves = 0; held = -1; hint = []; };

  const newPuzzle = (): void => {
    clearTimeout(hintTimer);
    rb.reset();
    K = movesOf();
    puzzle = nextPuzzle(level);
    path = statesAlongPlan(puzzle);
    restart();
    done = false;
    busy = false;
    msg = label();
    draw();
  };

  el.onclick = (e) => {
    const sw = hit(e, '[data-c]');
    if (sw) { color = sw.dataset.c as string; setStr('mgs', color); return draw(); }
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l); solved = 0; return newPuzzle(); }
    if (hit(e, '#nx')) return newPuzzle();
    if (hit(e, '#rs')) {
      if (busy || done) return;
      restart();
      msg = label();
      return draw();
    }
    if (hit(e, '#hp')) {
      if (done || busy) return;
      if (held >= 0) { s[held] = true; held = -1; }
      if (!(moves < K && s.join('') === (path[moves] as Slots).join(''))) restart();
      msg = label();
      hint = [...(puzzle.plan[moves] as [number, number])];
      draw();
      clearTimeout(hintTimer);
      hintTimer = window.setTimeout(() => { hint = []; draw(); }, 2200);
      return;
    }
    if (done || busy) return;
    const p = hit(e, '[data-i]');
    let i = p ? Number(p.dataset.i) : -1;
    // Mengetuk batang terisi yang menutupi slot kosong (mis. di tengah tanda "−"): pilih slot kosong di bawahnya.
    if (held >= 0 && (i < 0 || s[i])) {
      const under = document.elementsFromPoint(e.clientX, e.clientY)
        .map((x) => x.closest('.stk [data-i]') as HTMLElement | null)
        .find((x) => x && !s[Number(x.dataset.i)]);
      if (under) i = Number(under.dataset.i);
    }
    if (i < 0) return;
    if (held < 0) {
      if (s[i]) { held = i; s[i] = false; msg = 'Pilih tempat kosong'; draw(); }
      return;
    }
    if (s[i]) { msg = 'Pilih tempat kosong'; draw(); return; }
    const from = held;
    s = [...s];
    s[i] = true; // letakkan batang di slot baru (asal tetap kosong)
    held = -1;
    if (i === from) msg = label();
    else {
      moves++;
      if (isEquation(s)) { done = true; solved++; best(id + level, solved); msg = ''; }
      else if (moves >= K) {
        busy = true;
        msg = 'Salah';
        window.setTimeout(() => { if (dead) return; restart(); busy = false; msg = label(); draw(); }, 900);
      } else msg = `${K - moves} batang lagi`;
    }
    draw();
  };

  refillTimer = window.setTimeout(function tick() {
    if (dead) return;
    refillPool();
    refillTimer = window.setTimeout(tick, 30);
  }, 300);
  newPuzzle();
  return () => { dead = true; clearTimeout(hintTimer); clearTimeout(refillTimer); };
};
