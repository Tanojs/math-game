import { faceMove, inverse, type FaceName, type LayerMove } from './model.js';

/**
 * Kasus latihan OLL/PLL (kubus 3x3). Algoritma dari zeroplay.io/docs/rubik/tutorials.
 * Kasus yang memakai rotasi seluruh kubus (x, y, z) tidak dimasukkan, karena model
 * kubus di sini hanya memutar lapisan. Notasi yang didukung: R L U D F B, r l u d f b,
 * M E S, dengan akhiran ', 2.
 */
export interface Case { name: string; alg: string }

export const OLL_CASES: readonly Case[] = [
  { name: 'Sune', alg: 'R U R\' U R U2 R\'' },
  { name: 'Antisune', alg: 'R U2 R\' U\' R U\' R\'' },
  { name: 'H', alg: 'R U R\' U R U\' R\' U R U2 R\'' },
  { name: 'Pi', alg: 'R U2 R2 U\' R2 U\' R2 U2 R' },
  { name: 'Headlights', alg: 'R2 D\' R U2 R\' D R U2 R' },
  { name: 'Chameleon', alg: 'r U R\' U\' r\' F R F\'' },
  { name: 'Bowtie', alg: 'F\' r U R\' U\' r\' F R' },
  { name: 'T', alg: 'R U R\' U\' R\' F R F\'' },
  { name: 'Dot', alg: 'F R U R\' U\' F\' f R U R\' U\' f\'' },
  { name: 'L-Shape', alg: 'f R U R\' U\' f\'' },
  { name: 'Line', alg: 'F R U R\' U\' F\'' },
  { name: 'L', alg: 'F R\' F\' R U R U\' R\'' },
];

export const PLL_CASES: readonly Case[] = [
  { name: 'Ua', alg: 'M2 U M U2 M\' U M2' },
  { name: 'Ub', alg: 'M2 U\' M U2 M\' U\' M2' },
  { name: 'H', alg: 'M2 U M2 U2 M2 U M2' },
  { name: 'Z', alg: 'M2 U M2 U M\' U2 M2 U2 M\'' },
  { name: 'T', alg: 'R U R\' U\' R\' F R2 U\' R\' U\' R U R\' F\'' },
  { name: 'Y', alg: 'F R U\' R\' U\' R U R\' F\' R U R\' U\' R\' F R F\'' },
  { name: 'F', alg: 'R\' U\' F\' R U R\' U\' R\' F R2 U\' R\' U\' R U R\' U R' },
  { name: 'Jb', alg: 'R U R\' F\' R U R\' U\' R\' F R2 U\' R\'' },
  { name: 'Ra', alg: 'R U\' R\' U\' R U R D R\' U\' R D\' R\' U2 R\'' },
  { name: 'Rb', alg: 'R\' U2 R U2 R\' F R U R\' U\' R\' F\' R2' },
  { name: 'Na', alg: 'R U R\' U R U R\' F\' R U R\' U\' R\' F R2 U\' R\' U2 R U\' R\'' },
  { name: 'Nb', alg: 'R\' U R U\' R\' F\' U\' F R U R\' F R\' F\' R U\' R' },
  { name: 'Ga', alg: 'R2 U R\' U R\' U\' R U\' R2 U\' D R\' U R D\'' },
  { name: 'Gb', alg: 'R\' U\' R U D\' R2 U R\' U R U\' R U\' R2 D' },
  { name: 'Gc', alg: 'R2 U\' R U\' R U R\' U R2 U D\' R U\' R\' D' },
  { name: 'Gd', alg: 'R U R\' U\' D R2 U\' R U\' R\' U R\' U R2 D\'' },
];

const turn = (f: FaceName, prime: boolean): LayerMove => faceMove(f, prime, 3);

/** Putaran irisan tengah (M, E, S) di lapisan tengah kubus 3x3; arahnya mengikuti sisi acuannya. */
function slice(s: 'M' | 'E' | 'S', prime: boolean): LayerMove {
  const base = s === 'M' ? faceMove('L', false, 3) : s === 'E' ? faceMove('D', false, 3) : faceMove('F', false, 3);
  const m: LayerMove = { a: base.a, l: 0, d: base.d };
  return prime ? inverse(m) : m;
}

/** Satu putaran (tanpa akhiran) menjadi daftar putaran lapisan. */
function quarter(tok: string, prime: boolean): LayerMove[] {
  switch (tok) {
    case 'R': case 'L': case 'U': case 'D': case 'F': case 'B':
      return [turn(tok, prime)];
    case 'M': case 'E': case 'S':
      return [slice(tok, prime)];
    // wide move: huruf kecil = dua lapisan (sisi + irisan di sebelahnya)
    case 'r': return [turn('R', prime), slice('M', !prime)];
    case 'l': return [turn('L', prime), slice('M', prime)];
    case 'u': return [turn('U', prime), slice('E', !prime)];
    case 'd': return [turn('D', prime), slice('E', prime)];
    case 'f': return [turn('F', prime), slice('S', prime)];
    case 'b': return [turn('B', prime), slice('S', !prime)];
    default: throw new Error('notasi tidak didukung: ' + tok);
  }
}

/** Ubah algoritma teks (mis. "R U R' U' ") menjadi daftar putaran lapisan. */
export function algMoves(alg: string): LayerMove[] {
  const out: LayerMove[] = [];
  for (const raw of alg.trim().split(/\s+/)) {
    const m = /^([RLUDFBrludfbMES])(2|')?$/.exec(raw);
    if (!m) throw new Error('token tidak valid: ' + raw);
    const tok = m[1] as string, suf = m[2] ?? '';
    const prime = suf === "'";
    const times = suf === '2' ? 2 : 1;
    for (let i = 0; i < times; i++) out.push(...quarter(tok, prime));
  }
  return out;
}

/** Putaran yang membawa kubus dari keadaan selesai ke kasus (kebalikan algoritma). */
export function setupMoves(alg: string): LayerMove[] {
  return algMoves(alg).reverse().map(inverse);
}
