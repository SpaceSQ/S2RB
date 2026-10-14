import assert from "node:assert/strict";
import test from "node:test";
import { admitContact, AXIS_BANDS, createLocalTopology, inspectRadar, OXYGEN_PERCENT_MIN, RADAR_AXES, SAFE_RADAR, TACTILE_NEWTON_MAX, VETO_MARKER } from "../src/red_anchor_sandbox.ts";
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

test("every remaining radar axis trips its visa band and SAFE_RADAR clears", () => {
  const trips: Array<[string, number, string]> = [
    ["lumina", 0, "LUMINA_LUX"],
    ["atmos", 50, "ATMOS_TEMP"],
    ["acoustic", 90, "ACOUSTIC_DB"],
    ["wave", 40, "WAVE_DBM"],
    ["energy", 4000, "ENERGY_WATT"],
    ["vision", 2, "VISION_STATE"],
    ["pressure", 70, "PRESSURE_KPA"],
    ["odor", 300, "ODOR_VOC"],
    ["magnetic", 3000, "MAGNETIC_UT"],
    ["gravity", 0.1, "GRAVITY_G"],
    ["water", 0.5, "WATER_LEAK"],
    ["food", 0.9, "FOOD_SPOIL"],
  ];
  for (const [axis, reading, fuse] of trips) {
    const tripped = inspectRadar({ [axis]: reading });
    assert.equal(tripped.ok, false);
    if (tripped.ok) return;
    assert.equal(tripped.fuse, fuse);
    assert.equal(tripped.marker, VETO_MARKER);
    assert.equal(tripped.upload, false);
    assert.equal(tripped.mains, "deenergized");
  }
  const clear = inspectRadar({ ...SAFE_RADAR });
  assert.equal(clear.ok, true);
  if (!clear.ok) return;
  assert.equal(Object.keys(AXIS_BANDS).length, RADAR_AXES.length);
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
