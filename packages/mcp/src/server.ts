import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
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
  server.registerTool(
    GET_SPACE_TOPOLOGY,
    {
      title: "Get space topology",
      description: listMcpTools()[0]?.description,
      inputSchema: { address: z.string().optional() },
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ address }) => {
      const topology = getSpaceTopology(space, { address });
      return { content: [{ type: "text", text: JSON.stringify(topology) }] };
    },
  );
  return server;
}
