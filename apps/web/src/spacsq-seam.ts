/**
 * Deployable seam. Checksum weights stay in the official SPACSQ snapshot
 * under vendor/spacsq/checksum.ts. Do not edit that table here.
 */
export { assembleS2Did, generateS2CheckSum } from "../vendor/spacsq/checksum.ts";
export { parseS2Did, S2_DID_LENGTH } from "../vendor/spacsq/s2-did.ts";

export const HOLOGRAPHIC_RANK = 14 as const;

export function parseAddress(raw: string): {
  ok: true;
  address: string;
  track: "CD-U6A";
  segments: { L1: string; L2: string; L3: string; L4: string; L5: string; L6: string };
} | { ok: false; code: "ADDR_EMPTY" | "ADDR_CHARSET" | "ADDR_L1" | "ADDR_LENGTH" } {
  const address = raw.trim().toUpperCase();
  if (!address) return { ok: false, code: "ADDR_EMPTY" };
  if (!/^[A-Z0-9-]+$/.test(address)) return { ok: false, code: "ADDR_CHARSET" };
  const parts = address.split("-");
  if (parts.length !== 6 || parts[0] !== "SITE") return { ok: false, code: "ADDR_L1" };
  if (address.length > 48) return { ok: false, code: "ADDR_LENGTH" };
  const [L1, L2, L3, L4, L5, L6] = parts as [string, string, string, string, string, string];
  return { ok: true, address, track: "CD-U6A", segments: { L1, L2, L3, L4, L5, L6 } };
}
