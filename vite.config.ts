import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(async ({command}) => {
  // The API middleware pulls in the whole engine graph at import time
  // (timers, sqlite, workers). Statically importing it here made `vite build`
  // leave active handles behind, so the process hung after "✓ built" — and
  // the swarm's build gate timed out on every merge. It only serves the dev
  // server, so load it lazily for `serve` and skip it entirely for `build`.
  const apiMiddleware = command === 'serve'
    ? (await import('./src/server/apiMiddleware')).apiMiddleware
    : null;

  return {
    plugins: [react(), tailwindcss(), ...(apiMiddleware ? [apiMiddleware()] : [])],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
