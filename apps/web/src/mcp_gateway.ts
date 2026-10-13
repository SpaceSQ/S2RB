import {
  createS2McpServer,
  GET_SPACE_TOPOLOGY,
  getSpaceTopology,
  listMcpTools,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  partnerManifest,
  peekSpatialContext,
  spatialSyncGuide,
  type TopologySpace,
} from "../../../packages/mcp/src/index.ts";
import { S2RB_FREE_NOTICE, S2RB_HOME } from "./config.ts";

let instance: ReturnType<typeof createS2McpServer> | null = null;

/** One process-wide MCP server. WorkBuddy / Qwen attach here later. */
export function s2rbMcpServer(space?: TopologySpace) {
  instance ??= createS2McpServer(space);
  return instance;
}

export function mcpManifest() {
  s2rbMcpServer();
  return {
    server: MCP_SERVER_NAME,
    version: MCP_SERVER_VERSION,
    home: S2RB_HOME,
    notice: S2RB_FREE_NOTICE,
    tools: listMcpTools(),
    mains: "deenergized" as const,
    upload: false as const,
    partners: partnerManifest(),
  };
}

export function spatialSyncManifest() {
  return {
    ...spatialSyncGuide(),
    partners: partnerManifest(),
  };
}

export function callMcpTool(name: string, args: { address?: string } = {}) {
  s2rbMcpServer();
  if (name !== GET_SPACE_TOPOLOGY) {
    return { ok: false as const, code: "TOOL" as const, upload: false as const, mains: "deenergized" as const };
  }
  return getSpaceTopology(undefined, args);
}

export function spatialSyncPeek(input: { markdown: string; token?: string; secret: string }) {
  return peekSpatialContext(input);
}
