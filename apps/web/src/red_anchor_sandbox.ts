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

export type FuseName =
  | "LUMINA_LUX"
  | "ATMOS_TEMP"
  | "ACOUSTIC_DB"
  | "WAVE_DBM"
  | "ENERGY_WATT"
  | "VISION_STATE"
  | "OXYGEN_PERCENT"
  | "PRESSURE_KPA"
  | "ODOR_VOC"
  | "TACTILE_NEWTON"
  | "MAGNETIC_UT"
  | "GRAVITY_G"
  | "WATER_LEAK"
  | "FOOD_SPOIL"
  | "RANK"
  | "FOREIGN_AXIS"
  | "MAINS";

/** Visa bands for a visitor handshake. Units follow the S2 XR describe port. */
export const AXIS_BANDS: Record<RadarAxis, { min?: number; max?: number; fuse: FuseName; unit: string }> = {
  lumina: { min: 1, max: 100_000, fuse: "LUMINA_LUX", unit: "lx" },
  atmos: { min: 5, max: 45, fuse: "ATMOS_TEMP", unit: "C" },
  acoustic: { max: 85, fuse: "ACOUSTIC_DB", unit: "dB" },
  wave: { max: 30, fuse: "WAVE_DBM", unit: "dBm" },
  energy: { max: 3000, fuse: "ENERGY_WATT", unit: "W" },
  vision: { min: 0, max: 1, fuse: "VISION_STATE", unit: "state" },
  base_air: { min: OXYGEN_PERCENT_MIN, fuse: "OXYGEN_PERCENT", unit: "%" },
  pressure: { min: 80, max: 120, fuse: "PRESSURE_KPA", unit: "kPa" },
  odor: { max: 200, fuse: "ODOR_VOC", unit: "index" },
  tactile: { max: TACTILE_NEWTON_MAX, fuse: "TACTILE_NEWTON", unit: "N" },
  magnetic: { max: 2000, fuse: "MAGNETIC_UT", unit: "uT" },
  gravity: { min: 0.5, max: 1.5, fuse: "GRAVITY_G", unit: "g" },
  water: { max: 0.2, fuse: "WATER_LEAK", unit: "ratio" },
  food: { max: 0.8, fuse: "FOOD_SPOIL", unit: "spoil" },
};

export const SAFE_RADAR: RadarFrame = {
  lumina: 80,
  atmos: 22,
  acoustic: 40,
  wave: -40,
  energy: 60,
  vision: 0,
  base_air: 21,
  pressure: 101,
  odor: 10,
  tactile: 1,
  magnetic: 40,
  gravity: 1,
  water: 0,
  food: 0.1,
};

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

function tripBand(axis: RadarAxis, reading: number): FuseTrip | null {
  const band = AXIS_BANDS[axis];
  if (typeof band.min === "number" && reading < band.min) return veto(band.fuse, axis, reading);
  if (typeof band.max === "number" && reading > band.max) return veto(band.fuse, axis, reading);
  return null;
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
  for (const axis of RADAR_AXES) {
    const reading = clean[axis];
    if (typeof reading !== "number") continue;
    const tripped = tripBand(axis, reading);
    if (tripped) return tripped;
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
