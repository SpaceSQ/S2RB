import { HOLOGRAPHIC_RANK } from "./spacsq-seam.ts";

/** Fourteen protocol axes. Same names as the edge tensor. Rank stays 14. */
export const RADAR_AXES = [
  "lumina",
  "atmos",
  "acoustic",
  "wave",
  "energy",
  "vision",
  "base_air",
  "pressure",
  "odor",
  "tactile",
  "magnetic",
  "gravity",
  "water",
  "food",
] as const;

export type RadarAxis = (typeof RADAR_AXES)[number];
export type RadarFrame = Partial<Record<RadarAxis, number>>;

export const TACTILE_NEWTON_MAX = 5;
export const OXYGEN_PERCENT_MIN = 19.5;
export const VETO_MARKER = "[VETO_SECURITY]";

export type FuseName = "TACTILE_NEWTON" | "OXYGEN_PERCENT" | "RANK" | "FOREIGN_AXIS" | "MAINS";

export type FuseTrip = {
  ok: false;
  code: "VETO_SECURITY";
  marker: typeof VETO_MARKER;
  fuse: FuseName;
  axis?: RadarAxis;
  reading?: number;
  upload: false;
  mains: "deenergized";
};

export type FuseClear = {
  ok: true;
  rank: typeof HOLOGRAPHIC_RANK;
  frame: RadarFrame;
  mains: "deenergized";
};

export type LanSighting = {
  kind: "UDP" | "QR";
  did?: string;
  url?: string;
  atMs: number;
};

function veto(fuse: FuseName, axis?: RadarAxis, reading?: number): FuseTrip {
  return {
    ok: false,
    code: "VETO_SECURITY",
    marker: VETO_MARKER,
    fuse,
    axis,
    reading,
    upload: false,
    mains: "deenergized",
  };
}

export function inspectRadar(frame: Record<string, unknown>): FuseClear | FuseTrip {
  if (RADAR_AXES.length !== HOLOGRAPHIC_RANK) return veto("RANK");
  const incoming = { ...frame };
  if (typeof incoming.oxygen === "number" && incoming.base_air === undefined) {
    incoming.base_air = incoming.oxygen;
    delete incoming.oxygen;
  }
  const clean: RadarFrame = {};
  for (const key of Object.keys(incoming)) {
    if (!RADAR_AXES.includes(key as RadarAxis)) return veto("FOREIGN_AXIS");
    const value = incoming[key];
    if (typeof value !== "number" || !Number.isFinite(value)) return veto("FOREIGN_AXIS", key as RadarAxis);
    clean[key as RadarAxis] = value;
  }
  const tactile = clean.tactile;
  if (typeof tactile === "number" && tactile > TACTILE_NEWTON_MAX) {
    return veto("TACTILE_NEWTON", "tactile", tactile);
  }
  const oxygen = clean.base_air ?? clean.atmos;
  if (typeof oxygen === "number" && oxygen < OXYGEN_PERCENT_MIN) {
    return veto("OXYGEN_PERCENT", clean.base_air !== undefined ? "base_air" : "atmos", oxygen);
  }
  return {
    ok: true,
    rank: HOLOGRAPHIC_RANK,
    frame: clean,
    mains: "deenergized",
  };
}

/** Handshake physicals. A tripped fuse cuts the link before any agent session. */
export function admitContact(input: {
  radar: Record<string, unknown>;
  energizeMains?: boolean;
}): FuseClear | FuseTrip {
  if (input.energizeMains) return veto("MAINS");
  return inspectRadar(input.radar);
}

export function createLocalTopology() {
  const sightings: LanSighting[] = [];
  return {
    sightings,
    remember(row: LanSighting) {
      sightings.push(row);
    },
    snapshot() {
      return sightings.map((row) => ({ ...row }));
    },
    cloudPayload() {
      return { topology: null, upload: false as const };
    },
  };
}
