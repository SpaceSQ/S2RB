import { readFileSync } from "node:fs";
import { TAOHUAYUAN_ROOT } from "./config.ts";
import { screenQuery } from "./s2rb_dns_root.ts";

export const HIT_TTL_MS = 10 * 60 * 1000;
export const MISS_TTL_MS = 60 * 1000;
export const ROOT_TIMEOUT_MS = 2500;

export type RootSource = "ZONE" | "HTTP";

export type RootHit = {
  ok: true;
  lane: "TAOHUAYUAN";
  query: string;
  root: typeof TAOHUAYUAN_ROOT.code;
  source: RootSource;
  address?: string;
};

export type RootMiss = {
  ok: false;
  code: "MISS";
  query: string;
  root: typeof TAOHUAYUAN_ROOT.code;
  upload: false;
};

export type RootFault = {
  ok: false;
  code: "NO_ROOT" | "UPSTREAM";
  upload: false;
};

export type RootAnswer = RootHit | RootMiss | RootFault;

export function parseZoneText(text: string): Map<string, string> {
  const rows = new Map<string, string>();
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const [token, answer] = line.split(/\s+/, 2);
    if (!token) continue;
    const screened = screenQuery(token);
    if (!screened.ok) continue;
    const mapped = answer ? screenQuery(answer) : screened;
    if (!mapped.ok) continue;
    rows.set(screened.clean, mapped.clean);
  }
  return rows;
}

export function loadZone(
  env: NodeJS.Dict<string | undefined> = process.env,
  readFile: (path: string) => string = (path) => readFileSync(path, "utf8"),
): Map<string, string> | null {
  if (typeof env.S2_TAOHUAYUAN_ZONE_TEXT === "string") return parseZoneText(env.S2_TAOHUAYUAN_ZONE_TEXT);
  const path = env.S2_TAOHUAYUAN_ZONE?.trim();
  if (!path) return null;
  try {
    return parseZoneText(readFile(path));
  } catch {
    return null;
  }
}

function rootUrl(env: NodeJS.Dict<string | undefined> = process.env): string {
  return (env.S2_TAOHUAYUAN_URL ?? "").trim().replace(/\/$/, "");
}

async function askHttp(
  query: string,
  url: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
): Promise<RootAnswer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ query }),
      signal: controller.signal,
    });
    if (res.status === 404) return { ok: false, code: "MISS", query, root: TAOHUAYUAN_ROOT.code, upload: false };
    if (res.status >= 500) return { ok: false, code: "UPSTREAM", upload: false };
    const body = await res.json().catch(() => null) as { ok?: unknown; code?: unknown; address?: unknown } | null;
    if (!body || typeof body !== "object") return { ok: false, code: "UPSTREAM", upload: false };
    if (body.ok === false && body.code === "MISS") {
      return { ok: false, code: "MISS", query, root: TAOHUAYUAN_ROOT.code, upload: false };
    }
    if (body.ok !== true) return { ok: false, code: "UPSTREAM", upload: false };
    if (typeof body.address === "string") {
      const screened = screenQuery(body.address);
      if (!screened.ok) return { ok: false, code: "UPSTREAM", upload: false };
      return { ok: true, lane: "TAOHUAYUAN", query, root: TAOHUAYUAN_ROOT.code, source: "HTTP", address: screened.clean };
    }
    return { ok: true, lane: "TAOHUAYUAN", query, root: TAOHUAYUAN_ROOT.code, source: "HTTP" };
  } catch {
    return { ok: false, code: "UPSTREAM", upload: false };
  } finally {
    clearTimeout(timer);
  }
}

/** Changde root. Zone is a local replica. HTTP only after the query is already screened. */
export async function askTaohuayuan(input: {
  query: string;
  env?: NodeJS.Dict<string | undefined>;
  fetchImpl?: typeof fetch;
  readFile?: (path: string) => string;
  timeoutMs?: number;
}): Promise<RootAnswer> {
  const screened = screenQuery(input.query);
  if (!screened.ok) return { ok: false, code: "UPSTREAM", upload: false };
  const env = input.env ?? process.env;
  const zone = loadZone(env, input.readFile);
  const mapped = zone?.get(screened.clean);
  if (mapped) {
    return {
      ok: true,
      lane: "TAOHUAYUAN",
      query: screened.clean,
      root: TAOHUAYUAN_ROOT.code,
      source: "ZONE",
      address: mapped === screened.clean ? undefined : mapped,
    };
  }
  const url = rootUrl(env);
  if (url) {
    return askHttp(screened.clean, url, input.fetchImpl ?? fetch, input.timeoutMs ?? ROOT_TIMEOUT_MS);
  }
  if (zone) return { ok: false, code: "MISS", query: screened.clean, root: TAOHUAYUAN_ROOT.code, upload: false };
  return { ok: false, code: "NO_ROOT", upload: false };
}
