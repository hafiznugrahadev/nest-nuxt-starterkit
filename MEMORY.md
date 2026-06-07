# Project Decision Log

Read this file at the start of every session. Never contradict a logged decision without flagging it first.

---

## 2026-06-06, SelectField — searchable dropdown implementation

**What was decided:** Use reka-ui `PopoverRoot` + custom `<input>` search + `<ul>` option list. Filter is computed in script, not delegated to reka-ui.

**Why:** reka-ui's `ComboboxRoot` filters against item _values_ (not labels), requiring a custom `filterFunction` that only receives value strings — not label strings. Full manual control over filtering, trigger layout, and multi-select tags was simpler and more explicit.

**What was rejected:**

- `ComboboxRoot` from reka-ui — filter API doesn't map cleanly to label-based search without workarounds.
- Native `<select>` — no search, no custom styling.

---

## 2026-06-06, SelectField — multi-select via `multiple` prop

**What was decided:** A single `SelectField.vue` handles both single and multi-select via the `multiple` boolean prop. Value type is `string | string[]` at the vee-validate layer.

**Why:** The UI logic (popover, search, options list) is identical. Only the trigger display (tags vs text) and selection behavior (toggle vs close-on-select) differ. One component is easier to maintain and compose.

**What was rejected:**

- Separate `MultiSelectField.vue` — code duplication for near-identical UI; callers would need to remember two component names for the same concept.

---

## 2026-06-06, `required` prop — asterisk pattern

**What was decided:** All field components accept a `required?: boolean` prop that renders `<span class="ml-0.5 text-destructive">*</span>` inline in the label.

**Why:** Consistent across all fields, no slot boilerplate at call sites, uses the existing `text-destructive` token.

**What was rejected:**

- `<template #label>` slot with manual `<span>` — verbose at every usage site (seen in original `login.vue`).
- CSS `::after` pseudo-element — harder to control spacing and colour with Tailwind v4.

---

## 2026-06-06, PasswordField — separate component

**What was decided:** `PasswordField.vue` is a dedicated component (not `TextField` with `type="password"`) that owns the `show` toggle state and `Eye`/`EyeOff` icons internally.

**Why:** The show/hide toggle is always coupled with password inputs. Keeping state internal means consumers don't need to manage `showPassword` or pass `Eye`/`EyeOff` icons. `ChangePasswordCard.vue` and `login.vue` both benefit.

**What was rejected:**

- `TextField` with `showToggle` prop — leaks icon imports and toggle logic into a generic component.
- Inline implementation per page — duplicated across login, register, change-password.

---

## 2026-06-06, FileField — hidden native input + styled trigger

**What was decided:** `FileField.vue` hides the native `<input type="file">` with `sr-only` and renders a styled "Choose file" button that calls `inputRef.click()`. Selected filename is displayed inline; an `X` button clears the value.

**Why:** Native file inputs are browser-styled and inconsistent. This approach gives full visual control while preserving native file dialog behaviour and accessibility (the `<input>` is still in the DOM for screen readers).

**What was rejected:**

- Drag-and-drop zone — over-engineered for most form use cases; can be added as a separate `DropzoneField` later if needed.
- Wrapping `Input` component — shadcn `Input` doesn't support `type="file"` cleanly.

---

## 2026-06-06, DateField — native `<input type="date">`

**What was decided:** `DateField.vue` uses a styled native `<input type="date">`. Value is a `string` in `YYYY-MM-DD` format.

**Why:** reka-ui's `Calendar` component requires `@internationalized/date` which is not in the project dependencies. A native date input is zero-dependency, SSR-safe, and sufficient for most data-entry forms.

**What was rejected:**

- reka-ui `CalendarRoot` + `Popover` — requires `@internationalized/date`, adds complexity, and the project doesn't have the dependency.
- A custom date-string parser — unnecessary complexity given the native input handles format correctly.

---

## 2026-06-06, Fields demo page location

**What was decided:** Demo page at `apps/web/app/pages/demo/fields.vue` (route `/demo/fields`), using the `dashboard` layout and `auth` middleware. Linked from the sidebar with a `FlaskConical` icon.

**Why:** Keeping demos under `/demo/` namespaces them cleanly away from production routes. The dashboard layout gives the full app chrome (sidebar, header) so field styling is tested in real context.

**What was rejected:**

- Standalone page without layout — wouldn't reflect real usage context.
- `/fields` at root level — pollutes top-level routes with a non-production page.

---

## 2026-06-06, File storage — driver abstraction, local default, lazy S3

**What was decided:** A `@Global` `StorageModule` (`apps/api/src/infrastructure/storage/`) with a `StorageDriver` contract and two drivers: `local` (default, writes to `apps/api/storage/uploads`, served as static assets) and `s3` (AWS S3 / MinIO / RustFS). Driver chosen via `STORAGE_DRIVER` env. The S3 driver loads `@aws-sdk/client-s3` **lazily** via a `string`-typed dynamic-import specifier so the compiler treats it as optional.

**Why:** Mirrors the existing `RedisModule` infra pattern (SPEC DRY #10). Local default = zero-infra: the starter kit runs uploads with no extra services. Lazy S3 load means `local` deployments never need the AWS SDK installed or even resolvable at compile time — which also fixed a real failure: the dev API container's `api_node_modules` volume didn't have `@aws-sdk` hoisted where tsc could resolve it, so a static import broke the in-container build. Size/MIME guardrails live in `StorageService` (config-driven), not in the controller's `ParseFilePipe`, so they read `ConfigService` at runtime.

**What was rejected:**

- Static `import { S3Client } from '@aws-sdk/client-s3'` — forces the SDK on every deployment and broke the container build (node_modules hoisting under the volume).
- `@nestjs/serve-static` module / `express.static` direct import — `express` is only a transitive dep of `@nestjs/platform-express`, so `import express` fails at runtime (`Cannot find package 'express'`). Used `app.useStaticAssets()` on `NestExpressApplication` instead (first-class, no direct express import).
- MinIO forced into docker-compose — kept optional/documented in `.env.example`; local driver covers dev.

---

## 2026-06-06, Upload endpoint shape — generic `POST /files` + profile PATCH

**What was decided:** A generic, auth-protected `POST /files?folder=<slug>` returns `{ key, url, mimeType, size }`. The avatar flow is two steps: FE `useUpload()` composable uploads → gets URL → PATCHes `/users/me` with `avatarUrl`. Local files are served at `/uploads/*` (outside the `api` prefix and the `ResponseInterceptor`, so binary streams untouched).

**Why:** A reusable upload primitive is the starter-kit value — any feature/form (incl. the `FileField` component) can compose `useUpload()`. Serving outside the interceptor is mandatory: the global `ResponseInterceptor` wraps every Nest route in `{success,data}`, which would corrupt binary responses. `folder` is sanitised server-side to a slug to block path traversal.

**What was rejected:**

- Dedicated `POST /users/me/avatar` (upload+set in one call) — nicer UX but not reusable; the generic endpoint demonstrates the pattern better. Trade-off accepted: a possible orphan file if the PATCH never lands (fine for a starter kit).
- Serving files through a Nest controller — would hit the response interceptor and need `@Res()` passthrough hacks.

---

## 2026-06-06, Dev DB migrations target docker Postgres on host port 5433

**What was decided:** Run Prisma migrate from the host with `DATABASE_URL=postgresql://starterkit:starterkit@localhost:5433/...` (the docker-published port), NOT the `.env` value (`localhost:5432`).

**Why:** The app runs inside docker and reaches Postgres at the internal host `postgres:5432` (compose-injected). The repo `.env` `DATABASE_URL` uses `localhost:5432`, but the host has _another_ Postgres on 5432 — so the host Prisma CLI hit the wrong server and failed `P1010: denied access`. The docker Postgres is published at host `5433` (`POSTGRES_PORT=5433`), where the `starterkit` user is a superuser (so `migrate dev`'s shadow DB works). `prisma.config.ts` loads `../../.env` via dotenv, but a shell-set `DATABASE_URL` wins (dotenv doesn't override existing env). Alternatively run the CLI inside the container.

**What was rejected:**

- `prisma db push` — skips the migration history the repo maintains (`prisma/migrations/`).
- Running migrate against `localhost:5432` — wrong Postgres instance (P1010).

> Note: `prisma migrate dev` here does NOT auto-regenerate the client — run `bunx prisma generate` explicitly after each migration (observed twice: avatar + reset-token migrations).

---

## 2026-06-06, Mail — `@Global` MailModule, log default, lazy SMTP, fully config-driven

**What was decided:** A `@Global` `MailModule` (`apps/api/src/infrastructure/mail/`) with a `MailTransport` contract and two transports: `log` (default — writes emails to the API logs, zero-infra) and `smtp` (nodemailer, **lazy-loaded** via a `string`-typed dynamic import). Everything flows through ConfigService/env: `MAIL_TRANSPORT`, `MAIL_FROM`, `MAIL_SMTP_*`. Same pattern as `StorageModule`/`RedisModule`.

**Why:** The user explicitly required mail to be configurable via ConfigService + env. The `log` default makes the password-reset flow fully testable with zero infra — the reset link appears in the logs (verified the e2e by grepping the token from `docker logs`). Lazy SMTP keeps nodemailer optional and the `local`/`log` build resolvable everywhere (same container node_modules hoisting reason as the S3 driver). The reset-token TTL and the frontend reset URL are likewise config-driven (`app.passwordReset.ttlMinutes` / `.url`).

**What was rejected:**

- `@nestjs-modules/mailer` — heavier, template engine baked in; the thin transport facade matches the repo's hand-rolled infra style and the storage precedent.
- Static `import nodemailer` — forces the dep + breaks the in-container build (volume hoisting), exactly like the S3 driver case.
- Returning the reset token in the dev API response for testing — leaks tokens; grep the `log` transport output instead.

---

## 2026-06-06, Password reset flow — hashed single-use token, no enumeration

**What was decided:** `POST /auth/forgot-password` (always 200, uniform message) issues an opaque token, stores only its SHA-256 hash in a new `PasswordResetToken` model (one active per user, time-boxed), and emails `${PASSWORD_RESET_URL}?token=<raw>`. `POST /auth/reset-password` validates (exists, unused, unexpired) → sets the new password, marks the token `usedAt`, and **deletes all of the user's refresh tokens** in one `$transaction`. Both routes are `@Public()` + tight `@Throttle`. FE pages `/forgot-password` + `/reset-password` drive them via auth-store actions.

**Why:** Mirrors the existing refresh-token security model (store hash, never raw; reuse the `token.util` helpers). Uniform forgot-password response + swallowing mail-send errors prevents account enumeration. Revoking refresh tokens on reset forces every existing session to re-authenticate (standard post-reset hardening). Single-use + expiry verified in the e2e (reuse → 400, bogus → 400, unknown email → 200).

**What was rejected:**

- JWT-based reset tokens — can't be revoked/single-used without server state anyway, so an opaque DB token is simpler and safer.
- Keeping sessions alive after reset — leaves a thief's session valid; deleting refresh tokens is the safer default.

---

## 2026-06-06, Dev mail catcher — Mailpit in docker-compose, API defaults to SMTP

**What was decided:** Added a `mailpit` service to the dev `docker-compose.yml` (SMTP `1025`, web UI `8025`) and set the dockerized `api` service env to `MAIL_TRANSPORT=smtp` / `MAIL_SMTP_HOST=mailpit`. So the docker dev stack sends real SMTP to Mailpit (readable at http://localhost:8025), while non-docker/local runs keep the `log` default. Verified the full reset flow through Mailpit's REST API (email caught → token extracted from body → reset → login).

**Why:** Mailpit gives a real SMTP path + inbox UI with zero config, exercising the `smtp` transport (and confirming lazy nodemailer loads in-container) instead of only the `log` transport. Wiring it via compose api-env keeps it consistent with how DATABASE_URL/REDIS_HOST already point at docker service names — no `.env` editing needed.

**What was rejected:**

- Mailhog — unmaintained; Mailpit is its modern successor (better UI + REST API).
- Leaving dev on the `log` transport — never exercises real SMTP, so misconfig surfaces only in prod.

---

## 2026-06-06, Playwright E2E — live-stack, `*.e2e.ts`, hydration wait, Mailpit-driven

**What was decided:** E2E tests live in `apps/web/e2e/*.e2e.ts` (Playwright `testMatch: '**/*.e2e.ts'`) and run against the **already-running dev stack** (no `webServer`; baseURL `http://localhost:4300`, override via `E2E_BASE_URL`). Coverage: auth (redirect-when-unauthenticated, login ok/invalid, logout) + password reset (forgot confirmation, missing-token, and a full forgot→read-Mailpit→reset→login flow). Serial (`workers: 1`) since the reset spec mutates the seed admin; the spec restores `admin123` in a `finally`.

**Why:**

- `*.e2e.ts` naming keeps Playwright specs out of vitest's `**/*.{test,spec}.ts` glob (no config needed to separate the two runners).
- Three real gotchas were solved and are worth remembering:
  1. **Hydration race** — clicking a form submit before Nuxt hydrates fires a _native_ GET submit (page reloads to `/path?`), so the vee-validate handler never runs. Fixed with a `gotoHydrated()` helper that waits for `document.getElementById('__nuxt').__vue_app__` (Vue mount marker).
  2. **Selector collisions** — `getByLabel('Password')` also matches the "Show password" toggle (`aria-label`), and `getByRole('button', {name: /sign in/i})` matches the Google/X social buttons. Use `#password` and an anchored `/^sign in$/i`.
  3. **Rate limiting** — the `@Throttle` on auth routes (forgot-password 3/min) makes rapid/repeated E2E runs 429. Added a config-driven kill switch `THROTTLE_DISABLED` (ThrottlerModule `skipIf` reads `app.throttle.disabled`); the docker dev stack sets it true. Default stays false (prod-safe).
- Added `data-testid="user-menu-trigger"` / `"logout-button"` to `UserMenu.vue` — the menu has no stable accessible name otherwise.

**What was rejected:**

- A Playwright `webServer` that boots the app — the stack is multi-service docker; reusing the running stack is simpler and matches how the app actually runs.
- `networkidle` waits for hydration — the dev Vite HMR websocket never goes idle.
- Mocking the email — the Mailpit REST API (`/api/v1/messages`) gives a real, end-to-end reset assertion.

---

## 2026-06-06, Self-service registration — config-gated (resolves the admin-provisioned scope)

**What was decided:** Registration is now available but **off by default**, gated by `AUTH_REGISTRATION_ENABLED` (BE, `app.registration.enabled`) mirrored by `NUXT_PUBLIC_REGISTRATION_ENABLED` (FE). `POST /auth/register` 403s when disabled; new accounts get the **USER role only** and are auto-logged-in. FE: a `/register` page (shows a "disabled" notice when off) + a conditional "Sign up" link on /login. The docker dev stack turns both on via a single `REGISTRATION_ENABLED` compose var (default true). This **resolves** the earlier admin-provisioned scope decision rather than overriding it: the _default_ is still admin-only; deployers opt in.

**Why:** The user wanted sign-up but configurable — same pattern as `THROTTLE_DISABLED`. Default-off keeps the kit's original posture; the flag makes open signup a one-line opt-in. USER-role-only prevents privilege escalation via self-registration.

**What was rejected:**

- A public `GET /auth/config` endpoint to feed the FE flag — mirroring via runtime config (single `REGISTRATION_ENABLED` in compose) avoids a round-trip; the BE still enforces.
- Defaulting registration ON — would silently contradict the logged admin-provisioned scope.

---

## 2026-06-06, E2E expansion — register/users/profile, and the dev-server flakiness fixes

**What was decided:** Added `register.e2e.ts`, `users.e2e.ts`, `profile.e2e.ts` (13 specs total). Users CRUD uses the seed **super-admin** (`superadmin@starterkit.test` / `super1234`) — the seed `admin` is ADMIN-only and can't manage. Idempotent: tests restore the seed admin (name/avatar/password) and delete created users via API helpers (`deleteUserByEmail`, `patchMe`) in `finally`. Config hardened for dev-server runs: `retries: 1`, `expect` timeout 10s, test timeout 45s.

**Why — three patterns worth remembering:**

1. **Login race** — the `login()` helper clicks submit but doesn't wait for the result; a following hard `page.goto('/protected')` can fire before the refresh cookie is set, so the auth plugin restores nothing and the guard bounces to /login. Fix: `await expect(page).toHaveURL(/\/dashboard/)` after `login()` before any `goto`.
2. **Modal selectors** — `UserFormModal` inputs have no `for`/`id` label association (use `getByPlaceholder`); the confirm "Delete" button collides with the row's `title="Delete"` icon, so scope to the dialog: `page.getByRole('dialog').getByRole('button', {name: /^delete$/i})` (Modal is reka-ui → role="dialog").
3. **Dev-server flakiness** — first hit of a cold route can exceed a 5s assertion; `retries: 1` + generous timeouts make it reliably green (observed: occasional "flaky" that passes on retry). A production-build target would be steadier but is out of scope.

**What was rejected:**

- Asserting protected-route content right after `login()` without the dashboard wait — the source of the flakiness.
- Bumping per-route assertion timeouts individually — a global `expect.timeout` + retries is cleaner.

---

## 2026-06-06, i18n — @nuxtjs/i18n v10, no_prefix, EN default + ID

**What was decided:** `@nuxtjs/i18n` v10 with `strategy: 'no_prefix'` (locale in a cookie, URLs unchanged), `defaultLocale: 'en'` + `id`, lazy locale files at `apps/web/i18n/locales/{en,id}.json`, `detectBrowserLanguage` via cookie. A `LanguageSwitcher` (shell) in the auth layout + `AppHeader`. Converted auth pages (login/register/forgot/reset), `error.vue`, sidebar nav, and the user menu as the pattern; other strings migrate incrementally.

**Why:** `no_prefix` is the least invasive strategy — it keeps every existing route, the auth middleware, and the whole E2E suite intact (no `/id/` prefixes). Default English means the E2E assertions (English strings) keep passing unchanged; ID is opt-in via the switcher/cookie. Verified SSR honours the cookie (curl with `i18n_locale=id` → Indonesian) and an E2E test covers switch + persistence.

**What was rejected:**

- `prefix_except_default` (URL-prefixed locales) — better for public SEO but would change routes and break middleware/E2E; this kit is mostly an authed dashboard.
- Hand-rolled vue-i18n plugin — `@nuxtjs/i18n` is the idiomatic Nuxt choice (auto `$t`, SSR-safe, cookie detection).
- Translating BE error messages — kept English; the FE maps its own copy. (Caveat: `error.vue` renders in the default locale even with an `id` cookie — acceptable.)

---

## 2026-06-06, Registration invalidates the users-list cache + CRUD edit E2E

**What was decided:** `AuthService.register()` calls `usersService.invalidateList()` after creating the user (AuthModule now imports UsersModule; `invalidateList()` made public). Added an E2E for editing a user via the modal, completing CRUD coverage (List/Create/Edit/Delete).

**Why:** Registration creates the user via `prisma.user.create` directly, bypassing `UsersService` — so it didn't bump the `users:gen` cache counter, leaving the admin list stale for up to 30s (Redis TTL). Reusing `invalidateList()` keeps the list eventually-consistent immediately (verified: a fresh registrant appears in the cached list at once). AuthModule→UsersModule is a safe one-way dependency (UsersModule doesn't import auth; guards are global APP_GUARDs).

**What was rejected:**

- Duplicating the `users:gen` key + injecting RedisService into AuthService — reusing `UsersService.invalidateList()` (with its existing error-swallowing `safe()`) is cleaner than a shared magic-string constant.
- Routing registration through `UsersService.create()` — its return shape (`UserEntity`, roles as `string[]`) doesn't match `issueTokens`, and it has no clean duplicate-email path.

---

## 2026-06-06, DataTable `filters` slot + UserTable multi-select role filter (server-side)

**What was decided:** Added a `filters` named slot to the reusable `DataTable.vue` (toolbar above the table, rendered only when used). Added a **multi-select** role filter to `UserTable.vue` as tags/chips (All / Super Admin / Admin / User). The BE is the source of truth and filtering is fully **server-side**: `QueryUserDto.role` (single) became `roles?: UserRole[]` (a single query value is coerced to an array via `@Transform`), and `findAll` filters `where.roles = { some: { name: { in: query.roles } } }` (users holding ANY selected role). FE sends `?roles=A&roles=B`; `UserListParams.role` → `roles?: string[]`. E2E covers multi-select (Super Admin + Admin → both rows, the USER-only row filtered out).

**Why:** Per the user: multi-select with the BE as the single source of truth and server-side datatables — so the filter is computed by the API (no client-side filtering of a full dataset), using `in` for OR semantics. UserTable stays hand-rolled (not migrated to `DataTable`): `userColumns` lacks actions/avatar columns, so migrating would churn the passing users E2E for no user-visible gain; the `filters` slot keeps the reusable table filter-ready regardless.

**What was rejected:**

- Single-role / client-side filtering — the BE is the source of truth; filtering is server-side and supports multiple roles.
- Keeping the old `?role=` param — with `forbidNonWhitelisted` the renamed `roles` is the only accepted filter (old `?role=` now 400s).
- Migrating UserTable onto `DataTable` now — high churn (actions/avatar columns + E2E selectors) for no user-visible gain.

---

## 2026-06-06, Dev file storage — RustFS in docker-compose, S3 driver passthrough

**What was decided:** Added a `rustfs` service to the dev `docker-compose.yml` (`rustfs/rustfs:latest`, port 9000 API + 9001 console, named volume `rustfs_data`, runs as UID 10001). The `api` service now passes through all S3 env vars (`STORAGE_DRIVER`, `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_FORCE_PATH_STYLE`, `S3_REGION`, `S3_PUBLIC_BASE_URL`) with safe defaults pointing at the compose-internal `http://rustfs:9000`. `STORAGE_DRIVER` defaults to `local` so existing setups are unaffected. `api` depends_on `rustfs: service_started`. RustFS credentials are driven by the same `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` vars (default `rustfsadmin`/`rustfsadmin`). OrbStack domain fix: `CORS_ORIGIN` and `NUXT_PUBLIC_API_BASE` in compose now use `${VAR:-default}` so they can be overridden from `.env` (needed when the browser hits `https://web.starterkit-dev.orb.local` instead of `localhost`).

**Why:** The existing S3 driver (`s3.driver.ts`) already supports RustFS. Adding RustFS to compose completes the dev stack so devs can switch to `STORAGE_DRIVER=s3` with a single `.env` line. Named volume (not bind mount) avoids the UID 10001 chown requirement. `S3_PUBLIC_BASE_URL` defaults to `http://localhost:9000/starterkit` so the browser can access uploaded files directly (the S3 driver falls back to `endpoint/bucket/key` when no `publicBaseUrl` is set — that would embed the docker-internal hostname `rustfs` in URLs, which browsers can't reach).

**What was rejected:**

- Bind-mounting `/data` to a host path — requires `chown -R 10001:10001` on the host dir before first run; a named volume is zero-config.
- Making RustFS a Docker Compose profile — the service is lightweight; always-on keeps the dev stack consistent.
- Separate `S3_ACCESS_KEY`/`S3_SECRET_KEY` vars for RustFS — reusing `S3_ACCESS_KEY_ID`/`S3_SECRET_ACCESS_KEY` means the same `.env` values drive both RustFS at startup and the NestJS S3 driver, no duplication.

---

## 2026-06-07, S3 endpoint split — internal for ops, public for presign (fixes upload 500)

**What was decided:** The dockerized API must use the **internal** compose endpoint for S3 operations (`S3_ENDPOINT=http://rustfs:9000`), NOT the external OrbStack HTTPS domain. A `.env` that set `S3_ENDPOINT=https://rustfs.starterkit-dev.orb.local` made every `POST /files` upload fail with 500 (RustFS, reached through the orb HTTPS proxy from inside the container, errored), leaving the bucket empty. Presigned GET URLs, by contrast, are signed for the **public** endpoint (derived from `S3_PUBLIC_BASE_URL` by stripping the trailing `/<bucket>`) so the browser can reach them — generation is offline, so the API never has to reach that host.

**Why:** Container→RustFS traffic should stay on the internal docker network (`rustfs:9000`, plain HTTP, no TLS/proxy in the path) — same rationale as `DATABASE_URL=postgres:5432`. The orb HTTPS proxy in front of RustFS breaks in-container S3 PUTs. The two endpoints are intentionally separate: `S3_ENDPOINT` (server-side ops, internal) vs the presign endpoint (browser-side, public). Verified empirically: a presigned GET signed for `https://rustfs.…orb.local` (path-style) returns 200 through the proxy.

**What was rejected:**

- Pointing `S3_ENDPOINT` at the orb domain — the documented "obvious" choice, but it's the bug (in-container PUT → 500).
- Trusting the compose default blindly — the default IS `http://rustfs:9000`; the `.env` override is what broke it. Left a comment in `.env` to stop the footgun recurring.

---

## 2026-06-07, Avatars stay PRIVATE — cached presigned URLs behind a stable proxy

**What was decided:** With `STORAGE_DRIVER=s3` the bucket stays **private** (no anonymous-read policy). Objects are served via short-lived **presigned GET URLs** generated by the new `S3StorageDriver.signedUrl()` (`@aws-sdk/s3-request-presigner`, lazy-loaded like the client). `POST /files` no longer persists a bare object URL; it returns a **stable proxy URL** `GET /api/files/view?key=<key>` (built from the request's `x-forwarded-proto/host`). That endpoint is `@Public()` (so `<img>` works with no auth header) and uses `@Res()` to 302-redirect (bypassing the global `ResponseInterceptor`). `StorageService.displayUrl()` caches the presigned URL in Redis keyed by the object key (TTL = `STORAGE_SIGNED_URL_TTL_SECONDS` − 300s), so the temp URL is generated **once per window, not per request**; a new upload = new key = natural cache miss. The local driver is unaffected (`signedUrl` absent → falls back to the static `/uploads` URL; upload returns it directly, the proxy is never used).

**Why:** The user wanted private object storage but didn't want to regenerate a presigned URL on every read. A stable proxy URL keeps the stored `avatarUrl` non-expiring (no DB-stored temp URL to go stale, zero changes to the user/auth serialization layer or the FE — it still just stores `url` and binds `<img :src>`), while Redis caching keyed by the immutable object key satisfies "cache the URL if the file doesn't change." Verified end-to-end through the orb domains: upload → `PATCH /users/me` → read-back → `<img>` 302 → 200 `image/png`; three proxy hits returned an identical signature (cache hit), Redis key present with the expected TTL.

**What was rejected:**

- **Public-read policy** on the bucket (`mc anonymous set download`) — the simplest serve path, but the user explicitly wanted private.
- **Presigned URL stored in / resolved at the user serialization layer** (store the key, sign in `toEntity` + auth login) — broader blast radius (every user-returning endpoint, async `toEntity`) and the stored/payload URL expires; the stable proxy avoids both.
- **Streaming the bytes through the API** — truly private and no temp URL at all, but pushes every image through Node; presigned+redirect keeps RustFS serving the bytes.
- **A redirect cached for the full presign TTL** — kept `Cache-Control: private, max-age=60` (well under the TTL) so the browser doesn't pin a redirect to a URL that later expires.

> Gotchas: (1) `@aws-sdk/s3-request-presigner` is a separate package from `@aws-sdk/client-s3`; install it (the dev entrypoint runs `bun install --frozen-lockfile`, so update `bun.lock` via `bun add`, don't hand-edit `package.json`). (2) Avatars saved before this change (bare RustFS URLs, or local `/uploads` URLs) now 403/404 against the private s3 bucket — re-upload to refresh.

---

## 2026-06-07, Avatar must ride in the auth session payload (chrome + persistence)

**What was decided:** `SessionUser` (the `user` object in the `/auth/login`, `/auth/register`, `/auth/refresh` response) now includes `avatarUrl`. `UserMenu.vue` (the avatar in the header AND the sidebar footer) now renders `<img :src="auth.user.avatarUrl">` with the initials `<span>` as the `v-else` fallback.

**Why:** The upload→`PATCH /users/me`→display worked on the Profile card but the avatar **vanished on reload** and never appeared in the app chrome. Two FE-visible causes, both rooted in the auth payload: (a) `UserMenu` only ever rendered initials; (b) `useMe()` seeds its data from `auth.user` (`initialData`) and, because the app has a non-zero query `staleTime`, it does **not** refetch `/users/me` on mount — so the card shows whatever `auth.user` holds. `auth.user` is populated from `/auth/login`+`/auth/refresh`, whose `SessionUser` was `{id,email,name,roles}` — no `avatarUrl`. So on every reload the in-memory user lost its avatar. Adding `avatarUrl` to `SessionUser` fixes both the card (via `initialData`) and the chrome (UserMenu) in one place; all three auth flows already `include: { roles: true }` (full user row, `avatarUrl` present), so only `issueTokens()` needed to pass it through. The FE needed no type change — the Pinia store already types `user` as the shared `User` (which has `avatarUrl`). Verified in a real browser: after a hard reload (→ `/auth/refresh`, not a fresh upload) the photo shows on the card, header, and sidebar and persists.

**What was rejected:**

- Forcing `useMe()` to always refetch `/users/me` on mount — treats the symptom; the session user should carry its own avatar anyway (the chrome reads `auth.user`, never `/users/me`).
- Rendering the avatar only on the Profile card — the header/sidebar are where users actually look; initials-only there reads as "the upload didn't work."

> Gotcha: `nest start --watch` does NOT pick up edits over the macOS Docker bind mount (no inotify events cross the boundary) — restart the api container (`docker compose restart api`) after BE source changes, or the running code stays stale. (The web/Nuxt side polls via `NUXT_DEV_POLLING=true`, so it HMRs fine.)
