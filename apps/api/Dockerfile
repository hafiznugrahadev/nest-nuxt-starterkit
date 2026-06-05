# syntax=docker/dockerfile:1
# Multi-stage build for @minisoccer/api (NestJS + Prisma on Bun).
# Build context MUST be the repo root: `docker build -f apps/api/Dockerfile .`

# ─────────────────────────────── deps ────────────────────────────────────────
# Install the whole workspace from the lockfile. --ignore-scripts skips app
# postinstall hooks (e.g. nuxt prepare) that need source we haven't copied yet.
FROM oven/bun:1.3.3 AS deps
WORKDIR /app
COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
RUN bun install --frozen-lockfile --ignore-scripts

# ─────────────────────────────── build ───────────────────────────────────────
FROM deps AS build
WORKDIR /app
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api
# shared-types first (api imports it), then generate Prisma client + compile.
RUN bun run --filter @minisoccer/shared-types build \
 && cd apps/api && bun run prisma:generate && bun run build

# ─────────────────────────────── runtime ─────────────────────────────────────
FROM oven/bun:1.3.3-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app/apps/api
# Prisma engines need openssl + ca-certificates at runtime.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
# node_modules carries the generated Prisma client + the prisma CLI (for migrate).
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/shared-types/dist /app/packages/shared-types/dist
COPY --from=build /app/packages/shared-types/package.json /app/packages/shared-types/package.json
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/package.json ./package.json
COPY --from=build /app/apps/api/prisma ./prisma
EXPOSE 4400
# Apply pending migrations, then boot. Move `migrate deploy` to a Dokploy release
# command instead if you run multiple replicas.
CMD ["sh", "-c", "bunx prisma migrate deploy && bun dist/main.js"]
