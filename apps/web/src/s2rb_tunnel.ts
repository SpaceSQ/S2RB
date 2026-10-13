import { screenDid } from "./s2rb_dns_root.ts";

export type TunnelLetter = {
  toDid: string;
  fromDid: string;
  body: string;
  atMs: number;
};

export function mqttAddress(did: string): { ok: true; topic: string } | { ok: false; code: "LOCAL_REJECT" } {
  const screened = screenDid(did);
  if (!screened.ok) return { ok: false, code: "LOCAL_REJECT" };
  return { ok: true, topic: `S2/rainbow/${screened.clean}/mail` };
}

/** Offline-async mailbox. Ciphertext stays on the bridge host, never in Supabase chat tables. */
export function createMailbox() {
  const letters: TunnelLetter[] = [];
  return {
    letters,
    post(letter: TunnelLetter) {
      if (!screenDid(letter.toDid).ok || !screenDid(letter.fromDid).ok) {
        return { ok: false as const, code: "LOCAL_REJECT" as const };
      }
      letters.push(letter);
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
