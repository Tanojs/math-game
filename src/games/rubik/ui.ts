import { $, $$, hit } from '../../core/dom.js';
import { getStr, setStr } from '../../core/storage.js';
import { celebrate } from '../../core/banner.js';
import type { Mount } from '../../core/types.js';
import { bestTime, fmtTime } from '../../app/records.js';
import { sfx } from '../../core/sfx.js';
import type { SfxKind } from '../../core/audio.js';
import {
  commit, createCubies, dragToMove, DIRS, faceMove, FACE_KEYS, inLayer, inverse, isSolved, mulMat, resetCubies,
  rotation, scrambleMoves, type Cubie, type FaceKey, type FaceName, type LayerMove, type Mat3,
} from './model.js';

const SCR = ['rtk1', 'rtk2', 'rtk3'] as const;
const COLOR: Record<FaceKey, string> = { x: '#D7192D', X: '#FF6B00', y: '#FFFFFF', Y: '#FFD60A', z: '#00A651', Z: '#0057E7' };
const LETTER: Record<FaceKey, string> = { x: 'M', X: 'O', y: 'P', Y: 'K', z: 'H', Z: 'B' };
const LETTER_COLOR: Record<FaceKey, string> = { x: '#fff', X: '#000', y: '#000', Y: '#000', z: '#000', Z: '#fff' };
const FACE_TRANSFORM: Record<FaceKey, string> = {
  z: 'translateZ(29px)', Z: 'rotateY(180deg) translateZ(29px)', x: 'rotateY(90deg) translateZ(29px)',
  X: 'rotateY(-90deg) translateZ(29px)', y: 'rotateX(90deg) translateZ(29px)', Y: 'rotateX(-90deg) translateZ(29px)',
};
const BUTTON_COLOR: Record<FaceName, FaceKey> = { U: 'y', D: 'Y', L: 'X', R: 'x', F: 'z', B: 'Z' };
const FACES: FaceName[] = ['U', 'D', 'L', 'R', 'F', 'B'];

let size = 3; // bertahan selama sesi

type Kind = 'u' | 's' | 'z'; // u = langkah pemain, s = pengacakan, z = urungkan/balikkan
interface Job { m: LayerMove; k: Kind; ms: number }

const matrix3d = (M: Mat3): string => {
  const r = (i: number, j: number): number => (M[i] as number[])[j] as number;
  return `matrix3d(${r(0, 0)},${r(1, 0)},${r(2, 0)},0,${r(0, 1)},${r(1, 1)},${r(2, 1)},0,${r(0, 2)},${r(1, 2)},${r(2, 2)},0,0,0,0,1)`;
};

export const mountRubik: Mount = (_id, el, info) => {
  let N = size;
  let cubies: Cubie[] = [];
  let els: HTMLElement[] = [];
  let hist: LayerMove[] = [];
  let moves = 0, t0 = 0;
  let running = false, scrambled = false, busy = false, dead = false;
  let queue: Job[] = [];
  let scr = 0;
  let rx = -28, ry = -38;

  el.innerHTML =
    '<div class=seg id=rsz>' + [2, 3, 4].map((n) => `<button data-n=${n}>${n}x${n}</button>`).join('') + '</div>' +
    '<div class="rv"><div class="sc" id="sc"></div></div><div class=msg id=rm></div><div class=rg>' +
    ['', "'"].map((q) => FACES.map((f) => `<button class=b data-f="${f + q}" style="background:${COLOR[BUTTON_COLOR[f]]};color:#000">${f + q}</button>`).join('')).join('') +
    '</div><div class=rc><button class=cta data-a=s>Acak</button><button class="cta alt" data-a=u>Urungkan</button>' +
    '<button class="cta alt" data-a=v>Balikkan semua</button><button class="cta alt" data-a=r>Reset</button>' +
    '<button class="cta alt" data-a=l>Huruf warna</button></div><div class=lgd id=lg></div>';

  const rakitKubus = (): void => {
    cubies = createCubies(N);
    $('#sc').innerHTML = '';
    els = cubies.map((c, idx) => {
      const e = document.createElement('div');
      e.className = 'cb';
      e.dataset.ci = String(idx);
      e.innerHTML = FACE_KEYS.map((k) => {
        const on = c.s.includes(k);
        return `<i data-k="${k}" style="transform:${FACE_TRANSFORM[k]};background:${on ? COLOR[k] : '#111'};--lc:${LETTER_COLOR[k]}">${on ? LETTER[k] : ''}</i>`;
      }).join('');
      $('#sc').appendChild(e);
      return e;
    });
    $$('#rsz button').forEach((b) => b.classList.toggle('on', Number(b.dataset.n) === N));
  };

  const place = (i: number, extra?: Mat3): void => {
    const c = cubies[i] as Cubie;
    (els[i] as HTMLElement).style.transform =
      (extra ? matrix3d(extra) : '') + ` translate3d(${c.p[0] * 30}px,${c.p[1] * 30}px,${c.p[2] * 30}px) ` + matrix3d(c.m);
  };
  const placeAll = (): void => cubies.forEach((_, i) => place(i));
  const view = (): void => {
    $('#sc').style.transform = `scale(${Math.min(1.6, el.clientWidth / (N * 110))}) rotateX(${rx}deg) rotateY(${ry}deg)`;
  };

  const recordKey = (): string => (N === 3 ? 'rbk' : 'rbk' + N);
  const hud = (): void => info(`${running ? fmtTime(Date.now() - t0) : '0:00.0'} · ${moves} langkah`);
  const say = (t: string): void => { const m = document.getElementById('rm'); if (m) m.textContent = t; };
  const solved = (): boolean => isSolved(cubies, COLOR);

  // ---- animasi & antrean ----
  const animate = (m: LayerMove, ms: number, done: () => void): void => {
    const layer = inLayer(cubies, m).map((c) => cubies.indexOf(c));
    const start = performance.now();
    const frame = (now: number): void => {
      if (dead) return;
      const k = Math.min(1, (now - start) / ms);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      if (k < 1) { layer.forEach((i) => place(i, rotation(m.a, m.d * e * Math.PI / 2))); requestAnimationFrame(frame); }
      else { commit(cubies, m); placeAll(); done(); }
    };
    requestAnimationFrame(frame);
  };

  const pump = (): void => {
    if (busy || dead) return;
    const job = queue.shift();
    if (!job) return;
    busy = true;
    animate(job.m, job.ms, () => {
      busy = false;
      // suara: putaran sendiri = "klak"; saat mengacak = rentetan "tek-tek-tek" bernada bervariasi, ditutup bunyi "nyes" saat berhenti
      if (job.k === 's') { sfx(SCR[scr++ % 3] as SfxKind); if (!queue.length) sfx('settle'); } else sfx('turn');
      if (job.k === 'u') {
        hist.push(job.m);
        moves++;
        if (scrambled && !running) { running = true; t0 = Date.now(); }
        hud();
        if (scrambled && solved()) {
          running = false;
          scrambled = false;
          const time = Date.now() - t0;
          const record = bestTime(recordKey(), time);
          say(`Selesai! ${fmtTime(time)} · ${moves} langkah${record ? ' · rekor baru!' : ''}`);
          const host = $('.rv');
          celebrate(host, record ? `Selesai! ${fmtTime(time)}\nRekor baru!` : `Selesai! ${fmtTime(time)}`, 'win', { fade: true });
          host.classList.remove('cel');
          void host.offsetWidth;
          host.classList.add('cel');
        }
      } else if (job.k === 's') { if (!queue.length) say(''); }
      else if (!queue.length && !hist.length && !scrambled) say('');
      pump();
    });
  };
  const go = (m: LayerMove, k: Kind, ms = 170): void => { queue.push({ m, k, ms }); pump(); };

  const resetAll = (): void => { resetCubies(cubies); placeAll(); hist = []; moves = 0; scrambled = false; running = false; queue = []; };
  const setSize = (n: number): void => {
    if (busy || queue.length || n === N) return;
    N = size = n;
    hist = []; moves = 0; scrambled = false; running = false; queue = [];
    rakitKubus(); placeAll(); view(); hud(); say('');
  };

  const actions: Record<string, () => void> = {
    s: () => {
      if (busy || queue.length) return;
      resetAll();
      for (const m of scrambleMoves(N)) { hist.push(m); go(m, 's', 75); }
      scrambled = true; say(''); hud();
    },
    u: () => {
      if (busy || queue.length || !hist.length) return;
      go(inverse(hist.pop() as LayerMove), 'z');
      moves = Math.max(0, moves - 1);
      if (!hist.length) { scrambled = false; running = false; }
      hud();
    },
    v: () => {
      if (busy || queue.length || !hist.length) return;
      scrambled = false; running = false;
      const h = [...hist].reverse();
      hist = [];
      h.forEach((x) => go(inverse(x), 'z', 90));
      say('');
    },
    r: () => { if (busy) return; resetAll(); say(''); hud(); },
    l: () => { const on = $('.rv').classList.toggle('lb'); legend(on); setStr('mgl', on ? '1' : ''); },
  };

  el.onclick = (e) => {
    const nb = hit(e, '[data-n]');
    if (nb) return setSize(Number(nb.dataset.n));
    const b = hit(e, 'button');
    if (!b) return;
    const f = b.dataset.f;
    if (f) go(faceMove(f[0] as FaceName, f.length > 1, N), 'u');
    else if (b.dataset.a) actions[b.dataset.a]?.();
  };

  // ---- geser: stiker = putar lapisan, ruang kosong di luar kubus = putar seluruh kubus ----
  const rv = $('.rv');
  let drag: { x: number; y: number; ci: number; face: FaceKey | null } | null = null;
  const legend = (on: boolean): void => { $('#lg').textContent = on ? 'P putih · K kuning · O oranye · M merah · H hijau · B biru' : ''; };
  rv.ondragstart = (e) => e.preventDefault();
  rv.oncontextmenu = (e) => e.preventDefault();
  if (getStr('mgl')) { rv.classList.add('lb'); legend(true); }

  rv.onpointerdown = (e) => {
    const f = hit(e, 'i');
    const cell = f?.parentElement;
    const ci = cell?.dataset.ci !== undefined ? Number(cell.dataset.ci) : -1;
    const face = f?.dataset.k as FaceKey | undefined;
    const outer = ci >= 0 && face && (cubies[ci] as Cubie).s.includes(face);
    drag = { x: e.clientX, y: e.clientY, ci: outer ? ci : -1, face: outer ? (face as FaceKey) : null };
    rv.setPointerCapture(e.pointerId);
  };
  rv.onpointermove = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (drag.face) {
      if (Math.hypot(dx, dy) < 12) return;
      const m = dragToMove(cubies[drag.ci] as Cubie, drag.face, dx, dy, rx, ry);
      drag = null;
      if (m && !busy && !queue.length) go(m, 'u');
      return;
    }
    ry += dx * 0.6;
    rx = Math.max(-85, Math.min(85, rx - dy * 0.6));
    drag.x = e.clientX;
    drag.y = e.clientY;
    view();
  };
  rv.onpointerup = () => { drag = null; };
  rv.onpointercancel = () => { drag = null; };

  const onKey = (e: KeyboardEvent): void => {
    const f = e.key.toUpperCase();
    if (f.length === 1 && 'UDLRFB'.includes(f)) go(faceMove(f as FaceName, e.shiftKey, N), 'u');
  };
  addEventListener('keydown', onKey);
  const iv = window.setInterval(() => { if (running) hud(); }, 100);

  rakitKubus();
  placeAll();
  view();
  hud();
  say('');

  // Hook pengujian e2e (hanya saat MODE=test)
  if (import.meta.env.MODE === 'test') {
    (window as unknown as Record<string, unknown>).__rb = {
      solved, hist: () => hist, moves: () => moves, busy: () => busy || queue.length, n: () => N, cnt: () => cubies.length,
      go: (a: number, l: number, d: 1 | -1) => go({ a, l, d }, 'u'),
      fr: () => cubies.map((c, i) => ({ c, i })).filter(({ c }) => c.p[2] === N - 1).map(({ c, i }) => {
        const r = (els[i] as HTMLElement).querySelector('i[data-k=z]')!.getBoundingClientRect();
        return { i, x: r.x + r.width / 2, y: r.y + r.height / 2, p: c.p };
      }),
      v: () => [rx, ry], ps: () => cubies.map((c) => ({ p: c.p, m: c.m })),
      st: () => cubies.map((c) => ({ p: c.p, m: c.m, s: c.s.map((k) => [k, COLOR[k]]) })),
      mulMat, DIRS,
    };
  }

  return () => { dead = true; clearInterval(iv); removeEventListener('keydown', onKey); };
};
