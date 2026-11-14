import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Prototipo visual autocontenido: no comparte build ni dependencias con el juego Phaser de la raíz.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 2000 },
});
