import { $, $$, hit } from '../core/dom.js';
import { SoundEngine, type SfxKind } from '../core/audio.js';
import { getStr, setStr } from '../core/storage.js';

const K_SFX = 'mgsfx', K_MUS = 'mgmus';
const engine = new SoundEngine();
engine.sfxOn = getStr(K_SFX) !== '0'; // bawaan: nyala
engine.musicOn = getStr(K_MUS) !== '0';

const paint = (): void => {
  $$('#snd-fx [data-v]').forEach((b) => b.classList.toggle('on', (b.dataset.v === '1') === engine.sfxOn));
  $$('#snd-mu [data-v]').forEach((b) => b.classList.toggle('on', (b.dataset.v === '1') === engine.musicOn));
};

/** Suara: efek ketukan, hasil game, dan musik latar. Semua opsional & bisa dimatikan di Pengaturan. */
export function initSound(): void {
  let last = 0;
  // Sentuhan pertama membuka konteks audio (syarat autoplay), sekaligus bunyi "tik" di tombol/papan game.
  document.addEventListener('pointerdown', (e) => {
    engine.unlock();
    if (!engine.sfxOn) return;
    const t = e.target as Element | null;
    if (!t?.closest?.('button, #st, #hg')) return;
    const now = performance.now();
    if (now - last < 35) return;
    last = now;
    engine.play('tap');
  }, true);

  document.addEventListener('mg-sfx', (e) => {
    const d = (e as CustomEvent<{ kind: SfxKind; delayMs: number }>).detail;
    engine.play(d.kind, d.delayMs);
  });

  // Benar / salah umum: elemen yang baru mendapat kelas `ok` atau `bad` di area game.
  new MutationObserver((muts) => {
    let good = 0, bad = 0;
    for (const m of muts) {
      const el = m.target as Element, before = (m.oldValue ?? '').split(/\s+/);
      if (el.classList.contains('bad') && !before.includes('bad')) bad++;
      else if (el.classList.contains('ok') && !before.includes('ok')) good++;
    }
    if (bad) engine.play('bad');
    else if (good && good < 3) engine.play('good'); // banyak sekaligus = sorotan kemenangan (sudah punya suara sendiri)
  }).observe($('#gm'), { subtree: true, attributes: true, attributeFilter: ['class'], attributeOldValue: true });

  // Aplikasi ke latar belakang -> diam; kembali -> lanjut.
  document.addEventListener('visibilitychange', () => engine.setActive(!document.hidden));
  addEventListener('pagehide', () => engine.setActive(false));
  addEventListener('pageshow', () => engine.setActive(!document.hidden));

  $('#snd-fx').onclick = (e) => {
    const b = hit(e, '[data-v]');
    if (!b) return;
    engine.sfxOn = b.dataset.v === '1';
    setStr(K_SFX, engine.sfxOn ? '1' : '0');
    paint();
    engine.unlock();
    engine.play('good');
  };
  $('#snd-mu').onclick = (e) => {
    const b = hit(e, '[data-v]');
    if (!b) return;
    setStr(K_MUS, b.dataset.v === '1' ? '1' : '0');
    engine.unlock();
    engine.setMusic(b.dataset.v === '1');
    paint();
  };
  paint();
}
