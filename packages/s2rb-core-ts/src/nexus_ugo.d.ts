export declare const CANONICAL_UGO_CATALOG: ReadonlyArray<Record<string, unknown>>;
export declare class UgoSemanticRegistry {
  constructor(seedItems?: ReadonlyArray<Record<string, unknown>>);
  register(spec: Record<string, unknown>): void;
  get(ugoId: string): Record<string, unknown> | null;
  translateForHost(ugoId: string, hostCapabilityProfile: Record<string, unknown>): Record<string, unknown>;
}
export declare class TwoTierSpatialInventory {
  constructor(registry?: UgoSemanticRegistry, maxSlots?: number, maxVolumeLiters?: number);
  getCurrentPodVolumeLiters(): number;
  storeLootWithAutoOverflow(ugoId: string, quantity: number): { storedInPod: number; routedToArkStash: number };
  transferPodToArk(ugoId: string, qty: number): void;
  transferArkToPod(ugoId: string, qty: number): { movedToPod: number; remainedInStash: number };
}
export declare class RelationalGraphEngine {
  bindCarbonSiliconCompanion(params: Record<string, unknown>): Record<string, unknown>;
  linkMutualFriends(didA: string, didB: string): void;
  updateFriendPresence(params: Record<string, unknown>): void;
  resolveFollowJumpTicket(params: Record<string, unknown>): Record<string, unknown>;
  bindPhysicalOpcArtifact(params: Record<string, unknown>): Record<string, unknown>;
}
