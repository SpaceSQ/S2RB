import { generateS2CheckSum } from "./checksum.ts";
import { parseS2Did, S2_DID_LENGTH } from "./s2-did.ts";

const DID_CHAR = /^[A-Z0-9]{22}$/;

export type ScreenFault = {
  ok: false;
  code: "LOCAL_REJECT";
  reason: "DID_LENGTH" | "DID_CHARSET" | "DID_CHECKSUM" | "DID_CLASS";
  upload: false;
};

export type ScreenedDid = {
  ok: true;
  kind: "DID";
  clean: string;
  agentClass: string;
};

export function cleanToken(raw: string): string {
  return raw.trim().toUpperCase();
}

/** First gate. Dirty tokens never reach fetch() or a whitelist write. */
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
