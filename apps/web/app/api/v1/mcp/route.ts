import { callMcpTool, mcpManifest } from "../../../../src/mcp_gateway.ts";

export const runtime = "nodejs";

export function GET() {
  return Response.json(mcpManifest());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name : "";
  const args = body.arguments && typeof body.arguments === "object" ? body.arguments as { address?: string } : {};
  const result = callMcpTool(name, args);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
