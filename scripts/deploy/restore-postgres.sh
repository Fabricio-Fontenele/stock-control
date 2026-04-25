#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  printf 'Usage: %s <backup-file> [env-file] [compose-file]\n' "$0" >&2
  exit 2
fi

BACKUP_FILE="$1"
ENV_FILE="${2:-.env.staging}"
COMPOSE_FILE="${3:-docker-compose.staging.yml}"

if [ ! -f "$BACKUP_FILE" ]; then
  printf 'Backup file not found: %s\n' "$BACKUP_FILE" >&2
  exit 2
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" stop api web

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'dropdb -U "$POSTGRES_USER" --if-exists "$POSTGRES_DB"'

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'createdb -U "$POSTGRES_USER" "$POSTGRES_DB"'

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner --no-acl' < "$BACKUP_FILE"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d api web

printf 'Database restored from: %s\n' "$BACKUP_FILE"
