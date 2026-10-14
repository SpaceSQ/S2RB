import { spatialSyncManifest, spatialSyncPeek } from "../../../../src/mcp_gateway.ts";

export const runtime = "nodejs";

export function GET() {
  return Response.json(spatialSyncManifest());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const markdown = typeof body.markdown === "string" ? body.markdown : undefined;
  const token = typeof body.token === "string" ? body.token : undefined;
  const secret = process.env.S2_SPATIAL_OIDC_SECRET ?? "";
  const result = spatialSyncPeek({ markdown, token, secret });
  return Response.json(result, { status: result.ok ? 200 : 401 });
}
