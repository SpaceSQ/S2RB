import { skillBus } from "../../../../src/mcp_gateway.ts";

export const runtime = "nodejs";

export function GET() {
  return Response.json(skillBus().list());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "install";
  const catalog = skillBus();
  const result = action === "run"
    ? catalog.run(body)
    : catalog.install(body);
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
