import { redactModel, screenQuery, type CloudLookup } from "../src/s2rb_dns_root.ts";

export const ALLOWLIST_TABLES = ["s2rb_valid_lookup", "s2rb_handshake", "s2rb_client_model"] as const;
export type AllowlistTable = (typeof ALLOWLIST_TABLES)[number];

export type AllowlistRows = {
  lookup: { query: string; kind: "DID" | "ADDRESS" };
  handshake?: { did: string; agent_class: string };
  model: { model: string };
};

export type CloudConfig = {
  url?: string;
  key?: string;
  fetchImpl?: typeof fetch;
};

/** Build the three allowed cloud shapes. Dirty tokens never become a row. */
export function allowlistRows(body: CloudLookup): { ok: true; rows: AllowlistRows } | { ok: false; code: "LOCAL_REJECT"; upload: false } {
  const screened = screenQuery(body.query);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT", upload: false };
  const rows: AllowlistRows = {
    lookup: { query: screened.clean, kind: screened.kind },
    model: { model: redactModel(body.model) },
  };
  if (screened.kind === "DID") {
    rows.handshake = { did: screened.clean, agent_class: screened.agentClass };
  }
  return { ok: true, rows };
}

async function postRow(
  fetchImpl: typeof fetch,
  base: string,
  key: string,
  table: AllowlistTable,
  body: Record<string, string>,
): Promise<void> {
  await fetchImpl(`${base}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      prefer: "resolution=ignore-duplicates",
    },
    body: JSON.stringify(body),
  });
}

/** Success-only write. Failed probes never reach fetch(). */
export async function recordValidLookup(
  body: CloudLookup,
  config: CloudConfig = {},
): Promise<
  | { ok: true; upload: true; tables: AllowlistTable[] }
  | { ok: false; code: "LOCAL_REJECT" | "NO_CLOUD"; upload: false; rows?: AllowlistRows }
> {
  const planned = allowlistRows(body);
  if (!planned.ok) return planned;
  const url = (config.url ?? process.env.NEXT_PUBLIC_SUPABASE_URL)?.replace(/\/$/, "");
  const key = config.key ?? process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { ok: false, code: "NO_CLOUD", upload: false, rows: planned.rows };
  const fetchImpl = config.fetchImpl ?? fetch;
  const tables: AllowlistTable[] = ["s2rb_valid_lookup", "s2rb_client_model"];
  try {
    await postRow(fetchImpl, url, key, "s2rb_valid_lookup", planned.rows.lookup);
    if (planned.rows.handshake) {
      tables.push("s2rb_handshake");
      await postRow(fetchImpl, url, key, "s2rb_handshake", planned.rows.handshake);
    }
    await postRow(fetchImpl, url, key, "s2rb_client_model", planned.rows.model);
  } catch {
    return { ok: false, code: "NO_CLOUD", upload: false, rows: planned.rows };
  }
  return { ok: true, upload: true, tables };
}
