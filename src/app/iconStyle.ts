import { $, $$ } from '../core/dom.js';
import { getStr, setStr } from '../core/storage.js';

export type IconStyle = 'solid' | 'line' | 'white';
const KEY = 'mgi';
const saved = getStr(KEY);
let style: IconStyle = saved === 'line' || saved === 'white' ? saved : 'solid';

export function applyIconStyle(): void {
  $('#hg').className = 'is-' + style;
  $$('#ics [data-is]').forEach((b) => b.classList.toggle('on', b.dataset.is === style));
}
export function setIconStyle(s: IconStyle): void {
  style = s;
  setStr(KEY, s);
  applyIconStyle();
}
