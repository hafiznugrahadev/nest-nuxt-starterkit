# LESSON — Cara Setup Monorepo (Bun + Turbo + NestJS + Nuxt)

> Panduan praktis membangun monorepo seperti `minisoccer` **dari nol**. Fokus ke
> _alasan_ tiap keputusan, bukan cuma perintah. Tiap bagian punya bagian
> **"Kenapa"** dan **"Jebakan"** (masalah nyata yang kita temui saat membangun ini).

**Hasil akhir:** satu repo berisi backend NestJS, frontend Nuxt 4, dan paket TypeScript
yang dipakai bersama keduanya — dengan satu perintah install, satu perintah build,
dan satu perintah `serve`.

---

## Daftar Isi

1. [Konsep: kenapa monorepo?](#1-konsep-kenapa-monorepo)
2. [Prasyarat](#2-prasyarat)
3. [Struktur akhir](#3-struktur-akhir)
4. [Langkah 1 — Root workspace](#4-langkah-1--root-workspace)
5. [Langkah 2 — Paket `shared-types`](#5-langkah-2--paket-shared-types)
6. [Langkah 3 — Backend (`apps/api`)](#6-langkah-3--backend-appsapi)
7. [Langkah 4 — Frontend (`apps/web`)](#7-langkah-4--frontend-appsweb)
8. [Langkah 5 — Menyambung shared-types ke kedua app](#8-langkah-5--menyambung-shared-types-ke-kedua-app)
9. [Langkah 6 — Orkestrasi build dengan Turbo](#9-langkah-6--orkestrasi-build-dengan-turbo)
10. [Langkah 7 — Port yang aman & command `serve`](#10-langkah-7--port-yang-aman--command-serve)
11. [Langkah 8 — Docker (dev hot-reload + prod)](#11-langkah-8--docker-dev-hot-reload--prod)
12. [Langkah 9 — Git, Husky, Conventional Commits](#12-langkah-9--git-husky-conventional-commits)
13. [Kumpulan Jebakan (rangkuman)](#13-kumpulan-jebakan-rangkuman)
14. [Checklist setup baru](#14-checklist-setup-baru)

---

## 1. Konsep: kenapa monorepo?

**Monorepo** = banyak paket/aplikasi dalam **satu** repository, dikelola oleh satu
package manager lewat fitur **workspaces**.

**Kenapa dipakai di sini:**

- **Share types tanpa publish ke npm.** Backend & frontend butuh tipe yang sama
  (enum status, bentuk response API). Di monorepo, cukup bikin paket
  `@minisoccer/shared-types` dan kedua app `import` dari situ — tanpa registry.
- **Satu kali install.** `bun install` di root meng-install semua app sekaligus.
- **Tooling konsisten.** Satu config TypeScript dasar, satu Prettier, satu pipeline CI.
- **Atomic change.** Ubah kontrak API + backend + frontend dalam **satu commit/PR**.

**Komponen kunci:**

| Komponen       | Tugas                                                              |
| -------------- | ------------------------------------------------------------------ |
| **Bun**        | Runtime + package manager + workspaces (pengganti npm/pnpm + node) |
| **Turborepo**  | Orkestrasi task antar paket (build/dev/test) + caching + urutan    |
| **workspaces** | Field di `package.json` root yang menandai folder mana = paket     |

> **Mental model:** root `package.json` adalah "daftar isi". Tiap folder di
> `apps/*` dan `packages/*` adalah paket independen dengan `package.json` sendiri.
> Bun menautkan (symlink) paket-paket lokal ke `node_modules` sehingga bisa saling
> `import` seolah-olah paket npm biasa.

---

## 2. Prasyarat

```bash
bun --version      # >= 1.3   (https://bun.sh)
docker --version   # untuk database & deploy (opsional saat dev awal)
```

Bun sudah termasuk runtime, bundler, test runner, dan package manager — jadi tidak
perlu install npm/pnpm/yarn terpisah.

---

## 3. Struktur akhir

```
minisoccer/
├── package.json            # root: workspaces + script global
├── turbo.json              # pipeline task (build/dev/test) + urutan
├── tsconfig.base.json      # config TS yang di-extends semua paket
├── .gitignore
├── docker-compose.yml      # dev: db + redis + storage (hot reload)
├── docker-compose.prod.yml # prod: apps only
│
├── packages/
│   └── shared-types/       # kontrak TS dipakai BE & FE
│       ├── package.json
│       ├── src/
│       └── tsconfig*.json
│
└── apps/
    ├── api/                # NestJS + Prisma
    │   ├── package.json
    │   ├── Dockerfile
    │   ├── prisma/
    │   └── src/
    └── web/                # Nuxt 4
        ├── package.json
        ├── Dockerfile
        ├── nuxt.config.ts
        └── app/
```

**Aturan penamaan paket:** semua pakai scope yang sama, mis. `@minisoccer/api`,
`@minisoccer/web`, `@minisoccer/shared-types`. Scope ini yang dipakai saat `import`.

---

## 4. Langkah 1 — Root workspace

Buat folder project lalu `package.json` root. **`private: true` wajib** (root
workspace tidak boleh ter-publish), dan `workspaces` menunjuk ke pola folder paket.

```jsonc
// package.json (root)
{
  "name": "minisoccer",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
  },
  "devDependencies": {
    "turbo": "^2.3.3",
    "typescript": "^5.7.2",
    "prettier": "^3.4.2",
  },
  "packageManager": "bun@1.3.3",
}
```

Config TypeScript dasar yang akan di-`extends` semua paket:

```jsonc
// tsconfig.base.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
  },
}
```

`turbo.json` minimal (nanti kita lengkapi):

```jsonc
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".output/**"] },
    "dev": { "cache": false, "persistent": true },
    "test": {},
    "typecheck": {},
  },
}
```

> **Kenapa `dependsOn: ["^build"]`?** Tanda `^` artinya "build **dependency** dulu".
> Jadi sebelum build `apps/api`, Turbo otomatis build `shared-types` lebih dulu
> (karena api bergantung padanya). Ini kunci urutan build yang benar.

**Jebakan:** jangan lupa `.gitignore` untuk `node_modules`, `dist`, `.output`,
`.nuxt`, `.turbo`, dan `.env` (tapi **jangan** ignore `.env.example`).

---

## 5. Langkah 2 — Paket `shared-types`

Ini paket terpenting di monorepo: sumber kebenaran tipe yang dipakai BE & FE.

```jsonc
// packages/shared-types/package.json
{
  "name": "@minisoccer/shared-types",
  "private": true,
  "main": "./dist/cjs/index.js",
  "module": "./dist/esm/index.js",
  "types": "./dist/cjs/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/cjs/index.d.ts",
      "import": "./dist/esm/index.js", // dipakai Vite/Nuxt
      "require": "./dist/cjs/index.js", // dipakai Node/NestJS/Jest
      "default": "./dist/cjs/index.js",
    },
  },
  "scripts": {
    "build": "tsc -p tsconfig.cjs.json && tsc -p tsconfig.esm.json",
  },
}
```

Isi paket cukup tipe + sedikit nilai runtime (enum):

```ts
// packages/shared-types/src/index.ts
export { FieldStatus } from './enums/field-status.enum';
export type { ApiResponse, Paginated } from './types/api-response';
```

### ⚠️ Jebakan terbesar #1 — CJS vs ESM (dual build)

Ini masalah paling halus dan paling sering bikin pusing di monorepo TS:

- **NestJS** dikompilasi ke **CommonJS** → butuh `require()`.
- **Nuxt/Vite** maunya **ES Modules** → butuh `import` native.

Kalau kita cuma emit CommonJS, **Vite gagal mendeteksi named export** dan build
frontend error:

```
"FieldStatus" is not exported by "shared-types/dist/index.js"
```

Penyebabnya: Rollup/Vite memakai `cjs-module-lexer` untuk membaca named export dari
file CommonJS, dan pola `Object.defineProperty(exports, ...)` hasil `tsc` kadang
tidak terdeteksi.

**Solusi: dual build** — emit dua versi, lalu arahkan lewat `exports` conditions:

```jsonc
// tsconfig.cjs.json → buat Node
{ "extends": "../../tsconfig.base.json",
  "compilerOptions": { "module": "commonjs", "moduleResolution": "node", "outDir": "./dist/cjs" } }

// tsconfig.esm.json → buat Vite
{ "extends": "../../tsconfig.base.json",
  "compilerOptions": { "module": "esnext", "moduleResolution": "bundler", "outDir": "./dist/esm" } }
```

Node ambil `require` → `dist/cjs`, Vite ambil `import` → `dist/esm`. Beres.

### ⚠️ Jebakan #2 — pakai named re-export, bukan `export *`

```ts
// ❌ JANGAN — `export *` susah dideteksi lexer di output CJS
export * from './enums/field-status.enum';

// ✅ PAKAI — eksplisit, selalu terdeteksi
export { FieldStatus } from './enums/field-status.enum';
```

---

## 6. Langkah 3 — Backend (`apps/api`)

Pakai struktur NestJS standar. Yang penting untuk **monorepo**:

```jsonc
// apps/api/package.json (potongan penting)
{
  "name": "@minisoccer/api",
  "dependencies": {
    "@minisoccer/shared-types": "workspace:*", // ← ini kuncinya
  },
}
```

> **`workspace:*`** memberi tahu Bun: "paket ini ada di workspace lokal, jangan cari
> ke npm." Bun akan membuat symlink `node_modules/@minisoccer/shared-types` →
> `packages/shared-types`.

Tambahkan **path alias** di `tsconfig.json` api supaya import internal rapi:

```jsonc
// apps/api/tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "emitDecoratorMetadata": true, // wajib untuk NestJS decorator
    "experimentalDecorators": true,
    "paths": {
      "@common/*": ["src/common/*"],
      "@modules/*": ["src/modules/*"],
    },
  },
}
```

Lalu import lintas-paket biasa saja:

```ts
import { FieldStatus } from '@minisoccer/shared-types'; // dari paket workspace
import { BaseEntity } from '@common/entities/base.entity'; // dari alias internal
```

> **Jebakan build path:** kalau `tsconfig` meng-`include` folder di luar `src`
> (mis. `prisma/`), output `tsc` bisa nyasar ke `dist/src/...` bukan `dist/`. Solusi:
> buat `tsconfig.build.json` yang `rootDir: "./src"` + `exclude` folder lain, lalu
> arahkan `nest build` ke situ.

---

## 7. Langkah 4 — Frontend (`apps/web`)

Sama: deklarasikan dependency workspace.

```jsonc
// apps/web/package.json (potongan)
{
  "name": "@minisoccer/web",
  "dependencies": { "@minisoccer/shared-types": "workspace:*" },
}
```

### ⚠️ Jebakan #3 — `tsconfig.json` Nuxt 4

Nuxt **men-generate** tsconfig sendiri di `.nuxt/`. Kalau kamu tulis tsconfig root
yang pakai _project references_ secara manual, `nuxt typecheck` bisa error
(`composite must be true`, dll). **Pakai bentuk paling sederhana:**

```jsonc
// apps/web/tsconfig.json — cukup ini
{ "extends": "./.nuxt/tsconfig.json" }
```

### ⚠️ Jebakan #4 — auto-import yang merusak boundary

Nuxt auto-import `components/`, `composables/`, `stores/`. Bagus untuk layer
_shared_, tapi **merusak batas antar-fitur**: feature A bisa diam-diam pakai komponen
feature B tanpa import yang kelihatan. Aturannya: **daftarkan layer shared saja,
biarkan `features/` di-import eksplisit.**

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  components: [
    { path: '~/components/ui', pathPrefix: false },
    { path: '~/components/common', pathPrefix: false },
    // features/ TIDAK didaftarkan → wajib import dari barrel features/<x>/index.ts
  ],
  imports: { dirs: ['composables', 'utils', 'stores'] }, // features & lib tidak masuk
});
```

---

## 8. Langkah 5 — Menyambung shared-types ke kedua app

Setelah `package.json` ketiga paket siap, jalankan **sekali** di root:

```bash
bun install
```

Bun akan:

1. Install semua dependency semua paket sekaligus.
2. Membuat symlink paket workspace (`@minisoccer/shared-types`) ke `node_modules`.

Lalu **build shared-types dulu** (karena app meng-`import` hasil build-nya):

```bash
bun run --filter @minisoccer/shared-types build
```

> **`--filter`** menjalankan script di paket tertentu saja. Bentuk umum:
> `bun run --filter <nama-paket> <script>`.

Sekarang `apps/api` & `apps/web` sudah bisa `import { FieldStatus } from '@minisoccer/shared-types'`.

---

## 9. Langkah 6 — Orkestrasi build dengan Turbo

Daripada ingat urutan build manual, biar Turbo yang atur lewat `dependsOn: ["^build"]`.

```bash
bun run build      # turbo: build shared-types → lalu api & web (paralel)
bun run typecheck  # cek tipe seluruh monorepo
bun run test       # jalankan test semua paket
```

**Yang Turbo lakukan:**

- Baca graph dependency antar paket.
- Build `shared-types` lebih dulu (karena api & web bergantung padanya).
- Build `api` & `web` **paralel** (tidak saling bergantung).
- **Cache** hasil — build kedua kali yang tidak berubah = instan.

> **Jebakan dev:** task `dev` itu _persistent_ (jalan terus). Tambahkan
> `"dev": { "dependsOn": ["^build"], "persistent": true, "cache": false }` supaya
> `shared-types` ke-build dulu sebelum dev server nyala — kalau tidak, fresh clone
> akan error "dist not found".

---

## 10. Langkah 7 — Port yang aman & command `serve`

**Prinsip:** jangan hardcode port. Baca dari `.env`, dan **hindari 3000** (paling
sering bentrok). Di project ini: web `4300`, api `4400`.

```bash
# apps/api/.env
PORT=4400

# apps/web/.env
PORT=4300
NUXT_PUBLIC_API_BASE=http://localhost:4400/api
```

Di backend, baca port dari config service (bukan `process.env` mentah) supaya `.env`
jadi satu sumber kebenaran:

```ts
// main.ts
const config = app.get(ConfigService);
await app.listen(config.get<number>('app.port') ?? 4400);
```

**Command ala `php artisan serve`** — tambahkan script di root:

```jsonc
"scripts": {
  "serve": "turbo run dev",                          // api + web sekaligus
  "serve:api": "turbo run dev --filter=@minisoccer/api",
  "serve:web": "turbo run dev --filter=@minisoccer/web"
}
```

```bash
bun run serve         # semua
bun run serve:api     # api saja
PORT=5000 bun run serve:api   # override cepat tanpa edit .env
```

---

## 11. Langkah 8 — Docker (dev hot-reload + prod)

**Pisahkan dua compose:**

- **`docker-compose.yml` (DEV)** — infra (Postgres/Redis/storage) **+** app dengan
  **hot reload** (source di-_bind mount_, jalan mode `--watch`).
- **`docker-compose.prod.yml` (PROD)** — **apps saja**; database di-provision di luar
  (mis. Dokploy).

**Dockerfile multi-stage** — konteks build = **root repo** (biar bisa akses
`packages/`):

```dockerfile
# apps/api/Dockerfile (inti)
FROM oven/bun:1.3.3 AS deps
WORKDIR /app
COPY package.json bun.lock ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile --ignore-scripts   # ← lihat jebakan di bawah

FROM deps AS build
COPY . .
RUN bun run --filter @minisoccer/shared-types build && \
    cd apps/api && bun run build

FROM oven/bun:1.3.3-slim AS runtime
COPY --from=build /app/apps/api/dist ./dist
CMD ["bun", "dist/main.js"]
```

Build-nya: `docker build -f apps/api/Dockerfile -t minisoccer-api .` (titik = root).

> **Jebakan #5 — `--ignore-scripts` saat install di Docker.** Stage `deps` cuma
> meng-copy `package.json`, belum ada source. Kalau ada `postinstall` (mis.
> `nuxt prepare`), install akan gagal karena source belum ada. Pakai
> `--ignore-scripts`, lalu jalankan langkah build secara eksplisit di stage `build`.

> **Jebakan #6 — hot reload di Docker.** Mount source + pakai _named volume_ untuk
> `node_modules` agar `node_modules` host (Mac, binari beda OS) tidak menimpa milik
> container (Linux):
>
> ```yaml
> volumes:
>   - ./:/app
>   - api_node_modules:/app/node_modules # named volume, jangan ketiban host
> ```

---

## 12. Langkah 9 — Git, Husky, Conventional Commits

```bash
git init -b main
bun add -d husky @commitlint/cli @commitlint/config-conventional lint-staged
bunx husky init
```

Hook yang berguna:

```bash
# .husky/pre-commit   → format file yang di-stage
bunx lint-staged

# .husky/commit-msg   → paksa format Conventional Commits
bunx commitlint --edit "$1"
```

```jsonc
// package.json
"lint-staged": { "*.{ts,vue}": "prettier --write" }
```

Format commit: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`, `build:`, `test:`.

> **Multi-akun GitHub via SSH:** kalau punya >1 akun, bikin alias di `~/.ssh/config`
> dan set remote pakai alias itu — bukan `git@github.com`:
>
> ```
> Host github-akunku
>   HostName github.com
>   IdentityFile ~/.ssh/akunku_ed25519
>   IdentitiesOnly yes
> ```
>
> ```bash
> git remote set-url origin git@github-akunku:user/repo.git
> ```
>
> `gh` CLI juga bisa multi-akun: `gh auth login` (tambah) lalu `gh auth switch`.

---

## 13. Kumpulan Jebakan (rangkuman)

| #   | Masalah                                     | Solusi                                                      |
| --- | ------------------------------------------- | ----------------------------------------------------------- |
| 1   | Vite gagal baca named export dari paket CJS | **Dual build** CJS+ESM via `exports` conditions             |
| 2   | `export *` tidak terdeteksi lexer           | Pakai **named re-export** eksplisit                         |
| 3   | `nuxt typecheck` error project references   | tsconfig web cukup `{ "extends": "./.nuxt/tsconfig.json" }` |
| 4   | Auto-import bocor antar-fitur               | Daftarkan layer shared saja; `features/` import eksplisit   |
| 5   | Install Docker gagal karena `postinstall`   | `bun install --ignore-scripts`, build manual di stage build |
| 6   | `node_modules` host menimpa container       | Named volume untuk `node_modules`                           |
| 7   | Output `tsc` nyasar ke `dist/src/`          | `tsconfig.build.json` dengan `rootDir: src` + exclude       |
| 8   | Build urutan salah (dist not found)         | Turbo `dependsOn: ["^build"]`                               |
| 9   | Port 3000 bentrok                           | Baca port dari `.env`, default jauh dari 3000               |

---

## 14. Checklist setup baru

```text
[ ] mkdir project && cd project
[ ] package.json root  (private, workspaces, scripts turbo)
[ ] tsconfig.base.json
[ ] turbo.json  (build dependsOn ^build, dev persistent)
[ ] .gitignore  (+ jangan ignore .env.example)
[ ] packages/shared-types  (dual build CJS+ESM, named exports)
[ ] apps/api      (workspace:* + path alias + tsconfig.build.json)
[ ] apps/web      (workspace:* + tsconfig extends .nuxt + auto-import boundary)
[ ] bun install
[ ] bun run --filter <shared-types> build
[ ] .env per app  (port != 3000)
[ ] script serve / serve:api / serve:web
[ ] Dockerfile multi-stage + 2 compose (dev hot-reload / prod)
[ ] git init + husky + commitlint
[ ] bun run build && bun run typecheck   ← harus hijau
```

---

### Penutup

Inti monorepo cuma tiga hal: **(1) workspaces** untuk menautkan paket lokal,
**(2) satu paket shared** sebagai sumber tipe bersama, dan **(3) Turbo** untuk
mengatur urutan + caching. Sisanya — Docker, port, git — adalah polish.

Jebakan paling sering: **interop CJS/ESM** (jebakan #1). Kalau paham itu, 80%
kepusingan monorepo TypeScript hilang.

> Lihat implementasi nyatanya langsung di repo ini — tiap konsep di atas ada
> file aslinya (`turbo.json`, `packages/shared-types/`, `apps/*/Dockerfile`, dst).
