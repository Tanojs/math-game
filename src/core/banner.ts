/** Spanduk hasil permainan yang tampil DI ATAS papan (menang / kalah / seri), dengan confetti saat menang. */
export type BannerKind = 'win' | 'lose' | 'draw';

const CONFETTI = ['#FFE14D', '#FF6B5E', '#9BE564', '#5CE1E6', '#B8A1FF', '#FFA94D'];

export interface BannerOpts {
  /** Tanpa animasi masuk (dipakai saat papan digambar ulang setelah permainan selesai). */
  still?: boolean;
  /** Hilang sendiri setelah beberapa detik dan tidak menghalangi sentuhan (mis. kubus Rubik). */
  fade?: boolean;
}

export function celebrate(host: HTMLElement, text: string, kind: BannerKind, opts: BannerOpts = {}): void {
  host.querySelector(':scope > .bn')?.remove();
  const bn = document.createElement('div');
  bn.className = `bn ${kind}${opts.still ? ' still' : ''}${opts.fade ? ' fade' : ''}`;
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
  bn.onclick = () => bn.remove(); // ketuk untuk melihat papan lagi
  host.appendChild(bn);
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
