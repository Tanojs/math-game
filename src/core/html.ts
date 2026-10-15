/** Tombol segmen (Mudah/Sedang/Sulit, 3x3/4x4/…). `values` = nilai data-atribut jika bukan indeks. */
export const segment = (attr: string, labels: readonly string[], current: number, values?: readonly number[]): string =>
  '<div class="seg">' +
  labels
    .map((label, i) => {
      const v = values ? (values[i] as number) : i;
      return `<button data-${attr}=${v} class="${v === current ? 'on' : ''}">${label}</button>`;
    })
    .join('') +
  '</div>';

export const LEVELS = ['Mudah', 'Sedang', 'Sulit'] as const;
export type Level = 0 | 1 | 2;
