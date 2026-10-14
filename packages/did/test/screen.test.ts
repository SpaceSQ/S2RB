import assert from "node:assert/strict";
import test from "node:test";
import { generateS2CheckSum as vendorSum } from "../../../apps/web/vendor/spacsq/checksum.ts";
import { assembleS2Did, generateS2CheckSum, screenDid } from "../src/index.ts";

const valid = assembleS2Did("DHOME1251009", "00000001");
if (!valid) throw new Error("fixture");

test("the shared screen matches the official SPACSQ checksum", () => {
  assert.equal(valid, "DHOME1251009FA00000001");
  assert.equal(generateS2CheckSum("DHOME1251009", "00000001"), vendorSum("DHOME1251009", "00000001"));
  const hit = screenDid(valid);
  assert.equal(hit.ok, true);
  if (!hit.ok) return;
  assert.equal(hit.clean, valid);
  assert.equal(hit.agentClass, "D");
});

test("length, charset, and a forged checksum die before any client write", () => {
  assert.equal(screenDid("ABC123").ok, false);
  const short = screenDid("ABC123");
  if (!short.ok) assert.equal(short.reason, "DID_LENGTH");
  const dirty = screenDid("!!!!!!!!!!!!!!!!!!!!!!");
  assert.equal(dirty.ok, false);
  if (!dirty.ok) assert.equal(dirty.reason, "DID_CHARSET");
  const forged = screenDid("DHOME1251009AB00000001");
  assert.equal(forged.ok, false);
  if (!forged.ok) assert.equal(forged.reason, "DID_CHECKSUM");
  assert.equal(forged.upload, false);
});
