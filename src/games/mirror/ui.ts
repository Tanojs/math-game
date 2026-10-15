import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { check, makePuzzle, type MirrorPuzzle } from './logic.js';

let level: Level = 0, pick = 0; // bertahan selama sesi
/** Warna blok yang bisa dipilih (hijau dicadangkan untuk "semua benar", merah untuk "salah"). */
const PALETTE = ['--c', '--o', '--v', '--k', '--y', '--bl'];

export const mountMirror: Mount = (id, el, info) => {
  let pz: MirrorPuzzle;
  let right: boolean[] = [];
  let moves = 0, solved = 0, done = false, painting: boolean | null = null, lastKey = '';
  let cells: HTMLElement[] = [];

  /** Isi tinggi layar: kontrol di atas, papan di tengah, tombol di bawah (tidak menumpuk di atas). */
  const fit = (): void => {
    const w = el.querySelector<HTMLElement>('.mrw');
    if (!w) return;
    const nav = document.querySelector('.nb')?.parentElement;
    const top = w.getBoundingClientRect().top + window.scrollY;
    w.style.minHeight = `${Math.max(0, window.innerHeight - top - (nav ? nav.getBoundingClientRect().height : 72) - 32)}px`;
  };

  const buttons = (): string =>
    '<button class="cta alt" id=rs>Ulangi</button>' + (done ? '<button class=cta id=nx>Soal berikutnya</button>' : '<button class="cta alt" id=nw>Soal baru</button>');

  const sync = (): void => {
    const res = check(pz, right);
    cells.forEach((c, i) => {
      const on = right[i] as boolean, bad = res.wrong.includes(i);
      c.className = 'mrc' + (on ? (res.solved ? ' ok' : bad ? ' bad' : ' on') : '');
      c.style.setProperty('--bc', on && !bad && !res.solved ? `var(${PALETTE[pick]})` : '');
      c.textContent = on && bad ? '✕' : '';
    });
    if (res.solved && !done) {
      done = true;
      solved++;
      best(id + level, solved);
      const rr = el.querySelector('.rr');
      if (rr) rr.innerHTML = buttons();
    }
    info(res.solved ? `Benar semua! ${moves} langkah` : 'Langkah ' + moves);
  };

  const draw = (): void => {
    const s = pz.size;
    const left = pz.target.map((t) => `<i class="mrc ${t ? 'sq' : 'dot'}"></i>`).join('');
    const rt = right.map((_, i) => `<b class=mrc data-i=${i}></b>`).join('');
    el.innerHTML =
      '<div class=mrw><div>' + segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      '<div class=mpal id=pal>' + PALETTE.map((c, i) => `<button class="msw${i === pick ? ' on' : ''}" data-p=${i} style="--bc:var(${c})" aria-label="Warna ${i + 1}"></button>`).join('') + '</div></div>' +
      `<div class=mrm><div class=mrb id=mrb style="--n:${s}"><div class="mrh l">${left}</div><div class="mrh r">${rt}</div></div></div>` +
      `<div class=rr>${buttons()}</div></div>`;
    cells = [...el.querySelectorAll<HTMLElement>('.mrh.r .mrc')];
    fit();
    sync();
  };

  const load = (fresh: boolean): void => {
    if (fresh) {
      let p = makePuzzle(level);
      for (let i = 0; i < 5 && p.target.join('') === lastKey; i++) p = makePuzzle(level);
      pz = p;
      lastKey = p.target.join('');
    }
    right = Array<boolean>(pz.size * pz.size).fill(false);
    moves = 0; done = false; painting = null;
    draw();
  };

  const apply = (i: number, v: boolean): void => {
    if (done || right[i] === v) return;
    right[i] = v;
    moves++;
    sync();
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]'), p = hit(e, '[data-p]');
    if (l) { level = Number(l.dataset.l) as Level; solved = 0; return load(true); }
    if (p) {
      pick = Number(p.dataset.p);
      el.querySelectorAll('.msw').forEach((b, k) => b.classList.toggle('on', k === pick));
      return sync(); // semua blok langsung ikut warna yang dipilih
    }
    if (hit(e, '#nx') || hit(e, '#nw')) return load(true);
    if (hit(e, '#rs')) load(false);
  };
  // ketuk untuk pasang/lepas blok; seret untuk "mewarnai" banyak petak sekaligus
  el.onpointerdown = (e) => {
    const c = hit(e, '.mrh.r .mrc');
    if (!c || done) return;
    const i = Number(c.dataset.i);
    painting = !right[i];
    apply(i, painting);
  };
  el.onpointermove = (e) => {
    if (painting === null || done) return;
    const t = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.mrh.r .mrc');
    if (t?.dataset.i !== undefined) apply(Number(t.dataset.i), painting);
  };
  const stop = (): void => { painting = null; };
  el.onpointerup = stop;
  el.onpointercancel = stop;

  window.addEventListener('resize', fit);
  load(true);
  return () => { window.removeEventListener('resize', fit); el.onclick = el.onpointerdown = el.onpointermove = el.onpointerup = el.onpointercancel = null; };
};
