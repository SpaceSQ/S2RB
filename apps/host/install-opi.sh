#!/bin/sh
# Orange Pi / Armbian host install. Run on the board (aarch64), not from a Mac flasher.
# Boards this script targets (same Debian-family stack; no extra hardware claims):
#   Orange Pi 5, Orange Pi 5 Plus, Orange Pi 3B, Orange Pi Zero2
# OS: Armbian or Orange Pi OS. Same gateway as Raspberry Pi — not S2 AIOS.
#   sudo ./install-opi.sh [/opt/s2rb]
# Stage (no root, no apt, no systemd) for tests:
#   S2RB_INSTALL_MODE=stage ./install-opi.sh /tmp/s2rb-stage
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")" && pwd)
REPO=$(CDPATH= cd -- "$HERE/../.." && pwd)
ROOT="${1:-/opt/s2rb}"
MODE="${S2RB_INSTALL_MODE:-live}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1
}

apt_install() {
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends "$@"
}

check_arch() {
  arch=$(uname -m)
  case "$arch" in
    aarch64|arm64) ;;
    *)
      echo "Orange Pi host install expects aarch64 (got $arch)" >&2
      exit 1
      ;;
  esac
}

ensure_apt() {
  if ! need_cmd apt-get; then
    echo "Orange Pi install needs apt (Armbian or Orange Pi OS)" >&2
    exit 1
  fi
  apt-get update
}

ensure_curl() {
  if need_cmd curl; then
    return 0
  fi
  echo "Installing curl"
  apt_install ca-certificates curl
  if ! need_cmd curl; then
    echo "curl install failed" >&2
    exit 1
  fi
}

ensure_docker() {
  if need_cmd docker; then
    return 0
  fi
  echo "Installing Docker Engine"
  if apt-cache show docker.io >/dev/null 2>&1; then
    apt_install ca-certificates docker.io
  else
    ensure_curl
    curl -fsSL https://get.docker.com | sh
  fi
  if ! need_cmd docker; then
    echo "Docker Engine install failed" >&2
    exit 1
  fi
}

ensure_compose() {
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  if need_cmd docker-compose; then
    return 0
  fi
  echo "Installing Docker Compose plugin"
  if apt-cache show docker-compose-plugin >/dev/null 2>&1; then
    apt_install docker-compose-plugin
  elif apt-cache show docker-compose-v2 >/dev/null 2>&1; then
    apt_install docker-compose-v2
  elif apt-cache show docker-compose >/dev/null 2>&1; then
    apt_install docker-compose
  else
    echo "install the Docker Compose plugin, then rerun $0" >&2
    exit 1
  fi
  if docker compose version >/dev/null 2>&1; then
    return 0
  fi
  if need_cmd docker-compose; then
    return 0
  fi
  echo "Docker Compose install failed" >&2
  exit 1
}

enable_docker() {
  if ! need_cmd systemctl; then
    echo "systemd is required to start Docker" >&2
    exit 1
  fi
  systemctl enable docker
  systemctl start docker
}

if [ "$MODE" = "live" ] && [ "$(id -u)" -ne 0 ]; then
  echo "run as root: sudo $0 $ROOT" >&2
  exit 1
fi

if [ "$MODE" = "live" ]; then
  check_arch
  ensure_apt
  echo "Orange Pi dependencies: Docker Engine, Docker Compose plugin, curl"
  ensure_curl
  ensure_docker
  enable_docker
  ensure_compose
fi

echo "Installing S2RB host into $ROOT"
mkdir -p "$ROOT" "$ROOT/apps/host/data/mosquitto"

if need_cmd rsync; then
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

chmod +x \
  "$ROOT/apps/host/s2rb-host.sh" \
  "$ROOT/apps/host/install-pi.sh" \
  "$ROOT/apps/host/install-opi.sh" \
  "$ROOT/apps/host/mqtt-entrypoint.sh"
sed "s#/opt/s2rb#$ROOT#g" "$HERE/s2rb-host.service" > "$ROOT/apps/host/s2rb-host.installed.service"

if [ "$MODE" = "stage" ]; then
  echo "staged $ROOT (systemd skipped)"
  exit 0
fi

cp "$ROOT/apps/host/s2rb-host.installed.service" /etc/systemd/system/s2rb-host.service
systemctl daemon-reload
systemctl enable --now s2rb-host
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "S2RB host is up on Orange Pi. Resolver: http://${IP:-127.0.0.1}:3100"
