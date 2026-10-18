export interface Track { name: string; url: string }

/**
 * Lagu bawaan (opsional): semua berkas di src/assets/music/*.mp3|ogg|m4a otomatis dibundel oleh Vite
 * (build satu-file untuk pratinjau mengabaikannya). Nama tampilan diambil dari nama berkas:
 * "01-santai-sore.mp3" -> "Santai Sore". Kosong = pakai musik sintetis.
 */
const found = import.meta.glob<string>('../assets/music/*.{mp3,ogg,m4a}', { eager: true, query: '?url', import: 'default' });
export const prettify = (path: string): string =>
  (path.split('/').pop() ?? path).replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const TRACK_LIST: Track[] = Object.keys(found).sort().map((k) => ({ name: prettify(k), url: found[k] as string }));
