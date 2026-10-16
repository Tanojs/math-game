import test from 'node:test';
import assert from 'node:assert/strict';
import { BAR, BEAT, MELODY, PROGRESSION, SFX, musicBar, noteFreq, type SfxKind } from '../src/core/audio.js';

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
      assert.ok(x.f0 >= 60 && x.f0 <= 2200, `birama ${i}: ${x.f0} Hz`);
      assert.ok(x.t >= 0 && x.t < BAR && x.t + x.dur <= BAR + 0.01, `birama ${i}: keluar batas`);
    }
    // jumlah volume serentak tetap rendah (musik latar tidak menenggelamkan efek)
    assert.ok(voices.filter((x) => x.t === 0).reduce((s, x) => s + x.gain, 0) < 0.45);
  }
  // indeks di luar 0..7 berputar (loop tak berujung)
  assert.deepEqual(musicBar(8), musicBar(0));
});
