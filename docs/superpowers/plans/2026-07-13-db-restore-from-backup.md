# db:restore from backup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the PostgreSQL database from a Dokploy-produced `.sql.gz` backup, selectable from a dedicated backup object storage, via CLI (`bun run db:restore`) and an admin-only, feature-flagged web UI.

**Architecture:** A new `backup` config namespace (separate from uploads `storage`) points at the S3-compatible bucket where Dokploy stores dumps. `BackupStorageService` lists/downloads dumps (s3 + local drivers); `DatabaseRestoreService` resets the `public` schema and applies a gunzipped dump through `psql`. Both services are reused by a standalone CLI script and (Phase 2) an admin `BackupController` + Nuxt page.

**Tech Stack:** NestJS 11, `@nestjs/config` (`registerAs`), class-validator, `@aws-sdk/client-s3` (lazy-loaded), Node `zlib`/`child_process`, Prisma 7 / PostgreSQL, Bun runtime for scripts, Nuxt 3 + vue-i18n for the web UI, Jest + Supertest for tests.

## Global Constraints

- **Single root `.env`** — all env vars live in the monorepo-root `.env`; no per-app env files. CLI/scripts load it via `config({ path: ['../../.env', '.env'] })` (cwd = `apps/api`).
- **Env validation** — use class-validator in `apps/api/src/config/env.validation.ts` (never Zod). New backup vars are all `@IsOptional` (app must boot without backup config).
- **Config access** — namespaces via `registerAs`, read through `ConfigService.get('backup.*')`; register in `app.module.ts` `load: [...]`.
- **AWS SDK is an optional runtime dep** — load `@aws-sdk/client-s3` lazily behind a `string`-typed module specifier so `local`-driver deployments never need it installed (mirror `s3.driver.ts`).
- **Roles** — restrict via `@Roles(UserRole.SUPER_ADMIN)` + existing `RolesGuard`; `UserRole` comes from `@starterkit/shared-types`.
- **Restore is destructive** — production requires an explicit `force`; the DB-name re-type confirmation lives in the CLI/UI layer.
- **Prerequisite** — `psql` binary must be on PATH wherever restore runs. Gunzip is done in Node (`zlib`); no `gzip` binary needed.
- **Never log/return credentials** — surface the DB _name_ only, never the full `DATABASE_URL`.
- **Web boundaries** — `features/` is NOT auto-imported; use explicit barrel imports. All UI copy goes through i18n (`en.json` + `id.json`).
- **Commit style** — conventional commits; end message body with `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.

---

## File Structure

**Phase 1 (CLI + services):**

- `apps/api/src/config/backup.config.ts` — new `registerAs('backup')` namespace.
- `apps/api/src/config/env.validation.ts` — add `BACKUP_*` fields (modify).
- `apps/api/src/app.module.ts` — register `backupConfig` in `load` (modify).
- `apps/api/src/infrastructure/backup/backup-storage.types.ts` — `BackupObject`, `BackupStorage`, `BACKUP_STORAGE` token.
- `apps/api/src/infrastructure/backup/backup-storage.util.ts` — pure `filterAndSortBackups`.
- `apps/api/src/infrastructure/backup/backup-storage.util.spec.ts` — its tests.
- `apps/api/src/infrastructure/backup/backup-storage.service.ts` — s3 + local drivers.
- `apps/api/src/infrastructure/backup/backup-storage.service.spec.ts` — local-driver tests.
- `apps/api/src/infrastructure/backup/database-restore.service.ts` — schema reset + psql apply.
- `apps/api/src/infrastructure/backup/database-restore.service.spec.ts` — guard + spawn tests.
- `apps/api/src/infrastructure/backup/select-backup.util.ts` — pure CLI selection helper.
- `apps/api/src/infrastructure/backup/select-backup.util.spec.ts` — its tests.
- `apps/api/scripts/db-restore.ts` — the CLI entrypoint.
- `apps/api/package.json` — add `"db:restore"` script (modify).
- `.env.example` — document `BACKUP_*` (modify).

**Phase 2 (admin API + web):**

- `apps/api/src/infrastructure/backup/backup.module.ts` — DI module.
- `apps/api/src/modules/admin/backup.controller.ts` — list + restore endpoints.
- `apps/api/src/modules/admin/dto/restore-backup.dto.ts` — request body.
- `apps/api/src/modules/admin/admin.module.ts` — wires the controller.
- `apps/api/src/app.module.ts` — import `AdminModule` (modify).
- `apps/api/test/backup.e2e-spec.ts` — endpoint e2e.
- `apps/web/app/features/backup/api/backup.api.ts` — fetchers.
- `apps/web/app/features/backup/types.ts` — `BackupObject` FE type.
- `apps/web/app/features/backup/index.ts` — barrel.
- `apps/web/app/features/backup/components/BackupTable.vue` — table + restore dialog.
- `apps/web/app/pages/admin/backups.vue` — the page.
- `apps/web/app/components/shell/AppSidebar.vue` — nav link (modify).
- `apps/web/i18n/locales/en.json` + `id.json` — copy (modify).

---

## PHASE 1 — CLI + services

### Task 1: Backup config namespace + env validation + wiring

**Files:**

- Create: `apps/api/src/config/backup.config.ts`
- Modify: `apps/api/src/config/env.validation.ts`
- Modify: `apps/api/src/app.module.ts:32` (the `load:` array) and its imports
- Modify: `.env.example`

**Interfaces:**

- Produces: `backupConfig` (default export-style `registerAs('backup')`) exposing
  `{ driver: 's3'|'local', restoreUiEnabled: boolean, local: { dir: string },
s3: { endpoint?, region, bucket?, accessKeyId?, secretAccessKey?, forcePathStyle: boolean, prefix: string } }`
  and `type BackupConfig = ReturnType<typeof backupConfig>`.

- [ ] **Step 1: Create the config namespace**

Create `apps/api/src/config/backup.config.ts`:

```ts
import { registerAs } from '@nestjs/config';

/**
 * Backup-storage config namespace. Points at the S3-compatible bucket where
 * Dokploy stores PostgreSQL dumps (`.sql.gz`). Kept separate from the uploads
 * `storage` namespace: this store is read-only (list + download) for db:restore.
 */
export const backupConfig = registerAs('backup', () => ({
  // 's3' (default — the Dokploy backup bucket) | 'local' (a folder, for dev).
  driver: process.env.BACKUP_DRIVER ?? 's3',
  // Gate the admin restore endpoint/UI (Phase 2). Off unless explicitly enabled.
  restoreUiEnabled: (process.env.BACKUP_RESTORE_UI_ENABLED ?? 'false') === 'true',
  local: {
    dir: process.env.BACKUP_LOCAL_DIR ?? './storage/backups',
  },
  s3: {
    endpoint: process.env.BACKUP_S3_ENDPOINT,
    region: process.env.BACKUP_S3_REGION ?? 'us-east-1',
    bucket: process.env.BACKUP_S3_BUCKET,
    accessKeyId: process.env.BACKUP_S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.BACKUP_S3_SECRET_ACCESS_KEY,
    forcePathStyle: (process.env.BACKUP_S3_FORCE_PATH_STYLE ?? 'true') !== 'false',
    // Optional folder within the bucket, e.g. "postgres/".
    prefix: process.env.BACKUP_S3_PREFIX ?? '',
  },
}));

export type BackupConfig = ReturnType<typeof backupConfig>;
```

- [ ] **Step 2: Add env-validation fields**

In `apps/api/src/config/env.validation.ts`, add these members to the
`EnvironmentVariables` class (after the mail block, before `validateEnv`). The
`toBool` transform already exists in the file:

```ts
  // ── Database backups (for db:restore) ─────────────────────────────────────
  @IsIn(['s3', 'local'])
  @IsOptional()
  BACKUP_DRIVER: 's3' | 'local' = 's3';

  @Transform(toBool)
  @IsBoolean()
  @IsOptional()
  BACKUP_RESTORE_UI_ENABLED = false;

  @IsString()
  @IsOptional()
  BACKUP_LOCAL_DIR?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_ENDPOINT?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_REGION?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_BUCKET?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_ACCESS_KEY_ID?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_SECRET_ACCESS_KEY?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_FORCE_PATH_STYLE?: string;

  @IsString()
  @IsOptional()
  BACKUP_S3_PREFIX?: string;
```

(`IsIn`, `IsBoolean`, `IsString`, `IsOptional`, `Transform` are already imported in this file.)

- [ ] **Step 3: Register the namespace in AppModule**

In `apps/api/src/app.module.ts`, add the import near the other config imports:

```ts
import { backupConfig } from '@config/backup.config';
```

and add `backupConfig` to the `load` array:

```ts
      load: [appConfig, databaseConfig, redisConfig, storageConfig, mailConfig, backupConfig],
```

- [ ] **Step 4: Document the env vars in `.env.example`**

Append after the `RUSTFS_CONSOLE_PORT` / S3 uploads block:

```bash
# ── Database backups (for `bun run db:restore`) ─────────────────────────────────
# The bucket where Dokploy stores PostgreSQL dumps (.sql.gz). Read-only here:
# db:restore lists these and applies the one you pick into DATABASE_URL.
BACKUP_DRIVER=s3                        # s3 (default) | local (a local folder, for dev)
# BACKUP_S3_ENDPOINT=                   # e.g. https://s3.example.com (omit for real AWS)
# BACKUP_S3_REGION=us-east-1
# BACKUP_S3_BUCKET=
# BACKUP_S3_ACCESS_KEY_ID=
# BACKUP_S3_SECRET_ACCESS_KEY=
# BACKUP_S3_FORCE_PATH_STYLE=true       # required by MinIO/RustFS/most self-hosted
# BACKUP_S3_PREFIX=                     # optional folder within the bucket, e.g. "postgres/"
# BACKUP_LOCAL_DIR=./storage/backups    # used when BACKUP_DRIVER=local
# BACKUP_RESTORE_UI_ENABLED=false       # enable the admin restore endpoint/UI (Phase 2)
```

- [ ] **Step 5: Verify it type-checks and boots config**

Run: `cd apps/api && bun run typecheck`
Expected: PASS (no type errors).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/config/backup.config.ts apps/api/src/config/env.validation.ts apps/api/src/app.module.ts .env.example
git commit -m "feat(api): add backup config namespace and env vars

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Backup storage — types, pure filter/sort, and service (s3 + local)

**Files:**

- Create: `apps/api/src/infrastructure/backup/backup-storage.types.ts`
- Create: `apps/api/src/infrastructure/backup/backup-storage.util.ts`
- Test: `apps/api/src/infrastructure/backup/backup-storage.util.spec.ts`
- Create: `apps/api/src/infrastructure/backup/backup-storage.service.ts`
- Test: `apps/api/src/infrastructure/backup/backup-storage.service.spec.ts`

**Interfaces:**

- Consumes: `BackupConfig` shape from Task 1 (via constructor options, not `ConfigService`, so the CLI can build it directly).
- Produces:
  - `interface BackupObject { key: string; size: number; lastModified: Date }`
  - `interface BackupStorage { listBackups(): Promise<BackupObject[]>; downloadBackup(key: string): Promise<NodeJS.ReadableStream> }`
  - `const BACKUP_STORAGE: unique symbol` (DI token, used in Phase 2)
  - `function filterAndSortBackups(items: BackupObject[]): BackupObject[]` — keeps `.sql.gz`/`.sql`/`.gz`, sorts newest-first.
  - `class BackupStorageService implements BackupStorage` with `constructor(opts: { driver: 's3'|'local'; local: { dir: string }; s3: {...} })`.

- [ ] **Step 1: Create the types**

Create `apps/api/src/infrastructure/backup/backup-storage.types.ts`:

```ts
/** DI token for the active backup storage (used by the admin module in Phase 2). */
export const BACKUP_STORAGE = Symbol('BACKUP_STORAGE');

/** A single backup object listed from the backup store. */
export interface BackupObject {
  /** Object key / filename within the bucket or local dir. */
  key: string;
  /** Size in bytes. */
  size: number;
  /** When the backup was written. */
  lastModified: Date;
}

/**
 * Read-only backup store contract. Both the s3 and local drivers implement it,
 * so callers (CLI + admin API) never depend on the backing store.
 */
export interface BackupStorage {
  /** All backups, newest-first. */
  listBackups(): Promise<BackupObject[]>;
  /** A readable stream of the gzipped dump bytes for `key`. */
  downloadBackup(key: string): Promise<NodeJS.ReadableStream>;
}
```

- [ ] **Step 2: Write the failing test for `filterAndSortBackups`**

Create `apps/api/src/infrastructure/backup/backup-storage.util.spec.ts`:

```ts
import { filterAndSortBackups } from './backup-storage.util';
import type { BackupObject } from './backup-storage.types';

const obj = (key: string, ms: number): BackupObject => ({
  key,
  size: 1,
  lastModified: new Date(ms),
});

describe('filterAndSortBackups', () => {
  it('keeps only .sql.gz / .sql / .gz and sorts newest-first', () => {
    const input = [
      obj('a.sql.gz', 1000),
      obj('notes.txt', 5000),
      obj('b.sql.gz', 3000),
      obj('c.sql', 2000),
    ];
    const result = filterAndSortBackups(input);
    expect(result.map((o) => o.key)).toEqual(['b.sql.gz', 'c.sql', 'a.sql.gz']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterAndSortBackups([obj('readme.md', 1)])).toEqual([]);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `cd apps/api && bun run test backup-storage.util`
Expected: FAIL — cannot find module `./backup-storage.util`.

- [ ] **Step 4: Implement `filterAndSortBackups`**

Create `apps/api/src/infrastructure/backup/backup-storage.util.ts`:

```ts
import type { BackupObject } from './backup-storage.types';

const BACKUP_EXTENSIONS = ['.sql.gz', '.sql', '.gz'];

/** Keep only dump-like keys and sort them newest-first (by lastModified desc). */
export function filterAndSortBackups(items: BackupObject[]): BackupObject[] {
  return items
    .filter((o) => BACKUP_EXTENSIONS.some((ext) => o.key.toLowerCase().endsWith(ext)))
    .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `cd apps/api && bun run test backup-storage.util`
Expected: PASS (2 tests).

- [ ] **Step 6: Write the failing test for the local driver**

Create `apps/api/src/infrastructure/backup/backup-storage.service.spec.ts`:

```ts
import { mkdtempSync, writeFileSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BackupStorageService } from './backup-storage.service';

function makeLocalStore() {
  const dir = mkdtempSync(join(tmpdir(), 'backup-test-'));
  writeFileSync(join(dir, 'old.sql.gz'), 'OLD');
  writeFileSync(join(dir, 'new.sql.gz'), 'NEW');
  writeFileSync(join(dir, 'ignore.txt'), 'x');
  // Force deterministic ordering: make new.sql.gz newer than old.sql.gz.
  utimesSync(join(dir, 'old.sql.gz'), new Date(1000), new Date(1000));
  utimesSync(join(dir, 'new.sql.gz'), new Date(9000), new Date(9000));
  return new BackupStorageService({
    driver: 'local',
    local: { dir },
    s3: { region: 'us-east-1', forcePathStyle: true, prefix: '' },
  });
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}

describe('BackupStorageService (local)', () => {
  it('lists only dump files, newest-first', async () => {
    const store = makeLocalStore();
    const list = await store.listBackups();
    expect(list.map((o) => o.key)).toEqual(['new.sql.gz', 'old.sql.gz']);
  });

  it('downloads a backup by key', async () => {
    const store = makeLocalStore();
    const stream = await store.downloadBackup('old.sql.gz');
    expect(await streamToString(stream)).toBe('OLD');
  });

  it('rejects a key that does not exist', async () => {
    const store = makeLocalStore();
    await expect(store.downloadBackup('missing.sql.gz')).rejects.toThrow();
  });
});
```

- [ ] **Step 7: Run to verify it fails**

Run: `cd apps/api && bun run test backup-storage.service`
Expected: FAIL — cannot find module `./backup-storage.service`.

- [ ] **Step 8: Implement `BackupStorageService`**

Create `apps/api/src/infrastructure/backup/backup-storage.service.ts`. The AWS
SDK is loaded lazily behind a `string` specifier so `local`-only deployments
never need it installed (mirrors `storage/drivers/s3.driver.ts`):

```ts
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { BackupObject, BackupStorage } from './backup-storage.types';
import { filterAndSortBackups } from './backup-storage.util';

export interface BackupStorageOptions {
  driver: 's3' | 'local';
  local: { dir: string };
  s3: {
    endpoint?: string;
    region: string;
    bucket?: string;
    accessKeyId?: string;
    secretAccessKey?: string;
    forcePathStyle: boolean;
    prefix: string;
  };
}

/** Structural view of the `@aws-sdk/client-s3` bits used here. */
interface S3ClientLike {
  send(command: unknown): Promise<unknown>;
}
interface S3Module {
  S3Client: new (config: unknown) => S3ClientLike;
  ListObjectsV2Command: new (input: unknown) => unknown;
  GetObjectCommand: new (input: unknown) => unknown;
}
// `string` (not a literal) keeps @aws-sdk/client-s3 an OPTIONAL runtime dep.
const S3_SDK: string = '@aws-sdk/client-s3';

export class BackupStorageService implements BackupStorage {
  private s3Client?: S3ClientLike;
  private s3Module?: S3Module;

  constructor(private readonly opts: BackupStorageOptions) {}

  async listBackups(): Promise<BackupObject[]> {
    const items = this.opts.driver === 's3' ? await this.listS3() : await this.listLocal();
    return filterAndSortBackups(items);
  }

  async downloadBackup(key: string): Promise<NodeJS.ReadableStream> {
    return this.opts.driver === 's3' ? this.downloadS3(key) : this.downloadLocal(key);
  }

  // ── local ────────────────────────────────────────────────────────────────
  private async listLocal(): Promise<BackupObject[]> {
    const dir = this.opts.local.dir;
    const names = await readdir(dir);
    return Promise.all(
      names.map(async (name) => {
        const s = await stat(join(dir, name));
        return { key: name, size: s.size, lastModified: s.mtime };
      }),
    );
  }

  private async downloadLocal(key: string): Promise<NodeJS.ReadableStream> {
    const path = join(this.opts.local.dir, key);
    await stat(path); // throws ENOENT if missing
    return createReadStream(path);
  }

  // ── s3 ───────────────────────────────────────────────────────────────────
  private async s3(): Promise<{ client: S3ClientLike; mod: S3Module }> {
    if (!this.s3Module) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.s3Module = require(S3_SDK) as S3Module;
    }
    if (!this.s3Client) {
      const { endpoint, region, forcePathStyle, accessKeyId, secretAccessKey } = this.opts.s3;
      this.s3Client = new this.s3Module.S3Client({
        endpoint,
        region,
        forcePathStyle,
        credentials: accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined,
      });
    }
    return { client: this.s3Client, mod: this.s3Module };
  }

  private requireBucket(): string {
    const bucket = this.opts.s3.bucket;
    if (!bucket) throw new Error('BACKUP_S3_BUCKET is not set');
    return bucket;
  }

  private async listS3(): Promise<BackupObject[]> {
    const { client, mod } = await this.s3();
    const prefix = this.opts.s3.prefix || undefined;
    const items: BackupObject[] = [];
    let token: string | undefined;
    do {
      const res = (await client.send(
        new mod.ListObjectsV2Command({
          Bucket: this.requireBucket(),
          Prefix: prefix,
          ContinuationToken: token,
        }),
      )) as {
        Contents?: Array<{ Key?: string; Size?: number; LastModified?: Date }>;
        IsTruncated?: boolean;
        NextContinuationToken?: string;
      };
      for (const o of res.Contents ?? []) {
        if (!o.Key) continue;
        items.push({ key: o.Key, size: o.Size ?? 0, lastModified: o.LastModified ?? new Date(0) });
      }
      token = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (token);
    return items;
  }

  private async downloadS3(key: string): Promise<NodeJS.ReadableStream> {
    const { client, mod } = await this.s3();
    const res = (await client.send(
      new mod.GetObjectCommand({ Bucket: this.requireBucket(), Key: key }),
    )) as { Body?: NodeJS.ReadableStream };
    if (!res.Body) throw new Error(`Backup not found: ${key}`);
    return res.Body;
  }
}
```

- [ ] **Step 9: Run to verify all backup-storage tests pass**

Run: `cd apps/api && bun run test backup-storage`
Expected: PASS (util: 2, service: 3).

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/infrastructure/backup/
git commit -m "feat(api): add BackupStorageService (s3 + local) for listing/downloading dumps

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: DatabaseRestoreService (schema reset + psql apply)

**Files:**

- Create: `apps/api/src/infrastructure/backup/database-restore.service.ts`
- Test: `apps/api/src/infrastructure/backup/database-restore.service.spec.ts`

**Interfaces:**

- Consumes: nothing from prior tasks (takes a gzipped stream + a `databaseUrl`).
- Produces:
  - `interface RestoreInput { gzippedDump: NodeJS.ReadableStream; databaseUrl: string; force: boolean; nodeEnv: string }`
  - `type SpawnFn = (cmd: string, args: string[]) => ChildProcessLike` (injectable for tests)
  - `class DatabaseRestoreService { constructor(spawnFn?: SpawnFn); restore(input: RestoreInput): Promise<void>; databaseName(url: string): string }`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/infrastructure/backup/database-restore.service.spec.ts`:

```ts
import { PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
import { DatabaseRestoreService, type SpawnFn } from './database-restore.service';

/** Fake child process that succeeds (exit 0) on the next tick. */
function fakeSpawn(exitCode = 0): { fn: SpawnFn; calls: Array<{ cmd: string; args: string[] }> } {
  const calls: Array<{ cmd: string; args: string[] }> = [];
  const fn: SpawnFn = (cmd, args) => {
    calls.push({ cmd, args });
    const child = new EventEmitter() as EventEmitter & {
      stdin: PassThrough;
      stderr: EventEmitter;
    };
    child.stdin = new PassThrough();
    child.stderr = new EventEmitter();
    queueMicrotask(() => child.emit('close', exitCode));
    return child as never;
  };
  return { fn, calls };
}

const gz = () => {
  const s = new PassThrough();
  s.end(Buffer.from(''));
  return s;
};

describe('DatabaseRestoreService', () => {
  it('blocks restore in production without force', async () => {
    const svc = new DatabaseRestoreService(fakeSpawn().fn);
    await expect(
      svc.restore({
        gzippedDump: gz(),
        databaseUrl: 'postgresql://u:p@h:5432/app',
        force: false,
        nodeEnv: 'production',
      }),
    ).rejects.toThrow(/production/i);
  });

  it('resets the schema then applies the dump via psql', async () => {
    const { fn, calls } = fakeSpawn(0);
    const svc = new DatabaseRestoreService(fn);
    await svc.restore({
      gzippedDump: gz(),
      databaseUrl: 'postgresql://u:p@h:5432/app',
      force: false,
      nodeEnv: 'development',
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].cmd).toBe('psql');
    expect(calls[0].args.join(' ')).toContain('DROP SCHEMA public CASCADE');
    expect(calls[1].cmd).toBe('psql');
  });

  it('extracts the database name from the url', () => {
    const svc = new DatabaseRestoreService(fakeSpawn().fn);
    expect(svc.databaseName('postgresql://u:p@h:5432/app?schema=public')).toBe('app');
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/api && bun run test database-restore`
Expected: FAIL — cannot find module `./database-restore.service`.

- [ ] **Step 3: Implement the service**

Create `apps/api/src/infrastructure/backup/database-restore.service.ts`:

```ts
import { spawn as nodeSpawn } from 'node:child_process';
import { createGunzip } from 'node:zlib';

export interface RestoreInput {
  gzippedDump: NodeJS.ReadableStream;
  databaseUrl: string;
  /** Required when nodeEnv === 'production' (destructive guard). */
  force: boolean;
  nodeEnv: string;
}

/** Minimal child-process shape used here (spawnable, injectable for tests). */
export interface ChildProcessLike {
  stdin: NodeJS.WritableStream;
  stderr: { on(event: 'data', cb: (chunk: unknown) => void): void };
  on(event: 'close', cb: (code: number | null) => void): void;
  on(event: 'error', cb: (err: Error) => void): void;
}
export type SpawnFn = (cmd: string, args: string[]) => ChildProcessLike;

const RESET_SQL = 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;';

/**
 * Restores a gzipped SQL dump into DATABASE_URL by resetting the `public` schema
 * and piping the decompressed dump through `psql`. `psql` must be on PATH.
 */
export class DatabaseRestoreService {
  constructor(private readonly spawnFn: SpawnFn = nodeSpawn as unknown as SpawnFn) {}

  /** Parse the database name out of a postgres connection URL. */
  databaseName(url: string): string {
    return new URL(url).pathname.replace(/^\//, '') || 'postgres';
  }

  async restore(input: RestoreInput): Promise<void> {
    if (input.nodeEnv === 'production' && !input.force) {
      throw new Error('Refusing to restore in production without force. Re-run with --force.');
    }
    // 1. Reset the schema.
    await this.runPsql(input.databaseUrl, ['-v', 'ON_ERROR_STOP=1', '-c', RESET_SQL]);
    // 2. Apply the dump (gunzip in Node → psql stdin).
    await this.runPsql(input.databaseUrl, ['-v', 'ON_ERROR_STOP=1'], input.gzippedDump);
  }

  private runPsql(
    databaseUrl: string,
    args: string[],
    gzippedInput?: NodeJS.ReadableStream,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const child = this.spawnFn('psql', [databaseUrl, ...args]);
      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += String(chunk);
      });
      child.on('error', (err: Error & { code?: string }) => {
        if (err.code === 'ENOENT') {
          reject(new Error('`psql` not found on PATH. Install the PostgreSQL client.'));
        } else {
          reject(err);
        }
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`psql exited with code ${code}: ${stderr.trim()}`));
      });
      if (gzippedInput) {
        gzippedInput.pipe(createGunzip()).pipe(child.stdin);
      } else {
        child.stdin.end();
      }
    });
  }
}
```

- [ ] **Step 4: Run to verify tests pass**

Run: `cd apps/api && bun run test database-restore`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/infrastructure/backup/database-restore.service.ts apps/api/src/infrastructure/backup/database-restore.service.spec.ts
git commit -m "feat(api): add DatabaseRestoreService (schema reset + psql apply, prod guard)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: CLI selection helper + `db:restore` script

**Files:**

- Create: `apps/api/src/infrastructure/backup/select-backup.util.ts`
- Test: `apps/api/src/infrastructure/backup/select-backup.util.spec.ts`
- Create: `apps/api/scripts/db-restore.ts`
- Modify: `apps/api/package.json` (scripts)

**Interfaces:**

- Consumes: `BackupObject` (Task 2), `BackupStorageService` (Task 2), `DatabaseRestoreService` (Task 3), `backupConfig` (Task 1).
- Produces: `function selectBackup(backups: BackupObject[], opts: { latest: boolean; key?: string; isTty: boolean }): { chosen?: BackupObject; needsPrompt: boolean; error?: string }`.

- [ ] **Step 1: Write the failing test for `selectBackup`**

Create `apps/api/src/infrastructure/backup/select-backup.util.spec.ts`:

```ts
import { selectBackup } from './select-backup.util';
import type { BackupObject } from './backup-storage.types';

const backups: BackupObject[] = [
  { key: 'new.sql.gz', size: 1, lastModified: new Date(9000) },
  { key: 'old.sql.gz', size: 1, lastModified: new Date(1000) },
];

describe('selectBackup', () => {
  it('picks the newest with --latest', () => {
    const r = selectBackup(backups, { latest: true, isTty: false });
    expect(r.chosen?.key).toBe('new.sql.gz');
  });

  it('picks an explicit key', () => {
    const r = selectBackup(backups, { latest: false, key: 'old.sql.gz', isTty: false });
    expect(r.chosen?.key).toBe('old.sql.gz');
  });

  it('errors on an unknown key', () => {
    const r = selectBackup(backups, { latest: false, key: 'nope.sql.gz', isTty: false });
    expect(r.error).toMatch(/not found/i);
  });

  it('requests a prompt when interactive with no selector', () => {
    const r = selectBackup(backups, { latest: false, isTty: true });
    expect(r.needsPrompt).toBe(true);
  });

  it('errors in non-TTY with no selector', () => {
    const r = selectBackup(backups, { latest: false, isTty: false });
    expect(r.error).toMatch(/--latest|key/i);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/api && bun run test select-backup`
Expected: FAIL — cannot find module `./select-backup.util`.

- [ ] **Step 3: Implement `selectBackup`**

Create `apps/api/src/infrastructure/backup/select-backup.util.ts`:

```ts
import type { BackupObject } from './backup-storage.types';

export interface SelectResult {
  chosen?: BackupObject;
  needsPrompt: boolean;
  error?: string;
}

/**
 * Decide which backup to restore from CLI inputs. Pure (no I/O): the caller runs
 * the interactive prompt when `needsPrompt` is true. `backups` is newest-first.
 */
export function selectBackup(
  backups: BackupObject[],
  opts: { latest: boolean; key?: string; isTty: boolean },
): SelectResult {
  if (backups.length === 0) {
    return { needsPrompt: false, error: 'No backups found in the backup store.' };
  }
  if (opts.latest) {
    return { chosen: backups[0], needsPrompt: false };
  }
  if (opts.key) {
    const chosen = backups.find((b) => b.key === opts.key);
    return chosen
      ? { chosen, needsPrompt: false }
      : { needsPrompt: false, error: `Backup not found: ${opts.key}` };
  }
  if (opts.isTty) {
    return { needsPrompt: true };
  }
  return {
    needsPrompt: false,
    error: 'No backup selected. Pass a <key> or --latest (non-interactive shell).',
  };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd apps/api && bun run test select-backup`
Expected: PASS (5 tests).

- [ ] **Step 5: Write the CLI entrypoint**

Create `apps/api/scripts/db-restore.ts`:

```ts
import { config } from 'dotenv';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { backupConfig } from '../src/config/backup.config';
import { BackupStorageService } from '../src/infrastructure/backup/backup-storage.service';
import { DatabaseRestoreService } from '../src/infrastructure/backup/database-restore.service';
import { selectBackup } from '../src/infrastructure/backup/select-backup.util';
import type { BackupObject } from '../src/infrastructure/backup/backup-storage.types';

// Single root .env (cwd = apps/api when run via bun). Real env vars win.
config({ path: ['../../.env', '.env'] });

function parseArgs(argv: string[]): { latest: boolean; force: boolean; key?: string } {
  const args = argv.slice(2);
  const key = args.find((a) => !a.startsWith('--'));
  return {
    latest: args.includes('--latest'),
    force: args.includes('--force'),
    key,
  };
}

function fmtSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

async function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function pickInteractively(backups: BackupObject[]): Promise<BackupObject | undefined> {
  console.log('\nAvailable backups (newest first):\n');
  backups.forEach((b, i) => {
    console.log(`  [${i + 1}] ${b.key}  (${fmtSize(b.size)}, ${b.lastModified.toISOString()})`);
  });
  const answer = await prompt('\nSelect a backup number (or blank to cancel): ');
  if (!answer) return undefined;
  const idx = Number(answer) - 1;
  return backups[idx];
}

async function main(): Promise<void> {
  const cfg = backupConfig();
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.');

  const { latest, force, key } = parseArgs(process.argv);
  const storage = new BackupStorageService(cfg);
  const restorer = new DatabaseRestoreService();

  const backups = await storage.listBackups();
  const selection = selectBackup(backups, { latest, key, isTty: Boolean(stdout.isTTY) });
  if (selection.error) {
    console.error(`✖ ${selection.error}`);
    process.exit(1);
  }

  let chosen = selection.chosen;
  if (selection.needsPrompt) {
    chosen = await pickInteractively(backups);
  }
  if (!chosen) {
    console.error('✖ No backup selected. Aborted.');
    process.exit(1);
  }

  const dbName = restorer.databaseName(databaseUrl);

  // Destructive-action confirmation.
  if (nodeEnv === 'production') {
    if (!force) {
      console.error('✖ Production restore requires --force.');
      process.exit(1);
    }
    const typed = await prompt(`Type the database name "${dbName}" to confirm restore: `);
    if (typed !== dbName) {
      console.error('✖ Database name did not match. Aborted.');
      process.exit(1);
    }
  } else {
    const yn = await prompt(
      `This will WIPE and restore "${dbName}" from "${chosen.key}". Continue? [y/N] `,
    );
    if (yn.toLowerCase() !== 'y') {
      console.error('Aborted.');
      process.exit(1);
    }
  }

  console.log(`\n→ Downloading ${chosen.key} (${fmtSize(chosen.size)})…`);
  const gzippedDump = await storage.downloadBackup(chosen.key);
  console.log('→ Restoring…');
  await restorer.restore({ gzippedDump, databaseUrl, force, nodeEnv });
  console.log(`✔ Restored "${dbName}" from "${chosen.key}".`);
}

main().catch((err) => {
  console.error(`✖ Restore failed: ${(err as Error).message}`);
  process.exit(1);
});
```

- [ ] **Step 6: Wire the `db:restore` script**

In `apps/api/package.json`, add to `"scripts"` right after `"db:seed"`:

```json
    "db:seed": "bun run prisma/seed.ts",
    "db:restore": "bun run scripts/db-restore.ts"
```

(add a comma after the `db:seed` line).

- [ ] **Step 7: Verify the script runs and reports missing config cleanly**

Run: `cd apps/api && BACKUP_DRIVER=local BACKUP_LOCAL_DIR=./__no_such_dir bun run db:restore --latest`
Expected: exits non-zero with a readable error (e.g. an ENOENT on the missing dir or "No backups found"), NOT an unhandled stack trace at the top level.

- [ ] **Step 8: Verify a real local restore path (smoke test)**

Run:

```bash
cd apps/api
mkdir -p ./storage/backups
# a tiny valid gzipped SQL dump
printf 'SELECT 1;\n' | gzip > ./storage/backups/smoke.sql.gz
BACKUP_DRIVER=local BACKUP_LOCAL_DIR=./storage/backups bun run db:restore --latest --force <<< "y"
```

Expected: PASS — prints `✔ Restored "<db>" from "smoke.sql.gz".` (requires `psql` reachable at `DATABASE_URL`; if the dev DB isn't running this step is optional — the psql error is still a clean message).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/infrastructure/backup/select-backup.util.ts apps/api/src/infrastructure/backup/select-backup.util.spec.ts apps/api/scripts/db-restore.ts apps/api/package.json
git commit -m "feat(api): add db:restore CLI (list, select, confirm, restore)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## PHASE 2 — Admin API + Web UI

### Task 5: BackupModule + admin BackupController (feature-flagged)

**Files:**

- Create: `apps/api/src/infrastructure/backup/backup.module.ts`
- Create: `apps/api/src/modules/admin/dto/restore-backup.dto.ts`
- Create: `apps/api/src/modules/admin/backup.controller.ts`
- Create: `apps/api/src/modules/admin/admin.module.ts`
- Modify: `apps/api/src/app.module.ts` (import `AdminModule`)

**Interfaces:**

- Consumes: `BackupStorageService`, `DatabaseRestoreService`, `BACKUP_STORAGE` token, `backupConfig`, `ConfigService`.
- Produces:
  - `GET /api/admin/backups` → `BackupObject[]` (super-admin only; 404 when `backup.restoreUiEnabled` is false).
  - `POST /api/admin/backups/restore` body `{ key: string; confirmDbName: string }` → `{ restored: string }`.

- [ ] **Step 1: Create the DI module**

Create `apps/api/src/infrastructure/backup/backup.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BACKUP_STORAGE } from './backup-storage.types';
import { BackupStorageService, type BackupStorageOptions } from './backup-storage.service';
import { DatabaseRestoreService } from './database-restore.service';

/**
 * Provides the backup store + restore service to the admin module. The store is
 * built from the `backup` config namespace at startup (same wiring style as
 * StorageModule).
 */
@Module({
  providers: [
    {
      provide: BACKUP_STORAGE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): BackupStorageService => {
        const opts = config.getOrThrow<BackupStorageOptions>('backup');
        return new BackupStorageService(opts);
      },
    },
    DatabaseRestoreService,
  ],
  exports: [BACKUP_STORAGE, DatabaseRestoreService],
})
export class BackupModule {}
```

- [ ] **Step 2: Create the request DTO**

Create `apps/api/src/modules/admin/dto/restore-backup.dto.ts`:

```ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class RestoreBackupDto {
  @ApiProperty({ description: 'The backup object key to restore.' })
  @IsString()
  @IsNotEmpty()
  key!: string;

  @ApiProperty({ description: 'The database name, re-typed to confirm the destructive restore.' })
  @IsString()
  @IsNotEmpty()
  confirmDbName!: string;
}
```

- [ ] **Step 3: Create the controller**

Create `apps/api/src/modules/admin/backup.controller.ts`:

```ts
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  BadRequestException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@starterkit/shared-types';
import { Roles } from '@common/decorators/roles.decorator';
import { BACKUP_STORAGE, type BackupStorage } from '@infrastructure/backup/backup-storage.types';
import { DatabaseRestoreService } from '@infrastructure/backup/database-restore.service';
import { RestoreBackupDto } from './dto/restore-backup.dto';

@ApiTags('admin/backups')
@ApiBearerAuth()
@Controller('admin/backups')
export class BackupController {
  constructor(
    @Inject(BACKUP_STORAGE) private readonly storage: BackupStorage,
    private readonly restorer: DatabaseRestoreService,
    private readonly config: ConfigService,
  ) {}

  /** 404 hides the whole feature unless BACKUP_RESTORE_UI_ENABLED=true. */
  private assertEnabled(): void {
    if (!this.config.get<boolean>('backup.restoreUiEnabled')) {
      throw new NotFoundException();
    }
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'List available database backups (newest-first)' })
  async list() {
    this.assertEnabled();
    return this.storage.listBackups();
  }

  @Post('restore')
  @Roles(UserRole.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore the database from a backup (destructive)' })
  async restore(@Body() dto: RestoreBackupDto) {
    this.assertEnabled();
    const databaseUrl = this.config.getOrThrow<string>('DATABASE_URL');
    const dbName = this.restorer.databaseName(databaseUrl);
    if (dto.confirmDbName !== dbName) {
      throw new BadRequestException('confirmDbName does not match the target database.');
    }
    const gzippedDump = await this.storage.downloadBackup(dto.key);
    await this.restorer.restore({
      gzippedDump,
      databaseUrl,
      force: true, // server-side restore is always explicit; guarded by confirmDbName above.
      nodeEnv: this.config.get<string>('app.env') ?? 'development',
    });
    return { restored: dto.key };
  }
}
```

Note: `ConfigService.get('DATABASE_URL')` returns the raw env var (validated at boot). `app.env` is the existing app-config key used elsewhere in this repo.

- [ ] **Step 4: Create the admin module**

Create `apps/api/src/modules/admin/admin.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { BackupModule } from '@infrastructure/backup/backup.module';
import { BackupController } from './backup.controller';

@Module({
  imports: [BackupModule],
  controllers: [BackupController],
})
export class AdminModule {}
```

- [ ] **Step 5: Register AdminModule in AppModule**

In `apps/api/src/app.module.ts`, add the import and add `AdminModule` to the
`imports` array (after `NotificationsModule`):

```ts
import { AdminModule } from '@modules/admin/admin.module';
```

```ts
    NotificationsModule,
    AdminModule,
```

- [ ] **Step 6: Verify it type-checks and the app builds**

Run: `cd apps/api && bun run typecheck && bun run build`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/infrastructure/backup/backup.module.ts apps/api/src/modules/admin/ apps/api/src/app.module.ts
git commit -m "feat(api): add admin backups endpoints (list + restore, feature-flagged, super-admin)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: E2E test for admin backups endpoint

**Files:**

- Create: `apps/api/test/backup.e2e-spec.ts`

**Interfaces:**

- Consumes: the test `app.helper.ts` bootstrap + auth helpers used by the existing e2e specs.

- [ ] **Step 1: Read the existing e2e helper to match its API**

Run: `sed -n '1,80p' apps/api/test/helpers/app.helper.ts && sed -n '1,60p' apps/api/test/users.e2e-spec.ts`
Expected: learn how the tests bootstrap the app and obtain a super-admin vs a regular-user token (mirror those exact helper calls in the next step).

- [ ] **Step 2: Write the e2e spec**

Create `apps/api/test/backup.e2e-spec.ts`. Adapt the bootstrap + login helpers
to whatever `app.helper.ts` exposes (seen in Step 1); the assertions below are
the contract to hit. Set `BACKUP_RESTORE_UI_ENABLED` before the app boots:

```ts
import request from 'supertest';
import type { INestApplication } from '@nestjs/common';
// Adjust these imports to the helper's actual exports (from Step 1):
import { createTestApp, loginAs } from './helpers/app.helper';

describe('Admin backups (e2e)', () => {
  let app: INestApplication;

  describe('when the feature flag is ON', () => {
    beforeAll(async () => {
      process.env.BACKUP_RESTORE_UI_ENABLED = 'true';
      process.env.BACKUP_DRIVER = 'local';
      process.env.BACKUP_LOCAL_DIR = './storage/backups-e2e';
      app = await createTestApp();
    });
    afterAll(async () => {
      await app.close();
      delete process.env.BACKUP_RESTORE_UI_ENABLED;
    });

    it('403 for a regular user', async () => {
      const token = await loginAs(app, 'user');
      await request(app.getHttpServer())
        .get('/api/admin/backups')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('200 for a super-admin', async () => {
      const token = await loginAs(app, 'superadmin');
      const res = await request(app.getHttpServer())
        .get('/api/admin/backups')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(Array.isArray(res.body?.data ?? res.body)).toBe(true);
    });
  });

  describe('when the feature flag is OFF', () => {
    beforeAll(async () => {
      delete process.env.BACKUP_RESTORE_UI_ENABLED;
      app = await createTestApp();
    });
    afterAll(async () => app.close());

    it('404 even for a super-admin', async () => {
      const token = await loginAs(app, 'superadmin');
      await request(app.getHttpServer())
        .get('/api/admin/backups')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });
});
```

If `app.helper.ts` exposes different names (e.g. a single `bootstrap()` returning
`{ app, tokens }`), use those instead — do not invent helpers. Ensure
`./storage/backups-e2e` exists or the local driver returns `[]` gracefully (the
`readdir` will throw ENOENT if absent → create the dir in `beforeAll` with
`mkdirSync(..., { recursive: true })` if needed to keep the 200 case green).

- [ ] **Step 3: Run the e2e spec**

Run: `cd apps/api && bun run test:e2e backup`
Expected: PASS (3 tests). If the 200 case fails on a missing dir, add the
`mkdirSync` guard noted above and re-run.

- [ ] **Step 4: Commit**

```bash
git add apps/api/test/backup.e2e-spec.ts
git commit -m "test(api): e2e for admin backups endpoint (role + feature-flag gating)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Web admin UI (feature + page + nav + i18n)

**Files:**

- Create: `apps/web/app/features/backup/types.ts`
- Create: `apps/web/app/features/backup/api/backup.api.ts`
- Create: `apps/web/app/features/backup/components/BackupTable.vue`
- Create: `apps/web/app/features/backup/index.ts`
- Create: `apps/web/app/pages/admin/backups.vue`
- Modify: `apps/web/app/components/shell/AppSidebar.vue`
- Modify: `apps/web/i18n/locales/en.json`
- Modify: `apps/web/i18n/locales/id.json`

**Interfaces:**

- Consumes: `useApi()` (`~/composables/useApi`), `unwrap` (`~/lib/api-client`), the
  `GET /admin/backups` + `POST /admin/backups/restore` endpoints from Task 5.
- Produces: `useBackupApi()` with `list()` and `restore(key, confirmDbName)`.

- [ ] **Step 1: Create the FE type**

Create `apps/web/app/features/backup/types.ts`:

```ts
export interface BackupObject {
  key: string;
  size: number;
  lastModified: string; // ISO string over the wire
}
```

- [ ] **Step 2: Create the API fetchers**

Create `apps/web/app/features/backup/api/backup.api.ts`:

```ts
import type { ApiResponse } from '@starterkit/shared-types';
import { unwrap } from '~/lib/api-client';
import { useApi } from '~/composables/useApi';
import type { BackupObject } from '../types';

/** Admin backups fetchers — all go through the shared apiClient. */
export function useBackupApi() {
  const api = useApi();

  return {
    list(): Promise<BackupObject[]> {
      return api<ApiResponse<BackupObject[]>>('/admin/backups').then(unwrap);
    },
    restore(key: string, confirmDbName: string): Promise<{ restored: string }> {
      return api<ApiResponse<{ restored: string }>>('/admin/backups/restore', {
        method: 'POST',
        body: { key, confirmDbName },
      }).then(unwrap);
    },
  };
}
```

Note: confirm `unwrap`'s shape against `user.api.ts`. If `GET /admin/backups`
returns a bare array rather than `{ data }`, adjust `list()` to not call
`unwrap` (match whatever the response interceptor produces — check one existing
list call in `user.api.ts`).

- [ ] **Step 3: Create the table + restore dialog component**

Create `apps/web/app/features/backup/components/BackupTable.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useBackupApi } from '../api/backup.api';
import type { BackupObject } from '../types';

const api = useBackupApi();
const { t } = useI18n();

const backups = ref<BackupObject[]>([]);
const loading = ref(true);
const error = ref('');

const dialogOpen = ref(false);
const target = ref<BackupObject | null>(null);
const confirmName = ref('');
const restoring = ref(false);

function fmtSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

async function load() {
  loading.value = true;
  error.value = '';
  try {
    backups.value = await api.list();
  } catch {
    error.value = t('backups.loadError');
  } finally {
    loading.value = false;
  }
}

function openRestore(b: BackupObject) {
  target.value = b;
  confirmName.value = '';
  dialogOpen.value = true;
}

async function confirmRestore() {
  if (!target.value) return;
  restoring.value = true;
  try {
    await api.restore(target.value.key, confirmName.value);
    dialogOpen.value = false;
  } catch {
    error.value = t('backups.restoreError');
  } finally {
    restoring.value = false;
  }
}

onMounted(load);
</script>

<template>
  <div>
    <p v-if="error" class="mb-4 text-sm text-destructive">{{ error }}</p>
    <p v-if="loading" class="text-sm text-muted-foreground">{{ $t('common.loading') }}</p>

    <table v-else-if="backups.length" class="w-full text-sm">
      <thead>
        <tr class="text-left text-muted-foreground">
          <th class="py-2">{{ $t('backups.name') }}</th>
          <th class="py-2">{{ $t('backups.size') }}</th>
          <th class="py-2">{{ $t('backups.date') }}</th>
          <th class="py-2"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="b in backups" :key="b.key" class="border-t border-border">
          <td class="py-2 font-mono">{{ b.key }}</td>
          <td class="py-2">{{ fmtSize(b.size) }}</td>
          <td class="py-2">{{ new Date(b.lastModified).toLocaleString() }}</td>
          <td class="py-2 text-right">
            <button
              class="rounded-lg border border-destructive px-3 py-1 text-destructive hover:bg-destructive/10"
              @click="openRestore(b)"
            >
              {{ $t('backups.restore') }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <p v-else class="text-sm text-muted-foreground">{{ $t('backups.empty') }}</p>

    <!-- Confirmation dialog: operator must type the DB name. -->
    <div
      v-if="dialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="dialogOpen = false"
    >
      <div class="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg">
        <h3 class="text-base font-semibold text-foreground">{{ $t('backups.confirmTitle') }}</h3>
        <p class="mt-2 text-sm text-muted-foreground">
          {{ $t('backups.confirmBody', { key: target?.key }) }}
        </p>
        <input
          v-model="confirmName"
          class="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          :placeholder="$t('backups.confirmPlaceholder')"
        />
        <div class="mt-5 flex justify-end gap-3">
          <button class="rounded-lg px-4 py-2 text-sm" @click="dialogOpen = false">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="rounded-lg bg-destructive px-4 py-2 text-sm text-white disabled:opacity-50"
            :disabled="restoring || !confirmName"
            @click="confirmRestore"
          >
            {{ restoring ? $t('backups.restoring') : $t('backups.restore') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
```

Note: match this component's styling primitives (button/table classes, any
existing `AppDialog`/`Modal` component) to the repo's conventions — check
`features/user/components/UserFormModal.vue` and reuse an existing dialog
component if one exists rather than the hand-rolled overlay above.

- [ ] **Step 4: Create the feature barrel**

Create `apps/web/app/features/backup/index.ts`:

```ts
export { default as BackupTable } from './components/BackupTable.vue';
export { useBackupApi } from './api/backup.api';
export type { BackupObject } from './types';
```

- [ ] **Step 5: Create the page**

Create `apps/web/app/pages/admin/backups.vue` (mirrors `pages/users/index.vue`):

```vue
<script setup lang="ts">
// Explicit barrel import — features/ is NOT auto-imported (SPEC boundary rule).
import { BackupTable } from '~/features/backup';
import { APP_NAME } from '~/lib/constants';

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'admin'] });
useHead({ title: `Backups — ${APP_NAME}` });
</script>

<template>
  <div class="space-y-6">
    <PageBreadcrumb
      :title="$t('backups.title')"
      :crumbs="[{ label: $t('nav.dashboard'), to: '/dashboard' }, { label: $t('backups.title') }]"
    />

    <div class="rounded-2xl border border-border bg-card p-5 shadow-theme-xs sm:p-6">
      <div class="mb-5">
        <h2 class="text-base font-semibold text-foreground">{{ $t('backups.heading') }}</h2>
        <p class="text-sm text-muted-foreground">{{ $t('backups.subtitle') }}</p>
      </div>
      <BackupTable />
    </div>
  </div>
</template>
```

- [ ] **Step 6: Add the sidebar nav link**

Read `apps/web/app/components/shell/AppSidebar.vue` and add a nav entry pointing
at `/admin/backups`, gated the same way the "Users" admin link is gated
(role-based `v-if`, mirroring the existing admin-only item). Use `$t('backups.title')`
as the label. Add the item immediately after the existing Users link, following
that file's exact item shape (icon + `to` + label).

- [ ] **Step 7: Add i18n copy (en)**

In `apps/web/i18n/locales/en.json`, add a `backups` block (and `common.cancel`/
`common.loading` if not already present):

```json
  "backups": {
    "title": "Backups",
    "heading": "Database backups",
    "subtitle": "Restore the database from a backup produced by Dokploy.",
    "name": "Name",
    "size": "Size",
    "date": "Date",
    "restore": "Restore",
    "restoring": "Restoring…",
    "empty": "No backups found.",
    "loadError": "Failed to load backups.",
    "restoreError": "Restore failed.",
    "confirmTitle": "Confirm database restore",
    "confirmBody": "This will WIPE the current database and restore it from \"{key}\". This cannot be undone.",
    "confirmPlaceholder": "Type the database name to confirm",
    "nav": "Backups"
  }
```

- [ ] **Step 8: Add i18n copy (id)**

In `apps/web/i18n/locales/id.json`, add the matching `backups` block:

```json
  "backups": {
    "title": "Backup",
    "heading": "Backup basis data",
    "subtitle": "Pulihkan basis data dari backup yang dibuat Dokploy.",
    "name": "Nama",
    "size": "Ukuran",
    "date": "Tanggal",
    "restore": "Pulihkan",
    "restoring": "Memulihkan…",
    "empty": "Tidak ada backup.",
    "loadError": "Gagal memuat daftar backup.",
    "restoreError": "Pemulihan gagal.",
    "confirmTitle": "Konfirmasi pemulihan basis data",
    "confirmBody": "Ini akan MENGHAPUS basis data saat ini dan memulihkannya dari \"{key}\". Tindakan ini tidak bisa dibatalkan.",
    "confirmPlaceholder": "Ketik nama basis data untuk konfirmasi",
    "nav": "Backup"
  }
```

- [ ] **Step 9: Verify the web app type-checks / builds**

Run: `cd apps/web && bun run typecheck`
Expected: PASS. (If the project has a lint step, run `bun run lint` too.)

- [ ] **Step 10: Manual smoke test**

Run the dev stack with `BACKUP_RESTORE_UI_ENABLED=true` and a `local` backup dir
holding a `.sql.gz`. Log in as the super-admin (`superadmin@starterkit.test`),
open `/admin/backups`, confirm the table renders and the restore dialog requires
the DB name. Expected: list renders; restore only fires when the typed name
matches.

- [ ] **Step 11: Commit**

```bash
git add apps/web/app/features/backup/ apps/web/app/pages/admin/backups.vue apps/web/app/components/shell/AppSidebar.vue apps/web/i18n/locales/en.json apps/web/i18n/locales/id.json
git commit -m "feat(web): admin backups page — list + guarded restore, i18n (en/id)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Final verification

- [ ] Run the full API test suite: `cd apps/api && bun run test`
- [ ] Run API typecheck + build: `cd apps/api && bun run typecheck && bun run build`
- [ ] Run web typecheck: `cd apps/web && bun run typecheck`
- [ ] Confirm `db:restore` help/selection paths behave (Task 4, Steps 7–8).
- [ ] Confirm the admin endpoint is hidden (404) with the flag off and reachable (200/403) with it on (Task 6).

```

```
