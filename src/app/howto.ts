import { getLang } from '../core/i18n.js';
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

/** Cara bermain dalam bahasa Inggris (kunci sama dengan HOWTO). */
export const HOWTO_EN: Readonly<Record<string, string>> = {
  hc: p('Answer the math questions as fast as you can by choosing the correct answer. Consecutive correct answers give more points.') +
    p('There is a 60-second time limit. Get the highest score you can.'),
  tf: p('Look at the equation on the screen, then choose <b>True</b> or <b>False</b>.') + p('There is a 60-second time limit. Consecutive correct answers give more points.'),
  op: p('Look at two numbers and the result, then choose the operator (+, −, ×, ÷) that makes the equation correct.') + p('There is a 60-second time limit.'),
  ty: p('Solve the question and type the answer on the keypad.') + p('There is a 60-second time limit. Consecutive correct answers give more points.'),
  cmp: p('Compare two calculations, then choose <b>&lt;</b>, <b>=</b>, or <b>&gt;</b> according to the results.') + p('There is a 60-second time limit.'),
  tb: p('Multiply and type the result on the keypad.') + p('There is a 60-second time limit.'),
  mtc: p('Match each question in the left column with its answer in the right column. Drag a line from one item to another.') +
    p('A red line means the pair is wrong. Finish all pairs before time runs out.'),
  g24: p('From four numbers, combine two numbers with an operator (+, −, ×, ÷) until one number is left that equals <b>24</b>.') +
    p('Pick a number, pick an operator, then pick the second number. <b>Undo</b> cancels the last step; the <b>?</b> button shows the answer.'),
  pyr: p('Each box equals the sum of the two boxes below it (left + right).') +
    p('Fill in all empty boxes. Press <b>→</b> to check the answers; wrong boxes will be marked.'),
  stk: p('The sticks form an equation that is still wrong. Move sticks so the equation becomes correct.') +
    p('Tap a stick to pick it up, then tap an empty spot to place it. The number of sticks to move is written below the question.') +
    p('<b>Easy</b>: 1 digit, move 1 stick. <b>Medium</b>: tens digits, move 1 stick. <b>Hard</b>: tens digits, move 2 sticks.') +
    p('The "=" sign and the horizontal stick of the operator cannot be moved. The vertical stick of the operator decides "+" (present) or "−" (absent).'),
  ttt: p('X and O take turns filling empty squares. The winner is the one who makes a straight line (horizontal, vertical, or diagonal) first.') +
    p('Play against the bot, or with a friend on the same phone.'),
  g15: p('Arrange the numbers from small to large by sliding tiles into the empty space.') +
    p('Tap a tile next to the empty space to slide it. The bigger the board, the harder it is.'),
  g2048: p('Swipe up, down, left, or right. All tiles move together.') +
    p('Two tiles with the same number that collide merge into double. Reach the <b>2048</b> tile. The game ends when the board is full and there are no moves left.'),
  sdk: p('Fill every row, column, and 3×3 box with the numbers 1 to 9 without repeating any number.') +
    p('Pick an empty cell, then pick a number. Numbers given at the start cannot be changed.'),
  chs: p('Play chess against the bot (choose the ELO level above the board) or with a friend on the same phone.') +
    p('Tap a piece then tap the target square, or drag the piece to its destination. <b>Undo</b> cancels a move. Win by checkmate.'),
  rev: p("The goal is to have the most discs when the board is full. Place a disc on an empty square that surrounds the opponent's disc in a straight line.") +
    p('Opponent discs that are surrounded are flipped to yours. If you have no move, your turn is skipped.'),
  rbk: p("Turn the cube faces with the buttons U, D, L, R, F, B. The <b>'</b> mark means turn counter-clockwise.") +
    p('You can also swipe directly on the stickers. Swipe the empty area around the cube to rotate the whole cube. <b>Scramble</b> to shuffle, then solve until each face is one color.'),
  tap: p('Tap the numbers 1, 2, 3, and so on up to the last number as fast as you can.') + p('Wrong taps add time. Pick the board size above.'),
  cod: p('Guess the secret code. Fill the boxes with numbers, then press <b>✓</b>.') +
    p('Each guess gives a hint: <b>exact</b> = right number in the right place; <b>shift</b> = right number in the wrong place. Numbers in the code do not repeat. Guess attempts are limited.'),
  blk: p('Get the red block out through the door on the right side of the board.') +
    p('Slide other blocks (horizontally or vertically) to open the way. Finish with as few moves as possible.'),
  mir: p('The left side is the example. The right side must be its mirror image.') +
    p('Tap a square on the right side to place a color, and tap again to remove it. Pick a color above the board. You win when all squares are correct.'),
  mns: p('Open all squares that do not contain a mine. Tap a square to open it. The number shows how many mines are around that square.') +
    p('Long-press (or use flag mode) to place or remove a flag on a square you suspect has a mine. The first tap is always safe.'),
  shp: p('Divide the board into areas that have the same shape as the shapes in the bank (rotation and mirror allowed).') +
    p('Drag your finger across empty squares to make an area. Tap a colored area to delete it.'),
};

/** Penjelasan game sesuai bahasa yang aktif. */
export const howtoFor = (id: string): string => {
  if (getLang() === 'en') return HOWTO_EN[id] ?? '<p>No instructions for this game yet.</p>';
  return HOWTO[id] ?? '<p>Belum ada penjelasan untuk game ini.</p>';
};
