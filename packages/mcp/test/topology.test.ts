import assert from "node:assert/strict";
import test from "node:test";
import { createS2McpServer } from "../src/server.ts";
import { peekSpatialContext, signSpatialGrant } from "../src/spatial-sync.ts";
import { parseJournalPlate, resolveLocalPlate, resolveLocalPlateSync } from "../src/plate.ts";
import { GET_EXTENSION_STATUS, REQUEST_ACTUATION } from "../src/actuation.ts";
import { GET_SPACE_TOPOLOGY, getSpaceTopology, listMcpTools, RADAR_AXES } from "../src/topology.ts";

test("get_space_topology returns the nine-grid and keeps mains deenergized", () => {
  const tools = listMcpTools();
  assert.equal(tools[0]?.name, GET_SPACE_TOPOLOGY);
  assert.equal(tools.some((tool) => tool.name === REQUEST_ACTUATION && tool.readOnly === false), true);
  assert.equal(tools.some((tool) => tool.name === GET_EXTENSION_STATUS && tool.readOnly === true), true);
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

test("local journal and env plates beat the Guangzhou fixture", async () => {
  const journal = "---\ncd_u6a: SITE-GZHAIZHU-TIYUXILU-SHEJIDASHA-ROOM01-01\n---\n";
  assert.equal(parseJournalPlate(journal), "SITE-GZHAIZHU-TIYUXILU-SHEJIDASHA-ROOM01-01");
  const fromEnv = resolveLocalPlateSync({ env: { S2_AIOS_ADDRESS: "SITE-GZHAIZHU-TIYUXILU-SHEJIDASHA-ROOM01-01" } });
  assert.equal(fromEnv.source, "ENV");
  const fromJournal = resolveLocalPlateSync({ env: { S2_JOURNAL_TEXT: journal } });
  assert.equal(fromJournal.source, "JOURNAL");
  assert.equal(fromJournal.address, "SITE-GZHAIZHU-TIYUXILU-SHEJIDASHA-ROOM01-01");
  const fromLan = await resolveLocalPlate({
    env: { S2_AIOS_HOST: "10.0.0.8" },
    fetchImpl: async () => new Response(JSON.stringify({ service: "s2-aios", cd_u6a: "SITE-GZHAIZHU-TIYUXILU-SHEJIDASHA-ROOM01-01" })),
  });
  assert.equal(fromLan.source, "LAN");
  const topology = getSpaceTopology({ address: fromJournal.address }, { source: fromJournal.source });
  assert.equal(topology.ok, true);
  if (!topology.ok) return;
  assert.equal(topology.source, "JOURNAL");
});

test("createS2McpServer constructs an official MCP instance with the topology tool", () => {
  const server = createS2McpServer();
  assert.equal(typeof server.connect, "function");
  const listed = (server as { _registeredTools?: Record<string, unknown> })._registeredTools;
  if (listed) {
    assert.equal(GET_SPACE_TOPOLOGY in listed, true);
    assert.equal(REQUEST_ACTUATION in listed, true);
    assert.equal(GET_EXTENSION_STATUS in listed, true);
  }
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
