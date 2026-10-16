import { hit } from '../../core/dom.js';
import { segment, LEVELS } from '../../core/html.js';
import { celebrate, clearBanner, type BannerKind } from '../../core/banner.js';
import type { Mount } from '../../core/types.js';
import {
  apply, chooseBotMove, gameStatus, initialPosition, isWhitePiece, legalMoves, parseFen, positionKey,
  type Move, type Position,
} from './engine.js';
import { pieceHtml, pieceSvg } from './pieces.js';
import { sfx } from '../../core/sfx.js';

const START: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 };
const VAL: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };
const ORDER = ['q', 'r', 'b', 'n', 'p'] as const;
const BOT_DELAY = 420;
const DRAG_PX = 7;

let level = 1, vsFriend = 0, humanWhite = true; // bertahan selama sesi (humanWhite: sisi pemain saat lawan bot)

interface Snap { pos: Position; white: boolean; last: number[]; end: string; check: boolean }

/**
 * Catur v2. Prinsip stabilitas:
 *  - DOM dibangun SEKALI; langkah hanya mengubah variabel CSS (--r/--c) bidak, lalu transisi CSS yang menganimasikan (tanpa render ulang).
 *  - Posisi bidak/petak dalam persen, jadi tahan ganti ukuran layar & putar papan.
 *  - Input pointer (ketuk atau seret) dengan pointer capture; satu sumber kebenaran: `pos`.
 */
export const mountChess: Mount = (_id, el, info) => {
  let pos: Position = initialPosition();
  let white = true, end = '', check = false;
  let last: number[] = [];
  let sel = -1, targets: Move[] = [];
  let promoPend: Move[] | null = null;
  let thinking = false, dead = false, flipped = false;
  let timer = 0, endTimer = 0;
  const hist: Snap[] = [];
  const seen = new Map<string, number>();
  const pieces = new Map<number, HTMLElement>();
  let drag: { from: number; x: number; y: number; started: boolean; wasSel: boolean; el: HTMLElement } | null = null;

  el.innerHTML =
    '<div class=cwrap><div id=cctl></div>' +
    '<div class=cbar id=cb0></div>' +
    '<div class=cbd id=cbd><div class=cgrid></div><div class=clayer></div><div class=cpromo></div></div>' +
    '<div class=cbar id=cb1></div>' +
    '<div class=cst id=cst></div>' +
    '<div class=cact><button class=b id=cun>Urungkan</button><button class=b id=cfl>Putar</button><button class=b id=cre>Main lagi</button></div></div>';
  const q = <T extends HTMLElement>(s: string): T => el.querySelector(s) as T;
  const cbd = q('#cbd'), grid = q('.cgrid'), layer = q('.clayer'), promoEl = q('.cpromo');
  const sqEls: HTMLElement[] = [];
  for (let i = 0; i < 64; i++) {
    const s = document.createElement('div');
    s.className = ((i >> 3) + (i & 7)) % 2 ? 'dk' : 'lt';
    s.innerHTML = '<b class="cd r"></b><b class="cd f"></b>';
    grid.appendChild(s);
    sqEls.push(s);
  }

  // ---------- koordinat ----------
  const rc = (i: number): [number, number] => (flipped ? [7 - (i >> 3), 7 - (i & 7)] : [i >> 3, i & 7]);
  const place = (n: HTMLElement, i: number): void => {
    const [r, c] = rc(i);
    n.style.setProperty('--r', String(r));
    n.style.setProperty('--c', String(c));
  };
  const sqAt = (e: PointerEvent): number => {
    const b = cbd.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * 8, y = ((e.clientY - b.top) / b.height) * 8;
    if (x < 0 || y < 0 || x >= 8 || y >= 8) return -1;
    const c = Math.floor(x), r = Math.floor(y);
    return flipped ? (7 - r) * 8 + (7 - c) : r * 8 + c;
  };
  // Mode teman: bidak sisi atas diputar 180° supaya berhadapan dengan pemain di seberang. Mode bot: semua tegak.
  const facing = (): void => { cbd.classList.toggle('fr', vsFriend === 1); cbd.classList.toggle('fl', flipped); };
  const layoutAll = (): void => {
    facing();
    sqEls.forEach((s, i) => {
      place(s, i);
      const [r, c] = rc(i);
      (s.children[0] as HTMLElement).textContent = c === 0 ? String(8 - (i >> 3)) : '';
      (s.children[1] as HTMLElement).textContent = r === 7 ? 'abcdefgh'[i & 7] as string : '';
    });
    pieces.forEach((n, i) => place(n, i));
  };

  // ---------- bidak ----------
  const makePiece = (ch: string, i: number): HTMLElement => {
    const n = document.createElement('div');
    n.className = 'cpcw';
    n.innerHTML = pieceHtml(ch);
    place(n, i);
    return n;
  };
  const rebuild = (): void => {
    layer.innerHTML = '';
    pieces.clear();
    pos.sq.forEach((ch, i) => {
      if (!ch) return;
      const n = makePiece(ch, i);
      layer.appendChild(n);
      pieces.set(i, n);
    });
  };
  const drop = (n: HTMLElement): void => { n.classList.add('out'); window.setTimeout(() => n.remove(), 230); };
  const animateMove = (m: Move): void => {
    const [from, to, promo] = m;
    const piece = pos.sq[from] as string, n = pieces.get(from);
    if (!n) return rebuild();
    const t = piece.toLowerCase();
    const capSq = pos.sq[to] ? to : t === 'p' && (from & 7) !== (to & 7) ? (from & ~7) | (to & 7) : -1; // en passant
    if (capSq >= 0) { const c = pieces.get(capSq); if (c) { pieces.delete(capSq); drop(c); } }
    const go = (a: number, b: number, node: HTMLElement): void => {
      pieces.delete(a);
      pieces.set(b, node);
      place(node, b);
      node.classList.add('mv');
      window.setTimeout(() => node.classList.remove('mv'), 280);
    };
    go(from, to, n);
    if (t === 'k' && Math.abs((to & 7) - (from & 7)) === 2) { // rokade: benteng ikut
      const rank = to & ~7, king = (to & 7) > (from & 7);
      const rk = pieces.get(rank + (king ? 7 : 0));
      if (rk) go(rank + (king ? 7 : 0), rank + (king ? 5 : 3), rk);
    }
    if (promo) {
      const ch = isWhitePiece(piece) ? promo.toUpperCase() : promo;
      window.setTimeout(() => { n.innerHTML = pieceHtml(ch); n.classList.add('pop'); }, 190);
    }
  };

  // ---------- tampilan ----------
  const paint = (): void => {
    const tgt = new Map(targets.map((m) => [m[1], m]));
    const kingSq = check ? pos.sq.indexOf(white ? 'K' : 'k') : -1;
    sqEls.forEach((s, i) => {
      const base = ((i >> 3) + (i & 7)) % 2 ? 'dk' : 'lt';
      s.className = base + (last.includes(i) ? ' lm' : '') + (i === sel ? ' sel' : '') + (i === kingSq ? ' chk' : '') + (tgt.has(i) ? (pos.sq[i] || (sel >= 0 && (pos.sq[sel] as string).toLowerCase() === 'p' && (sel & 7) !== (i & 7)) ? ' capt' : ' hint') : '');
    });
  };
  const captured = (bySide: boolean): string => { // bidak lawan yang sudah dimakan `bySide`
    const left: Record<string, number> = { ...START };
    for (const x of pos.sq) if (x && isWhitePiece(x) !== bySide && left[x.toLowerCase()] !== undefined) (left[x.toLowerCase()] as number)--;
    return ORDER.map((t) => {
      const n = Math.max(0, left[t] as number);
      return n ? `<span class="cpc ${bySide ? 'k' : 'w'} sm">${pieceSvg(t)}</span>`.repeat(n) : '';
    }).join('');
  };
  const material = (side: boolean): number =>
    pos.sq.reduce((s, x) => (x && x.toLowerCase() !== 'k' ? s + (isWhitePiece(x) === side ? 1 : -1) * (VAL[x.toLowerCase()] as number) : s), 0);
  const name = (side: boolean): string => (vsFriend ? (side ? 'Putih' : 'Hitam') : side === humanWhite ? 'Kamu' : `Bot · ${LEVELS[level]}`);
  const bars = (): void => {
    [q('#cb0'), q('#cb1')].forEach((bar, k) => {
      const side = flipped ? k === 0 : k === 1; // atas = hitam (putih jika papan diputar)
      const adv = material(side);
      bar.className = 'cbar' + (white === side && !end ? ' on' : '');
      bar.innerHTML = `<span class=dot></span><b>${name(side)}</b><span class=cx>${captured(side)}</span>${adv > 0 ? `<i>+${adv}</i>` : ''}`;
    });
  };
  /** Teks hasil akhir; di mode teman tidak menyebut "komputer"/"kamu". */
  const endLabel = (): string => {
    if (!/^Skakmat/.test(end)) return end;
    const winnerWhite = !white; // yang kena skakmat adalah sisi yang sedang giliran
    return vsFriend ? `Skakmat! ${winnerWhite ? 'Putih' : 'Hitam'} menang!` : winnerWhite === humanWhite ? 'Skakmat! Kamu menang!' : 'Skakmat! Bot menang';
  };
  const statusText = (): string => {
    if (end) return endLabel();
    if (thinking) return 'Bot berpikir…';
    const who = white ? 'Putih' : 'Hitam';
    if (vsFriend) return check ? `Skak! Giliran ${who}` : `Giliran ${who}`;
    return check ? 'Skak! Giliranmu' : 'Giliranmu';
  };
  const status = (): void => {
    const t = statusText();
    const s = q('#cst');
    s.textContent = t;
    s.className = 'cst' + (end ? ' end' : check ? ' chk' : thinking ? ' think' : '');
    info(end ? '' : t);
    (q('#cun') as HTMLButtonElement).disabled = !hist.length;
  };
  const controls = (): void => {
    q('#cctl').innerHTML = segment('o', ['Lawan Bot', 'Main Bareng Teman'], vsFriend) +
      (vsFriend ? '' : segment('l', LEVELS, level) + segment('s', ['Main Putih', 'Main Hitam'], humanWhite ? 0 : 1));
  };
  const showEnd = (): void => {
    clearTimeout(endTimer);
    clearBanner(cbd);
    if (!end) return;
    const kind: BannerKind = /^Seri/.test(end) ? 'draw' : vsFriend || !white === humanWhite ? 'win' : 'lose';
    const text = endLabel();
    endTimer = window.setTimeout(() => { if (!dead && end) celebrate(cbd, text, kind); }, 380); // tunggu animasi langkah terakhir
  };
  const refresh = (): void => { paint(); bars(); status(); };

  // ---------- logika ----------
  const evaluate = (): void => {
    const key = positionKey(pos, white);
    const reps = (seen.get(key) ?? 0) + 1;
    seen.set(key, reps);
    ({ end, check } = gameStatus(pos, white, reps));
  };
  const play = (m: Move): void => {
    hist.push({ pos, white, last, end, check });
    animateMove(m);
    sfx(pos.sq[m[1]] ? 'capture' : 'move');
    if (navigator.vibrate && (pos.sq[m[1]] || false)) navigator.vibrate(12);
    pos = apply(pos, m);
    white = !white;
    last = [m[0], m[1]];
    sel = -1; targets = []; promoPend = null;
    hidePromo();
    evaluate();
    refresh();
    showEnd();
    if (check && !end && navigator.vibrate) navigator.vibrate([10, 40, 10]);
    if (!end && !vsFriend && white !== humanWhite) botTurn();
  };
  const botTurn = (): void => {
    thinking = true;
    status();
    timer = window.setTimeout(() => {
      timer = 0;
      if (dead || !thinking) return;
      const m = chooseBotMove(pos, level, !humanWhite);
      thinking = false;
      if (m) play(m); else refresh();
    }, BOT_DELAY);
  };
  const undo = (): void => {
    if (dead || !hist.length) return;
    clearTimeout(timer);
    thinking = false;
    do {
      const k = positionKey(pos, white);
      seen.set(k, Math.max(0, (seen.get(k) ?? 1) - 1));
      const s = hist.pop() as Snap;
      ({ pos, white, last, end, check } = s);
    } while (!vsFriend && white !== humanWhite && hist.length);
    sel = -1; targets = []; hidePromo();
    clearBanner(cbd); clearTimeout(endTimer);
    rebuild();
    refresh();
  };
  const reset = (): void => {
    clearTimeout(timer); clearTimeout(endTimer);
    pos = initialPosition();
    white = true; end = ''; check = false; last = []; sel = -1; targets = []; thinking = false;
    hist.length = 0; seen.clear();
    seen.set(positionKey(pos, true), 1);
    hidePromo(); clearBanner(cbd);
    flipped = !vsFriend && !humanWhite; // pemain selalu di bawah
    layoutAll();
    rebuild(); controls(); refresh();
    if (!vsFriend && !humanWhite) botTurn(); // bot (putih) jalan duluan
  };

  // ---------- promosi ----------
  const hidePromo = (): void => { promoPend = null; promoEl.className = 'cpromo'; promoEl.innerHTML = ''; };
  const showPromo = (ms: Move[]): void => {
    promoPend = ms;
    const w = isWhitePiece(pos.sq[(ms[0] as Move)[0]] as string);
    promoEl.innerHTML = '<div>' + (['q', 'r', 'b', 'n'] as const).map((t) => `<button data-p=${t}>${pieceHtml(w ? t.toUpperCase() : t)}</button>`).join('') + '</div>';
    promoEl.className = 'cpromo on';
  };

  // ---------- input ----------
  const canAct = (): boolean => !dead && !end && !thinking && !promoPend && (vsFriend === 1 || white === humanWhite);
  const mine = (i: number): boolean => { const p = pos.sq[i]; return !!p && isWhitePiece(p) === white; };
  const select = (i: number): void => { sel = i; targets = legalMoves(pos, white).filter((m) => m[0] === i); paint(); };
  const clearSel = (): void => { sel = -1; targets = []; paint(); };
  const tryMove = (to: number): boolean => {
    const ms = targets.filter((m) => m[1] === to);
    if (!ms.length) return false;
    if (ms.length > 1) showPromo(ms); else play(ms[0] as Move);
    return true;
  };
  const endDrag = (n: HTMLElement): void => { n.classList.remove('drag'); n.style.transform = ''; };

  cbd.addEventListener('pointerdown', (e) => {
    if (!canAct() || (e.target instanceof Element && e.target.closest('.cpromo, .bn'))) return;
    const i = sqAt(e);
    if (i < 0) return;
    if (sel >= 0 && targets.some((m) => m[1] === i)) { tryMove(i); return; }
    if (mine(i)) {
      const wasSel = sel === i, n = pieces.get(i);
      select(i);
      if (n) { drag = { from: i, x: e.clientX, y: e.clientY, started: false, wasSel, el: n }; cbd.setPointerCapture(e.pointerId); }
    } else clearSel();
  });
  cbd.addEventListener('pointermove', (e) => {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < DRAG_PX) return;
      drag.started = true;
      drag.el.classList.add('drag');
    }
    const b = cbd.getBoundingClientRect(), s = b.width / 8;
    drag.el.style.transform = `translate(${e.clientX - b.left - s / 2}px,${e.clientY - b.top - s * 0.9}px) scale(1.15)`;
  });
  const finish = (e: PointerEvent, cancel: boolean): void => {
    const d = drag;
    if (!d) return;
    drag = null;
    if (cbd.hasPointerCapture(e.pointerId)) cbd.releasePointerCapture(e.pointerId);
    if (d.started) {
      endDrag(d.el);
      const to = cancel ? -1 : sqAt(e);
      if (to >= 0 && to !== d.from) tryMove(to);
    } else if (d.wasSel && !cancel) clearSel();
  };
  cbd.addEventListener('pointerup', (e) => finish(e, false));
  cbd.addEventListener('pointercancel', (e) => finish(e, true));

  const onClick = (e: MouseEvent): void => {
    const o = hit(e, '[data-o]'), l = hit(e, '[data-l]'), sd = hit(e, '[data-s]'), p = hit(e, '[data-p]');
    if (o) { vsFriend = Number(o.dataset.o); return reset(); }
    if (l) { level = Number(l.dataset.l); return reset(); }
    if (sd) { humanWhite = sd.dataset.s === '0'; return reset(); }
    if (p && promoPend) { const m = promoPend.find((x) => x[2] === p.dataset.p); if (m) play(m); return; }
    if (promoPend && hit(e, '.cpromo') && !hit(e, '.cpromo button')) { hidePromo(); clearSel(); return; }
    if (hit(e, '#cun')) return undo();
    if (hit(e, '#cfl')) { flipped = !flipped; layoutAll(); bars(); return; }
    if (hit(e, '#cre')) return reset();
  };
  el.addEventListener('click', onClick);

  seen.set(positionKey(pos, true), 1);
  layoutAll();
  reset();

  // Hook pengujian e2e (hanya saat MODE=test): memuat posisi FEN.
  if (import.meta.env.MODE === 'test') {
    (window as unknown as Record<string, unknown>).__cs = {
      fen: (fen: string, whiteToMove = true) => {
        clearTimeout(timer);
        ({ pos } = parseFen(fen));
        white = whiteToMove; sel = -1; targets = []; thinking = false; end = ''; last = [];
        hist.length = 0; seen.clear();
        hidePromo(); clearBanner(cbd);
        evaluate();
        rebuild(); refresh();
      },
      board: () => pos.sq.map((x) => x || '.').join(''),
    };
  }
  return () => { dead = true; el.removeEventListener('click', onClick); clearTimeout(timer); clearTimeout(endTimer); };
};
