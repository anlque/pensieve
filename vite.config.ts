import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    outDir: mode === 'extension' ? 'dist-extension' : 'dist',
  },
}));
