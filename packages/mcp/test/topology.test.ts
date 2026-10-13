import assert from "node:assert/strict";
import test from "node:test";
import { createS2McpServer } from "../src/server.ts";
import { peekSpatialContext, signSpatialGrant } from "../src/spatial-sync.ts";
import { GET_SPACE_TOPOLOGY, getSpaceTopology, listMcpTools, RADAR_AXES } from "../src/topology.ts";

test("get_space_topology returns the nine-grid and keeps mains deenergized", () => {
  const tools = listMcpTools();
  assert.equal(tools[0]?.name, GET_SPACE_TOPOLOGY);
  const topology = getSpaceTopology();
  assert.equal(topology.ok, true);
  if (!topology.ok) return;
  assert.equal(topology.grids.length, 9);
  assert.equal(topology.throne.grid, 1);
  assert.equal(topology.workbenches.length, 7);
  assert.equal(topology.radar.rank, 14);
  assert.equal(topology.radar.axes.length, RADAR_AXES.length);
  assert.equal(topology.mains, "deenergized");
  assert.equal(topology.upload, false);
  assert.equal(topology.actuation, "TRUSTZONE");
  const bad = getSpaceTopology(undefined, { address: "short" });
  assert.equal(bad.ok, false);
});

test("createS2McpServer constructs an official MCP instance with the topology tool", () => {
  const server = createS2McpServer();
  assert.equal(typeof server.connect, "function");
  const listed = (server as { _registeredTools?: Record<string, unknown> })._registeredTools;
  if (listed) assert.equal(GET_SPACE_TOPOLOGY in listed, true);
});

test("spatial sync refuses a missing OIDC grant and never uploads the journal", () => {
  const denied = peekSpatialContext({ markdown: "## 2026-10-13\n- atmos: 22", secret: "unit-secret" });
  assert.equal(denied.ok, false);
  if (denied.ok) return;
  assert.equal(denied.code, "OIDC_REQUIRED");
  assert.equal(denied.upload, false);
  const token = signSpatialGrant({
    iss: "https://s2rb.space2.world",
    aud: "s2-spatial-sync",
    sub: "DHOME1251009AB00000001",
    scope: "space.read",
    exp: Date.now() + 60_000,
  }, "unit-secret");
  const peek = peekSpatialContext({ markdown: "a".repeat(1200), token, secret: "unit-secret" });
  assert.equal(peek.ok, true);
  if (!peek.ok) return;
  assert.equal(peek.excerpt.length, 1000);
  assert.equal(peek.truncated, true);
  assert.equal(peek.upload, false);
});
