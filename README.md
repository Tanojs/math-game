# Math Games

Kumpulan 19 game latihan otak:

- **Hitungan:** Hitung Cepat, Benar/Salah, Operator, Ketik Jawaban, Bandingkan, Tabel Kali, Hubungkan, Game 24, Piramida Angka
- **Puzzle:** Pindahkan Batang, 15 Puzzle (4x4/5x5/6x6), 2048, Sudoku, Rubik 2x2/3x3/4x4, Geser Balok, Cermin (cocokkan bayangan cermin), Ranjau (Minesweeper 8x8/10x10/12x12), Tebak Kode
- **Melawan bot atau teman (satu HP, gantian):** XOX (3x3 sampai 5x5), Catur (aturan resmi), Reversi (piringan dibalik saat terjepit). Keduanya: pilih Bot / Teman, level Mudah-Sedang-Sulit, dan main sebagai Putih atau Hitam (lawan bot). Di mode Teman, bidak catur sisi atas diputar menghadap pemain seberang
- **Fokus & kecepatan:** Ketuk Berurutan

Hampir semua game punya tingkat Mudah, Sedang, dan Sulit.

Dibangun dengan **Vite + TypeScript** (tanpa framework UI). Semua data (skor, tema) tersimpan di browser.

## Menjalankan

Butuh Node.js 20.19+ (disarankan 22).

```bash
npm install
npm run dev        # server pengembangan (http://localhost:5173, bisa dibuka dari HP lewat WiFi yang sama)
npm run build      # cek tipe + build produksi ke folder dist/
npm run preview    # coba hasil build
npm run typecheck  # cek tipe TypeScript (mode strict)
npm run build:single  # satu file HTML mandiri di dist-single/math-games.html (tanpa Vite)
npm test           # tes unit logika game
```

## Push ke GitHub

```bash
git init
git add .
git commit -m "Math Games"
git branch -M main
git remote add origin https://github.com/USERNAME/math-games.git
git push -u origin main
```

Setelah `npm install` pertama, file `package-lock.json` akan terbentuk. Commit juga file itu.
GitHub Actions (`.github/workflows/ci.yml`) otomatis menjalankan cek tipe, tes, dan build di setiap push.

## Deploy ke Vercel

1. Buka vercel.com, **Add New > Project**, lalu impor repo GitHub ini.
2. Vercel mengenali Vite otomatis (Build Command `npm run build`, Output `dist`). Tidak perlu pengaturan tambahan.
3. Klik **Deploy**. Setiap push ke `main` akan men-deploy ulang otomatis.

Alternatif lewat terminal: `npx vercel` (pertama kali) dan `npx vercel --prod`.

## Struktur proyek

```
src/
  main.ts                 titik masuk
  core/                   utilitas kecil: dom, acak, storage aman, tipe bersama
  app/                    kerangka aplikasi: router (tab/game), tema, gaya ikon, rekor, tab Rekor, shell
  games/
    registry.ts           daftar game (urutan menu)
    <game>/logic.ts       logika murni (tanpa DOM) -> mudah dites
    <game>/ui.ts          tampilan & interaksi
    mirror/logic.ts       soal & pengecekan game Cermin (kiri = contoh, kanan = bayangan)
    mines/logic.ts        aturan Ranjau: ranjau diletakkan setelah ketukan pertama (aman), buka area, bendera, "chord"
    reversi/engine.ts     mesin Reversi + bot 3 level (ui.ts: papan & animasi balik piringan)
    chess/engine.ts       mesin catur (rokade, en passant, promosi, seri otomatis)
    rubik/model.ts        model kubus Rubik (rotasi, acak, deteksi selesai)
  icons/                  ikon menu & antarmuka
  styles/                 CSS per bagian (tokens, base, ui, home, nav, games/*)
tests/                    tes unit (node:test, dijalankan lewat tsx)
scripts/                  alat bantu (gen-blocks-bank.ts: membuat ulang bank soal Geser Balok)
```

## Menambah game baru

1. Buat `src/games/namagame/logic.ts` (aturan) dan `ui.ts` yang mengekspor fungsi `Mount`
   (`(id, el, info) => Cleanup | void`, lihat `src/core/types.ts`).
2. Daftarkan di `src/games/registry.ts`, dan tambahkan ikonnya di `src/icons/game-icons.ts` (kunci = id game).
3. Tambahkan file CSS di `src/styles/games/` lalu `@import` di `src/styles/index.css`.
4. Tulis tes di `tests/`.

## Pengujian

`npm test` menjalankan 48 tes unit, antara lain: mesin catur dicocokkan dengan 6 posisi uji standar
(perft sampai 4 langkah, mencakup rokade, en passant, promosi), semua putaran Rubik 2x2/3x3/4x4 kembali
ke awal setelah 4 kali, Sudoku selalu punya tepat satu solusi, soal Pindahkan Batang butuh tepat 1/2/3 pemindahan,
bot XOX 3x3 tidak pernah kalah, 2048 dibandingkan dengan implementasi referensi, semua soal Game 24 punya solusi sesuai tingkatnya,
Piramida Angka selalu bisa dipecahkan hanya dengan logika, Tebak Kode selalu bisa dipecahkan dengan strategi eliminasi,
dan langkah minimum tiap soal Geser Balok dihitung ulang dengan BFS.

Untuk pengujian tampilan di browser, bangun dengan `npx vite build --mode test`: pada mode itu beberapa game
membuka hook `window.__cs` (catur) dan `window.__rb` (Rubik) yang dipakai skrip uji. Pada build produksi
hook ini tidak ikut terbawa.

## Soal Geser Balok

Soal berasal dari bank terverifikasi di `src/games/blocks/bank.ts` (40/39/29 soal untuk Mudah/Sedang/Sulit, langkah minimum 4 sampai 23).
Membuat ulang atau menambah soal: `npm run gen:blocks -- 300` (mencari selama 300 detik; makin lama makin banyak soal Sulit).

## Catatan

- TypeScript memakai `strict: true`. Beberapa kode antarmuka (event DOM) masih memakai `as` untuk elemen
  yang pasti ada; bagian logika game sudah bertipe penuh.
- Font Space Grotesk dimuat dari Google Fonts; tanpa internet otomatis memakai font bawaan perangkat.
- Lisensi pihak ketiga (ikon) ada di `LICENSES.md`.

## Animasi & spanduk hasil

- Spanduk besar muncul **di atas papan** saat menang/kalah/seri (Catur, XOX, 15 Puzzle, 2048, Rubik); ketuk untuk menutup. Kode di `src/core/banner.ts` + `src/styles/banner.css`.
- Bidak catur meluncur (termasuk rokade), tanda XOX "pop", petak 15 Puzzle dan 2048 bergeser, kubus Rubik melompat saat selesai.
- Hormati pengaturan *reduce motion* di perangkat.

## Catur v2 (dibuat ulang)

- Engine (`src/games/chess/engine.ts`, aturan resmi + 49 tes) tidak berubah; hanya antarmuka yang ditulis ulang.
- DOM dibangun sekali; bidak bergerak lewat variabel CSS `--r/--c` + transisi (tanpa render ulang), jadi mulus dan tahan ganti ukuran layar.
- Bidak SVG buatan sendiri (`pieces.ts`), konsisten di semua HP. Input ketuk **atau seret**. Sorotan langkah terakhir, titik langkah sah, raja kena skak berkedip.
- Fitur: Lawan Bot (3 level) / Main Bareng Teman, Urungkan, Putar papan, promosi lewat pilihan bidak, bidak yang dimakan + selisih materi, rokade & en passant beranimasi.

## APK Android (offline)
Proyek ini siap dibungkus Capacitor menjadi APK yang memuat semua aset secara lokal (tanpa Vercel/internet). Panduan lengkap dari HP, kunci penandatangan, alur `main`/`development`, checklist uji, dan catatan AdMob: [`docs/ANDROID.md`](docs/ANDROID.md).

## Suara & animasi
Efek suara + musik latar disintesis lewat Web Audio (tanpa file audio, offline), bisa dimatikan di tab Setting. Membuka game memakai animasi masuk (hormati pengaturan *reduce motion*).

Setting memuat: tema, ikon, suara, Bagikan, Kebijakan privasi, Tentang. Iklan AdMob (banner di menu saja) dan kebijakan privasi dijelaskan di [`docs/ANDROID.md`](docs/ANDROID.md).
Musik latar bisa diganti lagu asli: taruh `.mp3`/`.ogg` di `src/assets/music/` (lihat `docs/ANDROID.md`).

## Bot catur
Mesin pencari sendiri (`src/games/chess/search.ts`): papan bilangan bulat dengan make/unmake, alpha-beta (PVS) + iterative deepening, tabel transposisi, null-move, late-move reduction, quiescence, dan evaluasi (materi, tabel posisi, pasangan gajah, pion lolos/ganda). Aturan resmi tetap di `engine.ts`; `tests/chess-search.test.ts` mencocokkan jumlah langkah (perft) dengan angka acuan.
- **Mudah**: kedalaman 2 + sering salah langkah. **Sedang**: ±0,6 detik, sesekali meleset. **Sulit**: sampai ±1,7 detik, tanpa kesalahan acak. Bot menghindari mengulang posisi bila ada langkah lain (tidak mudah seri).
