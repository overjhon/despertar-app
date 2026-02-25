import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      disable: false,
      includeAssets: ['favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'apple-touch-icon.png', 'robots.txt'],
      devOptions: {
        enabled: false,
        type: 'module'
      },
      manifest: {
        name: `${process.env.VITE_BRAND_NAME || 'Despertar da Mulher'}`,
        short_name: process.env.VITE_BRAND_NAME || 'Despertar da Mulher',
        description: process.env.VITE_PWA_DESCRIPTION || 'Conecte-se, converse e desperte seu potencial feminino.',
        theme_color: '#1a1a1a',
        background_color: '#1a1a1a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['social', 'lifestyle', 'communication'],
        icons: [
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'Minha Biblioteca',
            short_name: 'Biblioteca',
            description: 'Acesse seus conteúdos',
            url: '/library',
            icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }]
          },
          {
            name: 'Comunidade',
            short_name: 'Comunidade',
            description: 'Conecte-se com outras mulheres',
            url: '/community',
            icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }]
          },
          {
            name: 'Desafios',
            short_name: 'Desafios',
            description: 'Participe de desafios',
            url: '/challenges',
            icons: [{ src: '/web-app-manifest-512x512.png', sizes: '512x512' }]
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        globIgnores: ['**/ebooks/**', '**/cdn.jsdelivr.net/**', '**/cdnjs.cloudflare.com/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: null,
        navigateFallbackDenylist: [/^\/api/, /^\/__/],
        runtimeCaching: [
          // Assets do PDF.js - CacheFirst para performance
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-assets',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          },
          // PDF.js Worker do CDN Cloudflare
          {
            urlPattern: /^https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdf\.js/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pdfjs-worker',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
              }
            }
          },
          // PDFs - NetworkFirst com timeout generoso (Online First)
          {
            urlPattern: /^https:\/\/YOUR_PROJECT_REF\.supabase\.co\/storage\/v1\/object\/public\/ebooks\/.*\.pdf$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pdf-documents',
              networkTimeoutSeconds: 30,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 2 // 2 horas
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Proteger toda a rota de storage/ebooks (sem depender de extensão)
            urlPattern: /^https:\/\/YOUR_PROJECT_REF\.supabase\.co\/storage\/v1\/object\/public\/ebooks\/.*/i,
            handler: 'NetworkOnly'
          },
          {
            urlPattern: /^https:\/\/YOUR_PROJECT_REF\.supabase\.co\/rest\/v1\/ebooks/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ebooks-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/YOUR_PROJECT_REF\.supabase\.co\/rest\/v1\/(badges|challenges)/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'static-data',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            // Regra genérica mais relaxada - apenas para rest/v1
            urlPattern: /^https:\/\/YOUR_PROJECT_REF\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-rest-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /\.(woff2?|ttf|otf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    chunkSizeWarningLimit: 1000,
    sourcemap: mode !== 'production',
  },
}));
