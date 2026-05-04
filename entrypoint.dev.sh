#!/bin/sh
set -e

echo "Esperando a que PostgreSQL este disponible en $DATABASE_HOST:$DATABASE_PORT..."
while ! nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
  sleep 1
done
echo "PostgreSQL listo."

echo "Ejecutando migraciones pendientes..."
npm run migration:run

echo "Iniciando aplicacion en modo desarrollo..."
exec npm run dev
