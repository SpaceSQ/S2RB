import { GET_EXTENSION_STATUS, REQUEST_ACTUATION, requestActuation } from "../../../packages/mcp/src/actuation.ts";
import { horizonQueue } from "../../../packages/mcp/src/horizon.ts";
import { partnerManifest } from "../../../packages/mcp/src/partners.ts";
import { resolveLocalPlate } from "../../../packages/mcp/src/plate.ts";
import { skillCatalog } from "../../../packages/mcp/src/skills.ts";
import { peekSpatialContext, spatialSyncGuide } from "../../../packages/mcp/src/spatial-sync.ts";
import {
  GET_SPACE_TOPOLOGY,
  getSpaceTopology,
  listMcpTools,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  type TopologySpace,
} from "../../../packages/mcp/src/topology.ts";
import { readFileSync } from "node:fs";
import { S2RB_FREE_NOTICE, S2RB_HOME } from "./config.ts";

let instance: { connect: (...args: never[]) => unknown } | null = null;

/** One process-wide MCP server. WorkBuddy / Qwen attach here later. */
export async function s2rbMcpServer(space?: TopologySpace) {
  if (!instance) {
    const { createS2McpServer } = await import("../../../packages/mcp/src/server.ts");
    instance = createS2McpServer(space);
  }
  return instance;
}

export function mcpManifest() {
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

export function journalMarkdown(env: NodeJS.Dict<string | undefined> = process.env): string {
  if (typeof env.S2_JOURNAL_TEXT === "string" && env.S2_JOURNAL_TEXT) return env.S2_JOURNAL_TEXT;
  const path = env.S2_JOURNAL?.trim();
  if (!path) return "";
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

export async function callMcpTool(name: string, args: { address?: string; axis?: string; grid?: number } = {}) {
  if (name === REQUEST_ACTUATION) return requestActuation(args);
  if (name === GET_EXTENSION_STATUS) {
    return {
      ok: true as const,
      tool: GET_EXTENSION_STATUS,
      ...partnerManifest(),
      mains: "deenergized" as const,
      upload: false as const,
    };
  }
  if (name !== GET_SPACE_TOPOLOGY) {
    return { ok: false as const, code: "TOOL" as const, upload: false as const, mains: "deenergized" as const };
  }
  if (args.address) return getSpaceTopology(undefined, args);
  const plate = await resolveLocalPlate();
  return getSpaceTopology({ address: plate.address }, { source: plate.source });
}

export function spatialSyncPeek(input: { markdown?: string; token?: string; secret: string; env?: NodeJS.Dict<string | undefined> }) {
  const markdown = input.markdown?.trim() ? input.markdown : journalMarkdown(input.env);
  return peekSpatialContext({ markdown, token: input.token, secret: input.secret });
}

export function horizonBus() {
  return horizonQueue();
}

export function skillBus() {
  return skillCatalog();
}
