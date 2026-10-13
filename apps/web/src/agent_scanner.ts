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

/** Opt-in. The caller supplies the model transport. S2RB never ships an API key. */
export async function auditWithModel(input: {
  did: string;
  publicKey: string;
  history: string;
  grants: string;
  complete: (prompt: string) => Promise<{ ok: boolean; text?: string }>;
}): Promise<{ ok: true; report: LlmAdvice } | { ok: false; code: "LOCAL_REJECT" | "NO_MODEL" }> {
  const scanned = scanPublicPayload({ did: input.did });
  if (!scanned.ok) return scanned;
  const judged = await input.complete(
    `S2RB sandbox\nDID ${scanned.did}\nclass ${scanned.agentClass}\nkey ${input.publicKey}\nhistory ${input.history}\ngrants ${input.grants}\nReturn JSON {"score":0-100,"connect":"ALLOW|DENY","notes":""}`,
  );
  if (!judged.ok || !judged.text) return { ok: false, code: "NO_MODEL" };
  try {
    const report = JSON.parse(judged.text) as LlmAdvice;
    if (report.connect !== "ALLOW" && report.connect !== "DENY") return { ok: false, code: "NO_MODEL" };
    if (typeof report.score !== "number") return { ok: false, code: "NO_MODEL" };
    return { ok: true, report };
  } catch {
    return { ok: false, code: "NO_MODEL" };
  }
}
