import assert from "node:assert/strict";
import test from "node:test";
import { S2RB_FREE_NOTICE } from "../src/config.ts";
import { openReviewerSession } from "../src/reviewer.ts";
import { scanPublicPayload } from "../src/agent_scanner.ts";
import { createMailbox, mqttAddress, openMediaHole } from "../src/s2rb_tunnel.ts";

test("the reviewer mailbox skips LAN and receives checksum-valid devices", () => {
  assert.match(S2RB_FREE_NOTICE, /仅限个人免费使用/);
  const closed = openReviewerSession("user@example.com");
  assert.equal(closed.ok, false);
  const open = openReviewerSession("apple@robot0.com");
  assert.equal(open.ok, true);
  if (!open.ok) return;
  assert.equal(open.lan, false);
  assert.equal(open.fleet.length, 3);
  const classes = new Set(open.fleet.map((device) => device.agentClass));
  assert.equal(classes.has("D") && classes.has("V") && classes.has("I"), true);
  for (const device of open.fleet) {
    assert.equal(device.did.length, 22);
    const scanned = scanPublicPayload({ did: device.did });
    assert.equal(scanned.ok, true);
    assert.equal(mqttAddress(device.did).ok, true);
  }
  const hole = openMediaHole();
  assert.equal(hole.relay, "NONE");
  assert.equal(hole.store, false);
  assert.equal(createMailbox().post({ toDid: "SHORT", fromDid: open.fleet[0]?.did ?? "", body: "x", atMs: 1 }).ok, false);
});
