import { auditWithModel, parseLlmAdvice } from "../../../../src/agent_scanner.ts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const did = typeof body.did === "string" ? body.did : "";
  const publicKey = typeof body.publicKey === "string" ? body.publicKey : "";
  const history = typeof body.history === "string" ? body.history : "";
  const grants = typeof body.grants === "string" ? body.grants : "";
  const injected = typeof body.complete === "string" ? parseLlmAdvice(body.complete) : null;
  const result = await auditWithModel({
    did,
    publicKey,
    history,
    grants,
    complete: injected
      ? async () => ({ ok: true, text: JSON.stringify(injected) })
      : undefined,
  });
  return Response.json(result, { status: result.ok ? 200 : result.code === "LOCAL_REJECT" ? 422 : 503 });
}
