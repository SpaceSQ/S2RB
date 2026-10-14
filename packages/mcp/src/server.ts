import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GET_EXTENSION_STATUS, REQUEST_ACTUATION, requestActuation } from "./actuation.ts";
import { partnerManifest } from "./partners.ts";
import { resolveLocalPlate } from "./plate.ts";
import {
  defaultSpace,
  GET_SPACE_TOPOLOGY,
  getSpaceTopology,
  listMcpTools,
  MCP_SERVER_NAME,
  MCP_SERVER_VERSION,
  type TopologySpace,
} from "./topology.ts";

export type S2McpServer = McpServer;

export function createS2McpServer(space: TopologySpace = defaultSpace()): McpServer {
  const server = new McpServer({ name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION });
  const tools = listMcpTools();
  server.registerTool(
    GET_SPACE_TOPOLOGY,
    {
      title: "Get space topology",
      description: tools[0]?.description,
      inputSchema: { address: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ address }) => {
      const plate = address
        ? { address: address.trim().toUpperCase(), source: "ARG" as const }
        : await resolveLocalPlate({ fallback: space.address });
      const topology = getSpaceTopology({ address: plate.address }, { source: plate.source });
      return { content: [{ type: "text", text: JSON.stringify(topology) }] };
    },
  );
  server.registerTool(
    REQUEST_ACTUATION,
    {
      title: "Request actuation",
      description: tools[1]?.description,
      inputSchema: { axis: z.string().optional(), grid: z.number().optional() },
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    },
    async ({ axis, grid }) => {
      return { content: [{ type: "text", text: JSON.stringify(requestActuation({ axis, grid })) }] };
    },
  );
  server.registerTool(
    GET_EXTENSION_STATUS,
    {
      title: "Get extension status",
      description: tools[2]?.description,
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async () => {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            ok: true,
            tool: GET_EXTENSION_STATUS,
            ...partnerManifest(),
            mains: "deenergized",
            upload: false,
          }),
        }],
      };
    },
  );
  return server;
}
