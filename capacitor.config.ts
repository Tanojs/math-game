import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Konfigurasi Capacitor — APK memuat game dari aset lokal (folder `dist`), TANPA `server.url`
 * (tidak memuat dari Vercel / internet).
 *
 * JANGAN diubah setelah APK pertama dibagikan:
 *  - appId        : identitas aplikasi. Kalau berubah, Android menganggapnya aplikasi lain (update gagal, data hilang).
 *  - androidScheme: localStorage terikat ke origin `https://localhost`. Mengubahnya = semua rekor & pengaturan "hilang".
 */
const config: CapacitorConfig = {
  appId: 'com.tanostore.mathgames',
  appName: 'Math Games',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: { backgroundColor: '#FFF6E0', allowMixedContent: false },
};

export default config;
