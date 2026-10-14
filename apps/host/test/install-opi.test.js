import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { accessSync, constants, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const host = join(here, "..");
const installer = join(host, "install-opi.sh");

test("opi installer targets Armbian and the same gateway deps as Pi", () => {
  const script = readFileSync(installer, "utf8");
  assert.match(script, /Armbian/);
  assert.match(script, /Orange Pi OS/);
  assert.match(script, /aarch64/);
  assert.match(script, /Orange Pi 5/);
  assert.match(script, /5 Plus/);
  assert.match(script, /3B/);
  assert.match(script, /Zero2/);
  assert.match(script, /Docker Engine/);
  assert.match(script, /docker-compose-plugin/);
  assert.match(script, /\bcurl\b/);
  assert.match(script, /s2rb-host\.service/);
  assert.match(script, /not S2 AIOS/);
  assert.doesNotMatch(script, /\|\| true/);
  assert.doesNotMatch(script, /S2AIOS|install-aios|sk-[A-Za-z0-9]{10,}/i);
  const unit = readFileSync(join(host, "s2rb-host.service"), "utf8");
  assert.match(unit, /s2rb-host\.sh start/);
  const starter = readFileSync(join(host, "s2rb-host.sh"), "utf8");
  assert.match(starter, /api\/v1\/health/);
});

test("opi live install refuses non-root", () => {
  const script = readFileSync(installer, "utf8");
  assert.match(script, /id -u/);
  if (typeof process.getuid === "function" && process.getuid() === 0) {
    return;
  }
  const ran = spawnSync("sh", [installer, join(tmpdir(), "s2rb-opi-noref")], {
    env: { ...process.env, S2RB_INSTALL_MODE: "live" },
    encoding: "utf8",
  });
  assert.notEqual(ran.status, 0);
  assert.match(ran.stderr, /root/);
});

test("opi stage install copies the host tree without docker or root", () => {
  const root = mkdtempSync(join(tmpdir(), "s2rb-opi-"));
  try {
    const ran = spawnSync("sh", [installer, root], {
      env: { ...process.env, S2RB_INSTALL_MODE: "stage" },
      encoding: "utf8",
    });
    assert.equal(ran.status, 0, ran.stderr);
    assert.match(ran.stdout, /staged/);
    assert.doesNotMatch(ran.stdout, /apt-get|Installing Docker/);
    const unit = readFileSync(join(root, "apps/host/s2rb-host.installed.service"), "utf8");
    assert.match(unit, new RegExp(`${root}/apps/host/s2rb-host.sh start`));
    assert.doesNotMatch(unit, /\/opt\/s2rb/);
    const env = readFileSync(join(root, "apps/host/.env"), "utf8");
    assert.match(env, /S2_MQTT_USER/);
    assert.match(env, /S2_AIOS_HOST/);
    assert.match(env, /S2_JOURNAL/);
    assert.match(env, /S2_TAOHUAYUAN_URL/);
    accessSync(join(root, "apps/host/install-opi.sh"), constants.X_OK);
    accessSync(join(root, "apps/host/s2rb-host.sh"), constants.X_OK);
    accessSync(join(root, "apps/host/mqtt-entrypoint.sh"), constants.X_OK);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
