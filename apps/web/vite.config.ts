import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * The Iranian edition (VITE_EDITION=ir) must not depend on anything outside Iran:
 * drop the Google Fonts stylesheet (Persian uses the bundled Anjoman font) and start
 * the page in Persian, right to left.
 */
function iranianEdition(isIr: boolean): Plugin {
  return {
    name: 'purrpose-iranian-edition',
    transformIndexHtml(html) {
      if (!isIr) return html;
      return html
        .replace(/\s*<link rel="preconnect" href="https:\/\/fonts\.(googleapis|gstatic)\.com"[^>]*\/>/g, '')
        .replace(/\s*<link\s+href="https:\/\/fonts\.googleapis\.com[^"]*"\s+rel="stylesheet"\s*\/>/g, '')
        .replace('<html lang="en">', '<html lang="fa" dir="rtl">')
        .replace('<title>Purrpose</title>', '<title>پرپس</title>')
        .replace('content="Purrpose" />', 'content="پرپس" />');
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), iranianEdition((process.env.VITE_EDITION ?? loadEnv(mode, process.cwd(), 'VITE_').VITE_EDITION ?? '').trim().toLowerCase() === 'ir')],
  resolve: {
    alias: {
      '@purrpose/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@purrpose/cats': path.resolve(__dirname, '../../packages/cats/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
}));
