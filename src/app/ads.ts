import { ADMOB_BANNER_ID, ADS_ENABLED, ADS_TESTING } from './ads-config.js';
import { nativePlugin } from './native.js';

interface AdMobPlugin {
  requestConsentInfo(): Promise<{ status: string; isConsentFormAvailable: boolean; canRequestAds: boolean }>;
  showConsentForm(): Promise<{ status: string; canRequestAds: boolean }>;
  initialize(): Promise<void>;
  showBanner(o: { adId: string; adSize: string; position: string; margin: number; isTesting: boolean }): Promise<void>;
  hideBanner(): Promise<void>;
  resumeBanner(): Promise<void>;
  addListener(event: string, fn: (info: { height?: number }) => void): Promise<unknown>;
}

/**
 * Banner AdMob native. Aman: tanpa internet / plugin tidak ada / iklan gagal = game tetap jalan seperti biasa.
 * Banner hanya tampil di layar menu (Game, Rekor, Setting) dan disembunyikan saat bermain (cegah klik tak sengaja).
 */
export function initAds(): void {
  if (!ADS_ENABLED) return;
  const ad = nativePlugin<AdMobPlugin>('AdMob');
  if (!ad) return;

  let ready = false, shown = false, inGame = document.body.classList.contains('ig'), height = 60;
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
        await ad.showBanner({ adId: ADMOB_BANNER_ID, adSize: 'ADAPTIVE_BANNER', position: 'BOTTOM_CENTER', margin: Math.round(navH()), isTesting: ADS_TESTING });
        shown = true;
      }
    } catch { /* tanpa iklan */ }
    pad();
  };

  document.addEventListener('mg-screen', (e) => {
    inGame = (e as CustomEvent<string>).detail === 'game';
    pad();
    void sync();
  });

  void (async () => {
    try {
      let info = await ad.requestConsentInfo();
      if (info.isConsentFormAvailable && info.status === 'REQUIRED') info = await ad.showConsentForm();
      if (!info.canRequestAds) return;
      await ad.initialize();
      void ad.addListener('bannerAdSizeChanged', (s) => { height = s.height ?? height; pad(); });
      void ad.addListener('bannerAdFailedToLoad', () => { height = 0; pad(); });
      ready = true;
      await sync();
    } catch { /* tanpa iklan: game tetap jalan */ }
  })();
}
