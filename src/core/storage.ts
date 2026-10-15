/** localStorage yang aman (mode privat / diblokir tidak membuat aplikasi error). */
export const getStr = (key: string): string | null => {
  try { return localStorage.getItem(key); } catch { return null; }
};
export const setStr = (key: string, value: string): void => {
  try { localStorage.setItem(key, value); } catch { /* diabaikan */ }
};
export const getJson = <T>(key: string, fallback: T): T => {
  const raw = getStr(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};
export const setJson = (key: string, value: unknown): void => setStr(key, JSON.stringify(value));
