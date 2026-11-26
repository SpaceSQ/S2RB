export declare const CEREMONY_DURATION_SEC: 3.0;
export declare function sdBox9m6(pointLocalM: [number, number, number]): number;
export declare function evaluatePrimaryFragment9m6(pointLocalM: [number, number, number]): {
  sdfDistanceM: number;
  discardedOutside9m6: boolean;
  boundaryAlphaWeight: number;
  prismRimIntensity: number;
};
export declare class StealthEnvelopeController {
  constructor(container: unknown);
  triggerCeremony(): Record<string, unknown>;
  setUserInspectHotkey(active: boolean): Record<string, unknown>;
  setSystemTelemetryWakeup(active: boolean): Record<string, unknown>;
  tickFrame(dtSec: number): Record<string, unknown>;
}
export declare class ExtendedEffectHandoffBus {
  constructor(options?: Record<string, unknown>);
  evaluateAndDispatch(params: Record<string, unknown>): Record<string, unknown>;
  drainPendingCommands(): Array<Record<string, unknown>>;
}
