import fs from 'node:fs';
import path from 'node:path';
import {
  mintS2DidV4,
  CharacterContainer9m6,
  Singleton2PcBridge,
  CloneForkCrdtOrchestrator,
  PNCounterCrdt,
  ORSetCrdt,
  StealthEnvelopeController,
  ExtendedEffectHandoffBus,
  Host7DimGovernanceFilter
} from '../src/index.js';

const outDir = process.argv[2] || '/tmp';

// 1. Demo 1: Singleton Migration (Minecraft Voxel Knight -> UE5 Roman Empire)
const mcKnight = new CharacterContainer9m6({
  s2Did: mintS2DidV4('V', 'MC001', '261126', '00010842'),
  displayName: '方块创客骑士 · Steve-Prime',
  modality: 'VOXEL_HYBRID_MESH',
  originSuns: 'GAME-EA-101-MINECRAFT2-008-2',
  originCurrencies: { MC_EMERALD: 640 },
  backpackItems: { OBSIDIAN_BLOCK: 64, GOLDEN_APPLE: 8 },
  originSkills: [{ skillId: 'SK_VOXEL_WALL', name: '黑曜石筑垒', primitive: 'VOXEL_CONSTRUCT' }]
});

const romeManifest = {
  worldName: '古罗马帝国：军团纪元',
  worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
  networkMode: 'STANDALONE_MOD',
  trustTier: 'TIER_2_PARTNER_VERIFIED',
  coordConvention: 'UNREAL_LEFT_Z_UP_CM',
  hostHpBracket: [1000, 4000],
  allowSkin: 'FULL_PBR',
  allowApparel: 'ENABLED',
  allowEquipment: 'FULL_STATS',
  allowBackpackItems: 'ACTIVE_USE',
  allowSkills: 'SEMANTIC_MAPPED',
  allowOriginXp: 'CURVE_SYNC',
  allowCurrencyImport: false
};

const singletonBridge = new Singleton2PcBridge(mcKnight);
singletonBridge.beginFreezeAndExtract({ txId: 'TX-001', expectedFencingToken: 1, targetWorldSuns: romeManifest.worldSuns });
const receipt = singletonBridge.commitSourceDespawn({ sourceWorldSuns: 'GAME-EA-101-MINECRAFT2-008-2' });
const { projection: romeProj } = singletonBridge.commitTargetRebirth({
  providedFencingToken: receipt.nextFencingToken,
  targetManifest: romeManifest
});
const stealthMc = new StealthEnvelopeController(mcKnight);
const stealthAfterCeremony = stealthMc.tickFrame(3.2);
mcKnight.recordAdventureEvolution({
  worldSuns: romeManifest.worldSuns,
  trustTier: 'TIER_2_PARTNER_VERIFIED',
  xpDelta: 1450,
  originSkillId: 'SK_VOXEL_WALL',
  hostWorldLawTag: 'ROMAN_SIEGE_LAW'
});

// 2. Demo 2 & 3: Clone/Fork CRDT Parallel Worlds + @ dOmega Boundary Handoff (Taohuayuan Digital Human -> CS2 & HOK)
const holoHuman = new CharacterContainer9m6({
  s2Did: mintS2DidV4('D', 'TAOHU', '261126', '00000001'),
  s2Category: 'HUMAN',
  displayName: '桃花源全息影像数字人 · 零号先遣官',
  modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
  originSuns: 'META-CN-001-TAOHUAYUAN2-001-2',
  originCurrencies: { TAOHUAYUAN_COIN: 58000 },
  backpackItems: { HOLO_DECOY: 6 },
  originSkills: [{ skillId: 'SK_14D_SONAR', name: '14维声纹脉冲', primitive: 'ACOUSTIC_WAVE_SCAN' }]
});

const cs2Manifest = {
  worldName: 'CS反恐精英2',
  worldSuns: 'GAME-WA-707-CS2ARENA2-016-4',
  networkMode: 'ONLINE_AUTHORITATIVE',
  trustTier: 'TIER_1_AUTHORITATIVE',
  coordConvention: 'SOURCE2_RIGHT_Z_UP_INCH',
  hostHpBracket: [100, 100],
  allowSkin: 'SHADER_ADAPTED',
  allowApparel: 'COSMETIC_STATIC',
  allowEquipment: 'DISABLED',
  allowBackpackItems: 'DISABLED',
  allowSkills: 'SEMANTIC_MAPPED',
  allowOriginXp: 'DISABLED',
  allowCurrencyImport: false
};

const forkMgr = new CloneForkCrdtOrchestrator(holoHuman);
const cs2Clone = forkMgr.spawnShadowClone({ targetManifest: cs2Manifest, consumableSlice: { HOLO_DECOY: 2 } });

const cs2Bus = new ExtendedEffectHandoffBus({
  coordConvention: 'SOURCE2_RIGHT_Z_UP_INCH',
  vfxBackend: 'SOURCE2_PARTICLE_SYSTEM'
});
const m4ShotCmd = cs2Bus.evaluateAndDispatch({
  container: holoHuman,
  admissionProjection: Host7DimGovernanceFilter.projectContainer(holoHuman, cs2Manifest),
  actionId: 'M4A1_SILENCED_SHOT',
  originLocalM: [0, 0, 1.5],
  directionVec: [0, 1, 0],
  reachOrRangeM: 90.0,
  speedMps: 880.0
});

const xpCs2 = new PNCounterCrdt();
xpCs2.increment(cs2Clone.forkId, 1560);
const skillCs2 = new ORSetCrdt();
skillCs2.add('硅基全息声纹透视脉冲', `TAG:${cs2Clone.forkId}:ACE`);
forkMgr.mergeCloneDeltaPacket({
  forkId: cs2Clone.forkId,
  certifiedXpCounter: xpCs2,
  skillsOrSet: skillCs2,
  consumedItems: { HOLO_DECOY: 1 },
  retireFork: true
});

const mcOut = path.join(outDir, 'mc_knight_singleton.s2container.json');
const holoOut = path.join(outDir, 'holo_human_clone_crdt.s2container.json');
fs.writeFileSync(mcOut, JSON.stringify(mcKnight.toContainerManifest(), null, 2));
fs.writeFileSync(holoOut, JSON.stringify(holoHuman.toContainerManifest(), null, 2));

console.log('[WP01-WP04 PIPELINE OK]');
console.log('  1. Singleton 2PC Rome Rebirth:', romeProj.targetWorldSuns, '| Stealth DrawCalls after 3.2s =', stealthAfterCeremony.shellDrawCalls);
console.log('  2. Clone CRDT CS2 Converged XP:', holoHuman.avatar.certifiedTier1Xp, '| Remaining Decoys =', holoHuman.avatar.backpackItems.HOLO_DECOY);
console.log('  3. CS2 @ dOmega Ballistic Handoff (Source2 inches):', JSON.stringify(m4ShotCmd.spawnPosHostUnits), '| RemainingRangeM =', m4ShotCmd.remainingRangeM);
console.log('  4. Exported verified manifests:', mcOut, holoOut);
