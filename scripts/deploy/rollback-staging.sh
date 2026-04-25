#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ]; then
  printf 'Usage: %s <previous-image-tag> [backup-file]\n' "$0" >&2
  exit 2
fi

PREVIOUS_IMAGE_TAG="$1"
BACKUP_FILE="${2:-}"
ENV_FILE="${ENV_FILE:-.env.staging}"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.staging.yml}"

if [ -n "$BACKUP_FILE" ]; then
  ./scripts/deploy/restore-postgres.sh "$BACKUP_FILE" "$ENV_FILE" "$COMPOSE_FILE"
fi

export IMAGE_TAG="$PREVIOUS_IMAGE_TAG"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" pull api web
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d api web
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

printf 'Application rolled back to image tag: %s\n' "$PREVIOUS_IMAGE_TAG"
