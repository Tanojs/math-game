import type { GameDef } from '../core/types.js';
import { mountMath } from './math/ui.js';
import { mountConnect } from './connect/ui.js';
import { mountSticks } from './sticks/ui.js';
import { mountXox } from './xox/ui.js';
import { mountPuzzle15 } from './puzzle15/ui.js';
import { mount2048 } from './game2048/ui.js';
import { mountSudoku } from './sudoku/ui.js';
import { mountChess } from './chess/ui.js';
import { mountReversi } from './reversi/ui.js';
import { mountRubik } from './rubik/ui.js';
import { mountGame24 } from './game24/ui.js';
import { mountPyramid } from './pyramid/ui.js';
import { mountTap } from './tap/ui.js';
import { mountCode } from './code/ui.js';
import { mountBlocks } from './blocks/ui.js';
import { mountMirror } from './mirror/ui.js';
import { mountMines } from './mines/ui.js';
import { mountShapes } from './shapes/ui.js';

/** Daftar game sesuai urutan di menu. Untuk menambah game: buat modul `mount…` lalu daftarkan di sini (+ ikon di icons/game-icons.ts). */
export const GAMES: GameDef[] = [
  { id: 'hc', name: 'Hitung Cepat', mount: mountMath },
  { id: 'tf', name: 'Benar/Salah', mount: mountMath },
  { id: 'op', name: 'Operator', mount: mountMath },
  { id: 'ty', name: 'Ketik Jawaban', mount: mountMath },
  { id: 'cmp', name: 'Bandingkan', mount: mountMath },
  { id: 'tb', name: 'Tabel Kali', mount: mountMath },
  { id: 'mtc', name: 'Hubungkan', mount: mountConnect },
  { id: 'g24', name: 'Game 24', mount: mountGame24 },
  { id: 'pyr', name: 'Piramida Angka', mount: mountPyramid },
  { id: 'stk', name: 'Pindahkan Batang', mount: mountSticks },
  { id: 'ttt', name: 'XOX', mount: mountXox },
  { id: 'g15', name: '15 Puzzle', mount: mountPuzzle15 },
  { id: 'g2048', name: '2048', mount: mount2048 },
  { id: 'sdk', name: 'Sudoku', mount: mountSudoku },
  { id: 'chs', name: 'Catur', mount: mountChess },
  { id: 'rev', name: 'Reversi', mount: mountReversi },
  { id: 'rbk', name: 'Rubik', mount: mountRubik },
  { id: 'tap', name: 'Ketuk Berurutan', mount: mountTap },
  { id: 'cod', name: 'Tebak Kode', mount: mountCode },
  { id: 'blk', name: 'Geser Balok', mount: mountBlocks },
  { id: 'mir', name: 'Cermin', mount: mountMirror },
  { id: 'mns', name: 'Ranjau', mount: mountMines },
  { id: 'shp', name: 'Isi Bentuk', mount: mountShapes },
];

export const MATH_IDS = ['hc', 'tf', 'op', 'ty', 'cmp', 'tb'] as const;
export const gameName = (id: string): string => GAMES.find((g) => g.id === id)?.name ?? id;
