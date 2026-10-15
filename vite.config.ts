import { defineConfig } from 'vite';

// Konfigurasi minimal: Vercel mendeteksi Vite otomatis (build: `npm run build`, output: `dist`).
export default defineConfig({
  build: { target: 'es2020' },
  server: { host: true }, // supaya bisa dibuka dari HP lewat jaringan WiFi yang sama saat `npm run dev`
});
