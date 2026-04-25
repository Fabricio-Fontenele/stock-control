#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${1:-.env.staging}"
COMPOSE_FILE="${2:-docker-compose.staging.yml}"
BACKUP_DIR="${3:-backups}"

mkdir -p "$BACKUP_DIR"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_path="$BACKUP_DIR/stock-control-${timestamp}.dump"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom --no-owner --no-acl' > "$backup_path"

printf 'Backup created: %s\n' "$backup_path"
