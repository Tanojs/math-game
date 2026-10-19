import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { cellIndex, generate, violations, type PyramidPuzzle } from './logic.js';

let level: Level = 0;

export const mountPyramid: Mount = (id, el, info) => {
  let puzzle: PyramidPuzzle;
  let values: Array<number | null> = [];
  let sel = -1, buf = '', bad: number[] = [];
  let solved = 0, msg = '';
  let done = false;

  const blanks = (): number[] => puzzle.given.map((g, i) => (g ? -1 : i)).filter((i) => i >= 0);

  const draw = (): void => {
    info('Benar ' + solved);
    let rowsHtml = '';
    for (let r = 0; r < puzzle.rows; r++) {
      rowsHtml += '<div class=pr>';
      for (let c = 0; c <= r; c++) {
        const i = cellIndex(r, c), v = values[i];
        const cls = (puzzle.given[i] ? 'g' : '') + (i === sel ? ' sel' : '') + (bad.includes(i) ? ' er' : '');
        rowsHtml += `<button class="pcell ${cls}" data-i=${i}>${v ?? ''}</button>`;
      }
      rowsHtml += '</div>';
    }
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class=py>${rowsHtml}</div><div class="pad">` +
      [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '→'].map((k) => `<button class=b data-k="${k}">${k === '→' ? 'Enter' : k}</button>`).join('') +
      `</div><div class=msg>${msg}</div>` + `<button class=cta id=nx${done ? '' : ' style="visibility:hidden" tabindex=-1 aria-hidden=true'}>Soal berikutnya</button>`;
  };

  const newPuzzle = (): void => {
    puzzle = generate(level);
    values = puzzle.solution.map((v, i) => (puzzle.given[i] ? v : null));
    sel = blanks()[0] ?? -1;
    buf = '';
    bad = [];
    msg = '';
    done = false;
    draw();
  };

  const check = (): void => {
    bad = violations(values, puzzle.rows);
    if (!bad.length) { done = true; solved++; best(id + level, solved); msg = 'Benar!'; sel = -1; }
    else msg = 'Salah';
  };

  const select = (i: number): void => {
    sel = i;
    buf = values[i] === null ? '' : String(values[i]);
  };

  const press = (k: string): void => {
    if (done || sel < 0) return;
    if (k === '→') { // Enter: semua kotak terisi -> periksa jawaban; belum penuh -> pindah ke kotak kosong berikutnya
      if (values.every((v) => v !== null)) { check(); return; }
      const b = blanks(), at = b.indexOf(sel);
      select(b[(at + 1) % b.length] as number);
      return;
    }
    buf = k === '⌫' ? buf.slice(0, -1) : (buf + k).slice(0, 3);
    values[sel] = buf === '' ? null : Number(buf);
    bad = []; msg = ''; // benar/salah baru terlihat setelah Enter
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; solved = 0; return newPuzzle(); }
    if (hit(e, '#nx')) return newPuzzle();
    const c = hit(e, '[data-i]'), k = hit(e, '[data-k]');
    if (c && !done) { const i = Number(c.dataset.i); if (!puzzle.given[i]) select(i); }
    else if (k) press(k.dataset.k as string);
    draw();
  };

  const onKey = (e: KeyboardEvent): void => {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Tab' || e.key === 'Enter') { e.preventDefault(); press('→'); }
    else return;
    draw();
  };
  addEventListener('keydown', onKey);
  newPuzzle();
  return () => removeEventListener('keydown', onKey);
};
