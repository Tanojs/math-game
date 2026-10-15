/**
 * Bidak catur sebagai SVG buatan sendiri, gaya kartun datar: isi polos + garis tepi tipis, bagian-bagian
 * (kerah, leher, alas) bertumpuk dengan garis tepinya masing-masing. Warna lewat CSS (.cpc.w / .cpc.k).
 * Kelas: `.f` isi+garis tepi, `.d` garis detail, `.h` sorot/bayangan lembut, `.e` titik (mata).
 */
const BASE =
  '<rect x="26" y="70" width="48" height="11" rx="4"/><rect x="19" y="80" width="62" height="12" rx="4.5"/>';

const SHAPES: Record<string, string> = {
  // Pion
  p:
    '<path d="M38 48C38 62 33 68 28 79H72C67 68 62 62 62 48Z"/>' +
    '<rect x="32" y="41" width="36" height="9" rx="4.5"/><circle cx="50" cy="27" r="15"/>' +
    '<rect x="22" y="78" width="56" height="13" rx="4.5"/>' +
    '<g class="h"><path d="M42 54C42 62 39 68 36 74"/></g>',
  // Benteng
  r:
    '<path d="M31 79L34 42H66L69 79Z"/><rect x="29" y="40" width="42" height="9" rx="3"/>' +
    '<path d="M25 42V13H38V22H44V13H56V22H62V13H75V42Z"/>' +
    '<rect x="21" y="78" width="58" height="13" rx="4.5"/>' +
    '<g class="h"><path d="M40 54L38 72"/></g>',
  // Gajah
  b:
    '<path d="M39 71C41 62 40 58 36 53H64C60 58 59 62 61 71Z"/>' +
    '<path d="M50 13C64 24 71 36 67 45C65 49 35 49 33 45C29 36 36 24 50 13Z"/>' +
    '<circle cx="50" cy="11" r="5.5"/><rect x="31" y="47" width="38" height="8" rx="4"/>' + BASE +
    '<g class="d"><path d="M45 27Q53 31 52 40"/></g>',
  // Kuda (menghadap kiri)
  n:
    '<path d="M27 80C27 69 33 62 41 56L31 58C22 60 15 54 19 47C22 41 29 36 34 29L36 12L47 19C65 24 79 44 76 62L74 80Z"/>' +
    '<rect x="19" y="78" width="62" height="13" rx="4.5"/>' +
    '<g class="d"><path d="M60 28C70 38 72 52 68 64"/><path d="M22 50L25 52"/></g>' +
    '<g class="h"><path d="M44 58C50 52 53 46 52 40"/></g><circle class="e" cx="43" cy="34" r="3.2"/>',
  // Menteri / Ratu
  q:
    '<path d="M32 72L21 28L29 45L36 20L43 41L50 15L57 41L64 20L71 45L79 28L68 72Z"/>' +
    '<circle cx="21" cy="25" r="5.5"/><circle cx="36" cy="17" r="5.5"/><circle cx="50" cy="11" r="5.5"/>' +
    '<circle cx="64" cy="17" r="5.5"/><circle cx="79" cy="25" r="5.5"/>' +
    '<rect x="29" y="61" width="42" height="10" rx="5"/>' + BASE,
  // Raja
  k:
    '<path d="M32 72C28 58 26 46 34 40C40 36 46 35 50 35C54 35 60 36 66 40C74 46 72 58 68 72Z"/>' +
    '<path d="M45 4H55V11H62V20H55V30H45V20H38V11H45Z"/>' +
    '<rect x="29" y="61" width="42" height="10" rx="5"/>' + BASE +
    '<g class="h"><path d="M38 48C37 54 37 58 38 60"/></g>',
};

/** `type` = p, n, b, r, q, k (huruf kecil). */
export const pieceSvg = (type: string): string =>
  `<svg viewBox="0 0 100 100" aria-hidden="true"><g class="f">${SHAPES[type] ?? ''}</g></svg>`;

/** Elemen pembungkus berwarna: `ch` = huruf bidak ala FEN (besar = putih). */
export const pieceHtml = (ch: string): string =>
  `<span class="cpc ${ch === ch.toUpperCase() ? 'w' : 'k'}">${pieceSvg(ch.toLowerCase())}</span>`;
