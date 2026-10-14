#!/bin/sh
set -eu
HERE=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
cd "$HERE"
node --experimental-strip-types --test test/*.test.js
if command -v cargo >/dev/null 2>&1; then
  if cargo test --manifest-path src-tauri/Cargo.toml --lib --offline; then
    exit 0
  fi
  cargo test --manifest-path src-tauri/Cargo.toml --lib
fi
