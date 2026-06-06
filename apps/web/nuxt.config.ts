import tailwindcss from '@tailwindcss/vite';

// Derive the dev HMR transport from the public APP_URL. Behind OrbStack's HTTPS
// proxy (e.g. https://web.starterkit-dev.orb.local) the browser loads the app on
// port 443, but Vite can't infer where to open the HMR WebSocket and falls back
// to the container port (localhost:5173) — which the browser can't reach, so HMR
// silently dies and edits need a manual refresh. Pointing the client at wss://
// <host>:443 routes the socket back through the same proxy to the dev server.
// Plain localhost dev keeps APP_URL=http://localhost:… and needs no override
// (native ws on the dev port already works).
function resolveDevHmr() {
  const appUrl = process.env.APP_URL;
  if (!appUrl) return undefined;
  let url: URL;
  try {
    url = new URL(appUrl);
  } catch {
    return undefined;
  }
  if (url.protocol !== 'https:') return undefined;
  return {
    protocol: 'wss' as const,
    host: url.hostname,
    clientPort: url.port ? Number(url.port) : 443,
  };
}
const devHmr = resolveDevHmr();

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
  modules: ['@pinia/nuxt', '@nuxt/eslint', '@nuxtjs/i18n'],

  // vue-sonner's Nuxt module doesn't yet declare Nuxt 4 compat, so we register
  // <Toaster> manually in app.vue and just transpile the package for SSR.
  build: { transpile: ['vue-sonner'] },

  app: {
    head: {
      // Outfit is TailAdmin's typeface; preconnect + load the weights we use.
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
        },
      ],
      script: [
        {
          // Anti-FOUC: apply the persisted (or system) theme before first paint so
          // the dark/light flip never flashes on reload.
          innerHTML:
            "(function(){try{var t=localStorage.getItem('theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',d);}catch(e){}})();",
          tagPosition: 'head',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [
      tailwindcss(),
      // Pinia statically imports `setupDevtoolsPlugin` from `@vue/devtools-api`,
      // which ships only a bare CJS `main` (no `exports` map). Under Bun's `.bun`
      // layout Vite serves that CommonJS file raw to the browser, which throws
      // `exports is not defined`. Redirect the import to the package's ESM build
      // — but ONLY for the client (`!options.ssr`). The SSR build resolves CJS
      // natively in Node; swapping it there corrupts pinia's payload
      // serialization. A plugin `resolveId` is the one place Vite reliably tells
      // us client-vs-server (Nuxt's `vite:extendConfig` shares one config and
      // leaks the change into SSR).
      {
        name: 'starterkit:devtools-api-client-esm',
        enforce: 'pre',
        async resolveId(source, importer, options) {
          if (source !== '@vue/devtools-api' || options.ssr || !importer) return null;
          const esm = await this.resolve('@vue/devtools-api/lib/esm/index.js', importer, {
            skipSelf: true,
          });
          return esm?.id ?? null;
        },
      },
    ],
    // Bundle these (instead of externalizing) so named ESM exports survive the
    // dev SSR transform under Bun — otherwise `import { z } from 'zod'` is
    // undefined server-side. Prod (Nitro) already inlines them.
    ssr: {
      noExternal: ['zod', '@vee-validate/zod', 'vee-validate'],
    },
    // In Docker on macOS/Windows, bind-mount file events don't reach the container,
    // so HMR needs polling to detect edits. Enabled only when NUXT_DEV_POLLING=true
    // (set by the dev compose) — local dev keeps native, CPU-friendly watching.
    // `hmr` is set only behind the OrbStack HTTPS proxy (see resolveDevHmr above);
    // it routes the HMR WebSocket back through wss://<host>:443 to the dev server.
    server: {
      ...(process.env.NUXT_DEV_POLLING === 'true'
        ? { watch: { usePolling: true, interval: 300 } }
        : {}),
      ...(devHmr ? { hmr: devHmr } : {}),
    },
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
      // Mirror the API's AUTH_REGISTRATION_ENABLED so the UI can show/hide sign-up.
      registrationEnabled: process.env.NUXT_PUBLIC_REGISTRATION_ENABLED === 'true',
    },
  },

  // ── i18n (English default + Indonesian) ─────────────────────────────────────
  // `no_prefix`: locale is kept in a cookie, URLs are unchanged (routes/middleware
  // /E2E stay intact). Locale files lazy-load from i18n/locales/.
  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    locales: [
      { code: 'en', name: 'English', language: 'en-US', file: 'en.json' },
      { code: 'id', name: 'Bahasa Indonesia', language: 'id-ID', file: 'id.json' },
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_locale',
      redirectOn: 'root',
    },
  },

  typescript: {
    strict: true,
  },
});
