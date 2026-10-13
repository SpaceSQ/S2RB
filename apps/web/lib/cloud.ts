import { allowCloudFetch, type CloudLookup } from "../src/s2rb_dns_root.ts";

/** Success-only row. Failed probes never reach this function. */
export async function recordValidLookup(body: CloudLookup): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return;
  const gate = allowCloudFetch(body.query);
  if (!gate.ok) return;
  await fetch(`${url}/rest/v1/s2rb_valid_lookup`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify({
      query: gate.clean,
      kind: body.kind,
      model: body.model,
    }),
  }).catch(() => undefined);
}
