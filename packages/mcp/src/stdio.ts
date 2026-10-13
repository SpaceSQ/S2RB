#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createS2McpServer } from "./server.ts";

const server = createS2McpServer();
const transport = new StdioServerTransport();
await server.connect(transport);
