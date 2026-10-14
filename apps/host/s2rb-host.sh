#!/bin/sh
# Start, stop, or reload the S2RB host compose stack and wait for /api/v1/health.
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
cd "$HERE"

compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "docker compose is required" >&2
    exit 1
  fi
}

wait_health() {
  i=0
  while [ "$i" -lt 30 ]; do
    if curl -fsS "http://127.0.0.1:3100/api/v1/health" >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 3
  done
  echo "S2RB health check failed on :3100" >&2
  return 1
}

case "${1:-start}" in
  start)
    compose up -d --remove-orphans
    wait_health
    ;;
  stop)
    compose down
    ;;
  reload)
    compose up -d --remove-orphans
    wait_health
    ;;
  status)
    compose ps
    curl -fsS "http://127.0.0.1:3100/api/v1/health" || true
    echo
    ;;
  *)
    echo "usage: $0 start|stop|reload|status" >&2
    exit 2
    ;;
esac
