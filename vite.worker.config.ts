import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'worker/index.ts'),
      name: 'worker',
      fileName: () => 'index.js',
      formats: ['es'],
    },
    outDir: 'dist-worker',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
    },
  },
});
