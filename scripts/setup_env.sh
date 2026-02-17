#!/usr/bin/env bash
set -euo pipefail

# Generate .env.local from env.sample
ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
ENV_SAMPLE="$ROOT_DIR/env.sample"
ENV_LOCAL="$ROOT_DIR/.env.local"

if [ -f "$ENV_SAMPLE" ]; then
  cp "$ENV_SAMPLE" "$ENV_LOCAL"
  echo "Generated .env.local from env.sample. Please edit $ENV_LOCAL to set real secrets."
else
  echo "env.sample not found at $ENV_SAMPLE" >&2
  exit 1
fi
