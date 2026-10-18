/**
 * Identitas aplikasi di satu tempat. Mengganti NAMA game (label di bawah ikon HP):
 *   1) APP_NAME di sini, 2) appName di capacitor.config.ts, 3) <title> di index.html
 * (tes `tests/app.test.ts` memastikan ketiganya sama). JANGAN ubah appId di capacitor.config.ts.
 */
export const APP_NAME = 'Math Games';
export const APP_VERSION = '1.2.0'; // harus sama dengan "version" di package.json (dijaga tes)
export const DEVELOPER = 'Tano Store';
/** Tautan yang dibagikan lewat tombol Bagikan. Ganti dengan situs / halaman unduhanmu. */
export const SHARE_URL = 'https://github.com/Tanojs/math-game';
/** Email kontak untuk Kebijakan Privasi (wajib diisi sebelum rilis ke Play Store). Kosong = tidak ditampilkan. */
export const CONTACT_EMAIL = '';
/** Kredit lagu bawaan bila lisensinya mewajibkan (mis. CC BY). Contoh: 'Musik: Judul oleh Nama (CC BY 4.0)'. Kosong = tidak ditampilkan. */
export const MUSIC_CREDIT = 'Musik latar: tiga komposisi orisinal untuk aplikasi ini (Santai Sore, Petualangan Ceria, Fokus Tenang).';
export const PRIVACY_DATE = '16 Oktober 2026';
