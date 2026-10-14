import { cleanToken, screenDid, type ScreenedDid } from "../../../packages/did/src/index.ts";
import { LOCAL_DOMAINS, TAOHUAYUAN_ROOT, type LocalDomain } from "./config.ts";
import { parseAddress } from "./spacsq-seam.ts";

const HIT_TTL_MS = 10 * 60 * 1000;
const MISS_TTL_MS = 60 * 1000;

export { cleanToken, screenDid, type ScreenedDid } from "../../../packages/did/src/index.ts";

const SITE_PLATE = /^SITE-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-[A-Z0-9]{1,32}-ROOM\d{2}-\d{2}$/;
const RAINBOW_PLATE = /^(MARS|MOON|PHYS|GAME|MYTH)-[A-Z]{2}-\d{3}-[A-Z0-9_]{1,16}-ROOM\d{2}-\d{2}$/;
const BEARINGS = new Set(["CN", "NA", "NE", "EA", "SE", "SA", "SW", "WA", "NW"]);

export type ScreenFault = {
  ok: false;
  code: "LOCAL_REJECT";
  reason: "DID_LENGTH" | "DID_CHARSET" | "DID_CHECKSUM" | "DID_CLASS" | "ADDRESS" | "DOMAIN";
  upload: false;
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
  source?: "ZONE" | "HTTP";
  via?: "LOCAL" | "TAOHUAYUAN";
  cached?: boolean;
  address?: string;
};

export type RootMiss = {
  ok: false;
  code: "MISS";
  query: string;
  root: typeof TAOHUAYUAN_ROOT.code;
  upload: false;
};

export type RootFault = { ok: false; code: "NO_ROOT" | "UPSTREAM"; upload: false };

export type ResolveFault = ScreenFault | RootMiss | RootFault;

export type ResolveResult = ResolveHit | ResolveFault;

export type RootAnswer = ResolveHit | RootMiss | RootFault;

type Cache = {
  get(query: string, nowMs?: number): ResolveHit | RootMiss | undefined;
  putHit(hit: ResolveHit, nowMs?: number): void;
  putMiss(miss: RootMiss, nowMs?: number): void;
  forget(query: string): void;
};

type LocalDump = {
  stash(miss: LocalMiss): void;
};

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

type Stored =
  | { kind: "HIT"; hit: ResolveHit; untilMs: number }
  | { kind: "MISS"; miss: RootMiss; untilMs: number };

export function createMemoryCache(options?: { hitTtlMs?: number; missTtlMs?: number }): Cache & { size: () => number } {
  const map = new Map<string, Stored>();
  const hitTtl = options?.hitTtlMs ?? HIT_TTL_MS;
  const missTtl = options?.missTtlMs ?? MISS_TTL_MS;
  return {
    get(query, nowMs = Date.now()) {
      const row = map.get(query);
      if (!row) return undefined;
      if (row.untilMs <= nowMs) {
        map.delete(query);
        return undefined;
      }
      if (row.kind === "MISS") return row.miss;
      const via = row.hit.lane === "CACHE" ? row.hit.via : row.hit.lane;
      return {
        ...row.hit,
        lane: "CACHE",
        cached: true,
        via: via === "LOCAL" || via === "TAOHUAYUAN" ? via : undefined,
      };
    },
    putHit(hit, nowMs = Date.now()) {
      const stored: ResolveHit = { ...hit, lane: hit.lane === "CACHE" ? hit.via ?? "TAOHUAYUAN" : hit.lane };
      map.set(hit.query, { kind: "HIT", hit: stored, untilMs: nowMs + hitTtl });
    },
    putMiss(miss, nowMs = Date.now()) {
      map.set(miss.query, { kind: "MISS", miss, untilMs: nowMs + missTtl });
    },
    forget(query) {
      map.delete(query);
    },
    size: () => map.size,
  };
}

let processCache: ReturnType<typeof createMemoryCache> | null = null;

export function resolveCache() {
  processCache ??= createMemoryCache();
  return processCache;
}

export function resolveHttpStatus(result: ResolveResult): number {
  if (result.ok) return 200;
  if (result.code === "LOCAL_REJECT") return 422;
  if (result.code === "MISS") return 404;
  return 503;
}

/**
 * Local pre-filter, then cache, then the Taohuayuan root.
 * Failures and non-S2 probes stay in the local dump. They are not a cloud row.
 * A miss or upstream fault is never stored as a hit.
 */
export async function resolveQuery(input: {
  raw: string;
  nowMs?: number;
  cache?: Cache;
  dump?: LocalDump;
  model?: string;
  lookup?: (body: CloudLookup) => Promise<RootAnswer>;
}): Promise<ResolveResult> {
  const nowMs = input.nowMs ?? Date.now();
  const screened = screenQuery(input.raw);
  if (!screened.ok) {
    input.dump?.stash({
      query: cleanToken(input.raw),
      reason: screened.reason,
      atMs: nowMs,
    });
    return screened;
  }
  const cached = input.cache?.get(screened.clean, nowMs);
  if (cached) return cached;
  if (screened.kind === "ADDRESS" && screened.domain === "SITE") {
    const hit: ResolveHit = { ok: true, lane: "LOCAL", query: screened.clean };
    input.cache?.putHit(hit, nowMs);
    return hit;
  }
  const body: CloudLookup = {
    query: screened.clean,
    kind: screened.kind,
    handshake: "HIT",
    model: redactModel(input.model ?? "s2rb"),
  };
  if (!input.lookup) return { ok: false, code: "NO_ROOT", upload: false };
  const asked = await input.lookup(body);
  if (asked.ok) {
    input.cache?.putHit(asked, nowMs);
    return asked;
  }
  if (asked.code === "MISS") input.cache?.putMiss(asked, nowMs);
  return asked;
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
