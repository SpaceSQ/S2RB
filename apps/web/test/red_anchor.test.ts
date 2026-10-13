import assert from "node:assert/strict";
import test from "node:test";
import { admitContact, createLocalTopology, inspectRadar, OXYGEN_PERCENT_MIN, TACTILE_NEWTON_MAX, VETO_MARKER } from "../src/red_anchor_sandbox.ts";
import { HOLOGRAPHIC_RANK } from "../src/spacsq-seam.ts";

test("tactile above 5 N and oxygen below 19.5 percent trip VETO_SECURITY", () => {
  const hard = inspectRadar({ tactile: TACTILE_NEWTON_MAX + 0.1 });
  assert.equal(hard.ok, false);
  if (hard.ok) return;
  assert.equal(hard.code, "VETO_SECURITY");
  assert.equal(hard.marker, VETO_MARKER);
  assert.equal(hard.upload, false);
  assert.equal(hard.mains, "deenergized");
  const air = inspectRadar({ oxygen: OXYGEN_PERCENT_MIN - 0.1 });
  assert.equal(air.ok, false);
  if (air.ok) return;
  assert.equal(air.code, "VETO_SECURITY");
  assert.equal(air.fuse, "OXYGEN_PERCENT");
  assert.equal(air.marker, VETO_MARKER);
  const clear = inspectRadar({ tactile: 5, base_air: 19.5, lumina: 80 });
  assert.equal(clear.ok, true);
  if (!clear.ok) return;
  assert.equal(clear.rank, HOLOGRAPHIC_RANK);
});

test("LAN topology stays on the device and mains never energize", () => {
  const map = createLocalTopology();
  map.remember({ kind: "QR", url: "http://192.168.4.1", atMs: 1 });
  assert.equal(map.cloudPayload().upload, false);
  assert.equal(map.cloudPayload().topology, null);
  const live = admitContact({ radar: { tactile: 1 }, energizeMains: true });
  assert.equal(live.ok, false);
  if (live.ok) return;
  assert.equal(live.fuse, "MAINS");
});
