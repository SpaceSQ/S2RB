import assert from "node:assert/strict";
import test from "node:test";
import { DID, lanCardUrl, screenDid, subnetHosts } from "./discover.js";

test("mobile subnet probe keeps genesis AP and skips the phone itself", () => {
  const hosts = subnetHosts("10.0.0.8");
  assert.equal(hosts.includes("192.168.4.1"), true);
  assert.equal(hosts.includes("10.0.0.1"), true);
  assert.equal(hosts.includes("10.0.0.8"), false);
  assert.equal(lanCardUrl("10.0.0.3"), "http://10.0.0.3:1884/lan");
  assert.equal(DID.test("DHOME1251009AB00000001"), true);
  assert.equal(DID.test("short"), false);
  assert.equal(screenDid("DHOME1251009FA00000001").ok, true);
  assert.equal(screenDid("DHOME1251009AB00000001").ok, false);
  assert.equal(screenDid("short").ok, false);
});
