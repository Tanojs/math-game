import test from 'node:test';
import assert from 'node:assert/strict';
import { adsStatus, initAds, type AdMobPlugin } from '../src/app/ads.js';

type Handler = (e: unknown) => void;
const tick = async (n = 6): Promise<void> => { for (let i = 0; i < n; i++) await new Promise((r) => setTimeout(r, 0)); };

/** DOM & plugin palsu secukupnya untuk menjalankan alur iklan di Node. */
function setup(): { calls: string[]; emit: (ev: string, p?: Record<string, unknown>) => void; screen: (s: 'game' | 'menu') => void } {
  const docHandlers = new Map<string, Handler>();
  const classes = new Set<string>();
  const g = globalThis as unknown as Record<string, unknown>;
  g.window = globalThis;
  g.addEventListener = () => undefined;
  g.document = {
    body: { classList: { contains: (c: string) => classes.has(c), toggle: (c: string, on: boolean) => { if (on) classes.add(c); else classes.delete(c); } } },
    documentElement: { style: { setProperty: () => undefined } },
    getElementById: () => ({ getBoundingClientRect: () => ({ height: 70 }) }),
    addEventListener: (t: string, f: Handler) => { docHandlers.set(t, f); },
  };
  const calls: string[] = [];
  const listeners = new Map<string, (i: Record<string, unknown>) => void>();
  const fake: AdMobPlugin = {
    requestConsentInfo: async () => ({ status: 'NOT_REQUIRED', isConsentFormAvailable: false, canRequestAds: true }),
    showConsentForm: async () => ({ status: 'OBTAINED', isConsentFormAvailable: true, canRequestAds: true }),
    initialize: async () => { calls.push('initialize'); },
    showBanner: async () => { calls.push('show'); },
    hideBanner: async () => { calls.push('hide'); },
    removeBanner: async () => { calls.push('remove'); },
    resumeBanner: async () => { calls.push('resume'); },
    addListener: async (ev, fn) => { listeners.set(ev, fn); return {}; },
  };
  initAds(fake);
  return {
    calls,
    emit: (ev, p = {}) => listeners.get(ev)?.(p),
    screen: (s) => docHandlers.get('mg-screen')?.({ detail: s }),
  };
}

test('iklan gagal dimuat lalu masuk game: banner dibuang (bukan di-hide) dan tidak muncul galat "never shown"', async () => {
  const h = setup();
  await tick();
  assert.deepEqual(h.calls, ['initialize', 'show']);
  h.emit('bannerAdFailedToLoad', { code: 0, message: 'Unable to obtain a JavascriptEngine.' });
  assert.match(adsStatus(), /kode 0/);
  assert.match(adsStatus(), /percobaan ke-1/);
  h.screen('game');
  await tick();
  assert.ok(!h.calls.includes('hide'), 'tidak boleh menyembunyikan banner yang tidak pernah tampil');
  assert.ok(h.calls.includes('remove'));
  assert.doesNotMatch(adsStatus(), /never shown|banner gagal/);
  h.screen('menu');
  await tick();
  assert.equal(h.calls.filter((c) => c === 'show').length, 2, 'kembali ke menu: minta banner lagi');
});

test('iklan sudah tampil: masuk game = sembunyikan, kembali = lanjutkan (tanpa minta ulang)', async () => {
  const h = setup();
  await tick();
  h.emit('bannerAdLoaded');
  assert.equal(adsStatus(), 'banner tampil');
  h.screen('game');
  await tick();
  assert.ok(h.calls.includes('hide') && !h.calls.includes('remove'));
  h.screen('menu');
  await tick();
  assert.ok(h.calls.includes('resume'));
  assert.equal(h.calls.filter((c) => c === 'show').length, 1);
});
