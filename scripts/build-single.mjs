// Build alternatif: menghasilkan SATU file HTML mandiri (dist-single/math-games.html) tanpa Vite.
// Berguna untuk dibuka langsung / diunggah ke hosting statis. Jalankan: npm run build:single
// Penyisipan memakai split/join (bukan String.replace) agar pola `$&`, `$'` di dalam kode tidak merusak hasil.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const FAKE_TRACKS = "({ '../assets/music/01-santai-sore.mp3': 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=', '../assets/music/02-petualangan-ceria.mp3': 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=' })"; // hanya untuk uji e2e (MG_FAKE_TRACKS=1)

const here = path.dirname(fileURLToPath(import.meta.url));
const proj = path.resolve(here, '..');
const root = path.join(proj, 'src');
const mods = {};
const walk = (d) => {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.ts') && !p.endsWith('.d.ts')) {
      const id = path.relative(root, p).split(path.sep).join('/').replace(/\.ts$/, '');
      const src = fs.readFileSync(p, 'utf8')
        .replace(/import\.meta\.env\.MODE/g, JSON.stringify(process.env.MG_MODE ?? 'production'))
        .replace(/^import\s+'\.\/styles\/index\.css';?\s*$/m, '')
        .replace(/^import\s*\{[^}]*\}\s*from\s*'@capacitor\/core';?\s*$/gm, 'const Capacitor = { isNativePlatform: () => false, isPluginAvailable: (_n: string) => false }; const registerPlugin = <T,>(_n: string): T => undefined as unknown as T;') // build web biasa: tanpa runtime native
        .replace(/import\.meta\.glob(<[^>]*>)?\([^)]*\)/g, process.env.MG_FAKE_TRACKS ? FAKE_TRACKS : '{}') // pratinjau satu-file: tanpa lagu bundel
        .replace(/^import\s+'@fontsource\/[^']+';?.*$/gm, ''); // font npm: dibundel Vite; di sini diganti tautan Google Fonts (lihat bawah)
      mods[id] = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    }
  }
};
walk(root);
const css = (f) => fs.readFileSync(f, 'utf8').replace(/@import\s+'([^']+)';/g, (_, r) => css(path.join(path.dirname(f), r)));
const CSS = css(path.join(root, 'styles/index.css'));
const reg = Object.entries(mods).map(([k, v]) => JSON.stringify(k) + ':function(module,exports,require){' + v + '\n}').join(',\n');
const js = `(function(){var defs={${reg}};var cache={};
function norm(from,r){var parts=from.split('/');parts.pop();r.split('/').forEach(function(s){if(s==='.')return;if(s==='..')parts.pop();else parts.push(s);});return parts.join('/').replace(/\\.js$/,'');}
function load(id){if(cache[id])return cache[id].exports;var m={exports:{}};cache[id]=m;if(!defs[id])throw new Error('modul tidak ada: '+id);defs[id](m,m.exports,function(r){return load(norm(id,r));});return m.exports;}
load('main');})();`;
let html = fs.readFileSync(path.join(proj, 'index.html'), 'utf8');
const fav = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(proj, 'public/favicon.svg')).toString('base64');
html = html.split('href="/favicon.svg"').join('href="' + fav + '"');
const tag = '<script type="module" src="/src/main.ts"></script>';
if (!html.includes(tag)) throw new Error('tag script tidak ditemukan di index.html');
// Build satu-file ini untuk dibuka online (mis. pratinjau): font dari Google Fonts. Tambahkan --offline untuk melewatkannya (font sistem).
const FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com" />\n<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />\n';
if (!process.argv.includes('--offline')) html = html.split('</head>').join(FONTS + '</head>');
html = html.split('</head>').join('<style>\n' + CSS.split('</style').join('<\\/style') + '\n</style>\n</head>');
html = html.split(tag).join('<script>\n' + js.split('</script').join('<\\/script').split('<!--').join('<\\!--') + '\n</script>');
const out = path.join(proj, 'dist-single');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'math-games.html'), html);
console.log('OK ->', path.join(out, 'math-games.html'), `(${Math.round(html.length / 1024)} KB, ${Object.keys(mods).length} modul)`);
