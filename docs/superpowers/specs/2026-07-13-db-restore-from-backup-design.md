# Design: `db:restore` from backup + dedicated backup object storage

**Date:** 2026-07-13
**Status:** Approved (brainstorming) → ready for planning

## Summary

Add the ability to restore the PostgreSQL database from a backup dump. Backups
are produced by **Dokploy** (`pg_dump | gzip` → `.sql.gz`) and pushed to an
S3-compatible bucket. This project does **not** create backups; it only reads
them for restore.

Two deliverables, built in phases sharing the same services:

- **Phase 1 — CLI**: `bun run db:restore` (in `apps/api`) lists backups from a
  dedicated backup bucket, lets the operator pick one, and restores it into
  `DATABASE_URL`.
- **Phase 2 — Admin API + Web UI**: an admin-only, feature-flagged surface to
  list and trigger restores from the browser.

The "one more object storage" is a **new config namespace `backup`**, fully
separate from the existing uploads storage (`storage` / `StorageDriver`).

## Non-goals

- Creating backups (Dokploy owns that).
- Point-in-time recovery, WAL streaming, or partial/selective restore.
- Restoring into a fresh temporary database + swap (rejected during
  brainstorming in favor of drop-and-recreate schema).

## Decisions (from brainstorming)

| Topic            | Decision                                                                |
| ---------------- | ----------------------------------------------------------------------- |
| Delivery         | Both: CLI first, then admin API + UI                                    |
| Backup format    | `.sql.gz` (plain SQL, gzipped)                                          |
| Restore behavior | `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` then apply dump     |
| Production guard | Blocked unless `--force` **and** operator re-types the DB name          |
| CLI selection    | Interactive menu (default) + `<key>` arg + `--latest` flag              |
| Backup storage   | Dedicated `backup` config namespace, separate from uploads              |
| UI safety        | Admin/super-admin only + `BACKUP_RESTORE_UI_ENABLED` flag (default off) |

## Prerequisite

The `psql` binary must be available in whatever environment runs the restore
(local shell, CI, or the API container for the UI path). A `.sql.gz` dump
contains `psql` meta-commands (`\.`, `COPY ... FROM stdin`) that only `psql` can
execute — the Node `pg` driver cannot. Gzip decompression is done in Node
(`zlib`), so **only `psql` is required** (no `gzip` binary needed).

## Configuration

### New env vars (root `.env` / `.env.example`)

```bash
# ── Database backups (for db:restore) — the bucket where Dokploy stores dumps ──
BACKUP_DRIVER=s3                      # s3 (default) | local (a local folder, for dev)
BACKUP_S3_ENDPOINT=
BACKUP_S3_REGION=us-east-1
BACKUP_S3_BUCKET=
BACKUP_S3_ACCESS_KEY_ID=
BACKUP_S3_SECRET_ACCESS_KEY=
BACKUP_S3_FORCE_PATH_STYLE=true
BACKUP_S3_PREFIX=                     # optional: folder within the bucket, e.g. "postgres/"
# BACKUP_LOCAL_DIR=./storage/backups  # used when BACKUP_DRIVER=local
# BACKUP_RESTORE_UI_ENABLED=false     # gate the admin restore endpoint/UI (Phase 2)
```

### `apps/api/src/config/backup.config.ts`

`registerAs('backup', ...)` mirroring the shape/style of `storage.config.ts`:

```ts
export const backupConfig = registerAs('backup', () => ({
  driver: process.env.BACKUP_DRIVER ?? 's3',
  restoreUiEnabled: (process.env.BACKUP_RESTORE_UI_ENABLED ?? 'false') === 'true',
  local: { dir: process.env.BACKUP_LOCAL_DIR ?? './storage/backups' },
  s3: {
    endpoint: process.env.BACKUP_S3_ENDPOINT,
    region: process.env.BACKUP_S3_REGION ?? 'us-east-1',
    bucket: process.env.BACKUP_S3_BUCKET,
    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
    forcePathStyle: (process.env.BACKUP_S3_FORCE_PATH_STYLE ?? 'true') !== 'false',
    prefix: process.env.BACKUP_S3_PREFIX ?? '',
  },
}));
```

### `apps/api/src/config/env.validation.ts`

Add optional fields: `BACKUP_DRIVER` (`@IsIn(['s3','local'])`),
`BACKUP_RESTORE_UI_ENABLED` (`@Transform(toBool) @IsBoolean`), and the
`BACKUP_S3_*` / `BACKUP_LOCAL_DIR` strings (all `@IsOptional`). Do not make S3
creds hard-required at boot — the CLI validates them at run time so the app can
boot without backup config.

## Components

### 1. `infrastructure/backup/backup-storage.types.ts`

```ts
export interface BackupObject {
  key: string; // object key / filename
  size: number; // bytes
  lastModified: Date;
}
export interface BackupStorage {
  listBackups(): Promise<BackupObject[]>; // sorted newest-first
  downloadBackup(key: string): Promise<NodeJS.ReadableStream>; // gzipped bytes
}
```

### 2. `infrastructure/backup/backup-storage.service.ts`

Implements `BackupStorage` for both drivers:

- **s3**: reuse `@aws-sdk/client-s3` (`ListObjectsV2Command`, `GetObjectCommand`)
  with a dedicated client built from `backup.s3`. Applies `prefix` when listing.
  Filters to `.sql.gz` (and `.sql` / `.gz`) keys. Sorts by `lastModified` desc.
- **local**: reads `backup.local.dir`, `stat`s each file, streams via
  `fs.createReadStream`.

Kept separate from the uploads `StorageDriver` because the contract differs
(list + download vs upload/delete/url).

### 3. `infrastructure/backup/database-restore.service.ts`

Core restore logic, reused by both CLI and API:

```ts
restore(input: {
  gzippedDump: NodeJS.ReadableStream;
  databaseUrl: string;
  force: boolean;          // required in production
  nodeEnv: string;
}): Promise<void>
```

Steps:

1. **Guard**: if `nodeEnv === 'production'` and `!force`, throw. (The DB-name
   re-type confirmation lives in the CLI/UI layer, not here.)
2. Reset schema: spawn `psql "<databaseUrl>" -v ON_ERROR_STOP=1 -c
"DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`.
3. Apply dump: spawn `psql "<databaseUrl>" -v ON_ERROR_STOP=1`, pipe
   `gzippedDump.pipe(zlib.createGunzip())` into its stdin.
4. Reject on non-zero exit, surfacing `psql` stderr.

### 4. `infrastructure/backup/backup.module.ts`

Provides `BackupStorageService` and `DatabaseRestoreService`; imported by the
admin module (Phase 2). The CLI instantiates the services directly (standalone
context) without booting the HTTP app.

### 5. CLI — `apps/api/scripts/db-restore.ts` → `"db:restore"`

Add to `apps/api/package.json`:
`"db:restore": "bun run scripts/db-restore.ts"`.

Flow:

1. Load root `.env`, build `backupConfig()`, validate S3 creds present (clear
   error if missing).
2. `listBackups()`. If empty → friendly message + exit.
3. Selection:
   - `--latest` → newest.
   - positional `<key>` → that key (validate it exists).
   - else if `process.stdout.isTTY` → numbered interactive prompt.
   - else (non-TTY, no arg) → error telling the user to pass `<key>` or `--latest`.
4. Confirmation:
   - production → require `--force` **and** prompt "type the database name to
     confirm"; abort on mismatch.
   - non-production → simple `y/N`.
5. `downloadBackup(key)` → `DatabaseRestoreService.restore(...)`.
6. Print success (restored key, size, target DB name — never the full URL/creds).

### 6. Phase 2 — Admin API

`apps/api/src/modules/admin/backup.controller.ts` (or a `backups` module):

- `GET /api/admin/backups` → `BackupObject[]`.
- `POST /api/admin/backups/restore` → body `{ key: string, confirmDbName: string }`.

Both guarded by the existing `JwtAuthGuard` + `RolesGuard` with
`@Roles(UserRole.SUPER_ADMIN)` (restore is the most destructive op → super-admin
only). When `backup.restoreUiEnabled` is false, both routes return **404**
(feature hidden). The restore handler passes `force: true` (server-side) but
requires `confirmDbName` to match the configured DB name before proceeding.

### 7. Phase 2 — Web UI

Admin page (following existing admin page conventions) that:

- Fetches `GET /api/admin/backups`, renders a table (name, size, formatted date).
- Restore button per row → confirmation dialog requiring the operator to type
  the DB name → `POST .../restore`.
- Hidden entirely when the feature flag is off (route/nav gated).
- All copy via i18n (`id` + `en`), matching existing locale structure.

## Error handling

- Missing/invalid backup S3 config → CLI exits with a clear, actionable message.
- `psql` not found → catch spawn `ENOENT`, tell the user to install the Postgres
  client.
- `psql` non-zero exit → surface stderr; the DB may be left with an empty
  `public` schema (documented; operator can re-run).
- API: config-missing / `psql` failure → `500` with a safe message (no creds in
  the response); disabled feature → `404`; wrong `confirmDbName` → `400`.

## Testing

- **Unit** `BackupStorageService`: list sorting (newest-first), prefix handling,
  `.sql.gz` filtering, download streaming — S3 client mocked.
- **Unit** CLI arg parsing / selection: `--latest`, `<key>`, interactive vs
  non-TTY error path.
- **Unit** `DatabaseRestoreService`: production guard throws without `force`;
  `psql` invoked with expected args (child_process mocked).
- **E2E** (mirrors `apps/api/test/*.e2e-spec.ts`): `GET /api/admin/backups` →
  200 for super-admin, 403 for a regular user, 404 when the flag is off.

## Rollout / phasing

1. **Phase 1**: `backup.config`, env validation, `BackupStorageService`,
   `DatabaseRestoreService`, `db:restore` CLI, `.env.example`, unit tests, docs.
2. **Phase 2**: `BackupModule`, admin controller + guards + feature flag, Nuxt
   admin page + i18n, e2e test.

Each phase is independently shippable; Phase 1 delivers the core capability.
