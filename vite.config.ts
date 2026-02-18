import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';

// Common define for ESM __dirname polyfill in Electron main process
const electronDefine: Record<string, string> = {
  __dirname: 'import.meta.dirname',
};

export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process entry
        entry: 'electron/main.ts',
        vite: {
          define: electronDefine,
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
      {
        // Preload script entry
        entry: 'electron/preload.ts',
        onstart(args) {
          args.reload();
        },
        vite: {
          define: electronDefine,
          build: {
            outDir: 'dist/electron',
            rollupOptions: {
              external: ['electron'],
            },
          },
        },
      },
    ]),
    renderer(),
  ],
  root: '.',
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5174,
  },
  optimizeDeps: {
    exclude: ['electron'],
  },
});
