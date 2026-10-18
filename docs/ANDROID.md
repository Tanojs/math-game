# Math Games → APK Android offline (Capacitor)

## Kondisi proyek
- **Vite + TypeScript tanpa framework** (bukan React / Next.js). 21 game, semua logika berjalan di browser.
- **Sudah offline-ready:** tidak ada `fetch`, backend, login, atau URL eksternal. Satu-satunya yang online dulu adalah **Google Fonts**; sekarang font Space Grotesk dibundel lewat `@fontsource/space-grotesk`.
- **Rekor & pengaturan** disimpan di `localStorage` (hanya lewat `src/core/storage.ts`, aman bila diblokir). Kunci: `mgb` (rekor), `mgt2` (tema), dst.
- APK **memuat aset dari dalam APK** (`dist` → `webDir`), **tanpa** `server.url`. Vercel tidak dipakai APK.

## Yang ditambahkan (tidak ada game/fitur yang diubah)
| File | Fungsi |
|---|---|
| `capacitor.config.ts` | appId `com.tanostore.mathgames`, nama "Math Games", `webDir: dist`, scheme `https` |
| `package.json` | + `@capacitor/core`, `@capacitor/android`, `@capacitor/cli`, `@fontsource/space-grotesk`; skrip `android:sync` |
| `index.html`, `src/main.ts` | hapus Google Fonts → font lokal; `theme-color` |
| `resources/android/res/**` | ikon launcher (adaptif + bulat) |
| `.github/workflows/android.yml` | build APK **manual** (tes → build → Capacitor → tanda tangan) |
| `.github/workflows/keystore.yml` | membuat kunci penandatangan **sekali saja** |
| `.github/workflows/ci.yml` | typecheck + tes + build di `development` & `main` |
| `tests/offline.test.ts` | penjaga: tak ada akses internet, appId/scheme tak berubah, rilis hanya manual |
| `.gitignore` | `android/` (dibuat otomatis), kunci `*.jks` tidak boleh ter-commit |

## ⚠️ Jangan diubah setelah APK dibagikan
1. **`appId`** — kalau berubah, Android menganggapnya aplikasi lain (tidak bisa update).
2. **`androidScheme`** — `localStorage` terikat ke origin `https://localhost`; mengubahnya = rekor & pengaturan "hilang".
3. **Kunci penandatangan (keystore)** — kunci berbeda = APK baru tidak bisa menimpa yang lama (harus uninstall → data hilang). **Simpan cadangannya di luar GitHub.**

## Langkah dari HP Android (gratis)

### 1) Taruh proyek di GitHub (Termux)
Pasang **Termux dari F-Droid** (versi Play Store sudah usang), lalu:
```bash
pkg update && pkg install git unzip
cp /sdcard/Download/math-games-project.zip ~ && cd ~ && unzip math-games-project.zip && cd math-games
git init -b main && git add . && git commit -m "Math Games + Capacitor"
git branch development
# Buat repo KOSONG (Private) di github.com, lalu:
git remote add origin https://github.com/USERNAME/math-games.git
git push -u origin main development
```
Saat diminta password, pakai **Personal Access Token** (GitHub → Settings → Developer settings → Fine-grained tokens → izin *Contents: Read and write* untuk repo ini).
Alternatif tanpa Termux: buka `github.com/codespaces` di browser HP, unggah zip, lalu push dari terminal Codespaces.

### 2) Buat kunci penandatangan (sekali saja)
> ⚠️ **Lakukan ini saat repo masih PRIVATE.** Di repo publik, artifact `keystore-math-games` (berisi kunci + password) bisa diunduh siapa pun yang login ke GitHub. Setelah secret terisi dan artifact dihapus, repo boleh dijadikan publik.

1. Repo → **Actions** → **Buat keystore (sekali saja)** → **Run workflow**.
2. Setelah selesai, unduh artifact `keystore-math-games`, ekstrak.
3. Repo → **Settings → Secrets and variables → Actions → New repository secret**, isi 3 secret:
   - `ANDROID_KEYSTORE_BASE64` = isi file `keystore.b64` (satu baris panjang)
   - `ANDROID_KEYSTORE_PASSWORD` = nilai dari `secrets.txt`
   - `ANDROID_KEY_ALIAS` = `mathgames`
4. **Simpan `math-games.jks` + password di tempat aman** (mis. Google Drive pribadi), lalu hapus run/artifact tadi.

### 3) Build APK
**Actions → Android APK → Run workflow** (pilih branch, `release`). Tunggu ±10–15 menit. Di halaman run → **Artifacts** → unduh `Math-Games-…` → ekstrak → `Math-Games-1.0.0-N.apk`.
Pilih `debug` bila hanya mau coba cepat tanpa kunci (APK debug **tidak bisa** menimpa APK dari build lain).

### 4) Pasang di HP
Buka file APK → izinkan **Install aplikasi tidak dikenal** untuk browser/file manager → Pasang.
**Update:** naikkan `"version"` di `package.json`, build lagi, pasang di atas aplikasi lama. `versionCode` naik otomatis; appId & kunci sama → **rekor tetap ada**.

## Repo publik atau privat?
- **Publik:** menit Actions standar gratis tanpa batas, tapi kode terlihat semua orang, dan APK di Artifacts bisa diunduh siapa pun yang login GitHub. Secret tetap tersembunyi.
- **Privat:** gratis 2.000 menit/bulan + 500 MB (cukup untuk ±130 build/bulan).

## Memperbarui APK (setelah ada perubahan kode)
1. Salin berkas baru ke folder repo di Termux (jangan hapus folder `.git`), lalu `git add -A && git commit -m "..." && git push`.
2. Naikkan `"version"` di `package.json` (mis. `1.1.0`); `versionCode` naik otomatis.
3. Actions → **Android APK** → Run workflow → `release` → unduh → pasang **di atas** aplikasi lama (rekor tetap).

## Suara
Semua suara dibuat langsung oleh kode (Web Audio): efek ketukan, benar/salah, menang/kalah, langkah catur/Reversi, dan musik latar 8 birama — **tanpa file audio**, jadi tetap kecil dan offline. Pengaturan Efek suara & Musik ada di tab **Setting** (bawaan: nyala). Musik otomatis berhenti saat aplikasi di latar belakang dan mulai bersih dari awal saat kembali (tanpa menumpuk). Nada bass sengaja tidak lebih rendah dari ±130 Hz karena speaker HP bergetar bila memainkannya.

## Alur cabang & rilis
- `development` = pengembangan; `main` = stabil. Kerjakan di `development` → buka Pull Request ke `main` → CI harus hijau → gabung.
- Saran: GitHub → Settings → Branches → aktifkan *branch protection* di `main` (wajib CI lulus).
- **Tidak ada rilis otomatis.** APK hanya dibuat saat kamu menekan *Run workflow*.
- Website Vercel boleh diperbarui sendiri (sambungkan ke `main`); APK yang terpasang tidak terpengaruh karena memakai aset lokal.

## Penyimpanan lokal & pembaruan
Rekor/pengaturan tetap ada setelah aplikasi ditutup, HP direstart, dan update normal (appId, kunci, scheme sama). Hilang hanya jika: *Hapus data* / *uninstall*, atau 3 hal di atas diubah.

## Checklist uji di HP (manual)
- [ ] Mode pesawat **aktif** → buka tiap game dari menu, mainkan sebentar, kembali.
- [ ] Selesaikan 1 game → cek tab **Rekor** → tutup paksa aplikasi → buka lagi → rekor masih ada.
- [ ] Ganti tema (gelap) → restart HP → tema tetap.
- [ ] Tombol **Back** HP: di dalam game → kembali ke menu; di Rekor/Setting → ke menu; lembar Tentang/Privasi → tertutup; di **menu**: sekali = muncul "Tekan sekali lagi untuk keluar", dua kali dalam 2 detik = keluar aplikasi.
- [ ] **Suara:** ketuk tombol/papan → ada bunyi "tik"; musik latar mengalun setelah sentuhan pertama; ke layar utama HP / buka aplikasi lain → **musik berhenti**, kembali → lanjut; Setting → matikan Efek/Musik → benar-benar diam (pilihan tersimpan setelah restart).
- [ ] Animasi masuk saat membuka game terlihat mulus (tidak patah).
- [ ] Putar layar / layar kecil: tampilan tidak terpotong, tombol navigasi bawah tidak tertutup gesture bar.
- [ ] Pasang APK versi baru di atas yang lama → rekor tetap.

## AdMob (iklan banner)
Sudah terpasang dengan **ID contoh Google** (iklan bertanda "Test Ad", tidak menghasilkan uang). Banner hanya tampil di **Game (menu), Rekor, dan Setting**, dan **disembunyikan saat bermain** (mencegah klik tak sengaja, sesuai kebijakan AdMob). Tanpa internet / iklan gagal dimuat: game tetap jalan normal.

Saat akun AdMob siap:
1. Buat aplikasi + unit iklan **Banner** di admob.google.com (Android).
2. Edit `src/app/ads-config.ts` (bisa lewat editor web GitHub di HP): isi `ADMOB_APP_ID` (berbentuk `~`) dan `ADMOB_BANNER_ID` (berbentuk `/`), lalu ubah `ADS_TESTING` menjadi `false`. Tes otomatis menolak format ID yang salah.
3. Build ulang APK. Workflow memasang App ID ke `AndroidManifest.xml` otomatis dari berkas yang sama.
4. **Jangan klik iklan milikmu sendiri** saat ID asli aktif (bisa membuat akun AdMob diblokir). Untuk menguji, tetap pakai ID contoh.
5. Isi pesan persetujuan (GDPR/UMP) di AdMob → *Privacy & messaging* bila aplikasi tersedia di wilayah Uni Eropa/Inggris.

**Tidak perlu membuka situs AdMob dulu** untuk iklan uji: ID contoh Google berfungsi tanpa akun. Jika "Info teknis" menampilkan *Unable to obtain a JavascriptEngine* (kode 0): menurut panduan Google ini berarti permintaan iklan gagal karena **jaringan** (lambat / belum tersedia saat aplikasi baru dibuka); aplikasi mencoba lagi otomatis (jeda 5, 10, 20, 40 dtk, lalu tiap 60 dtk) dan juga saat internet kembali. Jika tetap gagal berkali-kali, periksa internet dan perbarui *Android System WebView* di Play Store.

Jika build gagal gara-gara plugin iklan: **Run workflow** lalu **matikan `with_ads`** — APK tetap dibuat, tanpa iklan. Kirim lognya agar diperbaiki.

## Musik latar
Bawaan: tiga lagu orisinal di `src/assets/music/` (Santai Sore, Petualangan Ceria, Fokus Tenang), diputar bergantian. Pilih lagu di **Setting → Pilihan lagu** (Semua bergantian, atau satu lagu diulang; nama diambil dari nama berkas). Tidak suka? Hapus berkasnya dan/atau tambahkan lagu pilihanmu:
1. Unduh lagu bebas royalti **dan baca lisensinya** (Pixabay Music, FreePD (CC0), incompetech (CC BY: wajib kredit)). Format `.mp3`, `.ogg`, atau `.m4a`, ±1–4 MB per lagu.
2. Di GitHub (browser, aktifkan *Situs desktop*): buka folder `src/assets/music` → **Add file → Upload files** → pilih lagunya → **Commit**.
3. Bila lisensi mewajibkan kredit, isi `MUSIC_CREDIT` di `src/app/brand.ts` (tampil di Setting → Tentang).
4. Build ulang APK. Lagu diputar bergantian dan berulang; berhenti saat aplikasi ke latar belakang; tombol Musik di Setting tetap berlaku. Tanpa lagu di folder itu, aplikasi kembali memakai musik sintetis.

## Kebijakan privasi
Wajib bila memakai AdMob atau menerbitkan di Play Store. Sudah ada: halaman di aplikasi (**Setting → Kebijakan privasi**) dan berkas web `public/privacy.html` (setelah deploy ke Vercel: `https://DOMAINMU/privacy.html`; itulah URL yang diminta Play Console). **Isi email kontak** di `CONTACT_EMAIL` (`src/app/brand.ts`) dan di `public/privacy.html` sebelum dipublikasikan. Ubah teksnya bila fitur berubah (mis. menambah analitik).

## Tombol Bagikan
Setting → **Bagikan game ini** membuka lembar bagikan Android (plugin `@capacitor/share`); di browser memakai Web Share atau menyalin tautan. Tautan yang dibagikan = `SHARE_URL` di `src/app/brand.ts` (sekarang halaman GitHub repo; ganti dengan situs / halaman unduhanmu).

## Mengganti nama game
Mudah dan aman untuk data pemain. Ubah **tiga** tempat (tes `tests/app.test.ts` memastikan ketiganya sama): `APP_NAME` di `src/app/brand.ts`, `appName` di `capacitor.config.ts`, dan `<title>` di `index.html`. Build ulang → nama di bawah ikon HP berubah (dibuat ulang tiap build). **Jangan ubah `appId`** (kunci identitas aplikasi: rekor & update bergantung padanya). Nama file APK diatur di `android.yml` (`Math-Games-…`), opsional.

## Yang belum bisa dibuktikan dari lingkungan pembuatan
Typecheck (kecuali `@types/node` yang belum terpasang), 63 tes, build satu-file, dan uji browser offline sudah dijalankan. **`vite build`, `cap add/sync`, Gradle, dan instal di HP belum** (tidak ada internet/Android SDK di sana): langkah itu pertama kali dijalankan oleh workflow GitHub. Jika ada error di sana, kirim log-nya.
