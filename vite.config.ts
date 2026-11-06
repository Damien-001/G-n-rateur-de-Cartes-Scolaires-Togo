import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'google-photos-resolver-middleware',
        configureServer(server) {
          server.middlewares.use('/api/resolve-video', async (req, res) => {
            try {
              const reqUrl = new URL(req.url || '', 'http://localhost');
              const rawUrl = reqUrl.searchParams.get('url') || '';
              const isStream = reqUrl.searchParams.get('stream') === '1';
              const isPoster = reqUrl.searchParams.get('poster') === '1';

              if (!rawUrl || !/^https?:\/\/(photos\.app\.goo\.gl\/|photos\.google\.com\/share\/)/i.test(rawUrl.trim())) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'URL invalide' }));
                return;
              }

              const response = await fetch(rawUrl.trim(), {
                redirect: 'follow',
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
              });
              const html = await response.text();
              const ogMatch =
                html.match(/property=["']og:image["']\s+content=["'](https:\/\/lh3\.googleusercontent\.com\/[^"']+)["']/i) ||
                html.match(/content=["'](https:\/\/lh3\.googleusercontent\.com\/[^"']+)["']\s+property=["']og:image["']/i) ||
                html.match(/(https:\/\/lh3\.googleusercontent\.com\/pw\/[a-zA-Z0-9_-]+)/i);

              if (!ogMatch || !ogMatch[1]) {
                res.statusCode = 404;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'Flux introuvable' }));
                return;
              }

              const baseLh3 = ogMatch[1].split('=')[0];
              if (isStream) {
                res.statusCode = 302;
                res.setHeader('Location', `${baseLh3}=m22`);
                res.end();
                return;
              }
              if (isPoster) {
                res.statusCode = 302;
                res.setHeader('Location', `${baseLh3}=w1280-h720-no`);
                res.end();
                return;
              }

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                ok: true,
                videoUrl: `${baseLh3}=m22`,
                posterUrl: `${baseLh3}=w1280-h720-no`
              }));
            } catch (e) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: 'Erreur interne' }));
            }
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/docs/**', '**/.agents/**', '**/node_modules/**'],
      },
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-supabase': ['@supabase/supabase-js'],
            'vendor-icons': ['lucide-react'],
          },
        },
      },
    },
  };
});
