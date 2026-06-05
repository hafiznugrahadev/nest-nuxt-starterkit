# syntax=docker/dockerfile:1
# Multi-stage build for @minisoccer/web (Nuxt 4 / Nitro node-server on Bun).
# Build context MUST be the repo root: `docker build -f apps/web/Dockerfile .`

# ─────────────────────────────── deps ────────────────────────────────────────
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
COPY apps/web ./apps/web
# Build the API base URL into the bundle at build time if provided.
ARG NUXT_PUBLIC_API_BASE
ENV NUXT_PUBLIC_API_BASE=${NUXT_PUBLIC_API_BASE}
RUN bun run --filter @minisoccer/shared-types build \
 && cd apps/web && bun run build

# ─────────────────────────────── runtime ─────────────────────────────────────
# Nitro's node-server output is self-contained — only .output is needed.
FROM oven/bun:1.3.3-slim AS runtime
ENV NODE_ENV=production
ENV PORT=4300
ENV HOST=0.0.0.0
WORKDIR /app
COPY --from=build /app/apps/web/.output ./.output
EXPOSE 4300
CMD ["bun", ".output/server/index.mjs"]
