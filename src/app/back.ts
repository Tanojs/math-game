import { nativePlugin } from './native.js';
import { closeSheet, toast } from './pages.js';
import { currentTab, gotoTab } from './router.js';
import { $ } from '../core/dom.js';

interface AppPlugin {
  addListener(event: 'backButton', fn: () => void): Promise<unknown>;
  exitApp(): Promise<void>;
}

let lastBack = 0;

/**
 * Perilaku tombol Back HP: tutup lembar -> keluar dari game ke menu -> dari Rekor/Setting ke menu ->
 * di menu: ketukan pertama memberi peringatan, ketukan kedua dalam 2 detik baru keluar aplikasi.
 */
export function handleBack(exit: () => void): 'sheet' | 'game' | 'tab' | 'warn' | 'exit' {
  if (document.getElementById('sheet')) { closeSheet(); return 'sheet'; }
  const t = currentTab();
  if (t === 'gm') { $('#bk').click(); return 'game'; } // sama dengan tombol panah di layar
  if (t !== 'home') { gotoTab('home'); return 'tab'; }
  const now = Date.now();
  if (now - lastBack < 2000) { exit(); return 'exit'; }
  lastBack = now;
  toast('Tekan sekali lagi untuk keluar');
  return 'warn';
}

export function initBack(): void {
  const app = nativePlugin<AppPlugin>('App');
  if (import.meta.env.MODE === 'test') {
    (window as unknown as Record<string, unknown>).__back = () => handleBack(() => { (window as unknown as Record<string, unknown>).__exited = true; });
  }
  if (!app) return;
  void app.addListener('backButton', () => { handleBack(() => { void app.exitApp(); }); });
}
