import { HELP_BTN } from '../../app/howto.js';
import { hit } from '../../core/dom.js';
import { segment, type Level } from '../../core/html.js';
import { celebrate, clearBanner } from '../../core/banner.js';
import { sfx } from '../../core/sfx.js';
import type { Mount } from '../../core/types.js';
import { bestTime, fmtTime } from '../../app/records.js';
import { LEVEL_CFG, REGION_COLORS, generate, isDone, matchShape, normalize, pickColor, type Puzzle, type Shape } from './logic.js';

let level: Level = 0;

interface Region { cells: number[]; color: number }

export const mountShapes: Mount = (id, el, info) => {
  let pz!: Puzzle; // diisi newGame() di bawah
  let lock: number[] = [];
  const regions = new Map<number, Region>();
  let nextId = 0, maxSize = 0;
  let sel: number[] = [], drawing = false, flash = new Set<number>(), flashTimer = 0;
  let tapAt = -1, lx = 0, ly = 0, last = -1;
  let t0 = 0, iv = 0, elapsed = 0, started = false, won = false;
  let cellEls: HTMLElement[] = [];

  const board = (): HTMLElement => el.querySelector('.sbb') as HTMLElement;
  const say = (t: string): void => { const m = el.querySelector('#sbm'); if (m) m.textContent = t; };
  const filled = (): number => lock.filter((v) => v >= 0).length;
  const total = (): number => pz.cells.filter(Boolean).length;
  const hud = (): void => info(`Terisi ${filled()}/${total()} · ${fmtTime(started && !won ? performance.now() - t0 : elapsed)}`);

  const mini = (s: Shape, k: number): string => {
    const n = normalize(s), h = Math.max(...n.map((p) => p[0])) + 1, w = Math.max(...n.map((p) => p[1])) + 1;
    const on = new Set(n.map((p) => p[0] * w + p[1]));
    let cells = '';
    for (let i = 0; i < h * w; i++) cells += on.has(i) ? '<i></i>' : '<u></u>';
    return `<div class=sbm data-s=${k} style="grid-template:repeat(${h},1fr)/repeat(${w},1fr);width:${w * 17}px;height:${h * 17}px">${cells}</div>`;
  };

  const draw = (): void => {
    const { rows, cols } = pz;
    let cells = '';
    for (let i = 0; i < rows * cols; i++) cells += pz.cells[i] ? `<div class=sbc data-i=${i}></div>` : '<i></i>';
    el.innerHTML =
      segment('l', ['Mudah', 'Sedang', 'Sulit'], level) +
      `<div class=sbk><b>Semua area harus salah satu bentuk ini:</b><div class=sbs>${pz.bank.map(mini).join('')}</div></div>` +
      `<div class=sbb data-nosnd style="aspect-ratio:${cols}/${rows};grid-template:repeat(${rows},1fr)/repeat(${cols},1fr)">${cells}</div>` +
      '<div class=msg id=sbm></div><div class=rr><button class="cta alt" id=rs>Ulangi</button><button class="cta alt" id=re>Soal baru</button>' + HELP_BTN + '</div>';
    cellEls = [];
    el.querySelectorAll<HTMLElement>('.sbc').forEach((c) => { cellEls[Number(c.dataset.i)] = c; });
    const b = board();
    b.oncontextmenu = (e) => e.preventDefault();
    b.ondragstart = (e) => e.preventDefault();
  };

  const paintAll = (): void => {
    const { rows, cols } = pz;
    const selSet = new Set(sel);
    const nb = (r: number, c: number): number => (r >= 0 && c >= 0 && r < rows && c < cols && pz.cells[r * cols + c] ? r * cols + c : -1);
    for (let i = 0; i < rows * cols; i++) {
      if (!pz.cells[i]) continue;
      const b = cellEls[i] as HTMLElement, lk = lock[i] as number, r = Math.floor(i / cols), c = i % cols;
      const up = nb(r - 1, c), left = nb(r, c - 1), right = nb(r, c + 1), down = nb(r + 1, c);
      // Garis tebal digambar sekali: atas/kiri hanya di tepi papan, kanan/bawah juga di batas antar-area.
      let cls = 'sbc';
      if (up < 0) cls += ' sbt';
      if (left < 0) cls += ' sbl';
      if (right < 0 || lock[right] !== lk) cls += ' sbr';
      if (down < 0 || lock[down] !== lk) cls += ' sbd';
      if (flash.has(i)) cls += ' sbe';
      else if (selSet.has(i)) cls += ' sbp';
      b.className = cls;
      if (lk >= 0) b.dataset.s = String((regions.get(lk) as Region).color); else delete b.dataset.s;
    }
  };

  const stop = (): void => { clearInterval(iv); elapsed = started ? performance.now() - t0 : 0; };

  const win = (): void => {
    stop();
    won = true;
    const record = bestTime(id + level, elapsed);
    info('Selesai ' + fmtTime(elapsed));
    say(`Waktu ${fmtTime(elapsed)}${record ? ' · rekor baru!' : ''}`);
    celebrate(board(), `Selesai! ${fmtTime(elapsed)}`, 'win', { again: newGame });
  };

  const clearAll = (): void => {
    regions.clear();
    lock = new Array<number>(pz.rows * pz.cols).fill(-1);
    sel = [];
    flash = new Set();
    paintAll();
    hud();
  };

  const newGame = (): void => {
    clearInterval(iv);
    clearTimeout(flashTimer);
    pz = generate(LEVEL_CFG[level] as never);
    maxSize = Math.max(...pz.bank.map((s) => s.length));
    nextId = 0;
    started = won = drawing = false;
    elapsed = 0;
    tapAt = last = -1;
    draw();
    clearAll();
    say('');
  };

  const cellAt = (x: number, y: number): number => {
    const b = board().getBoundingClientRect();
    const c = Math.floor(((x - b.left) / b.width) * pz.cols), r = Math.floor(((y - b.top) / b.height) * pz.rows);
    if (r < 0 || c < 0 || r >= pz.rows || c >= pz.cols) return -1;
    const i = r * pz.cols + c;
    return pz.cells[i] ? i : -1;
  };

  /** Jari melewati petak `i`: tambahkan ke area yang sedang digambar (petak terkunci dilewati). */
  const extend = (i: number): void => {
    if (i < 0 || (lock[i] as number) >= 0) return;
    const prev = last;
    last = i;
    if (sel.includes(i) || sel.length >= maxSize) return;
    if (prev >= 0 && prev !== i) {
      // Gerakan miring melewati sudut: tambahkan petak penghubung agar area tetap utuh.
      const pr = Math.floor(prev / pz.cols), pc = prev % pz.cols, r = Math.floor(i / pz.cols), c = i % pz.cols;
      if (Math.abs(pr - r) === 1 && Math.abs(pc - c) === 1) {
        const ok = (k: number): boolean => pz.cells[k] === true && (lock[k] as number) < 0 && !sel.includes(k);
        const bridge = [pr * pz.cols + c, r * pz.cols + pc].find(ok);
        if (bridge !== undefined && sel.length + 2 <= maxSize) sel.push(bridge);
      }
    }
    sel.push(i);
    paintAll();
  };

  const commit = (): void => {
    const cells = sel;
    sel = [];
    last = -1;
    if (cells.length < 2) return paintAll();
    const k = matchShape(cells, pz.cols, pz.keys);
    if (k < 0) {
      sfx('bad');
      flash = new Set(cells);
      paintAll();
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => { flash = new Set(); paintAll(); }, 320);
      return;
    }
    const blocked = new Set<number>(), usage = new Array<number>(REGION_COLORS).fill(0);
    regions.forEach((r) => { usage[r.color] = (usage[r.color] ?? 0) + 1; });
    for (const c of cells) {
      const r = Math.floor(c / pz.cols), col = c % pz.cols;
      for (const [rr, cc] of [[r - 1, col], [r + 1, col], [r, col - 1], [r, col + 1]] as const) {
        if (rr < 0 || cc < 0 || rr >= pz.rows || cc >= pz.cols) continue;
        const lk = lock[rr * pz.cols + cc] as number;
        if (lk >= 0) blocked.add((regions.get(lk) as Region).color);
      }
    }
    regions.set(nextId, { cells, color: pickColor(blocked, usage) });
    for (const c of cells) lock[c] = nextId;
    nextId++;
    paintAll();
    hud();
    if (isDone(pz.cells, lock)) return win();
    sfx('good');
  };

  /** Batalkan status menang (mis. pemain menghapus area setelah selesai): timer lanjut dari waktu terakhir. */
  const unwin = (): void => {
    won = false;
    clearBanner(board());
    t0 = performance.now() - elapsed;
    clearInterval(iv);
    iv = window.setInterval(hud, 250);
    say('');
  };

  const erase = (rid: number): void => {
    const r = regions.get(rid);
    if (!r) return;
    if (won) unwin();
    for (const c of r.cells) lock[c] = -1;
    regions.delete(rid);
    sfx('pop');
    paintAll();
    hud();
  };

  el.onclick = (e) => {
    const l = hit(e, '[data-l]');
    if (l) { level = Number(l.dataset.l) as Level; return newGame(); }
    if (hit(e, '#rs')) { if (won) unwin(); clearAll(); return; }
    if (hit(e, '#re')) newGame();
  };

  // Menggambar lewat pointer (bukan click): jari menyentuh papan lalu diseret melewati kotak-kotak kosong.
  el.onpointerdown = (e) => {
    if (e.button !== 0 || hit(e, '.bn')) return; // mengetuk spanduk/tombolnya bukan menggambar
    const b = hit(e, '.sbb');
    if (!b) return;
    const i = cellAt(e.clientX, e.clientY);
    if (i < 0) return;
    lx = e.clientX; ly = e.clientY;
    try { b.setPointerCapture(e.pointerId); } catch { /* diabaikan */ }
    if ((lock[i] as number) >= 0) { tapAt = i; return; } // ketuk area terkunci = hapus (bila tidak digeser)
    if (!started) { started = true; t0 = performance.now(); iv = window.setInterval(hud, 250); }
    drawing = true;
    sel = [];
    last = -1;
    extend(i);
  };
  el.onpointermove = (e) => {
    if (tapAt >= 0) { if (Math.hypot(e.clientX - lx, e.clientY - ly) > 10) tapAt = -1; return; }
    if (!drawing) return;
    const cell = board().getBoundingClientRect().width / pz.cols;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (cell / 3)));
    for (let k = 1; k <= steps; k++) extend(cellAt(lx + (dx * k) / steps, ly + (dy * k) / steps));
    lx = e.clientX; ly = e.clientY;
  };
  el.onpointerup = () => {
    if (tapAt >= 0) { const rid = lock[tapAt] as number; tapAt = -1; return erase(rid); }
    if (!drawing) return;
    drawing = false;
    commit();
  };
  el.onpointercancel = () => { tapAt = -1; if (drawing) { drawing = false; sel = []; last = -1; paintAll(); } };

  newGame();
  return () => { clearInterval(iv); clearTimeout(flashTimer); };
};
