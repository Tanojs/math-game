import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { APP_NAME, APP_VERSION } from '../src/app/brand.js';
import { ADMOB_APP_ID, ADMOB_BANNER_ID, ADS_TESTING } from '../src/app/ads-config.js';
import { GAMES } from '../src/games/registry.js';

const root = path.resolve(import.meta.dirname, '..');
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8');

test('versi: brand.ts = package.json', () => {
  assert.equal(APP_VERSION, JSON.parse(read('package.json')).version);
});

test('nama aplikasi konsisten: brand.ts = capacitor.config.ts = <title> index.html', () => {
  assert.match(read('capacitor.config.ts'), new RegExp(`appName:\\s*'${APP_NAME}'`));
  assert.match(read('index.html'), new RegExp(`<title>${APP_NAME}</title>`));
});

test('nama game unik dan tombol navigasi memakai "Setting"', () => {
  const names = GAMES.map((g) => g.name);
  assert.equal(new Set(names).size, names.length);
  assert.ok(names.includes('Pindahkan Batang') && !names.includes('Pindah Batang'));
  assert.match(read('src/app/shell.ts'), /\['set', 'Setting'\]/);
});

test('AdMob: ID contoh Google saat ADS_TESTING; ID asli (bukan contoh) saat produksi', () => {
  const SAMPLE = 'ca-app-pub-3940256099942544';
  if (ADS_TESTING) {
    assert.ok(ADMOB_APP_ID.startsWith(SAMPLE) && ADMOB_BANNER_ID.startsWith(SAMPLE));
  } else {
    assert.match(ADMOB_APP_ID, /^ca-app-pub-\d{16}~\d{10}$/);
    assert.match(ADMOB_BANNER_ID, /^ca-app-pub-\d{16}\/\d{10}$/);
    assert.ok(!ADMOB_APP_ID.startsWith(SAMPLE) && !ADMOB_BANNER_ID.startsWith(SAMPLE));
  }
});

test('kebijakan privasi: halaman statis ada dan menyebut AdMob', () => {
  const h = read('public/privacy.html');
  assert.match(h, /Kebijakan Privasi/);
  assert.match(h, /AdMob/);
});

test('suara klik hanya pada event click (bukan pointerdown) agar scroll tidak berbunyi', () => {
  const s = read('src/app/sound.ts');
  assert.match(s, /addEventListener\('click'/);
  assert.doesNotMatch(s, /addEventListener\('pointerdown'[\s\S]{0,120}engine\.play\('tap'\)/);
});

test('CSS: tidak ada kelas dasar (.nama{...}) yang didefinisikan di dua berkas berbeda (mencegah tabrakan seperti .sw / .rc)', () => {
  const ALLOWED = new Set(['mode', 'modes', 'rv']); // sengaja: penyesuaian tata letak / selektor daftar
  const defs = new Map<string, Set<string>>();
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(root, 'src/styles')).filter((x) => x.endsWith('.css'))) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/(?:^|[}\n,])\s*\.([a-zA-Z][\w-]*)\s*\{/g)) {
      const k = m[1] as string;
      (defs.get(k) ?? defs.set(k, new Set()).get(k))?.add(f);
    }
  }
  const clash = [...defs].filter(([k, v]) => v.size > 1 && !ALLOWED.has(k)).map(([k, v]) => `${k}: ${[...v].map((x) => path.basename(x)).join(', ')}`);
  assert.deepEqual(clash, []);
});
