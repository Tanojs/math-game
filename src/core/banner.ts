/** Spanduk hasil permainan yang tampil DI ATAS papan (menang / kalah / seri), dengan confetti saat menang. */
import { sfx } from './sfx.js';

export type BannerKind = 'win' | 'lose' | 'draw';

/** Setelah spanduk baru muncul, ketukan diabaikan sesaat: di HP, "click" dari jari yang baru diangkat jatuh ke spanduk yang baru muncul dan langsung menutupnya. */
const GRACE_MS = 600;

const CONFETTI = ['#FFE14D', '#FF6B5E', '#9BE564', '#5CE1E6', '#B8A1FF', '#FFA94D'];

export interface BannerOpts {
  /** Tanpa animasi masuk (dipakai saat papan digambar ulang setelah permainan selesai). */
  still?: boolean;
  /** Hilang sendiri setelah beberapa detik dan tidak menghalangi sentuhan (mis. kubus Rubik). */
  fade?: boolean;
  /** Tanpa bunyi (untuk game yang sudah membunyikan kemenangannya sendiri). */
  silent?: boolean;
  /** Tombol "Main lagi" di dalam spanduk. Spanduk dihapus lebih dulu, baru fungsi ini dipanggil. */
  again?: () => void;
  /** Dipanggil saat pemain mengetuk spanduk untuk menutupnya (bukan lewat tombol Main lagi). */
  onClose?: () => void;
  /** Spanduk menutupi gabungan elemen-elemen ini (mis. papan + tombol di bawahnya) alih-alih seluruh `host`. */
  span?: readonly Element[];
  /** Jarak (px) dari tepi kiri-kanan area game, supaya spanduk tidak menempel ke tepi layar. */
  inset?: number;
}

/** Sisi maksimum spanduk (= lebar maksimum papan XOX). */
const MAX_SIDE = 460;

/**
 * Semua spanduk berukuran sama: persegi selebar area game (maks. 460px), seperti papan XOX.
 * Spanduk dipasang di area game (`#st`) dan dipusatkan di atas `span` (papan/elemen yang diselesaikan).
 */
function placeSquare(bn: HTMLElement, stage: HTMLElement, span: readonly Element[], inset: number): void {
  const side = Math.min(MAX_SIDE, stage.clientWidth - 2 * inset);
  const S = stage.getBoundingClientRect();
  let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity;
  for (const e of span) {
    const q = e.getBoundingClientRect();
    t = Math.min(t, q.top); l = Math.min(l, q.left); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
  }
  const cx = (l + r) / 2 - S.left - stage.clientLeft + stage.scrollLeft;
  const cy = (t + b) / 2 - S.top - stage.clientTop + stage.scrollTop;
  const left = Math.max(0, Math.min(cx - side / 2, stage.scrollWidth - side));
  const top = Math.max(0, Math.min(cy - side / 2, stage.scrollHeight - side));
  Object.assign(bn.style, { inset: 'auto', top: `${top}px`, left: `${left}px`, width: `${side}px`, height: `${side}px` });
}

export function celebrate(host: HTMLElement, text: string, kind: BannerKind, opts: BannerOpts = {}): void {
  // fade (kubus Rubik) menempel pada host-nya; yang lain di area game supaya ukurannya seragam
  const stage = opts.fade ? host : (host.closest<HTMLElement>('#st') ?? host);
  host.querySelector(':scope > .bn')?.remove();
  stage.querySelector(':scope > .bn')?.remove();
  if (!opts.still && !opts.silent) sfx(kind);
  if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative'; // spanduk menutupi area
  const again = opts.fade ? undefined : opts.again;
  const born = performance.now();
  const early = (): boolean => !opts.still && performance.now() - born < GRACE_MS;
  const bn = document.createElement('div');
  bn.className = `bn ${kind}${opts.still ? ' still' : ''}${opts.fade ? ' fade' : ''}${again ? ' ag' : ''}`;
  const label = document.createElement('b');
  label.textContent = text;
  bn.appendChild(label);
  if (kind === 'win' && !opts.still) {
    for (let i = 0; i < 28; i++) {
      const c = document.createElement('i');
      const ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 140;
      c.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
      c.style.setProperty('--dy', `${Math.sin(ang) * dist - 40}px`);
      c.style.setProperty('--rot', `${Math.round(Math.random() * 720 - 360)}deg`);
      c.style.setProperty('--c', CONFETTI[i % CONFETTI.length] as string);
      c.style.animationDelay = `${Math.random() * 0.15}s`;
      bn.appendChild(c);
    }
  }
  if (again) {
    const btn = document.createElement('button');
    btn.className = 'bna';
    btn.textContent = 'Main lagi';
    btn.onclick = (e) => { e.stopPropagation(); if (early()) return; bn.remove(); again(); };
    bn.appendChild(btn);
  }
  bn.onclick = (e) => {
    if (early()) { e.stopPropagation(); return; }
    bn.remove();
    opts.onClose?.(); // ketuk spanduk = melihat papan lagi
  };
  if (!opts.fade) placeSquare(bn, stage, opts.span?.length ? opts.span : [host], opts.inset ?? 20);
  stage.appendChild(bn);
}

/**
 * Spanduk hasil untuk game yang menggambar ulang seluruh layar: panggil `show` setiap selesai menggambar.
 * Animasi + bunyi hanya sekali; setelah pemain menutupnya, spanduk tidak muncul lagi sampai `reset()` (soal baru).
 */
export function resultBanner(): {
  show: (host: HTMLElement | null, text: string, kind: BannerKind, again: () => void, opts?: BannerOpts) => void;
  reset: () => void;
} {
  let shown = false, dismissed = false;
  return {
    show(host, text, kind, again, opts = {}) {
      if (!host || dismissed) return;
      celebrate(host, text, kind, { ...opts, still: shown, again, onClose: () => { dismissed = true; } });
      shown = true;
    },
    reset() { shown = dismissed = false; },
  };
}

export const clearBanner = (host: HTMLElement | null): void => {
  host?.querySelector(':scope > .bn')?.remove();
  host?.closest<HTMLElement>('#st')?.querySelector(':scope > .bn')?.remove();
};

/** Posisi tata letak elemen (tidak terpengaruh transform/animasi yang sedang berjalan). */
export const layoutPos = (n: HTMLElement): { x: number; y: number } => ({ x: n.offsetLeft, y: n.offsetTop });

/** Geser elemen dari posisi lama ke posisi barunya (teknik FLIP) supaya perpindahan terlihat mulus. */
export function slideFrom(node: HTMLElement, from: { x: number; y: number }, ms = 140): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dx = from.x - node.offsetLeft, dy = from.y - node.offsetTop;
  if (!dx && !dy) return;
  node.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }], { duration: ms, easing: 'cubic-bezier(.25,.8,.35,1)' });
}
