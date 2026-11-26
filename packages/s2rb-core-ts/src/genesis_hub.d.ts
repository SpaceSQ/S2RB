export const PORTAL_CHANNELS: Readonly<{
  ROBOT0_TECH_PORTAL: string;
  TAOHUAYUAN_CULTURAL_PORTAL: string;
}>;
export class TaohuayuanGenesisOperationsCenter {
  constructor(daemon: unknown);
  issueTaoyuanTravelPass(req: {
    travelerDid: string;
    companionDid?: string | null;
    routeCode: string;
    attemptedCurrencyCarry?: number;
  }): Record<string, unknown>;
  triggerGlobalRedAnchorDrill(reason?: string): {
    hubSuns: string;
    landmarkCode: string;
    recalledCount: number;
    totalElapsedMs: number;
    withinLaw1Sla: boolean;
  };
  get4kCommandDeckSnapshot(): Record<string, unknown>;
}
