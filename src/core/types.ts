export type Cleanup = () => void;
/** Menulis teks ringkas di chip kanan atas layar game. */
export type Info = (text: string) => void;
/** Memasang sebuah game ke elemen `el`. Boleh mengembalikan fungsi pembersih. */
export type Mount = (id: string, el: HTMLElement, info: Info) => Cleanup | void;
export interface GameDef { id: string; name: string; mount: Mount }
