import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { combine, fracText, isTarget, makePuzzle, OPS, type Frac, type Op, type Puzzle24 } from './logic.js';
import { frac } from './logic.js';

let level: Level = 1; // bertahan selama sesi

type Slots = Array<Frac | null>;

export const mountGame24: Mount = (id, el, info) => {
  let puzzle: Puzzle24;
  let cards: Slots = [];
  let history: Slots[] = [];
  let sel = -1;
  let op: Op | null = null;
  let solved = 0, msg = '', shake = -1;
  let done = false, busy = false, dead = false;
  let timer = 0;

  const left = (): number => cards.filter(Boolean).length;

  const draw = (): void => {
    if (dead) return;
    info('Benar ' + solved);
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      '<div class=g24>' +
      cards.map((c, i) => `<button class="cd24${i === sel ? ' sel' : ''}${c ? '' : ' gone'}${i === shake ? ' bad' : ''}" data-i=${i}>${c ? fracText(c) : ''}</button>`).join('') +
      '</div><div class=ops>' +
      OPS.map((o) => `<button data-o="${o}" class="${o === op ? 'on' : ''}">${o}</button>`).join('') +
      `</div><div class=msg>${msg}</div><div class=rr><button class=help id=hp aria-label="Petunjuk">?</button>` +
      '<button class="cta alt" id=un>Urungkan</button>' +
      (done ? '<button class=cta id=nx>Soal berikutnya</button>' : '<button class="cta alt" id=rs>Ulangi</button>') + '</div>';
  };

  const restart = (): void => {
    cards = puzzle.nums.map((n) => frac(n));
    history = [];
    sel = -1;
    op = null;
    shake = -1;
  };

  const newPuzzle = (): void => {
    clearTimeout(timer);
    puzzle = makePuzzle(level);
    restart();
    msg = '';
    done = false;
    busy = false;
    draw();
  };

  const finish = (): void => {
    const last = cards.find(Boolean) as Frac;
    if (isTarget(last)) {
      done = true;
      solved++;
      best(id + level, solved);
      msg = 'Benar!';
    } else {
      busy = true;
      msg = 'Salah';
      timer = window.setTimeout(() => { if (dead) return; restart(); busy = false; msg = ''; draw(); }, 900);
    }
  };

  const tapCard = (i: number): void => {
    if (!cards[i]) return;
    if (sel < 0 || sel === i) { sel = sel === i ? -1 : i; return; }
    if (!op) { sel = i; return; }
    const r = combine(cards[sel] as Frac, op, cards[i] as Frac);
    if (!r) { shake = i; msg = 'Tidak bisa dibagi nol'; return; }
    history.push([...cards]);
    cards[i] = r;
    cards[sel] = null;
    sel = -1;
    op = null;
    msg = '';
    if (left() === 1) finish();
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; solved = 0; return newPuzzle(); }
    if (hit(e, '#nx')) return newPuzzle();
    if (hit(e, '#rs')) { if (busy || done) return; restart(); msg = ''; return draw(); }
    if (hit(e, '#un')) {
      if (busy || done || !history.length) return;
      cards = history.pop() as Slots;
      sel = -1; op = null; msg = '';
      return draw();
    }
    if (hit(e, '#hp')) { if (busy || done) return; msg = puzzle.answer; return draw(); }
    if (busy || done) return;
    const c = hit(e, '[data-i]');
    const o = hit(e, '[data-o]');
    shake = -1;
    if (c) tapCard(Number(c.dataset.i));
    else if (o) op = op === o.dataset.o ? null : (o.dataset.o as Op); // operator boleh dipilih lebih dulu
    draw();
  };

  newPuzzle();
  return () => { dead = true; clearTimeout(timer); };
};
