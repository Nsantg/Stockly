#!/bin/sh
set -e

echo "Esperando a que PostgreSQL este disponible en $DATABASE_HOST:$DATABASE_PORT..."
while ! nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
  sleep 1
done
echo "PostgreSQL listo."

echo "Ejecutando migraciones pendientes..."
npm run migration:run

if [ "$FORCE_RESEED" = "true" ]; then
  echo "FORCE_RESEED=true detectado: vaciando la base de datos antes de volver a poblarla..."
  CONFIRM_RESET=YES npm run db:reset
fi

echo "Ejecutando seed inicial (se omite si la BD ya tiene datos)..."
npm run seed

echo "Iniciando aplicacion en modo produccion..."
export NODE_ENV=production
exec npm run start
