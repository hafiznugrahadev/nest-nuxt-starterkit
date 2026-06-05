# Mini Soccer ⚽

Mini soccer field booking platform — a **Bun + Turbo monorepo** built to the team
[`SPEC.md`](./SPEC.md) conventions.

```
minisoccer/
├── apps/
│   ├── api/            NestJS + Prisma backend (class-validator, Swagger, Pino)
│   └── web/            Nuxt 4 (Vue 3) frontend (shadcn-vue, Pinia, TanStack Query)
├── packages/
│   └── shared-types/   TS contracts (enums, API envelope, entities) shared by both
├── docker-compose.yml  Postgres + Redis + MinIO (backing services only)
└── turbo.json
```

## Stack

| Layer    | Tech                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| Backend  | Bun · NestJS 11 · Prisma 6 · PostgreSQL · Redis · JWT · class-validator      |
| Frontend | Nuxt 4 · Vue 3 · Tailwind v4 · shadcn-vue (Reka UI) · Pinia · TanStack Query |
| Shared   | `@minisoccer/shared-types` (enums + API contracts, compiled to CJS)          |

## Getting started

```bash
# 1. Install (Bun workspaces)
bun install

# 2. Start backing services
cp .env.example .env
docker compose up -d

# 3. Configure the API
cp apps/api/.env.example apps/api/.env
bun run --filter @minisoccer/api prisma:generate
bun run --filter @minisoccer/api prisma:migrate
bun run --filter @minisoccer/api db:seed

# 4. Configure the web app
cp apps/web/.env.example apps/web/.env

# 5. Run everything (artisan-serve style — one command for api + web)
bun run serve
```

- API → http://localhost:4400/api · Swagger → http://localhost:4400/api/docs
- Web → http://localhost:4300

### Ports (configurable per `.env` — no clashes with your other apps)

| App | Default | Where to change                                                                   |
| --- | ------- | --------------------------------------------------------------------------------- |
| Web | `4300`  | `apps/web/.env` → `PORT`                                                          |
| API | `4400`  | `apps/api/.env` → `PORT` (also update `CORS_ORIGIN` + web `NUXT_PUBLIC_API_BASE`) |

> Picked deliberately away from `3000`/`3001`. Change them freely — they are read
> from `.env` at startup, nothing is hardcoded.

### Serve commands (`php artisan serve` vibes)

| Command             | Starts                         |
| ------------------- | ------------------------------ |
| `bun run serve`     | API + Web together (Turbo)     |
| `bun run serve:api` | API only (`:4400`, watch mode) |
| `bun run serve:web` | Web only (`:4300`, HMR)        |

Quick one-off port override without editing `.env`:

```bash
PORT=5000 bun run serve:api                     # API on :5000
bun run --filter @minisoccer/web dev --port 5000 # Web on :5000
```

### Seed credentials

| Role     | Email                      | Password      |
| -------- | -------------------------- | ------------- |
| Admin    | `admin@minisoccer.test`    | `admin123`    |
| Customer | `customer@minisoccer.test` | `customer123` |

## DRY patterns implemented

**Backend** (`apps/api/src/common`): `BaseEntity`, `BaseQueryDto`, `PaginatedDto`,
`BaseRepository<T>`, `BaseCrudService`, `ResponseInterceptor`, global `ValidationPipe`,
`IsUnique` async validator, `ApiPaginatedResponse` decorator, `@Global()` Prisma/Redis.

**Frontend** (`apps/web/app`): generic `<DataTable />`, VeeValidate field components,
shared Zod schemas, single `apiClient` (ofetch), `usePaginatedQuery`, shared
Error/Empty/Loading state blocks. `features/` is intentionally **not** auto-imported —
explicit barrel imports enforce the dependency rule.

## Scripts (root)

| Command             | Description                         |
| ------------------- | ----------------------------------- |
| `bun run serve`     | Run api + web (artisan-serve style) |
| `bun run serve:api` | Run API only                        |
| `bun run serve:web` | Run web only                        |
| `bun run dev`       | Alias of `serve` (api + web)        |
| `bun run build`     | Build all packages (ordered)        |
| `bun run typecheck` | Type-check the whole monorepo       |
| `bun run lint`      | Lint all packages                   |
| `bun run test`      | Run unit tests                      |
