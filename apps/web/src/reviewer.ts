import { REVIEWER_EMAIL } from "./config.ts";
import { assembleS2Did, parseS2Did } from "./spacsq-seam.ts";

export type VirtualDevice = {
  did: string;
  agentClass: string;
  title: string;
};

export function isReviewer(email: string): boolean {
  return email.trim().toLowerCase() === REVIEWER_EMAIL;
}

/** Skip LAN. Inject checksum-valid 22-char DIDs so the reviewer UI can walk the desk. */
export function reviewerFleet(_now = new Date(2025, 9, 9)): VirtualDevice[] {
  return [
    device("DHOME1251009", "00000001", "Throne"),
    device("VAGENT251009", "00000021", "Visitor"),
    device("IDCARD251009", "00000031", "Instrument"),
  ];
}

export function openReviewerSession(email: string, now?: Date) {
  if (!isReviewer(email)) return { ok: false as const, code: "NOT_REVIEWER" as const, lan: true as const };
  return {
    ok: true as const,
    lan: false as const,
    fleet: reviewerFleet(now),
  };
}

function device(header: string, serial: string, title: string): VirtualDevice {
  const did = assembleS2Did(header, serial);
  if (!did) throw new Error("REVIEWER_DID");
  const parsed = parseS2Did(did);
  if (!parsed.ok || parsed.did.length !== 22) throw new Error("REVIEWER_DID");
  return { did: parsed.did, agentClass: parsed.agentClass, title };
}
