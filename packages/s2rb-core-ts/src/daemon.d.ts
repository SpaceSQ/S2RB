export declare class S2rbLocalDaemon {
  protocolVersion: string;
  constructor();
  registerHostWorld(manifest: Record<string, unknown>, capabilityProfile?: Record<string, unknown>): string;
  registerContainer(container: unknown): string;
  dispatchIpc(command: Record<string, unknown>): Record<string, unknown>;
}
