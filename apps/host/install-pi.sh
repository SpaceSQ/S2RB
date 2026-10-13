#!/bin/sh
# Raspberry Pi / Debian host install. Run on the board, not from a Mac flasher.
set -eu
ROOT="${1:-/opt/s2rb}"
echo "Installing S2RB host into $ROOT"
mkdir -p "$ROOT"
cp -R "$(dirname "$0")/../.."/* "$ROOT/" 2>/dev/null || true
cd "$ROOT/apps/host"
if command -v docker >/dev/null 2>&1; then
  docker compose up -d
  echo "S2RB host is up. Resolver: http://$(hostname -I | awk '{print $1}'):3100"
else
  echo "Install Docker, then: cd $ROOT/apps/host && docker compose up -d"
fi
