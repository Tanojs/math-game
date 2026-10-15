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
- [ ] Tombol **Back** HP: di dalam game → kembali ke menu; di menu → keluar aplikasi.
- [ ] Putar layar / layar kecil: tampilan tidak terpotong, tombol navigasi bawah tidak tertutup gesture bar.
- [ ] Pasang APK versi baru di atas yang lama → rekor tetap.

## AdMob (nanti, belum dipasang)
Sengaja **belum** diintegrasikan agar APK offline tetap sederhana. Saat siap:
- Buat akun AdMob + app + unit iklan; pasang plugin `@capacitor-community/admob` (kompatibel dengan Capacitor 8).
- Isi **App ID** di `AndroidManifest.xml` (`com.google.android.gms.ads.APPLICATION_ID`). App ID salah/kosong bisa membuat aplikasi crash saat start → uji dulu.
- Selama pengembangan pakai **ID iklan uji** Google (`ca-app-pub-3940256099942544/...`), jangan klik iklan sungguhan milik sendiri.
- Siapkan formulir persetujuan (**UMP/consent**) untuk pengguna wilayah tertentu, dan isi *Data safety* bila ke Play Store.
- Panggil iklan di `try/catch` dan **jangan `await` di jalur gameplay**: tanpa internet / gagal memuat → game tetap jalan.
- Karena `android/` dibuat ulang oleh workflow, pengaturan manifest sebaiknya ditambahkan lewat langkah di `android.yml` (atau commit folder `android/` dan hapus dari `.gitignore`).

## Yang belum bisa dibuktikan dari lingkungan pembuatan
Typecheck (kecuali `@types/node` yang belum terpasang), 63 tes, build satu-file, dan uji browser offline sudah dijalankan. **`vite build`, `cap add/sync`, Gradle, dan instal di HP belum** (tidak ada internet/Android SDK di sana): langkah itu pertama kali dijalankan oleh workflow GitHub. Jika ada error di sana, kirim log-nya.
