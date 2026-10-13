import { admitContact } from "../../../../src/red_anchor_sandbox.ts";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const radar = body && typeof body === "object" && "radar" in body && body.radar && typeof body.radar === "object"
    ? body.radar as Record<string, unknown>
    : {};
  const verdict = admitContact({
    radar,
    energizeMains: body?.energizeMains === true,
  });
  return Response.json(verdict, { status: verdict.ok ? 200 : 423 });
}
