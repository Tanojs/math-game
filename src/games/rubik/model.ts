import { R } from '../../core/rand.js';

/**
 * Model kubus Rubik n x n x n. Koordinat memakai satuan setengah-kotak supaya
 * bilangan genap (2x2, 4x4) tetap bulat: n=3 -> -2,0,2; n=2 -> -1,1; n=4 -> -3,-1,1,3.
 * Sumbu mengikuti CSS: x ke kanan, y ke bawah, z ke arah penonton.
 */
export type Vec3 = [number, number, number];
export type Mat3 = number[][];
export type FaceKey = 'x' | 'X' | 'y' | 'Y' | 'z' | 'Z';
export type FaceName = 'F' | 'B' | 'R' | 'L' | 'U' | 'D';

/** Satu putaran lapisan: sumbu `a`, koordinat lapisan `l`, arah `d` (+1/-1). */
export interface LayerMove { a: number; l: number; d: 1 | -1 }
export interface Cubie { p: Vec3; p0: Vec3; m: Mat3; s: FaceKey[] }

export const FACE_KEYS: FaceKey[] = ['x', 'X', 'y', 'Y', 'z', 'Z'];
/** Arah normal tiap sisi. y = atas (negatif karena sumbu y CSS ke bawah). */
export const DIRS: Record<FaceKey, Vec3> = { x: [1, 0, 0], X: [-1, 0, 0], y: [0, -1, 0], Y: [0, 1, 0], z: [0, 0, 1], Z: [0, 0, -1] };
export const IDENTITY: Mat3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];

const FACE_MAPS: Record<FaceName, (v: Vec3) => Vec3> = {
  F: ([x, y, z]) => [-y, x, z], B: ([x, y, z]) => [y, -x, z],
  R: ([x, y, z]) => [x, -z, y], L: ([x, y, z]) => [x, z, -y],
  U: ([x, y, z]) => [-z, y, x], D: ([x, y, z]) => [z, y, -x],
};
/** [sumbu, tanda lapisan terluar] untuk tiap sisi. */
const FACE_AXIS: Record<FaceName, [number, number]> = { F: [2, 1], B: [2, -1], R: [0, 1], L: [0, -1], U: [1, -1], D: [1, 1] };

const round = (A: Mat3): Mat3 => A.map((r) => r.map((v) => Math.round(v) || 0));
export const transpose = (A: Mat3): Mat3 => (A[0] as number[]).map((_, j) => A.map((r) => r[j] as number));
export const mulMat = (A: Mat3, B: Mat3): Mat3 =>
  round(A.map((r) => [0, 1, 2].map((j) => (r[0] as number) * (B[0] as number[])[j]! + (r[1] as number) * (B[1] as number[])[j]! + (r[2] as number) * (B[2] as number[])[j]!)));
export const mulVec = (A: Mat3, v: readonly number[]): Vec3 =>
  A.map((r) => Math.round((r[0] as number) * (v[0] as number) + (r[1] as number) * (v[1] as number) + (r[2] as number) * (v[2] as number)) || 0) as Vec3;

/** Matriks rotasi sumbu `a` sebesar `t` radian (tangan kanan). */
export function rotation(a: number, t: number): Mat3 {
  const c = Math.cos(t), s = Math.sin(t);
  return a === 0 ? [[1, 0, 0], [0, c, -s], [0, s, c]] : a === 1 ? [[c, 0, s], [0, 1, 0], [-s, 0, c]] : [[c, -s, 0], [s, c, 0], [0, 0, 1]];
}

const faceMatrix = (f: FaceName): Mat3 => transpose(IDENTITY.map((e) => FACE_MAPS[f](e as Vec3)));

/** Putaran sisi terluar (searah jarum jam jika dilihat dari luar; `prime` = berlawanan). */
export function faceMove(face: FaceName, prime: boolean, n: number): LayerMove {
  const [axis, sign] = FACE_AXIS[face];
  const same = JSON.stringify(round(rotation(axis, Math.PI / 2))) === JSON.stringify(faceMatrix(face));
  return { a: axis, l: sign * (n - 1), d: ((prime ? -1 : 1) * (same ? 1 : -1)) as 1 | -1 };
}

export const inverse = (m: LayerMove): LayerMove => ({ a: m.a, l: m.l, d: -m.d as 1 | -1 });
export const layerCoords = (n: number): number[] => Array.from({ length: n }, (_, i) => 2 * i - (n - 1));

export function createCubies(n: number): Cubie[] {
  const out: Cubie[] = [];
  const C = layerCoords(n);
  for (const x of C) for (const y of C) for (const z of C) {
    const p: Vec3 = [x, y, z];
    const s = FACE_KEYS.filter((k) => p[0] * DIRS[k][0] + p[1] * DIRS[k][1] + p[2] * DIRS[k][2] === n - 1);
    out.push({ p, p0: [...p], m: IDENTITY, s });
  }
  return out;
}

export const resetCubies = (cubies: Cubie[]): void => cubies.forEach((c) => { c.p = [...c.p0]; c.m = IDENTITY; });
export const inLayer = (cubies: Cubie[], m: LayerMove): Cubie[] => cubies.filter((c) => c.p[m.a] === m.l);

/** Terapkan putaran: posisi & orientasi cubie di lapisan itu berubah. */
export function commit(cubies: Cubie[], m: LayerMove): void {
  const Q = round(rotation(m.a, (m.d * Math.PI) / 2));
  for (const c of inLayer(cubies, m)) { c.p = mulVec(Q, c.p); c.m = mulMat(Q, c.m); }
}

/** Selesai jika tiap sisi dunia berwarna seragam (tidak peduli sisi mana yang warna apa). */
export function isSolved(cubies: Cubie[], colors: Record<FaceKey, string>): boolean {
  const seen: Record<string, string> = {};
  for (const c of cubies) for (const k of c.s) {
    const key = mulVec(c.m, DIRS[k]).join();
    if (seen[key] && seen[key] !== colors[k]) return false;
    seen[key] = colors[k];
  }
  return true;
}

/** Urutan acak (tanpa mengulang lapisan yang sama berturut-turut). */
export function scrambleMoves(n: number): LayerMove[] {
  const count = [12, 22, 40][n - 2] as number, C = layerCoords(n), out: LayerMove[] = [];
  let prev = '';
  for (let i = 0; i < count; i++) {
    let a: number, l: number;
    do {
      a = R(0, 2);
      l = n === 4 ? (C[R(0, 3)] as number) : R(0, 1) ? n - 1 : -(n - 1);
    } while (`${a},${l}` === prev);
    prev = `${a},${l}`;
    out.push({ a, l, d: R(0, 1) ? 1 : -1 });
  }
  return out;
}

/** Proyeksi (ortografis) vektor dunia ke layar untuk sudut pandang rx/ry (derajat). */
export function project(v: readonly number[], rx: number, ry: number): [number, number] {
  const a = (ry * Math.PI) / 180, b = (rx * Math.PI) / 180;
  const x1 = (v[0] as number) * Math.cos(a) + (v[2] as number) * Math.sin(a);
  const z1 = -(v[0] as number) * Math.sin(a) + (v[2] as number) * Math.cos(a);
  return [x1, (v[1] as number) * Math.cos(b) - z1 * Math.sin(b)];
}

/**
 * Geseran jari (dx, dy) pada stiker `face` milik `cubie` -> putaran lapisan,
 * atau null jika arahnya tidak jelas. Lapisan berputar searah geseran.
 */
export function dragToMove(cubie: Cubie, face: FaceKey, dx: number, dy: number, rx: number, ry: number): LayerMove | null {
  const n = mulVec(cubie.m, DIRS[face]);
  let axis = -1, bestDot = 0;
  for (let i = 0; i < 3; i++) {
    if (n[i]) continue;
    const s = project(IDENTITY[i] as number[], rx, ry), dot = dx * s[0] + dy * s[1];
    if (Math.abs(dot) > Math.abs(bestDot)) { bestDot = dot; axis = i; }
  }
  if (axis < 0) return null;
  const t: Vec3 = [0, 0, 0];
  t[axis] = bestDot > 0 ? 1 : -1;
  const a: Vec3 = [n[1] * t[2] - n[2] * t[1], n[2] * t[0] - n[0] * t[2], n[0] * t[1] - n[1] * t[0]];
  const j = a.findIndex((v) => v);
  if (j < 0) return null;
  return { a: j, l: cubie.p[j] as number, d: a[j] as 1 | -1 };
}
