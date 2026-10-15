import { shuf } from '../../core/rand.js';

export interface CodeConfig { len: number; pool: string; tries: number }

/** Mudah: 3 angka dari 1-6 (8 kesempatan). Sedang: 4 angka 0-9 (10). Sulit: 5 angka 0-9 (12). Angka tidak berulang. */
export const CONFIG: readonly CodeConfig[] = [
  { len: 3, pool: '123456', tries: 8 },
  { len: 4, pool: '0123456789', tries: 10 },
  { len: 5, pool: '0123456789', tries: 12 },
];

export function makeSecret(cfg: CodeConfig): string {
  return shuf([...cfg.pool]).slice(0, cfg.len).join('');
}

/** exact = angka benar di posisi benar, near = angka benar tapi posisi salah. */
export function score(secret: string, guess: string): { exact: number; near: number } {
  let exact = 0;
  const restSecret: string[] = [], restGuess: string[] = [];
  for (let i = 0; i < secret.length; i++) {
    if (secret[i] === guess[i]) exact++;
    else { restSecret.push(secret[i] as string); restGuess.push(guess[i] as string); }
  }
  let near = 0;
  for (const g of restGuess) {
    const k = restSecret.indexOf(g);
    if (k >= 0) { near++; restSecret.splice(k, 1); }
  }
  return { exact, near };
}

/** Tebakan sah: panjang tepat, hanya angka dari pool, tanpa angka berulang. */
export function isValidGuess(cfg: CodeConfig, guess: string): boolean {
  return guess.length === cfg.len && [...guess].every((ch) => cfg.pool.includes(ch)) && new Set(guess).size === guess.length;
}

/** Semua kode yang masih cocok dengan riwayat tebakan (dipakai untuk menguji bahwa soal bisa dipecahkan). */
export function remainingCodes(cfg: CodeConfig, history: Array<{ guess: string; exact: number; near: number }>): string[] {
  const out: string[] = [];
  const rec = (prefix: string): void => {
    if (prefix.length === cfg.len) {
      if (history.every((h) => { const s = score(prefix, h.guess); return s.exact === h.exact && s.near === h.near; })) out.push(prefix);
      return;
    }
    for (const ch of cfg.pool) if (!prefix.includes(ch)) rec(prefix + ch);
  };
  rec('');
  return out;
}
