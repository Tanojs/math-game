import { $ } from '../core/dom.js';

/** Lembar isi (bottom sheet) untuk Tentang / Kebijakan Privasi / Cara bermain. */
export function openSheet(title: string, html: string, onClick?: (e: MouseEvent, root: HTMLElement) => void): void {
  closeSheet();
  const s = document.createElement('div');
  s.className = 'sheet';
  s.id = 'sheet';
  s.innerHTML = `<div class="sheet-in" role="dialog" aria-label="${title}"><h2>${title}</h2>${html}<button class="cta" id="sheet-x">Tutup</button></div>`;
  s.addEventListener('click', (e) => { if (e.target === s || (e.target as Element).id === 'sheet-x') closeSheet(); else onClick?.(e, s); });
  document.body.appendChild(s);
  $('#sheet-x').focus({ preventScroll: true });
}
export const closeSheet = (): void => { document.getElementById('sheet')?.remove(); };
