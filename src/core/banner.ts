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
}

export function celebrate(host: HTMLElement, text: string, kind: BannerKind, opts: BannerOpts = {}): void {
  host.querySelector(':scope > .bn')?.remove();
  if (!opts.still && !opts.silent) sfx(kind);
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative'; // spanduk menutupi host
  if (!opts.fade && !opts.span?.length && host.clientHeight < 150) host.style.minHeight = '200px'; // host terlalu pendek (mis. 1 baris tebakan): beri ruang agar spanduk terbaca
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
  if (opts.span?.length) {
    // Letakkan spanduk tepat di atas gabungan elemen yang ditutupi (koordinat relatif terhadap host).
    const H = host.getBoundingClientRect();
    let t = Infinity, l = Infinity, r = -Infinity, b = -Infinity;
    for (const e of opts.span) {
      const q = e.getBoundingClientRect();
      t = Math.min(t, q.top); l = Math.min(l, q.left); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
    }
    Object.assign(bn.style, {
      inset: 'auto',
      top: `${t - H.top - host.clientTop + host.scrollTop}px`,
      left: `${l - H.left - host.clientLeft + host.scrollLeft}px`,
      width: `${r - l}px`,
      height: `${b - t}px`,
    });
  }
  bn.onclick = (e) => {
    if (early()) { e.stopPropagation(); return; }
    bn.remove();
    opts.onClose?.(); // ketuk spanduk = melihat papan lagi
  };
  host.appendChild(bn);
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

export const clearBanner = (host: HTMLElement | null): void => { host?.querySelector(':scope > .bn')?.remove(); };

/** Posisi tata letak elemen (tidak terpengaruh transform/animasi yang sedang berjalan). */
export const layoutPos = (n: HTMLElement): { x: number; y: number } => ({ x: n.offsetLeft, y: n.offsetTop });

/** Geser elemen dari posisi lama ke posisi barunya (teknik FLIP) supaya perpindahan terlihat mulus. */
export function slideFrom(node: HTMLElement, from: { x: number; y: number }, ms = 140): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dx = from.x - node.offsetLeft, dy = from.y - node.offsetTop;
  if (!dx && !dy) return;
  node.animate([{ transform: `translate(${dx}px,${dy}px)` }, { transform: 'translate(0,0)' }], { duration: ms, easing: 'cubic-bezier(.25,.8,.35,1)' });
}
