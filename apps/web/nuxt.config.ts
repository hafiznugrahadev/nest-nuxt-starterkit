import tailwindcss from '@tailwindcss/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // Dev server port comes from the single root .env (WEB_PORT). In containers/prod
  // the process `PORT` (set by compose) wins.
  devServer: {
    host: process.env.HOST || 'localhost',
    port: Number(process.env.PORT || process.env.WEB_PORT) || 4300,
  },

  // Nuxt 4: srcDir defaults to app/ (alias ~ → app/), matching the spec structure.
  modules: ['@pinia/nuxt', '@nuxt/eslint'],

  // vue-sonner's Nuxt module doesn't yet declare Nuxt 4 compat, so we register
  // <Toaster> manually in app.vue and just transpile the package for SSR.
  build: { transpile: ['vue-sonner'] },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // ── SPEC: Auto-import boundary strategy ──────────────────────────────────────
  // ON for shared layers; features/ is intentionally NOT registered so the
  // dependency rule is enforced via explicit barrel imports.
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/common', pathPrefix: false },
    { path: '~/components/blocks', pathPrefix: false },
    { path: '~/components/shell', pathPrefix: false },
    // features/ → not registered (explicit import via features/<x>/index.ts)
  ],

  imports: {
    dirs: ['composables', 'utils', 'stores'],
    // 'features' & 'lib' intentionally excluded — explicit imports only.
  },

  runtimeConfig: {
    // server-only secrets go here
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE ?? 'http://localhost:4400/api',
    },
  },

  typescript: {
    strict: true,
  },
});
