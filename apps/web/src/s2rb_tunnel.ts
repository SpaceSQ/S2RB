import { screenDid } from "../../../packages/did/src/index.ts";

export type TunnelLetter = {
  toDid: string;
  fromDid: string;
  body: string;
  atMs: number;
};

export const MAIL_FILTER = "S2/rainbow/+/mail";

export function mqttAddress(did: string): { ok: true; topic: string } | { ok: false; code: "LOCAL_REJECT" } {
  const screened = screenDid(did);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT" };
  return { ok: true, topic: `S2/rainbow/${screened.clean}/mail` };
}

export function didFromMailTopic(topic: string): string | null {
  const match = /^S2\/rainbow\/([A-Z0-9]{22})\/mail$/.exec(topic);
  if (!match?.[1]) return null;
  const screened = screenDid(match[1]);
  return screened.ok ? screened.clean : null;
}

export function parseMailLetter(raw: unknown): TunnelLetter | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (typeof row.toDid !== "string" || typeof row.fromDid !== "string" || typeof row.body !== "string") return null;
  const to = screenDid(row.toDid);
  const from = screenDid(row.fromDid);
  if (!to.ok || !from.ok) return null;
  const atMs = typeof row.atMs === "number" && Number.isFinite(row.atMs) ? row.atMs : Date.now();
  return { toDid: to.clean, fromDid: from.clean, body: row.body, atMs };
}

/** Offline-async mailbox. Ciphertext stays on the bridge host, never in Supabase chat tables. */
export function createMailbox() {
  const letters: TunnelLetter[] = [];
  return {
    letters,
    post(letter: TunnelLetter) {
      const parsed = parseMailLetter(letter);
      if (!parsed) return { ok: false as const, code: "LOCAL_REJECT" as const };
      if (letters.some((row) => row.atMs === parsed.atMs && row.toDid === parsed.toDid && row.fromDid === parsed.fromDid && row.body === parsed.body)) {
        return { ok: true as const, queued: letters.length };
      }
      letters.unshift(parsed);
      if (letters.length > 50) letters.length = 50;
      return { ok: true as const, queued: letters.length };
    },
    pull(did: string) {
      const screened = screenDid(did);
      if (!screened.ok) return [];
      return letters.filter((row) => row.toDid === screened.clean);
    },
  };
}

/** Realtime media punches through. S2RB does not copy the stream. */
export function openMediaHole(): { ok: true; relay: "NONE"; store: false } {
  return { ok: true, relay: "NONE", store: false };
}
