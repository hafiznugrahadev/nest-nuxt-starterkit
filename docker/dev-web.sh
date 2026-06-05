#!/bin/sh
# Dev entrypoint for the web container (source is bind-mounted at /app).
# --ignore-scripts skips `nuxt prepare` (it needs shared-types built first);
# `nuxt dev` runs prepare itself once shared-types exists.
set -e

echo "› Installing dependencies…"
bun install --frozen-lockfile --ignore-scripts

echo "› Building @starterkit/shared-types…"
bun run --filter @starterkit/shared-types build

echo "› Starting web (HMR)…"
exec bun run --filter @starterkit/web dev
