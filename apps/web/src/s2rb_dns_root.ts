import { LOCAL_DOMAINS, TAOHUAYUAN_ROOT, type LocalDomain } from "./config.ts";
import { generateS2CheckSum, parseAddress, parseS2Did, S2_DID_LENGTH } from "./spacsq-seam.ts";

const DID_CHAR = /^[A-Z0-9]{22}$/;
const SITE_PLATE = /^SITE-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-ROOM\d{2}-\d{2}$/;
const RAINBOW_PLATE = /^(MARS|MOON|PHYS|GAME|MYTH)-[A-Z]{2}-\d{3}-[A-Z0-9_]{1,16}-ROOM\d{2}-\d{2}$/;
const BEARINGS = new Set(["CN", "NA", "NE", "EA", "SE", "SA", "SW", "WA", "NW"]);

export type ScreenFault = {
  ok: false;
  code: "LOCAL_REJECT";
  reason: "DID_LENGTH" | "DID_CHARSET" | "DID_CHECKSUM" | "DID_CLASS" | "ADDRESS" | "DOMAIN";
  upload: false;
};

export type ScreenedDid = {
  ok: true;
  kind: "DID";
  clean: string;
  agentClass: string;
};

export type ScreenedAddress = {
  ok: true;
  kind: "ADDRESS";
  clean: string;
  domain: LocalDomain;
};

export type LocalMiss = {
  query: string;
  reason: ScreenFault["reason"];
  atMs: number;
};

export type CloudLookup = {
  query: string;
  kind: "DID" | "ADDRESS";
  handshake: "HIT";
  model: string;
};

export type ResolveHit = {
  ok: true;
  lane: "CACHE" | "LOCAL" | "TAOHUAYUAN";
  query: string;
  root?: typeof TAOHUAYUAN_ROOT.code;
};

type Cache = {
  get(query: string): ResolveHit | undefined;
  put(hit: ResolveHit): void;
};

type LocalDump = {
  stash(miss: LocalMiss): void;
};

export function cleanToken(raw: string): string {
  return raw.trim().toUpperCase();
}

/** First gate. Dirty tokens never reach fetch(). */
export function screenDid(raw: string): ScreenedDid | ScreenFault {
  const clean = cleanToken(raw);
  if (clean.length !== S2_DID_LENGTH || clean.length !== 22) {
    return { ok: false, code: "LOCAL_REJECT", reason: "DID_LENGTH", upload: false };
  }
  if (!DID_CHAR.test(clean)) {
    return { ok: false, code: "LOCAL_REJECT", reason: "DID_CHARSET", upload: false };
  }
  const parsed = parseS2Did(clean);
  if (!parsed.ok) {
    return { ok: false, code: "LOCAL_REJECT", reason: "DID_CHECKSUM", upload: false };
  }
  const seal = generateS2CheckSum(parsed.header, parsed.serial);
  if (!seal || seal !== parsed.checksum) {
    return { ok: false, code: "LOCAL_REJECT", reason: "DID_CHECKSUM", upload: false };
  }
  if (parsed.agentClass !== "D" && parsed.agentClass !== "V" && parsed.agentClass !== "I" && parsed.agentClass !== "R" && parsed.agentClass !== "A" && parsed.agentClass !== "E") {
    return { ok: false, code: "LOCAL_REJECT", reason: "DID_CLASS", upload: false };
  }
  return { ok: true, kind: "DID", clean, agentClass: parsed.agentClass };
}

export function screenAddress(raw: string): ScreenedAddress | ScreenFault {
  const clean = cleanToken(raw);
  if (SITE_PLATE.test(clean)) {
    const parsed = parseAddress(clean);
    if (!parsed.ok || parsed.segments.L1 !== "SITE") {
      return { ok: false, code: "LOCAL_REJECT", reason: "ADDRESS", upload: false };
    }
    return { ok: true, kind: "ADDRESS", clean, domain: "SITE" };
  }
  if (!RAINBOW_PLATE.test(clean)) {
    return { ok: false, code: "LOCAL_REJECT", reason: "ADDRESS", upload: false };
  }
  const domain = clean.slice(0, clean.indexOf("-")) as LocalDomain;
  if (!LOCAL_DOMAINS.includes(domain) || domain === "SITE") {
    return { ok: false, code: "LOCAL_REJECT", reason: "DOMAIN", upload: false };
  }
  const bearing = clean.split("-")[1] ?? "";
  if (!BEARINGS.has(bearing)) {
    return { ok: false, code: "LOCAL_REJECT", reason: "ADDRESS", upload: false };
  }
  return { ok: true, kind: "ADDRESS", clean, domain };
}

export function screenQuery(raw: string): ScreenedDid | ScreenedAddress | ScreenFault {
  const clean = cleanToken(raw);
  if (clean.includes("-")) return screenAddress(clean);
  return screenDid(clean);
}

export function createMemoryDump(): LocalDump & { rows: LocalMiss[] } {
  const rows: LocalMiss[] = [];
  return {
    rows,
    stash(miss) {
      rows.push(miss);
    },
  };
}

export function createMemoryCache(): Cache & { size: () => number } {
  const map = new Map<string, ResolveHit>();
  return {
    get: (query) => map.get(query),
    put(hit) {
      map.set(hit.query, hit);
    },
    size: () => map.size,
  };
}

/**
 * Local pre-filter, then cache, then the Taohuayuan root.
 * Failures and non-S2 probes stay in the local dump. They are not a cloud row.
 */
export async function resolveQuery(input: {
  raw: string;
  nowMs?: number;
  cache?: Cache;
  dump?: LocalDump;
  model?: string;
  lookup?: (body: CloudLookup) => Promise<ResolveHit>;
}): Promise<ResolveHit | ScreenFault> {
  const screened = screenQuery(input.raw);
  if (!screened.ok) {
    input.dump?.stash({
      query: cleanToken(input.raw),
      reason: screened.reason,
      atMs: input.nowMs ?? Date.now(),
    });
    return screened;
  }
  const cached = input.cache?.get(screened.clean);
  if (cached) return cached;
  if (screened.kind === "ADDRESS" && screened.domain === "SITE") {
    const hit: ResolveHit = { ok: true, lane: "LOCAL", query: screened.clean };
    input.cache?.put(hit);
    return hit;
  }
  const body: CloudLookup = {
    query: screened.clean,
    kind: screened.kind,
    handshake: "HIT",
    model: redactModel(input.model ?? "s2rb"),
  };
  if (!input.lookup) {
    const hit: ResolveHit = { ok: true, lane: "TAOHUAYUAN", query: screened.clean, root: TAOHUAYUAN_ROOT.code };
    input.cache?.put(hit);
    return hit;
  }
  const hit = await input.lookup(body);
  input.cache?.put(hit);
  return hit;
}

export function redactModel(model: string): string {
  return model.replace(/[^A-Z0-9._-]/gi, "").slice(0, 32) || "s2rb";
}

/** SDK tripwire: a caller that still wants fetch() must pass this gate first. */
export function allowCloudFetch(raw: string): { ok: true; clean: string } | { ok: false; code: "LOCAL_REJECT" } {
  const screened = screenQuery(raw);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT" };
  return { ok: true, clean: screened.clean };
}

/** Network layer. Dirty DID/address never reaches fetch(). */
export async function guardedFetch(
  raw: string,
  fetchImpl: typeof fetch,
  url: string,
): Promise<{ ok: true; clean: string; sent: true; status: number } | { ok: false; code: "LOCAL_REJECT"; upload: false; sent: false }> {
  const screened = raw.includes("-") ? screenAddress(raw) : screenDid(raw);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT", upload: false, sent: false };
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query: screened.clean }),
  });
  return { ok: true, clean: screened.clean, sent: true, status: res.status };
}
