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

# 2. Make it YOUR project (renames the package scope, containers, volumes, DB…)
bun run init            # or: bun run init --name portal-desa --yes
#    …this also writes .env from .env.example with a generated JWT_SECRET.
#    Skipping it? Then: cp .env.example .env

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

| Command                     | Description                                   |
| --------------------------- | --------------------------------------------- |
| `bun run serve`             | Run api + web                                 |
| `bun run dev`               | Alias of `serve`                              |
| `bun run build`             | Build all packages (ordered)                  |
| `bun run typecheck`         | Type-check the whole monorepo                 |
| `bun run lint`              | Lint all packages                             |
| `bun run test`              | Run unit tests                                |
| `bun run init`              | Rename the kit into a new project (see below) |
| `bun run db:restore`        | Restore the DB from a backup (see below)      |
| `bun run db:restore:docker` | Same, inside the `db-tools` container         |

## Starting a new project (`bun run init`)

Renames the kit's identity to yours in one pass: the `@starterkit/*` package
scope, the `starterkit` slug used by the Compose project name, container names,
volume names, the Postgres database, the S3 buckets and the `*.orb.local` dev
domains, plus the "Starter Kit" display name. It then writes `.env` from
`.env.example` with a freshly generated `JWT_SECRET`.

```bash
bun run init                                   # interactive prompts
bun run init --name portal-desa --dry-run      # preview which files change
bun run init --name portal-desa --display "Portal Desa" --yes --reset-git
```

| Flag               | Effect                                          |
| ------------------ | ----------------------------------------------- |
| `--name <slug>`    | Project slug (default: the directory name)      |
| `--display <name>` | Display name (default: Title Case of the slug)  |
| `--dry-run`        | List the files that would change; write nothing |
| `--yes`, `-y`      | Accept defaults, skip the prompts               |
| `--reset-git`      | Delete `.git` and start a fresh history         |
| `--force`          | Run even with uncommitted changes               |

The slug must be lowercase kebab-case: it has to be legal as an npm scope, a
Compose project name, a Postgres database and an S3 bucket all at once.

Only git-tracked files are rewritten, so `node_modules`, build output and your
local `.env` are untouched — and every change is reviewable with `git diff` and
revertible with `git checkout .`. It refuses to run on a dirty working tree
unless you pass `--force`. **Commit any new files first** — untracked files are
invisible to the rename.

Afterwards: `bun install` (regenerates `bun.lock` with the new package names) and
`prisma:generate`. The old `starterkit_*` Docker volumes stick around under the
previous name — remove them with `docker volume ls | grep starterkit`.

## Restoring the database (`bun run db:restore`)

Restores Postgres from a `pg_dump | gzip` dump kept in an S3-compatible bucket
(RustFS / MinIO / AWS — whatever your backup job, e.g. Dokploy, writes to). The
kit **never creates** backups; it only lists and restores them.

`.env` holds just the credentials and the bucket — **which folder and dump to
restore is chosen at run time** by browsing the bucket:

```bash
bun run db:restore                            # browse the bucket, pick a dump
bun run db:restore --path postgres/2026-07    # start browsing in that folder
bun run db:restore --latest                   # newest dump under the start path
bun run db:restore postgres/daily.sql.gz      # restore that exact key
```

In the browser, `1`…`n` picks a row, `..` goes up, typing `/some/path` jumps
straight there, and `q` quits.

| Flag              | Effect                                                     |
| ----------------- | ---------------------------------------------------------- |
| `<key>`           | Restore that exact object key, skipping selection          |
| `--path <folder>` | Start browsing (or search with `--latest`) in that folder  |
| `--latest`        | Newest dump under the start path, no browsing              |
| `--yes`, `-y`     | Skip the `y/N` prompt (for CI)                             |
| `--force`         | Required in production, on top of typing the database name |

Config lives under `BACKUP_*` in the root `.env` (see `.env.example`). Two things
to watch:

- **Endpoint:** the CLI runs on the host, so `BACKUP_S3_ENDPOINT` must be the
  host-published address (`http://localhost:9000`), not the in-Compose service
  host (`http://rustfs:9000`).
- **`psql` required:** the dump is replayed through the Postgres client
  (macOS: `brew install libpq && brew link --force libpq`). Prefer a client
  matching your server's major version — recent `pg_dump` releases emit
  `\restrict` meta-commands that an older `psql` rejects.

The restore is destructive — it runs `DROP SCHEMA public CASCADE` before applying
the dump. Non-production asks for a `y/N`; production additionally requires
`--force` **and** typing the database name. If the dump fails halfway, the
database is left with an empty `public` schema — re-run with a good dump.

### From Docker

The dev `api`/`web` containers run plain `oven/bun` and have no Postgres client,
so the restore lives in its own `db-tools` service (bun + `psql` 17, behind the
`tools` profile — `docker compose up` never starts it). Use `run`, not `exec`:
`run` allocates the TTY the interactive browser needs.

```bash
bun run db:restore:docker                            # = docker compose run --rm db-tools
docker compose run --rm db-tools --latest --yes      # non-interactive
docker compose run --rm db-tools --path postgres/2026-07
```

Running `bun run db:restore` inside the `api` container instead will get as far
as downloading the dump and then fail — that image has no `psql`.

It talks to `postgres:5432` on the compose network (overriding the host-mapped
`DATABASE_URL` from `.env`). If `BACKUP_S3_ENDPOINT` points at `localhost`, give
the container a reachable host instead — an external domain, or
`host.docker.internal`.

> **Compose project names collide.** Every copy of this kit that hasn't been
> renamed shares `name: starterkit-dev`, so `docker compose` in one copy attaches
> to another copy's containers. Run `bun run init` in each project (or set
> `COMPOSE_PROJECT_NAME`) before relying on `docker compose exec/run`.
