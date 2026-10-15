import { $, $$ } from '../core/dom.js';
import { getStr, setStr } from '../core/storage.js';
import { UI_ICONS } from '../icons/ui-icons.js';

export type Theme = 'system' | 'light' | 'dark';
const KEY = 'mgt2';
const NAMES: Record<Theme, string> = { light: 'Terang', dark: 'Gelap', system: 'Sistem' };
const NEXT: Record<Theme, Theme> = { system: 'light', light: 'dark', dark: 'system' };

const saved = getStr(KEY);
let theme: Theme = saved === 'light' || saved === 'dark' ? saved : 'system'; // awalnya selalu mengikuti sistem

export function applyTheme(): void {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  $('#tq').innerHTML = UI_ICONS[theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'auto'];
  $('#tq').title = 'Tema: ' + NAMES[theme];
  $$('#thm [data-th]').forEach((b) => b.classList.toggle('on', b.dataset.th === theme));
}
export function setTheme(t: Theme): void {
  theme = t;
  setStr(KEY, t);
  applyTheme();
}
export const cycleTheme = (): void => setTheme(NEXT[theme]);
