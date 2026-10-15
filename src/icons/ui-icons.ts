const wrap = (d: string): string =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

/** Ikon antarmuka: tema (matahari/bulan/otomatis) dan navigasi bawah. */
export const UI_ICONS = {
  sun: wrap('<circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>'),
  moon: wrap('<path d="M20 14.5A8.5 8.5 0 119.5 4a7 7 0 0010.5 10.5z"/>'),
  auto: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 010 18z" fill="currentColor"/>'),
  home: wrap('<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>'),
  scr: wrap('<path d="M7 4h10v5a5 5 0 01-10 0zM7 6H4v2a3 3 0 003 3M17 6h3v2a3 3 0 01-3 3M12 14v4M8 20h8"/>'),
  set: wrap('<path d="M4 7h9M18 7h2M4 17h2M11 17h9"/><circle cx="15.5" cy="7" r="2.3"/><circle cx="8.5" cy="17" r="2.3"/>'),
} as const;
