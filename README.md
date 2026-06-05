# Starter Kit

A **Bun + Turbo monorepo** starter kit — NestJS API + Nuxt 4 web with authentication,
a users datatable, and reusable components, built to the team [`SPEC.md`](./SPEC.md)
conventions.

```
starterkit/
├── apps/
│   ├── api/            NestJS 11 + Prisma 7 backend (JWT auth, class-validator, Swagger, Pino)
│   └── web/            Nuxt 4 (Vue 3) frontend (shadcn-vue, Pinia, TanStack Query)
├── packages/
│   └── shared-types/   TS contracts (UserRole, API envelope, entities) shared by both
├── docker-compose.yml  Postgres + Redis (backing services for local dev)
└── turbo.json
```

## Stack

| Layer    | Tech                                                                         |
| -------- | ---------------------------------------------------------------------------- |
| Backend  | Bun · NestJS 11 · Prisma 7 (driver adapter) · PostgreSQL · Redis · JWT       |
| Frontend | Nuxt 4 · Vue 3 · Tailwind v4 · shadcn-vue (Reka UI) · Pinia · TanStack Query |
| Shared   | `@starterkit/shared-types` (UserRole + API contracts, compiled to CJS/ESM)   |

## What's included

- **Auth** — email/password login, short-lived JWT access token + rotating refresh
  token in an httpOnly cookie (with reuse detection), `/auth/refresh` + `/auth/logout`,
  global JWT & role guards, login rate limiting.
- **Users datatable** — admin-only `GET /users` (paginated, searchable; password never
  returned) rendered with a generic, reusable `<DataTable />`.
- **Reusable components** — shadcn-vue UI primitives, VeeValidate form fields, and
  Error/Empty/Loading state blocks; `BaseRepository`/`BaseCrudService`/`BaseQueryDto`
  on the backend.

## Getting started

```bash
# 1. Install (Bun workspaces)
bun install

# 2. One .env for the whole monorepo
cp .env.example .env

# 3. Start backing services (Postgres + Redis)
docker compose up -d postgres redis

# 4. Generate the Prisma client, migrate, seed
bun run --filter @starterkit/api prisma:generate
bun run --filter @starterkit/api prisma:deploy   # apply migrations
bun run --filter @starterkit/api db:seed

# 5. Run everything (one command for api + web)
bun run serve
```

> **Single `.env`:** there is exactly one env file at the repo root. The API loads
> it via `ConfigModule` (`envFilePath: ../../.env`) and Nuxt via `--dotenv ../../.env`.

- API → http://localhost:4400/api · Swagger → http://localhost:4400/api/docs
- Web → http://localhost:4300

> **CORS + cookies:** the refresh cookie requires an explicit `CORS_ORIGIN` (the web
> origin) on the API — a wildcard `*` is rejected by browsers for credentialed requests.

### Ports (configurable in the root `.env`)

| App | Default | Where to change                                                          |
| --- | ------- | ------------------------------------------------------------------------ |
| Web | `4300`  | `.env` → `WEB_PORT`                                                      |
| API | `4400`  | `.env` → `API_PORT` (also update `CORS_ORIGIN` + `NUXT_PUBLIC_API_BASE`) |

### Serve commands

| Command             | Starts                         |
| ------------------- | ------------------------------ |
| `bun run serve`     | API + Web together (Turbo)     |
| `bun run serve:api` | API only (`:4400`, watch mode) |
| `bun run serve:web` | Web only (`:4300`, HMR)        |

### Seed credentials

| Role  | Email                   | Password   |
| ----- | ----------------------- | ---------- |
| Admin | `admin@starterkit.test` | `admin123` |
| User  | `user@starterkit.test`  | `user1234` |

## DRY patterns

**Backend** (`apps/api/src/common`): `BaseEntity`, `BaseQueryDto`, `PaginatedDto`,
`BaseRepository<T>` (with `omit` support), `BaseCrudService`, `ResponseInterceptor`,
global `ValidationPipe`, `IsUnique` async validator, `ApiPaginatedResponse` decorator,
`@Global()` Prisma/Redis modules.

**Frontend** (`apps/web/app`): generic `<DataTable />`, VeeValidate field components,
single `apiClient` (ofetch) with transparent 401→refresh→retry, `usePaginatedQuery`,
`useApiMutation`, and shared Error/Empty/Loading blocks. `features/` is intentionally
**not** auto-imported — explicit barrel imports enforce the dependency rule.

## Scripts (root)

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `bun run serve`     | Run api + web                 |
| `bun run dev`       | Alias of `serve`              |
| `bun run build`     | Build all packages (ordered)  |
| `bun run typecheck` | Type-check the whole monorepo |
| `bun run lint`      | Lint all packages             |
| `bun run test`      | Run unit tests                |
