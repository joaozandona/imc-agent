#!/bin/sh
set -e

DB_FILE="${DB_PATH:-/data/imc.sqlite}"
mkdir -p "$(dirname "$DB_FILE")"

export NODE_PATH="${NODE_PATH:-/app/node_modules}"
cd /app/apps/api

echo "Running database migrations..."
node dist/scripts/run-migrations.js

if [ "${SEED_ADMIN:-false}" = "true" ]; then
  echo "Seeding admin user..."
  node dist/scripts/seed-admin.js
fi

if [ "${SEED_DEMO:-false}" = "true" ]; then
  echo "Seeding demo professor, student and assessments..."
  node dist/scripts/seed-demo-evolution.js
fi

echo "Starting API..."
exec node dist/server.js
