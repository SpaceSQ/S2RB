export declare const TRANSIT_DEADMAN_TIMEOUT_MS: 3000;
export declare class Host7DimGovernanceFilter {
  static validateManifest(manifest: Record<string, unknown>): boolean;
  static projectContainer(container: unknown, manifest: Record<string, unknown>): Record<string, unknown>;
}
export declare class Singleton2PcBridge {
  highestFencingToken: number;
  state: Record<string, unknown>;
  constructor(container: unknown, initialNowMs?: number);
  beginFreezeAndExtract(params: Record<string, unknown>): Record<string, unknown>;
  commitSourceDespawn(params: Record<string, unknown>): Record<string, unknown>;
  commitTargetRebirth(params: Record<string, unknown>): Record<string, unknown>;
  rollbackToGenesisSanctuary(reason?: string, nowMs?: number): Record<string, unknown>;
}
export declare class PNCounterCrdt {
  increment(branchId: string, delta: number): void;
  decrement(branchId: string, delta: number): void;
  value(): number;
  clone(): PNCounterCrdt;
  mergeFrom(other: PNCounterCrdt): this;
}
export declare class ORSetCrdt {
  add(item: string, uniqueTag: string): void;
  removeObserved(item: string): void;
  elements(): string[];
  clone(): ORSetCrdt;
  mergeFrom(other: ORSetCrdt): this;
}
export declare class CloneForkCrdtOrchestrator {
  constructor(matriarchContainer: unknown);
  spawnShadowClone(params: Record<string, unknown>): Record<string, unknown>;
  mergeCloneDeltaPacket(params: Record<string, unknown>): Record<string, unknown>;
  verifyMassConservation(): boolean;
}
