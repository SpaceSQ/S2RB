import { recordValidLookup } from "../../../../lib/cloud.ts";
import { createMemoryDump, resolveCache, resolveHttpStatus, resolveQuery } from "../../../../src/s2rb_dns_root.ts";
import { askTaohuayuan } from "../../../../src/taohuayuan.ts";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const raw = typeof body.query === "string" ? body.query : "";
  const dump = createMemoryDump();
  const result = await resolveQuery({
    raw,
    dump,
    model: "s2rb-web",
    cache: resolveCache(),
    async lookup(row) {
      const asked = await askTaohuayuan({ query: row.query });
      if (asked.ok) await recordValidLookup(row);
      return asked;
    },
  });
  return Response.json(result, { status: resolveHttpStatus(result) });
}
