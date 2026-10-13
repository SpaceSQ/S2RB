import { recordValidLookup } from "../../../../lib/cloud.ts";
import { createMemoryDump, resolveQuery } from "../../../../src/s2rb_dns_root.ts";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = typeof body.query === "string" ? body.query : "";
  const dump = createMemoryDump();
  const result = await resolveQuery({
    raw,
    dump,
    model: "s2rb-web",
    async lookup(row) {
      await recordValidLookup(row);
      return { ok: true, lane: "TAOHUAYUAN", query: row.query, root: "TAOHUAYUAN" };
    },
  });
  return Response.json(result, { status: result.ok ? 200 : 422 });
}
