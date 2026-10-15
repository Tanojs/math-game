import { getJson, setJson } from '../core/storage.js';

const KEY = 'mgb';
const data: Record<string, number> = getJson<Record<string, number>>(KEY, {});

/** Skor/waktu terbaik tersimpan (0 jika belum ada). */
export const getRecord = (key: string): number => data[key] ?? 0;

/** Simpan skor jika lebih tinggi. Mengembalikan skor terbaik terbaru. */
export function best(key: string, score: number): number {
  const old = data[key] ?? 0;
  if (score > old) {
    data[key] = score;
    setJson(KEY, data);
  }
  return Math.max(old, score);
}

/** Simpan waktu (ms) jika lebih cepat. Mengembalikan true jika ini rekor baru. */
export function bestTime(key: string, ms: number): boolean {
  const old = data[key];
  if (old && ms >= old) return false;
  data[key] = ms;
  setJson(KEY, data);
  return true;
}

export function clearRecords(): void {
  for (const k of Object.keys(data)) delete data[k];
  setJson(KEY, data);
}

/** 1:02.3 */
export function fmtTime(ms: number): string {
  const s = ms / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;
}
