// WP-07: Eight Native Game & Physical Edge Engine Adapters + Host Config / Code Generator
import {
  GENESIS_HUB_ADDRESS,
  GENESIS_LANDMARK_CODE,
  parseSunsAddress,
  convertContainerPointToHost,
  assertZeroCurrencyImport
} from './protocol.js';
import { Host7DimGovernanceFilter } from './bridge.js';

export const EIGHT_ENGINE_PLUGINS = Object.freeze([
  {
    engineId: 'unreal-s2rb',
    engineName: 'Unreal Engine 5 (RDG + Niagara)',
    shortLabel: 'UE5',
    pluginDir: 'plugins/unreal-s2rb',
    language: 'C++20 / HLSL SM6',
    shaderBackend: 'HLSL_SM6',
    coordConvention: 'UNREAL_LEFT_Z_UP_CM',
    unitLabel: 'cm (Left-Handed +Z Up)',
    defaultWorldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
    sampleHostTitle: '古罗马帝国：军团纪元 (UE5 单机/联机)',
    networkMode: 'STANDALONE_MOD',
    trustTier: 'TIER_3_LOCAL_SANDBOX',
    supportedPrimitives: ['PLACEABLE_BARRIER_1M3', 'MELEE_HOLY_CLEAVE', 'BLAST_SHIELD'],
    allowPassiveAffixes: true,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: true,
      maxUgoTier: 'TIER_A_NATIVE_MECHANIC',
      allowExtendedHandoff: true,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 25.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'unity-s2rb',
    engineName: 'Unity 6 (URP / HDRP)',
    shortLabel: 'Unity 6',
    pluginDir: 'plugins/unity-s2rb',
    language: 'C# 12 / ShaderLab HLSL',
    shaderBackend: 'HLSL_URP_HDRP',
    coordConvention: 'UNITY_LEFT_Y_UP_M',
    unitLabel: 'm (Left-Handed +Y Up)',
    defaultWorldSuns: 'GAME-CN-002-HONORKING2-005-2',
    sampleHostTitle: '王者荣耀：万界峡谷 (MOBA 竞技服)',
    networkMode: 'ONLINE_AUTHORITATIVE',
    trustTier: 'TIER_1_AUTHORITATIVE',
    supportedPrimitives: [],
    allowPassiveAffixes: false,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: false,
      maxUgoTier: 'TIER_C_COSMETIC_CHARM',
      allowExtendedHandoff: true,
      allowOriginXpSync: false,
      enable14ElementShield: false,
      competitivePowerClampPct: 5.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'minecraft-fabric-s2rb',
    engineName: 'Minecraft Java (Fabric Mod)',
    shortLabel: 'MC Fabric',
    pluginDir: 'plugins/minecraft-fabric-s2rb',
    language: 'Java 21 / GLSL 450',
    shaderBackend: 'GLSL_450',
    coordConvention: 'GLTF_RIGHT_Y_UP_M',
    unitLabel: 'block = 1m (Right-Handed +Y Up)',
    defaultWorldSuns: 'GAME-NE-004-MINECRAFT2-001-2',
    sampleHostTitle: 'Minecraft 模组创造母世界',
    networkMode: 'STANDALONE_MOD',
    trustTier: 'TIER_3_LOCAL_SANDBOX',
    supportedPrimitives: ['PLACEABLE_BARRIER_1M3', 'INSTANT_ABSORPTION_SHIELD', 'VITAL_REGEN_BURST'],
    allowPassiveAffixes: true,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: true,
      maxUgoTier: 'TIER_A_NATIVE_MECHANIC',
      allowExtendedHandoff: true,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 30.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'source2-cs2-s2rb',
    engineName: 'Source 2 / CS2 Tactical',
    shortLabel: 'Source 2 / CS2',
    pluginDir: 'plugins/source2-cs2-s2rb',
    language: 'C++17 / Source2 HLSL',
    shaderBackend: 'HLSL_SM6',
    coordConvention: 'SOURCE2_RIGHT_Z_UP_INCH',
    unitLabel: 'inch (Right-Handed +Z Up)',
    defaultWorldSuns: 'GAME-NA-003-CS2TACTIC2-012-4',
    sampleHostTitle: 'CS 反恐精英：特警联合作战',
    networkMode: 'ONLINE_AUTHORITATIVE',
    trustTier: 'TIER_1_AUTHORITATIVE',
    supportedPrimitives: [],
    allowPassiveAffixes: false,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: false,
      maxUgoTier: 'TIER_C_COSMETIC_CHARM',
      allowExtendedHandoff: false,
      allowOriginXpSync: false,
      enable14ElementShield: false,
      competitivePowerClampPct: 0.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'godot4-s2rb',
    engineName: 'Godot 4 (GDExtension)',
    shortLabel: 'Godot 4',
    pluginDir: 'plugins/godot4-s2rb',
    language: 'GDScript / C++ GDExtension',
    shaderBackend: 'GLSL_450',
    coordConvention: 'GLTF_RIGHT_Y_UP_M',
    unitLabel: 'm (Right-Handed +Y Up)',
    defaultWorldSuns: 'GAME-SA-006-OPENINDIE2-003-2',
    sampleHostTitle: '星海边境：开源独立游戏宇宙',
    networkMode: 'STANDALONE_MOD',
    trustTier: 'TIER_3_LOCAL_SANDBOX',
    supportedPrimitives: [],
    allowPassiveAffixes: true,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: true,
      maxUgoTier: 'TIER_B_PASSIVE_AFFIX',
      allowExtendedHandoff: true,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 15.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'webgpu-s2rb',
    engineName: 'WebGPU / Three.js Metaverse',
    shortLabel: 'WebGPU',
    pluginDir: 'plugins/webgpu-s2rb',
    language: 'TypeScript / WGSL 1.0',
    shaderBackend: 'WGSL_1_0',
    coordConvention: 'GLTF_RIGHT_Y_UP_M',
    unitLabel: 'm (glTF/VRM Right-Handed +Y Up)',
    defaultWorldSuns: 'META-EA-007-WEBGPUVERSE2-001-2',
    sampleHostTitle: 's2rb.space2.world 云端试炼场',
    networkMode: 'ONLINE_AUTHORITATIVE',
    trustTier: 'TIER_1_AUTHORITATIVE',
    supportedPrimitives: ['PLACEABLE_BARRIER_1M3', 'SANCTUARY_AURA_CALM'],
    allowPassiveAffixes: true,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: true,
      maxUgoTier: 'TIER_A_NATIVE_MECHANIC',
      allowExtendedHandoff: true,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 10.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'taohuayuan-world-s2rb',
    engineName: 'Taohuayuan World Model (#001 母港)',
    shortLabel: '桃花源世界模型',
    pluginDir: 'plugins/taohuayuan-world-s2rb',
    language: 'TypeScript / Rust WASM',
    shaderBackend: 'WGSL_1_0',
    coordConvention: 'S2_CANONICAL_Z_UP_M',
    unitLabel: 'm (S2 Canonical Right-Handed +Z Up)',
    defaultWorldSuns: GENESIS_HUB_ADDRESS,
    sampleHostTitle: '桃花源数字孪生总入口 (taohuayuan.world/s2RB)',
    networkMode: 'ONLINE_AUTHORITATIVE',
    trustTier: 'TIER_1_AUTHORITATIVE',
    supportedPrimitives: ['SANCTUARY_AURA_CALM', 'ACOUSTIC_CLARITY'],
    allowPassiveAffixes: true,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: true,
      maxUgoTier: 'TIER_A_NATIVE_MECHANIC',
      allowExtendedHandoff: true,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 10.0,
      allowCurrencyImport: false
    }
  },
  {
    engineId: 'taoyuan-edge-iot-s2rb',
    engineName: 'Taoyuan Physical Edge Gateway (TC-001-ARCH)',
    shortLabel: '古镇边缘网关',
    pluginDir: 'plugins/taoyuan-edge-iot-s2rb',
    language: 'Rust Embedded / OpenXR AR',
    shaderBackend: 'OPENXR_HOLOLENS_SDF',
    coordConvention: 'S2_CANONICAL_Z_UP_M',
    unitLabel: 'm (Physical Plaza 2m×2m×2.4m Pod)',
    defaultWorldSuns: 'PHYS-CN-001-TAOYUANARCH7-001-2',
    sampleHostTitle: `桃花源古镇中心广场 (${GENESIS_LANDMARK_CODE}) 实景星门`,
    networkMode: 'ONLINE_AUTHORITATIVE',
    trustTier: 'TIER_1_AUTHORITATIVE',
    supportedPrimitives: ['SANCTUARY_AURA_CALM'],
    allowPassiveAffixes: false,
    defaultGovernance: {
      allowCustomSkin: true,
      allowOriginWeapons: false,
      maxUgoTier: 'TIER_C_COSMETIC_CHARM',
      allowExtendedHandoff: false,
      allowOriginXpSync: true,
      enable14ElementShield: true,
      competitivePowerClampPct: 0.0,
      allowCurrencyImport: false
    }
  }
]);

export function getEnginePluginProfile(engineId) {
  const found = EIGHT_ENGINE_PLUGINS.find((p) => p.engineId === engineId);
  if (!found) {
    throw new Error(`S2RB_WP07_ERR: Unknown engineId "${engineId}"`);
  }
  return found;
}

export function convertHostPointToContainerS2(hostPoint, convention, hostAvatarScale = 1.0) {
  const scale = Math.abs(hostAvatarScale) < 1e-9 ? 1.0 : hostAvatarScale;
  let rawMeters;
  switch (convention) {
    case 'S2_CANONICAL_Z_UP_M':
      rawMeters = [hostPoint[0], hostPoint[1], hostPoint[2]];
      break;
    case 'UNREAL_LEFT_Z_UP_CM':
      rawMeters = [hostPoint[1] / 100.0, hostPoint[0] / 100.0, hostPoint[2] / 100.0];
      break;
    case 'UNITY_LEFT_Y_UP_M':
      rawMeters = [hostPoint[0], hostPoint[2], hostPoint[1]];
      break;
    case 'GLTF_RIGHT_Y_UP_M':
      rawMeters = [hostPoint[0], -hostPoint[2], hostPoint[1]];
      break;
    case 'SOURCE2_RIGHT_Z_UP_INCH':
      rawMeters = [hostPoint[0] * 0.0254, hostPoint[1] * 0.0254, hostPoint[2] * 0.0254];
      break;
    default:
      throw new Error(`Unsupported engine convention: ${convention}`);
  }
  return rawMeters.map((v) => v / scale);
}

export function buildDaemonManifestFromEngine(profile, overrides = {}) {
  const gov = { ...profile.defaultGovernance, ...overrides };
  if (gov.allowCurrencyImport !== false) {
    assertZeroCurrencyImport(1);
  }
  const worldSuns = overrides.worldSuns || profile.defaultWorldSuns;
  parseSunsAddress(worldSuns);
  const backpackPolicy = gov.maxUgoTier === 'TIER_C_COSMETIC_CHARM' ? 'COSMETIC_ONLY' : 'ACTIVE_USE';
  const manifest = {
    worldName: overrides.worldName || profile.sampleHostTitle,
    worldSuns,
    networkMode: overrides.networkMode || profile.networkMode,
    trustTier: overrides.trustTier || profile.trustTier,
    coordConvention: profile.coordConvention,
    hostHpBracket: [1000, 3200],
    allowSkin: gov.allowCustomSkin ? 'FULL_PBR' : 'HOST_DEFAULT',
    allowApparel: 'ENABLED',
    allowEquipment: gov.allowOriginWeapons ? 'FULL_STATS' : 'COSMETIC_TRANSMOG',
    allowBackpackItems: backpackPolicy,
    allowSkills: gov.allowExtendedHandoff ? 'SEMANTIC_MAPPED' : 'DISABLED',
    allowOriginXp: gov.allowOriginXpSync ? 'CURVE_SYNC' : 'LOCKED_LEVEL_1',
    allowCurrencyImport: false
  };
  Host7DimGovernanceFilter.validateManifest(manifest);
  return {
    manifest,
    capabilityProfile: {
      supportedPrimitives: overrides.supportedPrimitives ?? profile.supportedPrimitives,
      allowPassiveAffixes: overrides.allowPassiveAffixes ?? profile.allowPassiveAffixes
    }
  };
}

export function generateHostTomlConfig(engineId, overrides = {}) {
  const profile = getEnginePluginProfile(engineId);
  const gov = { ...profile.defaultGovernance, ...overrides };
  const { manifest } = buildDaemonManifestFromEngine(profile, overrides);
  return [
    `# Generated by S2RB v3.0 Plugin SDK (${profile.engineName})`,
    `# Portal: https://s2rb.space2.world/ | Genesis Hub: ${GENESIS_HUB_ADDRESS}`,
    `[host_world]`,
    `engine_id = "${profile.engineId}"`,
    `world_suns = "${manifest.worldSuns}"`,
    `world_title = "${manifest.worldName}"`,
    `trust_tier = "${manifest.trustTier}"`,
    `coord_convention = "${profile.coordConvention}"`,
    `shader_backend = "${profile.shaderBackend}"`,
    ``,
    `[container_geometry]`,
    `width_m = 2.0`,
    `depth_m = 2.0`,
    `height_m = 2.4`,
    `volume_m3 = 9.6`,
    `min_prism_rim_roughness_pct = 6.5 # Silicon Law 2 (>= 5.0%)`,
    `red_anchor_fuse_sla_ms = 3.0      # Silicon Law 1 (< 3.0 ms)`,
    ``,
    `[admission_governance_7dim]`,
    `allow_custom_skin = ${Boolean(gov.allowCustomSkin)}`,
    `allow_origin_weapons = ${Boolean(gov.allowOriginWeapons)}`,
    `max_ugo_item_tier = "${gov.maxUgoTier}"`,
    `allow_domega_extended_handoff = ${Boolean(gov.allowExtendedHandoff)}`,
    `allow_origin_xp_sync = ${Boolean(gov.allowOriginXpSync)}`,
    `enable_14element_spatial_shield = ${Boolean(gov.enable14ElementShield)}`,
    `competitive_power_clamp_pct = ${Number(gov.competitivePowerClampPct).toFixed(1)}`,
    `allow_currency_import = false # HARD CONSTITUTIONAL FIREWALL`
  ].join(String.fromCharCode(10));
}

export class HostEnginePluginSimulator {
  constructor(daemon, engineId, customManifestOverrides = {}) {
    this.daemon = daemon;
    this.profile = getEnginePluginProfile(engineId);
    const { manifest, capabilityProfile } = buildDaemonManifestFromEngine(this.profile, customManifestOverrides);
    this.manifest = manifest;
    this.worldSuns = manifest.worldSuns;
    this.capabilityProfile = capabilityProfile;
    this.daemon.registerHostWorld(this.manifest, this.capabilityProfile);
  }

  toHostCoords(pointS2Meters, avatarScale = 1.0) {
    return convertContainerPointToHost(pointS2Meters, this.profile.coordConvention, avatarScale);
  }

  fromHostCoords(hostPoint, avatarScale = 1.0) {
    return convertHostPointToContainerS2(hostPoint, this.profile.coordConvention, avatarScale);
  }
}
