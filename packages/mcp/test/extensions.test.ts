import assert from "node:assert/strict";
import test from "node:test";
import { requestActuation } from "../src/actuation.ts";
import { createHorizonQueue, MAX_INFLIGHT, MAX_TRACE_STEPS } from "../src/horizon.ts";
import { admitSkill, auditSkillSource, createSkillCatalog } from "../src/skills.ts";

test("request_actuation always returns VETO_SECURITY and keeps mains dark", () => {
  const veto = requestActuation({ axis: "energy", grid: 3 });
  assert.equal(veto.ok, false);
  assert.equal(veto.code, "VETO_SECURITY");
  assert.equal(veto.mains, "deenergized");
  assert.equal(veto.upload, false);
  assert.equal(veto.actuation, "TRUSTZONE");
});

test("horizon queue stays local, caps inflight at 8, and fuses after 64 steps", () => {
  const queue = createHorizonQueue({ now: () => 1_700_000_000_000, max: MAX_INFLIGHT });
  const first = queue.enqueue({ name: "night watch", kind: "ENERGY_WATCH", horizonHours: 6 });
  assert.equal(first.ok, true);
  if (!first.ok) return;
  assert.equal(first.job.callback, "LOCAL");
  assert.equal(first.job.mains, "deenergized");
  assert.equal(queue.start(first.job.jobId).ok, true);
  const same = queue.trace(first.job.jobId, "same");
  const again = queue.trace(first.job.jobId, "same");
  assert.equal(same.ok, true);
  assert.equal(again.ok, true);
  if (again.ok) assert.equal(again.inherited, true);
  for (let i = 0; i < MAX_INFLIGHT; i += 1) {
    const extra = queue.enqueue({ name: `job-${i}` });
    if (i < MAX_INFLIGHT - 1) assert.equal(extra.ok, true);
    else {
      assert.equal(extra.ok, false);
      if (!extra.ok) assert.equal(extra.code, "QUEUE_FULL");
    }
  }
  const tight = createHorizonQueue({ now: () => 99 });
  const job = tight.enqueue({ name: "patrol", kind: "PATROL" });
  assert.equal(job.ok, true);
  if (!job.ok) return;
  for (let step = 0; step < MAX_TRACE_STEPS; step += 1) {
    assert.equal(tight.trace(job.job.jobId, `step-${step}`).ok, true);
  }
  const fused = tight.trace(job.job.jobId, "overflow");
  assert.equal(fused.ok, false);
  if (!fused.ok) assert.equal(fused.code, "FUSE");
  const done = queue.callback(first.job.jobId, "local handback");
  assert.equal(done.ok, true);
  if (done.ok) assert.equal(done.job.status, "DONE");
});

test("skills bind SITE plates to seats 02-08 and never actuate mains", () => {
  assert.equal(auditSkillSource("fetch('https://x')").ok, false);
  assert.equal(admitSkill({ name: "fall", plate: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01", seat: 1, source: "1" }).ok, false);
  const catalog = createSkillCatalog();
  const installed = catalog.install({
    name: "fall",
    plate: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01",
    seat: 2,
    source: "requestActuation({ axis: 'energy' })",
    read: ["radar"],
    actuate: ["energy"],
  });
  assert.equal(installed.ok, true);
  const ran = catalog.run({
    name: "fall",
    plate: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01",
    seat: 2,
  });
  assert.equal(ran.ok, true);
  if (!ran.ok) return;
  assert.equal(ran.actuation, "TRUSTZONE");
  assert.equal(ran.mains, "deenergized");
  assert.equal(ran.upload, false);
  const blocked = catalog.install({
    name: "leak",
    plate: "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01",
    seat: 3,
    source: "require('fs')",
  });
  assert.equal(blocked.ok, false);
  if (!blocked.ok) assert.equal(blocked.code, "SANDBOX");
});
