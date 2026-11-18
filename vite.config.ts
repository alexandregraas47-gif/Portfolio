import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run build:single` : tout le site dans un seul fichier HTML (dist-single/index.html),
// à ouvrir sans internet — copie de secours pour une présentation.
// Les images de public/img ne sont pas incluses dans ce mode.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [viteSingleFile()] : [],
  build: {
    target: 'es2020',
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 0,
    chunkSizeWarningLimit: 800,
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    copyPublicDir: mode !== 'single',
  },
}));
