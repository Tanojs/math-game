import test from 'node:test';
import assert from 'node:assert/strict';
import { BAR, BEAT, MELODY, PROGRESSION, SFX, musicBar, noteFreq, planMusic, type SfxKind } from '../src/core/audio.js';

test('noteFreq: A4 = 440 Hz, oktaf = dua kali lipat', () => {
  assert.equal(noteFreq(69), 440);
  assert.ok(Math.abs(noteFreq(81) - 880) < 1e-9);
});

test('semua efek suara terdefinisi, valid, dan tidak berpotensi pecah (clipping)', () => {
  const kinds: SfxKind[] = ['tap', 'pop', 'good', 'bad', 'win', 'lose', 'draw', 'flip', 'move', 'capture', 'open', 'back'];
  for (const k of kinds) {
    const voices = SFX[k];
    assert.ok(voices && voices.length > 0, `${k} kosong`);
    for (const x of voices) {
      assert.ok(x.f0 > 20 && x.f0 < 12000 && (x.f1 === undefined || (x.f1 > 20 && x.f1 < 12000)), `${k}: frekuensi`);
      assert.ok(x.dur > 0 && x.dur < 1 && x.t >= 0 && x.gain > 0 && x.gain <= 0.4, `${k}: waktu/volume`);
    }
    // volume yang berbunyi SERENTAK (bukan jumlah semua nada berurutan)
    const peak = Math.max(...voices.map((a) => voices.filter((b) => b.t <= a.t && a.t < b.t + b.dur).reduce((sum, b) => sum + b.gain, 0)));
    assert.ok(peak <= 0.75, `${k}: volume serentak ${peak}`);
  }
});

test('musik: 8 birama, loop mulus, semua nada dalam rentang aman dan tiap birama sama panjang', () => {
  assert.equal(PROGRESSION.length, 8);
  assert.equal(MELODY.length, 8);
  assert.ok(Math.abs(BAR - BEAT * 4) < 1e-12);
  for (let i = 0; i < 8; i++) {
    const voices = musicBar(i);
    assert.ok(voices.length >= 15);
    for (const x of voices) {
      assert.ok(x.f0 >= 130 && x.f0 <= 2200, `birama ${i}: ${x.f0} Hz (tidak boleh di bawah ±C3: speaker HP bergetar)`);
      assert.ok(x.t >= 0 && x.t < BAR, `birama ${i}: mulai di luar birama`);
      // hanya pad yang boleh sedikit melewati batas birama (menyambung ke birama berikutnya)
      assert.ok(x.t + x.dur <= BAR + (x.rel ? 0.45 : 0.01), `birama ${i}: keluar batas`);
    }
    // jumlah volume serentak tetap rendah (musik latar tidak menenggelamkan efek)
    assert.ok(voices.filter((x) => x.t === 0).reduce((s, x) => s + x.gain, 0) < 0.45);
  }
  // indeks di luar 0..7 berputar (loop tak berujung)
  assert.deepEqual(musicBar(8), musicBar(0));
});

test('jadwal musik: setelah di latar belakang lama, mulai dari SEKARANG tanpa mengejar (tidak menumpuk)', () => {
  // normal: lanjut berurutan
  assert.deepEqual(planMusic(10, 9.5), { start: 10, count: 1 });
  // belum waktunya: JANGAN menjadwalkan apa pun (bug sebelumnya: tiap pemeriksaan 300 ms menambah satu birama -> menumpuk)
  assert.deepEqual(planMusic(10, 5), { start: 10, count: 0 });
  assert.deepEqual(planMusic(10, 8.7), { start: 10, count: 0 });
  // jalan 20 detik dengan pemeriksaan tiap 300 ms: tepat 8 birama berurutan tanpa celah/tumpang tindih
  let next = 0.15, bars = 0;
  for (let now = 0; now < 20; now += 0.3) { const p = planMusic(next, now); bars += p.count; next = p.start + p.count * BAR; }
  assert.equal(bars, Math.ceil((20 + 1.2 - 0.15) / BAR) );
  // jam audio melompat jauh (aplikasi di latar belakang): hanya birama dalam jendela 1.2 dtk, dimulai dari sekarang
  const p = planMusic(10, 400);
  assert.ok(Math.abs(p.start - 400.1) < 1e-9);
  assert.ok(p.count >= 1 && p.count <= 2, `count=${p.count}`);
  // tidak pernah menjadwalkan nada di masa lalu
  for (const [next, now] of [[0, 50], [5, 5], [5.04, 5], [100, 3]] as const) {
    assert.ok(planMusic(next, now).start >= now - 0.05);
  }
});
