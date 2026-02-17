#!/usr/bin/env bash
set -euo pipefail

# Local UI tests runner (no Docker)

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR/frontend"

# Optional: copy env.sample to .env.local if not exists
if [ -f ../env.sample ] && [ ! -f .env.local ]; then
  cp ../env.sample .env.local
  echo "Generated ./env.local from env.sample. Please edit it if needed."
fi

echo "Installing dependencies..."
pnpm install

echo "Installing Playwright browsers..."
pnpm exec playwright install

echo "Starting test: UI tests (register, login)"
pnpm run test:e2e
