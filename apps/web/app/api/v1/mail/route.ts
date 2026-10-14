import { mqttAddress } from "../../../../src/s2rb_tunnel.ts";
import { postMail, mailStore } from "../../../../src/mail_bus.ts";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const did = new URL(req.url).searchParams.get("did") ?? "";
  const topic = mqttAddress(did);
  if (!topic.ok) return Response.json({ ok: false, code: "LOCAL_REJECT", upload: false }, { status: 422 });
  return Response.json({ ok: true, topic: topic.topic, letters: mailStore().pull(did), upload: false });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const result = await postMail({
    toDid: typeof body.toDid === "string" ? body.toDid : "",
    fromDid: typeof body.fromDid === "string" ? body.fromDid : "",
    body: typeof body.body === "string" ? body.body : "",
    atMs: typeof body.atMs === "number" ? body.atMs : Date.now(),
  });
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
