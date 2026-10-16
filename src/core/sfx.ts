import type { SfxKind } from './audio.js';

/** Minta efek suara dari game mana pun (tanpa ketergantungan ke modul suara aplikasi). `delayMs` = tunda pemutaran. */
export const sfx = (kind: SfxKind, delayMs = 0): void => {
  document.dispatchEvent(new CustomEvent('mg-sfx', { detail: { kind, delayMs } }));
};
