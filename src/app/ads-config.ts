/**
 * Iklan AdMob (banner di menu, Rekor & Setting; TIDAK tampil saat bermain game).
 * Sekarang memakai ID CONTOH dari Google (iklan bertanda "Test Ad", tidak menghasilkan uang).
 * Saat akun AdMob siap: isi dua ID di bawah dengan milikmu dan ubah ADS_TESTING menjadi false.
 *  - ADMOB_APP_ID    : "ca-app-pub-XXXXXXXXXXXXXXXX~NNNNNNNNNN"  (ID AKLIKASI)
 *  - ADMOB_BANNER_ID : "ca-app-pub-XXXXXXXXXXXXXXXX/NNNNNNNNNN"  (ID UNIT IKLAN banner)
 * Jangan pernah mengklik iklan milikmu sendiri saat ADS_TESTING = false (melanggar kebijakan AdMob).
 */
export const ADS_ENABLED = true;
export const ADS_TESTING = true;
export const ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';
/** ID unit iklan layar penuh (interstitial) dan iklan hadiah (rewarded). Ganti dengan milikmu saat ADS_TESTING = false. */
export const ADMOB_INTERSTITIAL_ID = 'ca-app-pub-3940256099942544/1033173712';
export const ADMOB_REWARDED_ID = 'ca-app-pub-3940256099942544/5224354917';
