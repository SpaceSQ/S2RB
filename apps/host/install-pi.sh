#!/bin/sh
# Raspberry Pi / Debian host install. Run on the board, not from a Mac flasher.
#   sudo ./install-pi.sh [/opt/s2rb]
# Stage (no root, no systemd) for tests:
#   S2RB_INSTALL_MODE=stage ./install-pi.sh /tmp/s2rb-stage
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO=$(CDPATH= cd -- "$HERE/../.." && pwd)
ROOT="${1:-/opt/s2rb}"
MODE="${S2RB_INSTALL_MODE:-live}"

if [ "$MODE" = "live" ] && [ "$(id -u)" -ne 0 ]; then
  echo "run as root: sudo $0 $ROOT" >&2
  exit 1
fi

if [ "$MODE" = "live" ] && ! command -v docker >/dev/null 2>&1; then
  echo "install Docker, then rerun $0" >&2
  exit 1
fi

echo "Installing S2RB host into $ROOT"
mkdir -p "$ROOT" "$ROOT/apps/host/data/mosquitto"

if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete \
    --exclude node_modules --exclude .next --exclude target --exclude .git \
    --exclude "apps/desktop/src-tauri/target" \
    "$REPO/" "$ROOT/"
else
  tar -C "$REPO" \
    --exclude node_modules --exclude .next --exclude target --exclude .git \
    -cf - . | tar -C "$ROOT" -xf -
fi

if [ ! -f "$ROOT/apps/host/.env" ]; then
  cp "$ROOT/apps/host/.env.example" "$ROOT/apps/host/.env"
fi

chmod +x "$ROOT/apps/host/s2rb-host.sh" "$ROOT/apps/host/install-pi.sh" "$ROOT/apps/host/install-opi.sh" "$ROOT/apps/host/mqtt-entrypoint.sh"
sed "s#/opt/s2rb#$ROOT#g" "$HERE/s2rb-host.service" > "$ROOT/apps/host/s2rb-host.installed.service"

if [ "$MODE" = "stage" ]; then
  echo "staged $ROOT (systemd skipped)"
  exit 0
fi

cp "$ROOT/apps/host/s2rb-host.installed.service" /etc/systemd/system/s2rb-host.service
systemctl daemon-reload
systemctl enable --now s2rb-host
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "S2RB host is up. Resolver: http://${IP:-127.0.0.1}:3100"
