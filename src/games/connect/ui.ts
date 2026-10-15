import { $, hit } from '../../core/dom.js';
import { LEVELS, type Level } from '../../core/html.js';
import type { Cleanup, Mount } from '../../core/types.js';
import { best } from '../../app/records.js';
import { makeRound, PAIRS, type Round } from './logic.js';

let lastLevel: Level = 1;

interface Conn { i: number; j: number; ok: boolean }
interface Drag { i: number; x: number; y: number; p: [number, number] | null; moved: boolean }
interface Sel { s: 'l' | 'r'; k: number }

export const mountConnect: Mount = (id, el, info) => {
  let off: Cleanup | null = null;

  const menu = (): void => {
    off?.();
    off = null;
    info('');
    el.innerHTML = '<div class=modes>' + LEVELS.map((n, i) => `<button class="b mode" data-m=${i}>${n}</button>`).join('') + '</div>';
    el.onclick = (e) => {
      const b = hit(e, '[data-m]');
      if (b) { lastLevel = Number(b.dataset.m) as Level; off = run(lastLevel); }
    };
  };

  const run = (d: Level): Cleanup => {
    const pairs = PAIRS[d] as number;
    let t = 60, s = 0, over = false, last = 0, iv = 0, ct = 0;
    let round: Round = makeRound(d);
    let conn: Conn[] = [];
    let drag: Drag | null = null;
    let sel: Sel | null = null;

    el.innerHTML = '<div class=tm><i id=mb></i></div><div class=mt id=mt><svg id=ml></svg><div class=col id=lc></div><div class=col id=rc></div></div>';
    const mt = $('#mt');
    const isOk = (side: 'l' | 'r', k: number): boolean => conn.some((c) => c.ok && (side === 'l' ? c.i === k : c.j === k));

    const anchor = (side: 'l' | 'r', k: number): [number, number] => {
      const item = mt.querySelector(`[data-s=${side}][data-k="${k}"]`) as HTMLElement;
      const r = item.getBoundingClientRect(), m = mt.getBoundingClientRect();
      return [(side === 'l' ? r.right : r.left) - m.left, r.top + r.height / 2 - m.top];
    };

    const drawLines = (): void => {
      const line = (a: [number, number], b: [number, number], color: string, dashed: boolean): string =>
        `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" style="stroke:${color}" stroke-width="6" stroke-linecap="round"${dashed ? ' stroke-dasharray="2 10"' : ''}/>` +
        `<circle cx="${a[0]}" cy="${a[1]}" r="6" style="fill:${color}"/><circle cx="${b[0]}" cy="${b[1]}" r="6" style="fill:${color}"/>`;
      let h = '';
      for (const c of conn) h += line(anchor('l', c.i), anchor('r', c.j), c.ok ? 'var(--ink)' : '#FF3B30', !c.ok);
      if (drag?.p) h += line(anchor('l', drag.i), drag.p, 'var(--ink)', true);
      $('#ml').innerHTML = h;
    };

    const render = (): void => {
      $('#lc').innerHTML = round.left
        .map((e, i) => `<button class="mi l${isOk('l', i) ? ' ok' : ''}${sel?.s === 'l' && sel.k === i ? ' sel' : ''}" data-s=l data-k=${i}>${e.t}</button>`)
        .join('');
      $('#rc').innerHTML = round.right
        .map((x, j) => `<button class="mi r${isOk('r', j) ? ' ok' : ''}${sel?.s === 'r' && sel.k === j ? ' sel' : ''}" data-s=r data-k=${j}>${x.v}</button>`)
        .join('');
      drawLines();
    };

    const draw = (): void => {
      $('#mb').style.width = Math.max(0, (t / 60) * 100) + '%';
      info(`Skor ${s} · ${LEVELS[d]}`);
    };

    const end = (): void => {
      if (over) return;
      over = true;
      clearInterval(iv);
      clearTimeout(ct);
      const bs = best(id + d, s);
      el.innerHTML = `<div class=res><p>Waktu habis</p><h1>${s}</h1><p>terbaik ${bs}</p><button class=cta id=re>Main lagi</button><button class="cta alt" id=lv>Ganti level</button></div>`;
    };

    const connect = (i: number, j: number): void => {
      if (over || isOk('l', i) || isOk('r', j)) return;
      sel = null;
      if ((round.right[j] as { i: number }).i === i) {
        conn.push({ i, j, ok: true });
        s += 10;
        draw();
        render();
        if (conn.filter((c) => c.ok).length === pairs) {
          s += pairs * 2;
          draw();
          ct = window.setTimeout(() => {
            if (over) return;
            round = makeRound(d);
            conn = [];
            sel = null;
            render();
          }, 350);
        }
      } else {
        t -= 3;
        const wrong: Conn = { i, j, ok: false };
        conn.push(wrong);
        draw();
        render();
        window.setTimeout(() => {
          conn = conn.filter((c) => c !== wrong);
          if (!over) render();
        }, 450);
        if (t <= 0) end();
      }
    };

    mt.onpointerdown = (e) => {
      const b = hit(e, '.mi');
      if (!b || over || b.classList.contains('ok')) return;
      const side = b.dataset.s as 'l' | 'r', k = Number(b.dataset.k);
      if (sel && sel.s !== side) {
        if (side === 'l') connect(k, sel.k);
        else connect(sel.k, k);
        return;
      }
      if (side === 'l') {
        drag = { i: k, x: e.clientX, y: e.clientY, p: null, moved: false };
        mt.setPointerCapture(e.pointerId);
      } else {
        sel = { s: 'r', k };
        render();
      }
    };
    mt.onpointermove = (e) => {
      if (!drag) return;
      const m = mt.getBoundingClientRect();
      drag.p = [e.clientX - m.left, e.clientY - m.top];
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 8) drag.moved = true;
      drawLines();
    };
    mt.onpointerup = (e) => {
      if (!drag) return;
      const d0 = drag;
      drag = null;
      if (d0.moved) {
        const under = document.elementFromPoint(e.clientX, e.clientY);
        const target = under?.closest('.mi.r') as HTMLElement | null;
        if (target && !target.classList.contains('ok')) connect(d0.i, Number(target.dataset.k));
        else drawLines();
      } else {
        sel = { s: 'l', k: d0.i };
        render();
      }
    };
    mt.onpointercancel = () => { drag = null; drawLines(); };

    el.onclick = (e) => {
      const b = hit(e, 'button');
      if (!b) return;
      if (b.id === 're') { off?.(); off = run(d); }
      else if (b.id === 'lv') menu();
    };
    const onResize = (): void => { if (!over) drawLines(); };
    addEventListener('resize', onResize);

    render();
    draw();
    last = performance.now();
    iv = window.setInterval(() => {
      const now = performance.now();
      t -= (now - last) / 1000;
      last = now;
      if (t <= 0) end();
      else draw();
    }, 100);
    return () => {
      over = true;
      clearInterval(iv);
      clearTimeout(ct);
      removeEventListener('resize', onResize);
    };
  };

  menu();
  return () => off?.();
};
