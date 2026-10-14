import assert from "node:assert/strict";
import test from "node:test";
import { ECOSYSTEM_STANCE, FUTURE_EXTENSIONS, partnerManifest } from "../src/partners.ts";
import { spatialSyncGuide } from "../src/spatial-sync.ts";

test("partner copy names Tencent and Alibaba and does not contest the chat door", () => {
  const listed = partnerManifest();
  assert.equal(listed.posture, "ACTIVE_FRIENDLY_PARTNER");
  assert.equal(listed.contest_chat_door, false);
  assert.match(ECOSYSTEM_STANCE, /不与腾讯、阿里争夺通用对话入口/);
  assert.equal(listed.extensions.length, 4);
  for (const lane of FUTURE_EXTENSIONS) {
    assert.equal(lane.status, "WIRED");
    assert.ok(lane.hosts.length >= 2);
    assert.ok(lane.actions.length >= 3);
    assert.ok(lane.invitation.length > 40);
  }
  const spatial = spatialSyncGuide();
  assert.match(spatial.invitation, /夸克|Eva/);
  assert.equal(spatial.upload, false);
});
