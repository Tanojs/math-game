import { Capacitor, registerPlugin } from '@capacitor/core';

const cache = new Map<string, unknown>();

/** Plugin native Capacitor. `null` di browser biasa atau bila plugin tidak ikut terpasang di APK. */
export function nativePlugin<T>(name: string): T | null {
  try {
    if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable(name)) return null;
    if (!cache.has(name)) cache.set(name, registerPlugin<T>(name));
    return cache.get(name) as T;
  } catch {
    return null;
  }
}
