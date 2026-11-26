import { BoundaryExitEvent, ChronicleEvent, MerkleInclusionProof } from './types.js';
export declare const CONTAINER_DIMENSIONS_M: Readonly<{
  widthM: 2.0;
  depthM: 2.0;
  heightM: 2.4;
  volumeM3: 9.6;
}>;
export declare function sha256Hex(domain: string, payload: string): string;
export declare class ChronicleMerkleLedger {
  events: ChronicleEvent[];
  merkleRoot: string;
  constructor(s2Did: string, originSuns: string, genesisTimestampMs?: number);
  verifyIntegrity(): boolean;
  generateInclusionProof(leafIndex: number): MerkleInclusionProof;
  static verifyInclusionProof(proof: MerkleInclusionProof): boolean;
}
export declare class CharacterContainer9m6 {
  s2Did: string;
  constructor(config: Record<string, unknown>);
  computeGameOverlay(): Record<string, number>;
  solveBoundaryExit(params: Record<string, unknown>): BoundaryExitEvent | null;
  toContainerManifest(): Record<string, unknown>;
}
