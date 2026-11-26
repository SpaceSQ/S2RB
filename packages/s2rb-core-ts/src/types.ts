export type S2Category = 'HUMAN' | 'SILICON' | 'SPACE' | 'THING' | 'ORG' | 'RULE' | 'MYTH';
export type SpeciesClass = 'D' | 'V' | 'I' | 'A';

export type ElementCode =
  | 'E01_LUMINA'
  | 'E02_ATMOS'
  | 'E03_ACOUSTIC'
  | 'E04_THERMAL'
  | 'E05_MOMENTUM'
  | 'E06_METABOLIC'
  | 'E07_BIOSENSOR'
  | 'E08_WAVE'
  | 'E09_ODOR'
  | 'E10_VIBRATION'
  | 'E11_HYDRO_NUTRIENT'
  | 'E12_LOGIC_MEMORY'
  | 'E13_SOCIAL_TRUST'
  | 'E14_CARBON_SOVEREIGNTY';

export type WorldTrustTier =
  | 'TIER_1_AUTHORITATIVE'
  | 'TIER_2_PARTNER_VERIFIED'
  | 'TIER_3_LOCAL_SANDBOX';

export type EnvelopeVisibilityMode =
  | 'CEREMONY_VISIBLE'
  | 'STEALTH_GAMEPLAY_INVISIBLE'
  | 'USER_INSPECT_OVERLAY'
  | 'SYSTEM_TELEMETRY_WAKEUP';

export interface SpatialBounds9m6 {
  readonly widthM: 2.0;
  readonly depthM: 2.0;
  readonly heightM: 2.4;
  readonly volumeM3: 9.6;
}

export interface BoundaryExitEvent {
  skillOrWeaponId: string;
  exitPointLocalM: [number, number, number];
  exitPointWorldM: [number, number, number];
  directionUnitVec: [number, number, number];
  exitFace: '+X' | '-X' | '+Y' | '-Y' | '+Z' | '-Z';
  remainingRangeM: number;
  targetAoeRadiusM: number;
}

export interface ChronicleEvent {
  seqNo: number;
  timestampEpochMs: number;
  worldSuns: string;
  trustTier: WorldTrustTier;
  kind: string;
  summaryPayload: string;
  prevEventHash: string;
  eventHash: string;
}

export interface MerkleInclusionProof {
  leafIndex: number;
  leafEventHash: string;
  siblingHashes: Array<{ siblingIsRight: boolean; hashHex: string }>;
  merkleRoot: string;
}
