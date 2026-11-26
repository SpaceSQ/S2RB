export const WEBGPU_METAVERSE_SUNS = 'META-EA-007-WEBGPUVERSE2-001-2';
export const CONTAINER_BOX_M = { width: 2.0, depth: 2.0, height: 2.4, volumeM3: 9.6 } as const;

export function createWebGpuClipUniforms(prismOpacity: number, rimRoughnessPct = 6.5) {
  if (prismOpacity > 0 && rimRoughnessPct < 5.0) {
    throw new Error('S2RB_LAW2_VIOLATION: Prism rim roughness must be >= 5.0%');
  }
  return {
    halfExtents: [1.0, 1.2, 1.0],
    prismOpacity,
    rimRoughnessPct,
    allowCurrencyImport: false
  };
}
