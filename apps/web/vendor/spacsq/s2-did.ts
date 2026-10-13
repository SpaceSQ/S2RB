/**
 * S2-DID from Taohuayuan addressing v1.1, S²-EIP, and the S2-CheckSum note.
 * 22 characters, no hyphen: 12-character header + 2 weighted letters + 8-digit serial.
 * The checksum note's 10-character tail and 24-character verify length are corrected to this layout.
 * Header: 1 class + 5-character attribute + YYMMDD.
 * A matching checksum shows the string was not altered. It is not world-model enrollment.
 * Class E is the embodied-robot head from ERSAP. I must carry DCARD. A must carry BRAND.
 */

import { generateS2CheckSum } from "./checksum.ts";

export const S2_DID_LENGTH = 22 as const;

export const DID_CLASS = Object.freeze({
  R: { role: "real_human", heartbeat: "sovereign" },
  D: { role: "digital_human", heartbeat: "5m" },
  V: { role: "native_agent", heartbeat: "5m" },
  I: { role: "wild_agent", heartbeat: "3_per_day", attribute: "DCARD" },
  A: { role: "brand_avatar", heartbeat: "contract", attribute: "BRAND" },
  E: { role: "embodied_robot", heartbeat: "hardware_breaker" },
} as const);

export type DidClass = keyof typeof DID_CLASS;

export type DidErrorCode =
  | "DID_LENGTH"
  | "DID_HYPHEN"
  | "DID_CHARSET"
  | "DID_CLASS"
  | "DID_ATTRIBUTE"
  | "DID_STAMP"
  | "DID_CHECKSUM"
  | "DID_SERIAL";

export type DidRejection = { ok: false; code: DidErrorCode };

export type S2Did = {
  ok: true;
  did: string;
  header: string;
  checksum: string;
  serial: string;
  agentClass: DidClass;
  role: (typeof DID_CLASS)[DidClass]["role"];
  heartbeat: string;
  attribute: string;
  stamp: string;
  checksumStatus: "verified";
  weightedSumVerified: boolean;
  worldModelVerified: false;
};

export function parseS2Did(input: string): S2Did | DidRejection {
  const did = input.trim().toUpperCase();
  if (did.includes("-")) return { ok: false, code: "DID_HYPHEN" };
  if (did.length !== S2_DID_LENGTH) return { ok: false, code: "DID_LENGTH" };
  if (!/^[A-Z0-9]+$/.test(did)) return { ok: false, code: "DID_CHARSET" };

  const agentClass = did.slice(0, 1);
  if (!isDidClass(agentClass)) return { ok: false, code: "DID_CLASS" };
  const attribute = did.slice(1, 6);
  const stamp = did.slice(6, 12);
  const checksum = did.slice(12, 14);
  const serial = did.slice(14);
  const rule = DID_CLASS[agentClass];

  if ("attribute" in rule && attribute !== rule.attribute) {
    return { ok: false, code: "DID_ATTRIBUTE" };
  }
  if (!/^\d{6}$/.test(stamp) || !plausibleStamp(stamp)) {
    return { ok: false, code: "DID_STAMP" };
  }
  if (!/^[A-Z]{2}$/.test(checksum)) return { ok: false, code: "DID_CHECKSUM" };

  const header = did.slice(0, 12);
  if (!/^\d{8}$/.test(serial)) return { ok: false, code: "DID_SERIAL" };
  if (generateS2CheckSum(header, serial) !== checksum) return { ok: false, code: "DID_CHECKSUM" };
  return accepted(did, header, checksum, serial, agentClass, rule, attribute, stamp, "verified", true);
}

function accepted(
  did: string,
  header: string,
  checksum: string,
  serial: string,
  agentClass: DidClass,
  rule: (typeof DID_CLASS)[DidClass],
  attribute: string,
  stamp: string,
  checksumStatus: S2Did["checksumStatus"],
  weightedSumVerified: boolean,
): S2Did {
  return {
    ok: true,
    did,
    header,
    checksum,
    serial,
    agentClass,
    role: rule.role,
    heartbeat: rule.heartbeat,
    attribute,
    stamp,
    checksumStatus,
    weightedSumVerified,
    worldModelVerified: false,
  };
}

function isDidClass(value: string): value is DidClass {
  return value in DID_CLASS;
}

function plausibleStamp(stamp: string): boolean {
  const month = Number(stamp.slice(2, 4));
  const day = Number(stamp.slice(4, 6));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}
