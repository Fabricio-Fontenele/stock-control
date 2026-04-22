#!/usr/bin/env bash

set -euo pipefail

if [[ -z "${STAGING_BASE_URL:-}" ]]; then
  echo "STAGING_BASE_URL is required"
  exit 1
fi

if [[ -z "${STAGING_ADMIN_EMAIL:-}" ]]; then
  echo "STAGING_ADMIN_EMAIL is required"
  exit 1
fi

if [[ -z "${STAGING_ADMIN_PASSWORD:-}" ]]; then
  echo "STAGING_ADMIN_PASSWORD is required"
  exit 1
fi

BASE_URL="${STAGING_BASE_URL%/}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

echo "[smoke] Waiting for web to respond: ${BASE_URL}"
for _ in {1..30}; do
  if curl --silent --show-error --fail "${BASE_URL}/login" > /dev/null; then
    break
  fi
  sleep 2
done

echo "[smoke] Authenticating via web login"
curl --silent --show-error --fail --location \
  --cookie-jar "$COOKIE_JAR" \
  --cookie "$COOKIE_JAR" \
  --data-urlencode "email=${STAGING_ADMIN_EMAIL}" \
  --data-urlencode "password=${STAGING_ADMIN_PASSWORD}" \
  -X POST "${BASE_URL}/api/auth/login" > /dev/null

if ! grep -q "sc_session" "$COOKIE_JAR"; then
  echo "[smoke] Login failed: session cookie not found"
  exit 1
fi

check_route() {
  local path="$1"
  echo "[smoke] Checking ${path}"
  curl --silent --show-error --fail \
    --cookie "$COOKIE_JAR" \
    "${BASE_URL}${path}" > /dev/null
}

check_route "/"
check_route "/estoque"
check_route "/estoque/saida"
check_route "/entradas"
check_route "/produtos"
check_route "/fornecedores"
check_route "/funcionarios"

echo "[smoke] Staging smoke checks passed"
