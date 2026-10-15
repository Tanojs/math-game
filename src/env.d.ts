interface ImportMetaEnv { readonly MODE: string }
interface ImportMeta { readonly env: ImportMetaEnv }

// Impor CSS (diproses Vite)
declare module '*.css';

// CSS font dari paket npm (@fontsource) dibundel oleh Vite.
declare module '@fontsource/*';
