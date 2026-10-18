/**
 * Suara sintetis (Web Audio) — TANPA file audio, jadi tetap ringan & offline.
 * Data suara (Voice) dipisah dari pemutarnya supaya mudah dites dan bisa dirender offline.
 */
export type SfxKind = 'tap' | 'pop' | 'good' | 'bad' | 'win' | 'lose' | 'draw' | 'flip' | 'move' | 'capture' | 'open' | 'back' | 'turn' | 'rtk1' | 'rtk2' | 'rtk3' | 'settle';

export interface Voice {
  type: OscillatorType;
  /** Frekuensi awal (Hz) dan opsional frekuensi akhir (meluncur). */
  f0: number;
  f1?: number;
  /** Waktu mulai (detik, relatif), durasi, dan puncak volume. */
  t: number;
  dur: number;
  gain: number;
  attack?: number;
  /** Bila diisi: nada ditahan rata lalu dilepas selama `rel` detik di akhir (pad / melodi yang halus). Tanpa ini: meluruh. */
  rel?: number;
  /** Low-pass (Hz) agar nada lebih lembut. */
  lp?: number;
}

export const noteFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

const v = (type: OscillatorType, f0: number, t: number, dur: number, gain: number, extra: Partial<Voice> = {}): Voice => ({ type, f0, t, dur, gain, ...extra });
const n = noteFreq;

export const SFX: Record<SfxKind, Voice[]> = {
  tap: [v('sine', 900, 0, 0.05, 0.2, { f1: 620 })],
  pop: [v('triangle', 540, 0, 0.09, 0.3, { f1: 300 })],
  good: [v('sine', n(76), 0, 0.13, 0.28), v('sine', n(81), 0.09, 0.2, 0.28)],
  bad: [v('sawtooth', 170, 0, 0.2, 0.2, { f1: 105, lp: 900 })],
  win: [
    v('triangle', n(72), 0, 0.16, 0.3), v('triangle', n(76), 0.1, 0.16, 0.3),
    v('triangle', n(79), 0.2, 0.16, 0.3), v('triangle', n(84), 0.3, 0.5, 0.32),
  ],
  lose: [
    v('triangle', n(67), 0, 0.2, 0.28, { lp: 1800 }), v('triangle', n(64), 0.16, 0.2, 0.28, { lp: 1800 }),
    v('triangle', n(60), 0.32, 0.45, 0.28, { lp: 1800 }),
  ],
  draw: [v('triangle', n(72), 0, 0.18, 0.26), v('triangle', n(72), 0.2, 0.3, 0.26)],
  flip: [v('square', 1100, 0, 0.035, 0.07, { f1: 700, lp: 3200 })],
  move: [v('triangle', 320, 0, 0.07, 0.3, { f1: 180 }), v('sine', 120, 0, 0.06, 0.22)],
  capture: [v('triangle', 260, 0, 0.1, 0.34, { f1: 110 }), v('sawtooth', 200, 0, 0.06, 0.1, { lp: 700 })],
  open: [v('sine', 330, 0, 0.2, 0.15, { f1: 760, attack: 0.04 })],
  back: [v('sine', 700, 0, 0.15, 0.14, { f1: 360 })],
  // Rubik: putaran satu sisi ("klak"), rentetan acak ("tek" 3 nada), dan bunyi berhenti ("nyes")
  turn: [v('triangle', 380, 0, 0.065, 0.3, { f1: 230 }), v('sine', 1600, 0, 0.02, 0.1, { f1: 800 }), v('sine', 150, 0, 0.05, 0.2)],
  rtk1: [v('triangle', 540, 0, 0.04, 0.22, { f1: 340 }), v('sine', 2300, 0, 0.012, 0.09, { f1: 1400 })],
  rtk2: [v('triangle', 640, 0, 0.04, 0.22, { f1: 400 }), v('sine', 2600, 0, 0.012, 0.09, { f1: 1500 })],
  rtk3: [v('triangle', 470, 0, 0.04, 0.22, { f1: 300 }), v('sine', 2000, 0, 0.012, 0.09, { f1: 1300 })],
  settle: [v('sine', 210, 0, 0.15, 0.3, { f1: 90 }), v('triangle', 720, 0, 0.07, 0.16, { f1: 430 }), v('triangle', 960, 0.06, 0.09, 0.1)],
};

// ---------- musik latar (loop 8 birama, ±20 detik) ----------
export const BPM = 96;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;

interface Chord { root: number; tones: readonly number[] }
/** `root` = nada bass. Sengaja tidak lebih rendah dari C3 (±131 Hz): speaker HP tidak mampu memainkan nada lebih rendah (terdengar bergetar). */
export const PROGRESSION: readonly Chord[] = [
  { root: 48, tones: [60, 64, 67] }, // C
  { root: 52, tones: [57, 60, 64] }, // Am (bass E3 = Am/E)
  { root: 53, tones: [57, 60, 65] }, // F
  { root: 55, tones: [59, 62, 67] }, // G
  { root: 48, tones: [60, 64, 67] }, // C
  { root: 52, tones: [59, 64, 67] }, // Em
  { root: 53, tones: [57, 60, 65] }, // F
  { root: 55, tones: [59, 62, 67] }, // G
];

/** Melodi per birama: [ketuk ke-, nada MIDI, panjang (ketuk)]. */
export const MELODY: ReadonlyArray<ReadonlyArray<readonly [number, number, number]>> = [
  [[0, 76, 1], [1, 79, 1], [2, 81, 1], [3, 79, 1]],
  [[0, 76, 1.5], [2, 72, 1], [3, 76, 1]],
  [[0, 77, 1], [1, 81, 1], [2, 79, 1], [3, 77, 1]],
  [[0, 74, 1.5], [2, 79, 1], [3, 74, 1]],
  [[0, 76, 1], [1, 79, 1], [2, 84, 1.5]],
  [[0, 83, 1], [1, 79, 1], [2, 76, 1], [3, 79, 1]],
  [[0, 81, 1], [1, 77, 1], [2, 72, 1], [3, 77, 1]],
  [[0, 79, 1], [1, 74, 1], [2, 71, 2]],
];

const ARP = [0, 1, 2, 1, 0, 1, 2, 1] as const;

/** Semua suara satu birama musik (waktu relatif terhadap awal birama). */
export function musicBar(i: number): Voice[] {
  const k = ((i % PROGRESSION.length) + PROGRESSION.length) % PROGRESSION.length;
  const ch = PROGRESSION[k] as Chord;
  const out: Voice[] = [];
  out.push(v('sine', n(ch.root), 0, BEAT * 1.9, 0.13, { attack: 0.02, rel: 0.5 }));
  out.push(v('sine', n(ch.root), BEAT * 2, BEAT * 1.9, 0.11, { attack: 0.02, rel: 0.5 }));
  // pad: sedikit melewati batas birama dan masuk-keluar perlahan, sehingga antar-birama menyatu (tidak berdenyut)
  for (const tone of ch.tones) out.push(v('sine', n(tone), 0, BAR + 0.4, 0.028, { attack: 0.4, rel: 0.4 }));
  ARP.forEach((idx, st) => out.push(v('triangle', n((ch.tones[idx] as number) + 12), st * BEAT * 0.5, BEAT * 0.45, 0.04, { attack: 0.012 })));
  for (const [b, midi, len] of MELODY[k] as ReadonlyArray<readonly [number, number, number]>) {
    out.push(v('sine', n(midi), b * BEAT, len * BEAT * 0.95, 0.08, { attack: 0.04, rel: 0.18 }));
  }
  return out;
}

/** Jadwal birama berikutnya. Jika jam audio sudah jauh melewati `nextBar` (mis. aplikasi tadi di latar belakang), mulai dari SEKARANG — jangan mengejar ketertinggalan (itu yang membuat musik menumpuk/terdengar cepat). */
export function planMusic(nextBar: number, now: number, lookahead = 1.2): { start: number; count: number } {
  const start = nextBar < now - 0.05 ? now + 0.1 : nextBar;
  let count = 0;
  while (start + count * BAR < now + lookahead) count++;
  return { start, count };
}

/** Memainkan sekumpulan suara pada `dest`, mulai di waktu konteks `when`. */
export function playVoices(ctx: BaseAudioContext, dest: AudioNode, voices: readonly Voice[], when: number): void {
  for (const x of voices) {
    const t0 = when + x.t, a = x.attack ?? 0.005;
    const o = ctx.createOscillator();
    o.type = x.type;
    o.frequency.setValueAtTime(x.f0, t0);
    if (x.f1) o.frequency.exponentialRampToValueAtTime(x.f1, t0 + x.dur);
    const g = ctx.createGain();
    const peak = Math.max(x.gain, 0.0002);
    g.gain.setValueAtTime(0.0001, t0);
    if (x.rel) {
      g.gain.linearRampToValueAtTime(peak, t0 + a);
      g.gain.setValueAtTime(peak, Math.max(t0 + a, t0 + x.dur - x.rel));
      g.gain.linearRampToValueAtTime(0.0001, t0 + x.dur);
    } else {
      g.gain.exponentialRampToValueAtTime(peak, t0 + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + x.dur);
    }
    if (x.lp) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = x.lp;
      o.connect(f);
      f.connect(g);
    } else o.connect(g);
    g.connect(dest);
    o.start(t0);
    o.stop(t0 + x.dur + 0.03);
  }
}

const MUSIC_LEVEL = 0.9;
const TRACK_LEVEL = 1.0; // volume elemen <audio> untuk lagu bawaan

/** Pengelola suara: konteks audio dibuat saat ada sentuhan pertama (aturan autoplay browser/WebView). */
export class SoundEngine {
  sfxOn = true;
  musicOn = true;
  /** Lagu bawaan (URL). Jika ada, diputar menggantikan musik sintetis. */
  tracks: readonly string[] = [];
  private audio: HTMLAudioElement | null = null;
  private trackIdx = Math.floor(Math.random() * 1000);
  /** -1 = semua lagu bergantian; selain itu indeks satu lagu yang diulang. */
  trackPick = -1;
  private ctx: AudioContext | null = null;
  private sfxBus: GainNode | null = null;
  private musBus: GainNode | null = null;
  private musIn: BiquadFilterNode | null = null;
  /** Satu "sesi" musik = satu node gain; diputus saat musik berhenti sehingga sisa nada yang sudah terjadwal ikut senyap. */
  private session: GainNode | null = null;
  private active = true;
  private timer = 0;
  private nextBar = 0;
  private bar = 0;

  /** Panggil dari dalam event sentuhan/klik. Aman dipanggil berulang kali. */
  unlock(): void {
    if (!this.ctx) {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
      const C = w.AudioContext ?? w.webkitAudioContext;
      if (!C) return;
      try { this.ctx = new C(); } catch { return; }
      const c = this.ctx;
      // Pembatas puncak saja (bukan kompresor agresif): efek ketukan tidak membuat musik "memompa" naik-turun.
      const limiter = c.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.1;
      limiter.connect(c.destination);
      this.sfxBus = c.createGain();
      this.sfxBus.gain.value = 1.25;
      this.sfxBus.connect(limiter);
      // Musik: buang nada sangat rendah (speaker HP bergetar) dan sangat tinggi (kasar) agar terdengar halus.
      this.musBus = c.createGain();
      this.musBus.gain.value = 0;
      this.musBus.connect(limiter);
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      lp.connect(this.musBus);
      this.musIn = c.createBiquadFilter();
      this.musIn.type = 'highpass';
      this.musIn.frequency.value = 120;
      this.musIn.connect(lp);
    }
    if (this.active && this.ctx.state !== 'running') void this.ctx.resume().catch(() => undefined).finally(() => this.syncMusic());
    this.syncMusic();
  }

  play(kind: SfxKind, delayMs = 0): void {
    if (!this.ctx || !this.sfxBus || !this.sfxOn || !this.active) return;
    playVoices(this.ctx, this.sfxBus, SFX[kind], this.ctx.currentTime + 0.005 + delayMs / 1000);
  }

  setMusic(on: boolean): void { this.musicOn = on; this.syncMusic(); }

  /** false saat aplikasi di latar belakang: hentikan semua suara. */
  setActive(on: boolean): void {
    this.active = on;
    if (!this.ctx) return;
    if (on) void this.ctx.resume().catch(() => undefined).finally(() => this.syncMusic());
    else { this.syncMusic(); void this.ctx.suspend().catch(() => undefined); }
  }

  private loadTrack(): void {
    if (!this.audio || !this.tracks.length) return;
    const i = this.trackPick >= 0 ? this.trackPick : this.trackIdx;
    this.audio.src = this.tracks[i % this.tracks.length] as string;
  }

  /** Pilih satu lagu (diulang) atau -1 = semua bergantian. Langsung diputar bila musik menyala. */
  setTrack(i: number): void {
    this.trackPick = i;
    if (i >= 0) this.trackIdx = i;
    if (!this.audio) { this.syncMusic(); return; }
    this.loadTrack();
    if (this.musicOn && this.active) void this.audio.play().catch(() => undefined);
  }

  private syncTracks(): void {
    const run = this.musicOn && this.active;
    if (!run) { this.audio?.pause(); return; }
    if (!this.audio) {
      const a = new Audio();
      a.preload = 'auto';
      a.volume = TRACK_LEVEL;
      const next = (): void => { if (this.trackPick < 0) this.trackIdx++; this.loadTrack(); void a.play().catch(() => undefined); };
      a.addEventListener('ended', next);
      let bad = 0;
      a.addEventListener('error', () => { if (++bad < this.tracks.length) next(); }); // lewati berkas rusak
      this.audio = a;
      this.loadTrack();
    }
    void this.audio.play().catch(() => undefined);
  }

  private syncMusic(): void {
    if (this.tracks.length) { this.syncTracks(); return; }
    const c = this.ctx;
    if (!c || !this.musBus || !this.musIn) return;
    const run = this.musicOn && this.active && c.state === 'running';
    this.musBus.gain.setTargetAtTime(run ? MUSIC_LEVEL : 0, c.currentTime, 0.08);
    if (run && !this.timer) {
      this.session = c.createGain();
      this.session.connect(this.musIn);
      this.nextBar = c.currentTime + 0.15;
      this.timer = window.setInterval(() => this.tick(), 300);
      this.tick();
    } else if (!run && this.timer) {
      clearInterval(this.timer);
      this.timer = 0;
      this.session?.disconnect(); // semua nada musik yang sudah terjadwal langsung senyap
      this.session = null;
    }
  }

  private tick(): void {
    const c = this.ctx, bus = this.session;
    if (!c || !bus) return;
    const plan = planMusic(this.nextBar, c.currentTime);
    for (let i = 0; i < plan.count; i++) {
      playVoices(c, bus, musicBar(this.bar), plan.start + i * BAR);
      this.bar++;
    }
    this.nextBar = plan.start + plan.count * BAR;
  }
}
