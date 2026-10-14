import { screenDid } from "./s2rb_dns_root.ts";

export type ScanReport = {
  ok: true;
  did: string;
  agentClass: string;
  lane: "LOCAL";
} | {
  ok: false;
  code: "LOCAL_REJECT";
  upload: false;
};

/** Public payload only. Non-standard DID bytes are dropped here. */
export function scanPublicPayload(payload: { did?: unknown }): ScanReport {
  if (typeof payload.did !== "string") return { ok: false, code: "LOCAL_REJECT", upload: false };
  const screened = screenDid(payload.did);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT", upload: false };
  if (screened.agentClass !== "D" && screened.agentClass !== "V" && screened.agentClass !== "I") {
    return { ok: false, code: "LOCAL_REJECT", upload: false };
  }
  return { ok: true, did: screened.clean, agentClass: screened.agentClass, lane: "LOCAL" };
}

export type LlmAdvice = {
  score: number;
  connect: "ALLOW" | "DENY";
  notes: string;
};

export type ModelComplete = (prompt: string) => Promise<{ ok: boolean; text?: string }>;

export function parseLlmAdvice(text: string): LlmAdvice | null {
  try {
    const report = JSON.parse(text) as LlmAdvice;
    if (report.connect !== "ALLOW" && report.connect !== "DENY") return null;
    if (typeof report.score !== "number" || !Number.isFinite(report.score)) return null;
    return {
      score: Math.min(100, Math.max(0, report.score)),
      connect: report.connect,
      notes: typeof report.notes === "string" ? report.notes.slice(0, 240) : "",
    };
  } catch {
    return null;
  }
}

/** Caller-hosted complete URL. S2RB never ships a model API key. */
export function modelTransportFromEnv(
  env: NodeJS.Dict<string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): ModelComplete | null {
  const url = env.S2_AUDIT_COMPLETE_URL?.trim();
  if (!url) return null;
  const token = env.S2_AUDIT_COMPLETE_TOKEN?.trim();
  return async (prompt: string) => {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ prompt }),
    });
    return { ok: res.ok, text: await res.text() };
  };
}

export function buildAuditPrompt(input: { did: string; agentClass: string; publicKey: string; history: string; grants: string }): string {
  return `S2RB sandbox\nDID ${input.did}\nclass ${input.agentClass}\nkey ${input.publicKey}\nhistory ${input.history}\ngrants ${input.grants}\nReturn JSON {"score":0-100,"connect":"ALLOW|DENY","notes":""}`;
}

/** Opt-in. The caller supplies the model transport. S2RB never ships an API key. */
export async function auditWithModel(input: {
  did: string;
  publicKey: string;
  history: string;
  grants: string;
  complete?: ModelComplete;
}): Promise<{ ok: true; report: LlmAdvice; prompt: string } | { ok: false; code: "LOCAL_REJECT" | "NO_MODEL"; upload?: false }> {
  const scanned = scanPublicPayload({ did: input.did });
  if (!scanned.ok) return scanned;
  const complete = input.complete ?? modelTransportFromEnv();
  if (!complete) return { ok: false, code: "NO_MODEL" };
  const prompt = buildAuditPrompt({
    did: scanned.did,
    agentClass: scanned.agentClass,
    publicKey: input.publicKey,
    history: input.history,
    grants: input.grants,
  });
  const judged = await complete(prompt);
  if (!judged.ok || !judged.text) return { ok: false, code: "NO_MODEL" };
  const report = parseLlmAdvice(judged.text);
  if (!report) return { ok: false, code: "NO_MODEL" };
  return { ok: true, report, prompt };
}
