import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const read = (f: string): string => fs.readFileSync(path.join(root, f), 'utf8');
const walk = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

test('offline: index.html tidak memuat sumber dari internet', () => {
  assert.doesNotMatch(read('index.html'), /(src|href)\s*=\s*["']https?:\/\//i);
});

test('offline: kode dan CSS tidak memakai jaringan (fetch / XHR / URL http)', () => {
  const files = walk(path.join(root, 'src')).filter((f) => /\.(ts|css)$/.test(f));
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    assert.doesNotMatch(s, /\bfetch\s*\(|XMLHttpRequest|WebSocket\s*\(/, `${f} memakai jaringan`);
    assert.doesNotMatch(s.replace(/http:\/\/www\.w3\.org\/\d+\/\w+/g, ''), /https?:\/\//, `${f} memuat URL eksternal`);
  }
});

test('penyimpanan: localStorage hanya diakses lewat core/storage.ts (aman bila diblokir)', () => {
  const offenders = walk(path.join(root, 'src'))
    .filter((f) => f.endsWith('.ts') && !f.endsWith(path.join('core', 'storage.ts')))
    .filter((f) => /\blocalStorage\b/.test(fs.readFileSync(f, 'utf8')));
  assert.deepEqual(offenders, []);
});

test('Capacitor: appId, scheme, dan sumber aset tidak berubah / tidak memuat dari server', () => {
  const c = read('capacitor.config.ts');
  assert.match(c, /appId:\s*'com\.tanostore\.mathgames'/);
  assert.match(c, /androidScheme:\s*'https'/);
  assert.match(c, /webDir:\s*'dist'/);
  assert.doesNotMatch(c.replace(/\/\*[\s\S]*?\*\//g, ''), /\burl\s*:/, 'server.url membuat APK memuat dari internet');
});

test('rilis: workflow APK hanya manual (tidak ada rilis otomatis)', () => {
  const y = read('.github/workflows/android.yml');
  assert.match(y, /workflow_dispatch:/);
  assert.doesNotMatch(y, /^\s{2}(push|pull_request|schedule|release):/m);
});
