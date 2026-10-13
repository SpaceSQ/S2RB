import { createHmac, timingSafeEqual } from "node:crypto";
import { FUTURE_EXTENSIONS } from "./partners.ts";

export const SPATIAL_AUDIENCE = "s2-spatial-sync";
export const SPATIAL_SCOPE = "space.read";

export type SpatialGrant = {
  iss: string;
  aud: typeof SPATIAL_AUDIENCE;
  sub: string;
  scope: typeof SPATIAL_SCOPE;
  exp: number;
};

export type SpatialPeek = {
  ok: true;
  address?: string;
  excerpt: string;
  truncated: boolean;
  upload: false;
};

export type SpatialDeny = {
  ok: false;
  code: "OIDC_REQUIRED" | "GRANT" | "SCOPE" | "EXPIRED";
  upload: false;
};

const EXCERPT_LIMIT = 1000;

export function signSpatialGrant(grant: SpatialGrant, secret: string): string {
  const body = Buffer.from(JSON.stringify(grant)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function readSpatialGrant(token: string, secret: string, nowMs = Date.now()): SpatialGrant | SpatialDeny {
  const cut = token.lastIndexOf(".");
  if (cut <= 0 || !secret) return { ok: false, code: "GRANT", upload: false };
  const body = token.slice(0, cut);
  const mac = token.slice(cut + 1);
  const expect = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expect);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return { ok: false, code: "GRANT", upload: false };
  }
  try {
    const grant = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SpatialGrant;
    if (grant.aud !== SPATIAL_AUDIENCE) return { ok: false, code: "GRANT", upload: false };
    if (grant.scope !== SPATIAL_SCOPE) return { ok: false, code: "SCOPE", upload: false };
    if (!Number.isFinite(grant.exp) || grant.exp <= nowMs) return { ok: false, code: "EXPIRED", upload: false };
    return grant;
  } catch {
    return { ok: false, code: "GRANT", upload: false };
  }
}

export function spatialSyncGuide() {
  const lane = FUTURE_EXTENSIONS.find((row) => row.module === "SPATIAL");
  return {
    audience: SPATIAL_AUDIENCE,
    scope: SPATIAL_SCOPE,
    excerptLimit: EXCERPT_LIMIT,
    upload: false as const,
    invitation: lane?.invitation ?? "",
    actions: lane?.actions ?? [],
    hosts: lane?.hosts ?? [],
  };
}

/** Chronos excerpt for an authorized glass / Eva-class device. Journal never goes to a public cloud. */
export function peekSpatialContext(input: {
  markdown: string;
  token?: string;
  secret: string;
  nowMs?: number;
}): SpatialPeek | SpatialDeny {
  if (!input.token) return { ok: false, code: "OIDC_REQUIRED", upload: false };
  const grant = readSpatialGrant(input.token, input.secret, input.nowMs);
  if ("ok" in grant && grant.ok === false) return grant;
  const chars = [...input.markdown];
  const truncated = chars.length > EXCERPT_LIMIT;
  return {
    ok: true,
    excerpt: chars.slice(0, EXCERPT_LIMIT).join(""),
    truncated,
    upload: false,
  };
}
