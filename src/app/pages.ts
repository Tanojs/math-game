import { $ } from '../core/dom.js';
import { APP_NAME, APP_VERSION, CONTACT_EMAIL, DEVELOPER, PRIVACY_DATE } from './brand.js';
import { GAMES } from '../games/registry.js';
import { ADS_ENABLED } from './ads-config.js';

let toastTimer = 0;
export function toast(text: string): void {
  let t = document.getElementById('toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => t?.classList.remove('on'), 2200);
}

/** Lembar isi (bottom sheet) untuk Tentang / Kebijakan Privasi. */
export function openSheet(title: string, html: string): void {
  closeSheet();
  const s = document.createElement('div');
  s.className = 'sheet';
  s.id = 'sheet';
  s.innerHTML = `<div class="sheet-in" role="dialog" aria-label="${title}"><h2>${title}</h2>${html}<button class="cta" id="sheet-x">Tutup</button></div>`;
  s.addEventListener('click', (e) => { if (e.target === s || (e.target as Element).id === 'sheet-x') closeSheet(); });
  document.body.appendChild(s);
  $('#sheet-x').focus({ preventScroll: true });
}
export const closeSheet = (): void => { document.getElementById('sheet')?.remove(); };

export const aboutHtml = (): string =>
  `<p><b>${APP_NAME}</b> · versi ${APP_VERSION}</p>` +
  `<p>${GAMES.length} game latihan otak: hitung cepat, puzzle, catur, Reversi, Rubik, dan banyak lagi. Semua game bisa dimainkan tanpa internet. Rekor dan pengaturan tersimpan di perangkatmu.</p>` +
  `<p>Dibuat oleh ${DEVELOPER}.</p>` +
  '<h4>Kredit &amp; lisensi</h4>' +
  '<p>Ikon: Phosphor (MIT) dan Font Awesome Free (CC BY 4.0). Font: Space Grotesk (SIL OFL 1.1). Efek suara dan musik dibuat langsung oleh kode.</p>';

export const privacyHtml = (): string =>
  `<p>Terakhir diperbarui: ${PRIVACY_DATE}</p>` +
  '<h4>Data yang kami kumpulkan</h4>' +
  `<p>${APP_NAME} tidak meminta akun, nama, email, atau data pribadi lain, dan tidak mengirim data permainanmu ke server kami. Rekor dan pengaturan (tema, suara) hanya disimpan di perangkatmu, dan terhapus bila kamu menghapus data aplikasi atau menghapus aplikasinya.</p>` +
  (ADS_ENABLED
    ? '<h4>Iklan</h4><p>Aplikasi menampilkan iklan dari Google AdMob. AdMob dapat mengumpulkan dan memakai data seperti ID iklan perangkat, alamat IP, serta informasi perangkat dan penggunaan untuk menampilkan dan mengukur iklan, sesuai <a href="https://policies.google.com/privacy" target="_blank" rel="noopener">Kebijakan Privasi Google</a> dan <a href="https://support.google.com/admob/answer/6128543" target="_blank" rel="noopener">penjelasan AdMob</a>. Di wilayah tertentu (mis. Uni Eropa dan Inggris) kamu akan diminta persetujuan lebih dulu. Kamu bisa membatasi personalisasi iklan lewat pengaturan iklan Google di perangkat Android-mu.</p>'
    : '') +
  '<h4>Internet</h4><p>Game berjalan tanpa internet. Koneksi hanya dipakai untuk memuat iklan (bila ada).</p>' +
  '<h4>Anak-anak</h4><p>Aplikasi ini ditujukan untuk umum dan tidak sengaja mengumpulkan data dari anak di bawah 13 tahun.</p>' +
  '<h4>Perubahan</h4><p>Kebijakan ini dapat diperbarui. Tanggal pembaruan terakhir tertera di atas.</p>' +
  (CONTACT_EMAIL ? `<h4>Kontak</h4><p>${CONTACT_EMAIL}</p>` : '');
