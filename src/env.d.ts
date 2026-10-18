interface ImportMetaEnv { readonly MODE: string }
interface ImportMeta {
  readonly env: ImportMetaEnv;
  glob<T = unknown>(pattern: string, options?: Record<string, unknown>): Record<string, T>;
}

// Impor CSS (diproses Vite)
declare module '*.css';

// CSS font dari paket npm (@fontsource) dibundel oleh Vite.
declare module '@fontsource/*';

// Tipe minimal untuk @capacitor/core (supaya typecheck tidak bergantung pada paket terpasang).
declare module '@capacitor/core' {
  export const Capacitor: { isNativePlatform(): boolean; isPluginAvailable(name: string): boolean };
  export function registerPlugin<T = unknown>(name: string): T;
}
