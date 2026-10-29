import { hit } from '../../core/dom.js';
import { resultBanner } from '../../core/banner.js';
import { segment, type Level } from '../../core/html.js';
import type { Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { CONFIG, isValidGuess, makeSecret, score, type CodeConfig } from './logic.js';

let level: Level = 1;

interface Row { guess: string; exact: number; near: number }

export const mountCode: Mount = (id, el, info) => {
  let cfg: CodeConfig = CONFIG[level] as CodeConfig;
  let secret = '', cur = '';
  let rows: Row[] = [];
  let solved = 0, state: 'play' | 'win' | 'lose' = 'play';
  const rb = resultBanner();

  const boxes = (s: string, len: number): string =>
    Array.from({ length: len }, (_, i) => `<i class="${s[i] ? 'f' : ''}">${s[i] ?? ''}</i>`).join('');

  const draw = (): void => {
    info(`${rows.length}/${cfg.tries} · Benar ${solved}`);
    const history = rows
      .map((r) => `<div class=cdr><span class=cdg>${boxes(r.guess, cfg.len)}</span><span class=cdf><b class=fx>${r.exact}</b><b class=fn>${r.near}</b></span></div>`)
      .join('');
    const current = state === 'play' ? `<div class="cdr cur"><span class=cdg>${boxes(cur, cfg.len)}</span></div>` : '';
    const pad = [...cfg.pool, '⌫', '✓'].map((k) => {
      const off = (k !== '⌫' && k !== '✓' && cur.includes(k)) || (k === '✓' && cur.length !== cfg.len);
      return `<button class=b data-k="${k}"${off ? ' disabled' : ''}>${k}</button>`;
    }).join('');
    const msg = state === 'win' ? 'Benar!' : state === 'lose' ? `Kode: ${secret}` : '<b class=fx></b> tepat <b class=fn></b> geser';
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class=cdh>${history}${current}</div>` +
      (state === 'play' ? `<div class="pad">${pad}</div>` : '') +
      `<div class=msg>${msg}</div>` + (state === 'play' ? '' : `<button class=cta id=nx>${state === 'win' ? 'Soal berikutnya' : 'Coba lagi'}</button>`);
    if (state !== 'play') rb.show(el.querySelector<HTMLElement>('.cdh'), state === 'win' ? 'Benar!' : `Kode: ${secret}`, state === 'win' ? 'win' : 'lose', newGame);
  };

  const newGame = (): void => {
    rb.reset();
    cfg = CONFIG[level] as CodeConfig;
    secret = makeSecret(cfg);
    cur = '';
    rows = [];
    state = 'play';
    draw();
  };

  const submit = (): void => {
    if (!isValidGuess(cfg, cur)) return;
    const s = score(secret, cur);
    rows.push({ guess: cur, ...s });
    cur = '';
    if (s.exact === cfg.len) { state = 'win'; solved++; best(id + level, solved); }
    else if (rows.length >= cfg.tries) state = 'lose';
  };

  const press = (k: string): void => {
    if (state !== 'play') return;
    if (k === '⌫') cur = cur.slice(0, -1);
    else if (k === '✓') submit();
    else if (cur.length < cfg.len && !cur.includes(k) && cfg.pool.includes(k)) cur += k;
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; solved = 0; return newGame(); }
    if (hit(e, '#nx')) return newGame();
    const k = hit(e, '[data-k]');
    if (k && !(k as HTMLButtonElement).disabled) { press(k.dataset.k as string); draw(); }
  };
  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Backspace') press('⌫');
    else if (e.key === 'Enter') press('✓');
    else if (cfg.pool.includes(e.key)) press(e.key);
    else return;
    draw();
  };
  addEventListener('keydown', onKey);
  newGame();
  return () => removeEventListener('keydown', onKey);
};
