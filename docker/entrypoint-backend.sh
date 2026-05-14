#!/bin/sh
set -e
export PATH="/repo/node_modules/.bin:$PATH"
echo "Aguardando Postgres em ${POSTGRES_HOST:-postgres}..."
until PGPASSWORD="${POSTGRES_PASSWORD:-hotspot}" psql -h "${POSTGRES_HOST:-postgres}" -U "${POSTGRES_USER:-hotspot}" -d "${POSTGRES_DB:-hotspot}" -c '\q' 2>/dev/null; do
  sleep 1
done
cd /repo/apps/backend
echo "Sincronizando schema Drizzle..."
npx drizzle-kit push --force
echo "Iniciando PM2..."
exec pm2-runtime start ecosystem.config.cjs
