import { nativePlugin } from './native.js';
import { APP_NAME, SHARE_URL } from './brand.js';
import { GAMES } from '../games/registry.js';

interface SharePlugin { share(o: { title: string; text: string; url?: string; dialogTitle?: string }): Promise<unknown> }

export type ShareResult = 'shared' | 'copied' | 'failed';

/** Bagikan game: lembar bagikan Android (plugin Share) -> Web Share -> salin ke papan klip. */
export async function shareApp(): Promise<ShareResult> {
  const text = `Coba ${APP_NAME}: ${GAMES.length} game latihan otak (hitung, puzzle, catur, Reversi, Rubik) yang bisa dimainkan offline!`;
  const native = nativePlugin<SharePlugin>('Share');
  try {
    if (native) { await native.share({ title: APP_NAME, text, url: SHARE_URL, dialogTitle: `Bagikan ${APP_NAME}` }); return 'shared'; }
    if (navigator.share) { await navigator.share({ title: APP_NAME, text, url: SHARE_URL }); return 'shared'; }
  } catch (e) {
    const msg = String((e as { name?: string; message?: string })?.name ?? '') + String((e as { message?: string })?.message ?? '');
    if (/abort|cancel/i.test(msg)) return 'shared'; // pengguna menutup lembar bagikan
  }
  try { await navigator.clipboard.writeText(`${text}\n${SHARE_URL}`); return 'copied'; } catch { return 'failed'; }
}
