import assert from "node:assert/strict";
import test from "node:test";
import { GET_SPACE_TOPOLOGY } from "../../../packages/s2-mcp-bridge/src/topology.ts";
import { callMcpTool, mcpManifest, s2rbMcpServer } from "../src/mcp_gateway.ts";

test("S2RB boots an MCP server and get_space_topology stays read-only", () => {
  const server = s2rbMcpServer();
  assert.equal(typeof server.connect, "function");
  const listed = mcpManifest();
  assert.equal(listed.tools.some((tool) => tool.name === GET_SPACE_TOPOLOGY), true);
  assert.equal(listed.mains, "deenergized");
  assert.equal(listed.upload, false);
  assert.equal(listed.partners.posture, "ACTIVE_FRIENDLY_PARTNER");
  assert.equal(listed.partners.contest_chat_door, false);
  assert.match(listed.partners.stance, /腾讯/);
  assert.match(listed.partners.stance, /阿里/);
  assert.equal(listed.partners.extensions.length, 4);
  const topology = callMcpTool(GET_SPACE_TOPOLOGY);
  assert.equal(topology.ok, true);
  if (!topology.ok) return;
  assert.equal(topology.tool, GET_SPACE_TOPOLOGY);
  assert.equal(topology.throne.slot, "01");
  const unknown = callMcpTool("cut_mains");
  assert.equal(unknown.ok, false);
});
