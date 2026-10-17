import { ADMOB_BANNER_ID, ADS_ENABLED, ADS_TESTING } from './ads-config.js';
import { nativePlugin } from './native.js';

interface ConsentInfo { status: string; isConsentFormAvailable: boolean; canRequestAds: boolean }
type Info = Record<string, unknown>;

interface AdMobPlugin {
  requestConsentInfo(): Promise<ConsentInfo>;
  showConsentForm(): Promise<ConsentInfo>;
  initialize(): Promise<void>;
  showBanner(o: { adId: string; adSize: string; position: string; margin: number; isTesting: boolean }): Promise<void>;
  hideBanner(): Promise<void>;
  removeBanner(): Promise<void>;
  resumeBanner(): Promise<void>;
  addListener(event: string, fn: (info: Info) => void): Promise<unknown>;
}

let status = 'belum dimulai';
/** Status iklan terakhir (ditampilkan di Setting → Tentang → Info teknis, untuk membantu mencari masalah). */
export const adsStatus = (): string => status;
const why = (e: unknown): string => String((e as { message?: string })?.message ?? e).slice(0, 120);

/**
 * Banner AdMob native. Aman: tanpa internet / plugin tidak ada / iklan gagal = game tetap jalan seperti biasa.
 * Banner hanya tampil di layar menu (Game, Rekor, Setting) dan disembunyikan saat bermain (cegah klik tak sengaja).
 */
export function initAds(): void {
  if (!ADS_ENABLED) { status = 'dimatikan (ADS_ENABLED = false)'; return; }
  const ad = nativePlugin<AdMobPlugin>('AdMob');
  if (!ad) { status = 'plugin AdMob tidak ada (bukan APK, atau dibuild dengan with_ads dimatikan)'; return; }
  status = 'plugin ditemukan, memulai…';

  let ready = false, shown = false, inGame = document.body.classList.contains('ig'), height = 60, tries = 0, retryTimer = 0;
  const navH = (): number => document.getElementById('nv')?.getBoundingClientRect().height ?? 72;
  const pad = (): void => {
    const on = ready && !inGame && height > 0;
    document.body.classList.toggle('has-ad', on);
    document.documentElement.style.setProperty('--adh', `${on ? Math.round(height) : 0}px`);
  };
  const sync = async (): Promise<void> => {
    if (!ready) return;
    try {
      if (inGame) { if (shown) await ad.hideBanner(); }
      else if (shown) await ad.resumeBanner();
      else {
        status = 'meminta banner…';
        await ad.showBanner({ adId: ADMOB_BANNER_ID, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: Math.round(navH()), isTesting: ADS_TESTING });
        shown = true;
        if (status === 'meminta banner…') status = 'banner diminta, menunggu iklan dimuat';
      }
    } catch (e) { status = `banner gagal: ${why(e)}`; }
    pad();
  };

  /** Iklan gagal dimuat (mis. jaringan lambat saat aplikasi baru dibuka): coba lagi dengan jeda 5, 10, 20, 40, lalu tiap 60 detik. */
  const retry = (): void => {
    if (!ready || inGame || retryTimer) return;
    const delay = Math.min(60000, 5000 * 2 ** tries++);
    retryTimer = window.setTimeout(() => {
      retryTimer = 0;
      void (async () => {
        try { await ad.removeBanner(); } catch { /* belum ada banner */ }
        shown = false;
        await sync();
      })();
    }, delay);
  };
  addEventListener('online', () => { tries = 0; clearTimeout(retryTimer); retryTimer = 0; retry(); });

  document.addEventListener('mg-screen', (e) => {
    inGame = (e as CustomEvent<string>).detail === 'game';
    pad();
    void sync();
  });

  void (async () => {
    try {
      let can = true;
      try {
        status = 'memeriksa persetujuan…';
        let info = await ad.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await ad.showConsentForm();
        can = info.canRequestAds || info.status === 'NOT_REQUIRED';
        if (!can) status = `persetujuan belum diberikan (${info.status})`;
      } catch (e) {
        // Gagal memeriksa persetujuan (mis. ID contoh / jaringan): saat uji tetap lanjut; produksi: jangan tampilkan iklan.
        can = ADS_TESTING;
        status = `persetujuan error: ${why(e)}${can ? ' (mode uji: lanjut)' : ''}`;
      }
      if (!can) return;
      status = 'menginisialisasi AdMob…';
      await ad.initialize();
      void ad.addListener('bannerAdSizeChanged', (s) => { height = typeof s.height === 'number' ? s.height : height; pad(); });
      void ad.addListener('bannerAdLoaded', () => { tries = 0; status = 'banner tampil'; });
      void ad.addListener('bannerAdFailedToLoad', (er) => {
        height = 0;
        const msg = String(er.message ?? 'tanpa pesan');
        status = `iklan gagal dimuat (kode ${String(er.code ?? '?')}: ${msg}); percobaan ke-${tries + 1}${/JavascriptEngine/i.test(msg) ? ' — biasanya jaringan lambat / tidak ada internet; akan dicoba lagi otomatis' : ''}`;
        pad();
        retry();
      });
      ready = true;
      await sync();
    } catch (e) { status = `gagal: ${why(e)}`; }
  })();
}
