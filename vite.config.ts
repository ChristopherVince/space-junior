import { defineConfig } from 'vite';

// base relativa para que funcione en GitHub Pages (https://<usuario>.github.io/space-junior/).
export default defineConfig({
  base: './',
  build: { chunkSizeWarningLimit: 2000 }, // Phaser pesa ~1.5 MB; es normal
});
