import { horizonBus } from "../../../../src/mcp_gateway.ts";

export const runtime = "nodejs";

export function GET() {
  return Response.json(horizonBus().snapshot());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const action = typeof body.action === "string" ? body.action : "";
  const jobId = typeof body.jobId === "string" ? body.jobId : "";
  const note = typeof body.note === "string" ? body.note : "";
  const queue = horizonBus();
  const result = action === "enqueue"
    ? queue.enqueue({
      name: typeof body.name === "string" ? body.name : "",
      kind: body.kind === "ENERGY_WATCH" || body.kind === "PATROL" || body.kind === "CUSTOM" ? body.kind : undefined,
      horizonHours: typeof body.horizonHours === "number" ? body.horizonHours : undefined,
    })
    : action === "start"
      ? queue.start(jobId)
      : action === "suspend"
        ? queue.suspend(jobId, note)
        : action === "resume"
          ? queue.resume(jobId)
          : action === "callback"
            ? queue.callback(jobId, note)
            : action === "trace"
              ? queue.trace(jobId, note)
              : action === "snapshot"
                ? queue.snapshot(jobId || undefined)
                : { ok: false as const, code: "JOB" as const, upload: false as const, mains: "deenergized" as const };
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
