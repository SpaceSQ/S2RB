import assert from "node:assert/strict";
import test from "node:test";
import { GET_EXTENSION_STATUS, REQUEST_ACTUATION } from "../../../packages/mcp/src/actuation.ts";
import { signSpatialGrant } from "../../../packages/mcp/src/spatial-sync.ts";
import { GET_SPACE_TOPOLOGY } from "../../../packages/mcp/src/topology.ts";
import { callMcpTool, journalMarkdown, mcpManifest, spatialSyncPeek } from "../src/mcp_gateway.ts";

test("S2RB boots an MCP server and get_space_topology stays read-only", async () => {
  const listed = mcpManifest();
  assert.equal(listed.tools.some((tool) => tool.name === GET_SPACE_TOPOLOGY), true);
  assert.equal(listed.mains, "deenergized");
  assert.equal(listed.upload, false);
  assert.equal(listed.partners.posture, "ACTIVE_FRIENDLY_PARTNER");
  assert.equal(listed.partners.contest_chat_door, false);
  assert.match(listed.partners.stance, /腾讯/);
  assert.match(listed.partners.stance, /阿里/);
  assert.equal(listed.partners.extensions.length, 4);
  const topology = await callMcpTool(GET_SPACE_TOPOLOGY);
  assert.equal(topology.ok, true);
  if (!topology.ok) return;
  assert.equal(topology.tool, GET_SPACE_TOPOLOGY);
  assert.equal(topology.throne.slot, "01");
  const unknown = await callMcpTool("cut_mains");
  assert.equal(unknown.ok, false);
  const actuation = await callMcpTool(REQUEST_ACTUATION, { axis: "lumina" });
  assert.equal(actuation.ok, false);
  if (!actuation.ok) assert.equal(actuation.code, "VETO_SECURITY");
  const extensions = await callMcpTool(GET_EXTENSION_STATUS);
  assert.equal(extensions.ok, true);
  if (!extensions.ok) return;
  assert.equal("extensions" in extensions && Array.isArray(extensions.extensions), true);
  if ("extensions" in extensions) {
    assert.equal(extensions.extensions.length, 4);
    assert.equal(extensions.extensions.every((lane: { status: string }) => lane.status === "WIRED"), true);
  }
  assert.equal(journalMarkdown({ S2_JOURNAL_TEXT: "# room" }), "# room");
  assert.equal(journalMarkdown({ S2_JOURNAL: "/no/such/journal.md" }), "");
  const token = signSpatialGrant({
    iss: "https://s2rb.space2.world",
    aud: "s2-spatial-sync",
    sub: "DHOME1251009AB00000001",
    scope: "space.read",
    exp: Date.now() + 60_000,
  }, "unit-secret");
  const peek = spatialSyncPeek({
    token,
    secret: "unit-secret",
    env: { S2_JOURNAL_TEXT: "from-journal" },
  });
  assert.equal(peek.ok, true);
  if (!peek.ok) return;
  assert.equal(peek.excerpt, "from-journal");
  assert.equal(peek.upload, false);
});
