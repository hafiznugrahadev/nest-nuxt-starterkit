#!/bin/sh
# Dev entrypoint for the API container (source is bind-mounted at /app).
# --ignore-scripts is required: it skips workspace postinstalls (e.g. web's
# `nuxt prepare`) that would otherwise run before shared-types is built and hang
# the install. bcrypt ships prebuilt binaries, so it needs no install script.
set -e

echo "› Installing dependencies…"
bun install --frozen-lockfile --ignore-scripts

echo "› Building @starterkit/shared-types…"
bun run --filter @starterkit/shared-types build

echo "› Generating Prisma client…"
bun run --filter @starterkit/api prisma:generate

echo "› Applying database migrations…"
bun run --filter @starterkit/api prisma:deploy

echo "› Seeding database (idempotent)…"
bun run --filter @starterkit/api db:seed

echo "› Starting API (watch mode)…"
exec bun run --filter @starterkit/api dev
