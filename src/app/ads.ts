import { ADMOB_BANNER_ID, ADMOB_INTERSTITIAL_ID, ADMOB_REWARDED_ID, ADS_ENABLED, ADS_TESTING } from './ads-config.js';
import { nativePlugin } from './native.js';

interface ConsentInfo { status: string; isConsentFormAvailable: boolean; canRequestAds: boolean }
type Info = Record<string, unknown>;

export interface AdMobPlugin {
  requestConsentInfo(): Promise<ConsentInfo>;
  showConsentForm(): Promise<ConsentInfo>;
  initialize(): Promise<void>;
  showBanner(o: { adId: string; adSize: string; position: string; margin: number; isTesting: boolean }): Promise<void>;
  hideBanner(): Promise<void>;
  removeBanner(): Promise<void>;
  resumeBanner(): Promise<void>;
  prepareInterstitial(o: { adId: string; isTesting: boolean }): Promise<void>;
  showInterstitial(): Promise<void>;
  prepareRewardVideoAd(o: { adId: string; isTesting: boolean }): Promise<unknown>;
  showRewardVideoAd(): Promise<unknown>;
  addListener(event: string, fn: (info: Info) => void): Promise<unknown>;
}

/** Interstitial muncul setiap berapa game (saat keluar dari game). */
const INTERSTITIAL_EVERY = 3;

let status = 'belum dimulai';
/** Status iklan terakhir (ditampilkan di Setting → Tentang → Info teknis, untuk membantu mencari masalah). */
/** Status interstitial & hadiah, dipisah supaya kelihatan penyebab masing-masing iklan gagal. */
const sub = { int: 'belum disiapkan', rew: 'belum disiapkan' };
export const adsStatus = (): string => `${status} · interstitial: ${sub.int} · hadiah: ${sub.rew}`;
const why = (e: unknown): string => String((e as { message?: string })?.message ?? e).slice(0, 120);

let ad: AdMobPlugin | null = null;
let bannerShown = false, bannerLoaded = false, held = false;
let sdkReady = false;
let intReady = false, rewReady = false;
let games = 0;
let rewardCb: (() => void) | null = null;
let rewardGranted = false;

const prepareInterstitial = async (): Promise<void> => {
  if (!ad || !sdkReady) return;
  sub.int = 'memuat…';
  try { await ad.prepareInterstitial({ adId: ADMOB_INTERSTITIAL_ID, isTesting: ADS_TESTING }); intReady = true; sub.int = 'siap'; }
  catch (e) { intReady = false; sub.int = `gagal (${why(e)})`; }
};
const prepareReward = async (): Promise<void> => {
  if (!ad || !sdkReady) return;
  sub.rew = 'memuat…';
  try { await ad.prepareRewardVideoAd({ adId: ADMOB_REWARDED_ID, isTesting: ADS_TESTING }); rewReady = true; sub.rew = 'siap'; }
  catch (e) { rewReady = false; sub.rew = `gagal (${why(e)})`; }
};

/** Sembunyikan banner selagi lembar web (Tentang, Cara main, dll.) tampil: banner native selalu di atas WebView. */
export function adsHold(on: boolean): void {
  if (!ad || !sdkReady || held === on) return;
  held = on;
  void (async () => {
    try {
      if (on) await ad!.hideBanner();
      else if (bannerShown && bannerLoaded) await ad!.resumeBanner();
    } catch { /* banner belum ada: tidak apa-apa */ }
  })();
}

/** Dipanggil saat sebuah game dibuka. */
export function countGame(): void { games++; }

/** Dipanggil saat keluar dari game: setiap INTERSTITIAL_EVERY game, tampilkan iklan layar penuh (jika sudah siap). */
export function leaveGame(): void {
  if (!ad || !intReady || games === 0 || games % INTERSTITIAL_EVERY !== 0) return;
  intReady = false;
  void (async () => {
    try { await ad!.showInterstitial(); } catch (e) { sub.int = `gagal tampil (${why(e)})`; }
    void prepareInterstitial();
  })();
}

/**
 * Tonton iklan hadiah; `onReward` dijalankan setelah iklan selesai ditonton.
 * Mengembalikan false bila iklan belum siap (tidak ada internet / plugin tidak ada).
 */
export function requestReward(onReward: () => void): boolean {
  if (!ad || !rewReady || rewardCb) return false;
  rewardCb = onReward;
  rewardGranted = false;
  rewReady = false;
  void (async () => {
    try { await ad!.showRewardVideoAd(); } catch (e) { sub.rew = `gagal tampil (${why(e)})`; rewardCb = null; void prepareReward(); }
  })();
  return true;
}

/**
 * Iklan AdMob: banner di bawah semua layar (termasuk saat bermain), interstitial tiap beberapa game,
 * dan iklan hadiah yang ditonton sukarela. Aman: tanpa internet / plugin tidak ada / iklan gagal = game tetap jalan.
 */
export function initAds(injected?: AdMobPlugin | null): void {
  if (!ADS_ENABLED) { status = 'dimatikan (ADS_ENABLED = false)'; return; }
  const plugin = injected ?? nativePlugin<AdMobPlugin>('AdMob');
  if (!plugin) { status = 'plugin AdMob tidak ada (bukan APK, atau dibuild dengan with_ads dimatikan)'; return; }
  ad = plugin;
  bannerShown = bannerLoaded = held = false;
  status = 'plugin ditemukan, memulai…';

  let height = 60, tries = 0, retryTimer = 0;
  const pad = (): void => {
    const on = sdkReady && height > 0;
    document.body.classList.toggle('has-ad', on);
    document.documentElement.style.setProperty('--adh', `${on ? Math.round(height) : 0}px`);
  };
  const sync = async (): Promise<void> => {
    if (!sdkReady) return;
    try {
      if (bannerShown && bannerLoaded) await ad!.resumeBanner();
      else {
        if (bannerShown) { try { await ad!.removeBanner(); } catch { /* sudah tidak ada */ } }
        status = 'meminta banner…';
        await ad!.showBanner({ adId: ADMOB_BANNER_ID, adSize: 'ADAPTIVE_BANNER', position: 'TOP_CENTER', margin: 0, isTesting: ADS_TESTING });
        bannerShown = true;
        if (status === 'meminta banner…') status = 'banner diminta, menunggu iklan dimuat';
      }
    } catch (e) {
      bannerShown = false;
      bannerLoaded = false;
      status = `banner gagal: ${why(e)}`;
      retry();
    }
    pad();
  };

  /** Iklan gagal dimuat (mis. jaringan lambat saat aplikasi baru dibuka): coba lagi dengan jeda 5, 10, 20, 40, lalu tiap 60 detik. */
  const retry = (): void => {
    if (!sdkReady || retryTimer) return;
    const delay = Math.min(60000, 5000 * 2 ** tries++);
    retryTimer = window.setTimeout(() => {
      retryTimer = 0;
      void (async () => {
        try { await ad!.removeBanner(); } catch { /* belum ada banner */ }
        bannerShown = false;
        await sync();
      })();
    }, delay);
  };
  addEventListener('online', () => { tries = 0; clearTimeout(retryTimer); retryTimer = 0; retry(); });

  void (async () => {
    try {
      let can = true;
      try {
        status = 'memeriksa persetujuan…';
        let info = await ad!.requestConsentInfo();
        if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await ad!.showConsentForm();
        can = info.canRequestAds || info.status === 'NOT_REQUIRED';
        if (!can) status = `persetujuan belum diberikan (${info.status})`;
      } catch (e) {
        // Gagal memeriksa persetujuan (mis. ID contoh / jaringan): saat uji tetap lanjut; produksi: jangan tampilkan iklan.
        can = ADS_TESTING;
        status = `persetujuan error: ${why(e)}${can ? ' (mode uji: lanjut)' : ''}`;
      }
      if (!can) return;
      status = 'menginisialisasi AdMob…';
      await ad!.initialize();
      void ad!.addListener('bannerAdSizeChanged', (s) => { height = typeof s.height === 'number' ? s.height : height; pad(); });
      void ad!.addListener('bannerAdLoaded', () => { tries = 0; bannerLoaded = true; status = 'banner tampil'; });
      void ad!.addListener('bannerAdFailedToLoad', (er) => {
        height = 0;
        bannerLoaded = false;
        const msg = String(er.message ?? 'tanpa pesan');
        status = `iklan gagal dimuat (kode ${String(er.code ?? '?')}: ${msg}); percobaan ke-${tries + 1}${/JavascriptEngine/i.test(msg) ? ' — biasanya jaringan lambat / tidak ada internet; akan dicoba lagi otomatis' : ''}`;
        pad();
        retry();
      });
      // Iklan layar penuh & hadiah: siapkan lebih dulu, lalu siapkan lagi setiap selesai ditutup.
      void ad!.addListener('onInterstitialAdDismissed', () => { intReady = false; void prepareInterstitial(); });
      void ad!.addListener('onRewardedVideoAdReward', () => { rewardGranted = true; });
      void ad!.addListener('onRewardedVideoAdDismissed', () => {
        const cb = rewardCb;
        rewardCb = null;
        if (cb && rewardGranted) cb();
        void prepareReward();
      });
      sdkReady = true;
      pad();
      void sync();
      void prepareInterstitial();
      void prepareReward();
    } catch (e) { status = `gagal: ${why(e)}`; }
  })();
}
