export interface EnginePluginProfile {
  engineId: string;
  engineName: string;
  shortLabel: string;
  pluginDir: string;
  language: string;
  shaderBackend: string;
  coordConvention: string;
  unitLabel: string;
  defaultWorldSuns: string;
  sampleHostTitle: string;
  trustTier: string;
}
export const EIGHT_ENGINE_PLUGINS: ReadonlyArray<EnginePluginProfile>;
export function getEnginePluginProfile(engineId: string): EnginePluginProfile;
export function convertHostPointToContainerS2(hostPoint: number[], convention: string, hostAvatarScale?: number): number[];
export function generateHostTomlConfig(engineId: string, overrides?: Record<string, unknown>): string;
export class HostEnginePluginSimulator {
  constructor(daemon: unknown, engineId: string, customManifestOverrides?: Record<string, unknown>);
  toHostCoords(pointS2Meters: number[], avatarScale?: number): number[];
  fromHostCoords(hostPoint: number[], avatarScale?: number): number[];
}
