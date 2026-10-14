import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const host = join(here, "..");

test("systemd unit waits for health and restarts when start fails", () => {
  const unit = readFileSync(join(host, "s2rb-host.service"), "utf8");
  assert.match(unit, /Restart=on-failure/);
  assert.match(unit, /s2rb-host\.sh start/);
  assert.match(unit, /s2rb-host\.sh stop/);
  assert.match(unit, /EnvironmentFile=-/);
  const script = readFileSync(join(host, "s2rb-host.sh"), "utf8");
  assert.match(script, /api\/v1\/health/);
  assert.match(script, /docker compose/);
});

test("stage install copies the host tree and rewrites the unit path", () => {
  const root = mkdtempSync(join(tmpdir(), "s2rb-host-"));
  try {
    const ran = spawnSync("sh", [join(host, "install-pi.sh"), root], {
      env: { ...process.env, S2RB_INSTALL_MODE: "stage" },
      encoding: "utf8",
    });
    assert.equal(ran.status, 0, ran.stderr);
    const unit = readFileSync(join(root, "apps/host/s2rb-host.installed.service"), "utf8");
    assert.match(unit, new RegExp(`${root}/apps/host/s2rb-host.sh start`));
    assert.doesNotMatch(unit, /\/opt\/s2rb/);
    const env = readFileSync(join(root, "apps/host/.env"), "utf8");
    assert.match(env, /S2_MQTT_USER/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
