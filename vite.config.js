import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Base path for deployment
  base: '/',
  
  // Configure build output
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  
  // Development server options
  server: {
    port: 3000,
    open: true,
  },
});