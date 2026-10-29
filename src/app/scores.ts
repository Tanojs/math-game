import { $ } from '../core/dom.js';
import { LEVELS } from '../core/html.js';
import { gameName, MATH_IDS } from '../games/registry.js';
import { fmtTime, getRecord } from './records.js';

const row = (name: string, chips: string): string => `<div class=row><b>${name}</b><span>${chips}</span></div>`;
const levelChips = (prefix: string): string => LEVELS.map((n, i) => `<i>${n} ${getRecord(prefix + i)}</i>`).join('');

/** Tab "Rekor": skor terbaik semua game. */
export function renderScores(): void {
  const rubik = [['2x2', 'rbk2'], ['3x3', 'rbk'], ['4x4', 'rbk4']] as const;
  $('#scr').innerHTML =
    '<h1 class="ttl">Rekor</h1><div class="card">' +
    MATH_IDS.map((id) => row(gameName(id), levelChips(id))).join('') +
    row('Hubungkan', levelChips('mtc')) +
    row('Game 24', levelChips('g24')) +
    row('Piramida Angka', levelChips('pyr')) +
    row('2048', `<i>${getRecord('g2048')}</i>`) +
    row('Pindahkan Batang', levelChips('stk')) +
    rubik.map(([n, k]) => row('Rubik ' + n, `<i>${getRecord(k) ? fmtTime(getRecord(k)) : '-'}</i>`)).join('') +
    row('Ketuk Berurutan', LEVELS.map((n, i) => `<i>${n} ${getRecord('tap' + i) ? fmtTime(getRecord('tap' + i)) : '-'}</i>`).join('')) +
    row('Tebak Kode', levelChips('cod')) +
    row('Geser Balok', levelChips('blk')) +
    row('Cermin', levelChips('mir')) +
    row('Isi Bentuk', LEVELS.map((n, i) => `<i>${n} ${getRecord('shp' + i) ? fmtTime(getRecord('shp' + i)) : '-'}</i>`).join('')) +
    row('Ranjau', LEVELS.map((n, i) => `<i>${n} ${getRecord('mns' + i) ? fmtTime(getRecord('mns' + i)) : '-'}</i>`).join('')) +
    '</div>';
}
