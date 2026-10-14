import vm from "node:vm";
import { SITE_PLATE, WORKBENCH_SEATS } from "./topology.ts";

export const FORBIDDEN_SKILL = /\b(fetch|require|import\s*\(|process\.|child_process|fs\.|net\.|dgram|WebSocket|eval\(|Function\s*\(|Deno\.|Bun\.)/;

export type SkillManifest = {
  name: string;
  plate: string;
  seat: number;
  read: readonly string[];
  actuate: readonly string[];
};

export type SkillRecord = SkillManifest & {
  source: string;
  mains: "deenergized";
};

export type SkillFault = {
  ok: false;
  code: "MANIFEST" | "THRONE" | "ADDRESS" | "SANDBOX" | "SKILL";
  upload: false;
  mains: "deenergized";
};

export function auditSkillSource(source: string): { ok: true } | { ok: false; code: "SANDBOX" } {
  if (!source.trim() || FORBIDDEN_SKILL.test(source)) return { ok: false, code: "SANDBOX" };
  return { ok: true };
}

export function admitSkill(input: {
  name?: unknown;
  plate?: unknown;
  seat?: unknown;
  source?: unknown;
  read?: unknown;
  actuate?: unknown;
}): { ok: true; record: SkillRecord } | SkillFault {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const plate = typeof input.plate === "string" ? input.plate.trim().toUpperCase() : "";
  const source = typeof input.source === "string" ? input.source : "";
  const seat = typeof input.seat === "number" ? input.seat : Number(input.seat);
  const read = Array.isArray(input.read) ? input.read.filter((item): item is string => typeof item === "string") : [];
  const actuate = Array.isArray(input.actuate) ? input.actuate.filter((item): item is string => typeof item === "string") : [];
  if (!name || !Number.isInteger(seat)) return { ok: false, code: "MANIFEST", upload: false, mains: "deenergized" };
  if (seat === 1) return { ok: false, code: "THRONE", upload: false, mains: "deenergized" };
  if (!(WORKBENCH_SEATS as readonly number[]).includes(seat)) return { ok: false, code: "MANIFEST", upload: false, mains: "deenergized" };
  if (!SITE_PLATE.test(plate)) return { ok: false, code: "ADDRESS", upload: false, mains: "deenergized" };
  if (!auditSkillSource(source).ok) return { ok: false, code: "SANDBOX", upload: false, mains: "deenergized" };
  return {
    ok: true,
    record: { name, plate, seat, source, read, actuate, mains: "deenergized" },
  };
}

export function runAdmittedSkill(record: SkillRecord): { ok: true; mains: "deenergized"; actuation: "TRUSTZONE"; upload: false } | SkillFault {
  if (!auditSkillSource(record.source).ok) return { ok: false, code: "SANDBOX", upload: false, mains: "deenergized" };
  try {
    const context = vm.createContext({
      requestActuation(_request: { axis?: string } = {}) {
        return { accepted: false, code: "TRUSTZONE", mains: "deenergized" };
      },
    });
    new vm.Script(record.source).runInContext(context, { timeout: 40 });
  } catch {
    return { ok: false, code: "SANDBOX", upload: false, mains: "deenergized" };
  }
  return { ok: true, mains: "deenergized", actuation: "TRUSTZONE", upload: false };
}

export function createSkillCatalog() {
  const rows = new Map<string, SkillRecord>();
  return {
    install(input: Parameters<typeof admitSkill>[0]) {
      const admitted = admitSkill(input);
      if (!admitted.ok) return admitted;
      const key = `${admitted.record.plate}:${admitted.record.seat}:${admitted.record.name}`;
      rows.set(key, admitted.record);
      return { ok: true as const, key, skill: { ...admitted.record, source: undefined }, mains: "deenergized" as const, upload: false as const };
    },
    run(input: { name?: unknown; plate?: unknown; seat?: unknown }) {
      const plate = typeof input.plate === "string" ? input.plate.trim().toUpperCase() : "";
      const name = typeof input.name === "string" ? input.name.trim() : "";
      const seat = typeof input.seat === "number" ? input.seat : Number(input.seat);
      const record = rows.get(`${plate}:${seat}:${name}`);
      if (!record) return { ok: false as const, code: "SKILL" as const, upload: false as const, mains: "deenergized" as const };
      return runAdmittedSkill(record);
    },
    list() {
      return {
        ok: true as const,
        throne: { grid: 1, rentable: false as const },
        workbenches: WORKBENCH_SEATS,
        skills: [...rows.values()].map((row) => ({ name: row.name, plate: row.plate, seat: row.seat, read: row.read, actuate: row.actuate })),
        mains: "deenergized" as const,
        upload: false as const,
      };
    },
  };
}

let catalog: ReturnType<typeof createSkillCatalog> | null = null;

export function skillCatalog() {
  catalog ??= createSkillCatalog();
  return catalog;
}
