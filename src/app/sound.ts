import { $ } from '../core/dom.js';
import { SoundEngine, type SfxKind } from '../core/audio.js';
import { getStr, setStr } from '../core/storage.js';
import { TRACK_LIST } from '../core/tracks.js';

const K_SFX = 'mgsfx', K_MUS = 'mgmus';
const engine = new SoundEngine();
engine.sfxOn = getStr(K_SFX) !== '0'; // bawaan: nyala
engine.musicOn = getStr(K_MUS) !== '0';
engine.tracks = TRACK_LIST.map((t) => t.url);
const K_TRK = 'mgtrk';
const savedTrack = TRACK_LIST.findIndex((t) => t.name === getStr(K_TRK));
engine.trackPick = savedTrack; // -1 bila belum dipilih / lagu sudah tidak ada

const setSwitch = (sel: string, on: boolean): void => {
  const b = $(sel);
  b.classList.toggle('on', on);
  b.setAttribute('aria-checked', String(on));
};
const paint = (): void => { setSwitch('#snd-fx', engine.sfxOn); setSwitch('#snd-mu', engine.musicOn); };

/** Suara: efek ketukan, hasil game, dan musik latar. Semua opsional & bisa dimatikan di Setting. */
export function initSound(): void {
  let last = 0;
  // Sentuhan pertama membuka konteks audio (syarat autoplay). Bunyi "tik" hanya pada KETUKAN (event click),
  // bukan pada sentuhan awal, sehingga menggulir layar tidak berbunyi.
  document.addEventListener('pointerdown', () => engine.unlock(), true);
  document.addEventListener('click', (e) => {
    if (!engine.sfxOn) return;
    const t = e.target as Element | null;
    if (!t?.closest?.('button, #st, #hg') || t.closest('[data-nosnd]')) return; // data-nosnd: area yang membunyikan sendiri
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

  $('#snd-fx').onclick = () => {
    engine.sfxOn = !engine.sfxOn;
    setStr(K_SFX, engine.sfxOn ? '1' : '0');
    paint();
    engine.unlock();
    if (engine.sfxOn) engine.play('good');
  };
  $('#snd-mu').onclick = () => {
    const on = !engine.musicOn;
    setStr(K_MUS, on ? '1' : '0');
    engine.unlock();
    engine.setMusic(on);
    paint();
  };
  paint();
}

export const trackNames = (): string[] => TRACK_LIST.map((t) => t.name);
export const currentTrack = (): number => engine.trackPick;
export const trackLabel = (): string => (engine.trackPick >= 0 ? TRACK_LIST[engine.trackPick]?.name ?? 'Semua bergantian' : 'Semua bergantian');

/** Pilih lagu (-1 = semua bergantian). Bila musik sedang mati, otomatis dinyalakan agar langsung terdengar. */
export function pickTrack(i: number): void {
  setStr(K_TRK, i >= 0 ? TRACK_LIST[i]?.name ?? '' : '');
  engine.unlock();
  if (!engine.musicOn) { engine.musicOn = true; setStr(K_MUS, '1'); paint(); }
  engine.setTrack(i);
}
