/** Cara bermain per game (kunci = id di registry.ts). Ditampilkan lewat tombol "i" di pojok kanan bawah setiap game. */
const p = (s: string): string => `<p>${s}</p>`;

/** Tombol "Cara main" yang ditaruh di baris tombol bawah setiap game (gaya sama dengan tombol lain). */
export const HELP_BTN = '<button class="cta alt hw" data-hw aria-label="Cara bermain">Cara main</button>';

export const HOWTO: Readonly<Record<string, string>> = {
  hc: p('Jawab soal hitungan secepat mungkin dengan memilih jawaban yang benar. Jawaban benar beruntun memberi poin lebih banyak.') +
    p('Ada batas waktu 60 detik. Kumpulkan skor setinggi mungkin.'),
  tf: p('Lihat persamaan di layar, lalu pilih <b>Benar</b> atau <b>Salah</b>.') + p('Ada batas waktu 60 detik. Jawaban benar beruntun memberi poin lebih banyak.'),
  op: p('Lihat dua angka dan hasilnya, lalu pilih operator (+, −, ×, ÷) yang membuat persamaan benar.') + p('Ada batas waktu 60 detik.'),
  ty: p('Hitung soal lalu ketik jawabannya di keypad.') + p('Ada batas waktu 60 detik. Jawaban benar beruntun memberi poin lebih banyak.'),
  cmp: p('Bandingkan dua hitungan, lalu pilih <b>&lt;</b>, <b>=</b>, atau <b>&gt;</b> sesuai hasilnya.') + p('Ada batas waktu 60 detik.'),
  tb: p('Hitung perkalian dan ketik hasilnya di keypad.') + p('Ada batas waktu 60 detik.'),
  mtc: p('Hubungkan setiap soal di kolom kiri dengan jawabannya di kolom kanan. Tarik garis dari satu item ke item lain.') +
    p('Garis merah berarti pasangannya salah. Selesaikan semua pasangan sebelum waktu habis.'),
  g24: p('Dari empat angka, gabungkan dua angka dengan operator (+, −, ×, ÷) sampai tersisa satu angka yang bernilai <b>24</b>.') +
    p('Pilih angka, pilih operator, lalu pilih angka kedua. <b>Urungkan</b> membatalkan langkah terakhir; tombol <b>?</b> menampilkan jawabannya.'),
  pyr: p('Setiap kotak sama dengan jumlah dua kotak di bawahnya (kiri + kanan).') +
    p('Isi semua kotak kosong. Tekan <b>→</b> untuk memeriksa jawaban; kotak yang salah akan ditandai.'),
  stk: p('Batang-batang membentuk persamaan yang masih salah. Pindahkan batang supaya persamaannya menjadi benar.') +
    p('Ketuk batang untuk mengambilnya, lalu ketuk tempat kosong untuk meletakkannya. Jumlah batang yang harus dipindah tertulis di bawah soal.') +
    p('<b>Mudah</b>: 1 angka, pindahkan 1 batang. <b>Sedang</b>: angka puluhan, pindahkan 1 batang. <b>Sulit</b>: angka puluhan, pindahkan 2 batang.') +
    p('Garis "=" dan batang mendatar operator tidak bisa dipindah. Batang tegak di operator menentukan "+" (ada) atau "−" (tidak ada).'),
  ttt: p('X dan O bergantian mengisi petak kosong. Pemenang adalah yang membuat satu garis lurus (mendatar, tegak, atau diagonal) lebih dulu.') +
    p('Mainkan melawan bot, atau bersama teman di satu HP.'),
  g15: p('Susun angka dari kecil ke besar dengan menggeser kotak ke kotak kosong.') +
    p('Ketuk kotak yang bersebelahan dengan kotak kosong untuk menggesernya. Makin besar papan, makin sulit.'),
  g2048: p('Geser ke atas, bawah, kiri, atau kanan. Semua ubin ikut bergeser.') +
    p('Dua ubin dengan angka sama yang bertabrakan akan menyatu menjadi dua kali lipat. Raih ubin <b>2048</b>. Game selesai jika papan penuh dan tidak ada langkah lagi.'),
  sdk: p('Isi setiap baris, kolom, dan kotak 3×3 dengan angka 1 sampai 9 tanpa ada angka yang sama.') +
    p('Pilih kotak kosong, lalu pilih angka. Angka yang sudah ada dari awal tidak bisa diubah.'),
  chs: p('Mainkan catur melawan bot (pilih level ELO di atas papan) atau bersama teman di satu HP.') +
    p('Ketuk bidak lalu ketuk petak tujuan, atau seret bidak ke tujuannya. <b>Urungkan</b> membatalkan langkah. Menangkan permainan dengan skakmat.'),
  rev: p('Tujuannya punya piringan paling banyak saat papan penuh. Taruh piringan di petak kosong yang mengapit piringan lawan dalam satu garis lurus.') +
    p('Piringan lawan yang terapit akan terbalik menjadi milikmu. Jika tidak punya langkah, giliran dilewati.'),
  rbk: p('Putar sisi kubus dengan tombol U, D, L, R, F, B. Tanda <b>\'</b> berarti putar berlawanan arah.') +
    p('Kamu juga bisa menggeser langsung di stiker. Geser area kosong di sekitar kubus untuk memutar seluruh kubus. <b>Acak</b> untuk mengacak, lalu susun sampai setiap sisi satu warna.'),
  tap: p('Ketuk angka 1, 2, 3, dan seterusnya sampai angka terakhir secepat mungkin.') +
    p('Ketukan yang salah menambah waktu. Pilih ukuran papan di atas.'),
  cod: p('Tebak kode rahasia. Isi kotak dengan angka, lalu tekan <b>✓</b>.') +
    p('Setiap tebakan memberi petunjuk: <b>tepat</b> = angka benar di tempat yang benar; <b>geser</b> = angka benar tetapi tempatnya salah. Angka dalam kode tidak berulang. Kesempatan tebakannya terbatas.'),
  blk: p('Keluarkan balok merah lewat pintu di sisi kanan papan.') +
    p('Geser balok lain (mendatar atau tegak) untuk membuka jalan. Selesaikan dengan langkah sesedikit mungkin.'),
  mir: p('Sisi kiri adalah contoh. Sisi kanan harus menjadi bayangan cerminnya.') +
    p('Ketuk kotak di sisi kanan untuk memasang warna, dan ketuk lagi untuk melepasnya. Pilih warna di atas papan. Menang jika semua kotak sudah benar.'),
  mns: p('Buka semua kotak yang tidak berisi ranjau. Ketuk kotak untuk membukanya. Angka menunjukkan jumlah ranjau di sekitar kotak itu.') +
    p('Tahan lama (atau pakai mode bendera) untuk memasang atau melepas bendera di kotak yang kamu curigai ranjau. Ketukan pertama selalu aman.'),
  shp: p('Bagi papan menjadi area-area yang bentuknya sama dengan bentuk di bank (boleh diputar atau dicerminkan).') +
    p('Seret jari di petak kosong untuk membuat area. Ketuk area berwarna untuk menghapusnya.'),
};
