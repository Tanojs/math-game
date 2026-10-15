/** Bilangan bulat acak di [a, b] (inklusif). */
export const R = (a: number, b: number): number => a + Math.floor(Math.random() * (b - a + 1));

/** Acak urutan array (Fisher-Yates) dan kembalikan array yang sama. */
export function shuf<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = R(0, i);
    [a[i], a[j]] = [a[j] as T, a[i] as T];
  }
  return a;
}

export const pick = <T>(a: readonly T[]): T => a[R(0, a.length - 1)] as T;
