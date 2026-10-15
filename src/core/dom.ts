/** Pintasan DOM yang aman-tipe. Jika elemen tidak ada, langsung error dengan pesan yang jelas (bukan null diam-diam). */
export const $ = <T extends HTMLElement = HTMLElement>(sel: string): T => {
  const el = document.querySelector<T>(sel);
  if (!el) throw new Error(`Elemen tidak ditemukan: ${sel}`);
  return el;
};

export const $$ = <T extends HTMLElement = HTMLElement>(sel: string, root: ParentNode = document): T[] =>
  [...root.querySelectorAll<T>(sel)];

/** Elemen terdekat dari target event yang cocok dengan selector (atau null). */
export const hit = <T extends HTMLElement = HTMLElement>(e: Event, sel: string): T | null => {
  const t = e.target;
  return t instanceof Element ? (t.closest(sel) as T | null) : null;
};
