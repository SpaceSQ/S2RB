import { readFileSync } from "node:fs";
import { SITE_PLATE } from "./topology.ts";

export type PlateSource = "ARG" | "ENV" | "JOURNAL" | "LAN" | "DEFAULT";

export type PlateHit = {
  address: string;
  source: PlateSource;
};

export type PlateLookup = {
  env?: NodeJS.Dict<string | undefined>;
  readFile?: (path: string) => string;
  fetchImpl?: typeof fetch;
  fallback?: string;
};

export function parseJournalPlate(markdown: string): string | null {
  const match = /^cd_u6a:\s*(\S+)/m.exec(markdown);
  if (!match?.[1]) return null;
  const address = match[1].trim().toUpperCase();
  return SITE_PLATE.test(address) ? address : null;
}

export function resolveLocalPlateSync(lookup: PlateLookup = {}): PlateHit {
  const env = lookup.env ?? process.env;
  const fallback = (lookup.fallback ?? "SITE-GZTIANHE-TIYUXILU-SHEJIDASHA-ROOM01-01").toUpperCase();
  const fromEnv = env.S2_AIOS_ADDRESS?.trim();
  if (fromEnv && SITE_PLATE.test(fromEnv.toUpperCase())) {
    return { address: fromEnv.toUpperCase(), source: "ENV" };
  }
  const journal = env.S2_JOURNAL?.trim();
  const text = env.S2_JOURNAL_TEXT;
  if (typeof text === "string" && text) {
    const plate = parseJournalPlate(text);
    if (plate) return { address: plate, source: "JOURNAL" };
  }
  if (journal) {
    try {
      const read = lookup.readFile ?? ((path: string) => readFileSync(path, "utf8"));
      const plate = parseJournalPlate(read(journal));
      if (plate) return { address: plate, source: "JOURNAL" };
    } catch {
      // house journal is optional on a resolver-only box
    }
  }
  return { address: fallback, source: "DEFAULT" };
}

export async function resolveLocalPlate(lookup: PlateLookup = {}): Promise<PlateHit> {
  const local = resolveLocalPlateSync(lookup);
  if (local.source !== "DEFAULT") return local;
  const env = lookup.env ?? process.env;
  const host = env.S2_AIOS_HOST?.trim();
  if (!host) return local;
  const fetchImpl = lookup.fetchImpl ?? fetch;
  try {
    const res = await fetchImpl(`http://${host}:1884/lan`, { signal: AbortSignal.timeout(400) });
    const body = (await res.json()) as Record<string, unknown>;
    const raw = [body.address, body.cd_u6a, body.full_address].find((item) => typeof item === "string");
    if (typeof raw === "string" && SITE_PLATE.test(raw.toUpperCase())) {
      return { address: raw.toUpperCase(), source: "LAN" };
    }
  } catch {
    // S2 AIOS is not on this box
  }
  return local;
}
