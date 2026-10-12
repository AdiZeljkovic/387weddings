import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify — file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // React core — changes rarely, benefits most from long-term cache.
            // react-dom/client (the bulk of react-dom) has to be named too, or
            // it lands in the app's own chunk and is downloaded again after
            // every deploy.
            'vendor-react': ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
            // Animation library (Coming Soon and the panel only)
            'vendor-motion': ['motion'],
            // Icons are no longer forced into one shared chunk: the public
            // site uses three, the panel the rest, and each now loads only
            // what it uses
          },
        },
      },
    },
  };
});
