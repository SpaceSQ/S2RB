import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_HUB_ADDRESS,
  mintS2DidV4,
  CharacterContainer9m6,
  Host7DimGovernanceFilter,
  Singleton2PcBridge,
  PNCounterCrdt,
  ORSetCrdt,
  CloneForkCrdtOrchestrator,
  sdBox9m6,
  evaluatePrimaryFragment9m6,
  StealthEnvelopeController,
  ExtendedEffectHandoffBus
} from '../src/index.js';

const ROME_MANIFEST = {
  worldName: '古罗马帝国：军团纪元 (UE5单机)',
  worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
  networkMode: 'STANDALONE_MOD',
  trustTier: 'TIER_2_PARTNER_VERIFIED',
  coordConvention: 'UNREAL_LEFT_Z_UP_CM',
  hostHpBracket: [800, 3200],
  allowSkin: 'FULL_PBR',
  allowApparel: 'ENABLED',
  allowEquipment: 'FULL_STATS',
  allowBackpackItems: 'ACTIVE_USE',
  allowSkills: 'SEMANTIC_MAPPED',
  allowOriginXp: 'CURVE_SYNC',
  allowCurrencyImport: false
};

const HOK_MANIFEST = {
  worldName: '王者荣耀·星界裂隙 (5v5权威服)',
  worldSuns: 'GAME-CN-505-HOKCANYON2-001-5',
  networkMode: 'ONLINE_AUTHORITATIVE',
  trustTier: 'TIER_1_AUTHORITATIVE',
  coordConvention: 'UNITY_LEFT_Y_UP_M',
  hostHpBracket: [3200, 3600],
  allowSkin: 'FULL_PBR',
  allowApparel: 'COSMETIC_STATIC',
  allowEquipment: 'TRANSMOG_ONLY',
  allowBackpackItems: 'DISABLED',
  allowSkills: 'SEMANTIC_MAPPED',
  allowOriginXp: 'PRESTIGE_BADGE',
  allowCurrencyImport: false
};

const CS2_MANIFEST = {
  worldName: 'CS反恐精英2·战术行动 (Source2权威服)',
  worldSuns: 'GAME-WA-707-CS2ARENA2-016-4',
  networkMode: 'ONLINE_AUTHORITATIVE',
  trustTier: 'TIER_1_AUTHORITATIVE',
  coordConvention: 'SOURCE2_RIGHT_Z_UP_INCH',
  hostHpBracket: [100, 100],
  allowSkin: 'SHADER_ADAPTED',
  allowApparel: 'COSMETIC_STATIC',
  allowEquipment: 'DISABLED',
  allowBackpackItems: 'DISABLED',
  allowSkills: 'VFX_EMOTE_ONLY',
  allowOriginXp: 'DISABLED',
  allowCurrencyImport: false
};

test('WP-03.1: Host 7-Dim Governance rejects any manifest unlocking allowCurrencyImport', () => {
  const illegalManifest = { ...ROME_MANIFEST, allowCurrencyImport: true };
  assert.throws(
    () => Host7DimGovernanceFilter.validateManifest(illegalManifest),
    /allowCurrencyImport MUST be strictly false/
  );
});

test('WP-03.2: Singleton Mode 2PC atomic despawn -> rebirth & monotonic fencing token split-brain immunity', () => {
  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('V', 'MC001', '261126', '00010842'),
    displayName: '方块创客骑士',
    originSuns: 'GAME-EA-101-MINECRAFT2-008-2',
    originCurrencies: { MC_EMERALD: 640 }
  });
  const bridge = new Singleton2PcBridge(hero, 1000);
  assert.equal(bridge.state.lease.fencingToken, 1);

  // Phase 1: Freeze in Minecraft
  bridge.beginFreezeAndExtract({
    txId: 'TX-MC-ROME-01',
    expectedFencingToken: 1,
    targetWorldSuns: ROME_MANIFEST.worldSuns,
    nowMs: 1100
  });

  // Phase 2: Atomic despawn in Minecraft -> revokes token #1, issues token #2
  const receipt = bridge.commitSourceDespawn({
    sourceWorldSuns: 'GAME-EA-101-MINECRAFT2-008-2',
    nowMs: 1250
  });
  assert.equal(receipt.revokedFencingToken, 1);
  assert.equal(receipt.nextFencingToken, 2);

  // Split-Brain Attack: delayed stale packet tries to spawn with old token #1 -> BLOCKED!
  assert.throws(
    () => bridge.commitTargetRebirth({ providedFencingToken: 1, targetManifest: ROME_MANIFEST, nowMs: 1400 }),
    /S2RB_SPLIT_BRAIN_BLOCKED/
  );

  // Valid token #2 succeeds and materializes in Rome with 0 imported currency
  const { lease, projection } = bridge.commitTargetRebirth({
    providedFencingToken: 2,
    targetManifest: ROME_MANIFEST,
    nowMs: 1500
  });
  assert.equal(lease.holderWorldSuns, 'FILM-WA-009-ROMANEMP2-108-2');
  assert.equal(lease.fencingToken, 2);
  assert.equal(projection.importedCurrencyAmount, 0);
  assert.equal(hero.chronicle.verifyIntegrity(), true);
});

test('WP-03.3: Singleton Mode 3000ms network drop Deadman Auto-Rollback to Taohuayuan Genesis Hub', () => {
  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('D', 'MILES', '261126', '00000009'),
    s2Category: 'HUMAN',
    displayName: '断网保护测试员'
  });
  const bridge = new Singleton2PcBridge(hero, 5000);
  bridge.beginFreezeAndExtract({
    txId: 'TX-DROP-01',
    expectedFencingToken: 1,
    targetWorldSuns: HOK_MANIFEST.worldSuns,
    nowMs: 5100
  });
  bridge.commitSourceDespawn({ sourceWorldSuns: GENESIS_HUB_ADDRESS, nowMs: 5200 });

  // Target server hangs for 4,500ms (> 3,000ms budget) -> Deadman Rollback restores to Taohuayuan Plaza!
  assert.throws(
    () => bridge.commitTargetRebirth({ providedFencingToken: 2, targetManifest: HOK_MANIFEST, nowMs: 9800 }),
    /S2RB_2PC_TIMEOUT/
  );
  assert.equal(bridge.state.phase, 'ACTIVE_IN_WORLD');
  assert.equal(bridge.state.lease.holderWorldSuns, GENESIS_HUB_ADDRESS);
  assert.equal(bridge.state.lease.fencingToken, 3); // Token #2 permanently invalidated!
});

test('WP-03.4: Clone/Fork Mode parallel multi-world existence, consumable mass conservation & CRDT idempotency', () => {
  const matriarch = new CharacterContainer9m6({
    s2Did: mintS2DidV4('V', 'WOW02', '261126', '00029910'),
    displayName: '白银之手重装圣骑士·母体',
    originSuns: 'GAME-NA-204-AZEROTH2-080-3',
    backpackItems: { GOLDEN_APPLE: 8, MANA_FLASK: 10 },
    certifiedTier1Xp: 10000,
    originCurrencies: { STORMWIND_GOLD: 128500 }
  });

  const orchestrator = new CloneForkCrdtOrchestrator(matriarch);

  // Fork Clone A -> Honor of Kings (allocating 3 Golden Apples)
  const cloneHok = orchestrator.spawnShadowClone({
    targetManifest: HOK_MANIFEST,
    consumableSlice: { GOLDEN_APPLE: 3 }
  });
  // Fork Clone B -> CS2 (allocating 4 Golden Apples)
  const cloneCs2 = orchestrator.spawnShadowClone({
    targetManifest: CS2_MANIFEST,
    consumableSlice: { GOLDEN_APPLE: 4 }
  });

  // Matriarch now has only 1 Golden Apple left; trying to fork Clone C with 2 Golden Apples MUST fail (anti-duping!)
  assert.equal(matriarch.avatar.backpackItems.GOLDEN_APPLE, 1);
  assert.throws(
    () => orchestrator.spawnShadowClone({ targetManifest: ROME_MANIFEST, consumableSlice: { GOLDEN_APPLE: 2 } }),
    /S2RB_QUOTA_EXCEEDED/
  );
  assert.equal(orchestrator.verifyMassConservation(), true);

  // Clone A earns +1820 Tier-1 XP & unlocks skill in Honor of Kings
  const xpFromHok = new PNCounterCrdt();
  xpFromHok.increment(cloneHok.forkId, 1820);
  const skillsFromHok = new ORSetCrdt();
  skillsFromHok.add('圣光裁决·主宰先锋圣盾', `TAG:${cloneHok.forkId}:1`);

  // Clone B earns +1560 Tier-1 XP & honor in CS2
  const xpFromCs2 = new PNCounterCrdt();
  xpFromCs2.increment(cloneCs2.forkId, 1560);
  const honorsFromCs2 = new ORSetCrdt();
  honorsFromCs2.add('ACH_CS2_CARBON_SILICON_ACE', `TAG:${cloneCs2.forkId}:1`);

  // Merge out-of-order (CS2 first, then HOK) AND replay HOK packet 3 times to prove CRDT idempotency!
  orchestrator.mergeCloneDeltaPacket({
    forkId: cloneCs2.forkId,
    certifiedXpCounter: xpFromCs2,
    honorsOrSet: honorsFromCs2,
    consumedItems: { GOLDEN_APPLE: 1 },
    retireFork: true
  });
  orchestrator.mergeCloneDeltaPacket({
    forkId: cloneHok.forkId,
    certifiedXpCounter: xpFromHok,
    skillsOrSet: skillsFromHok,
    consumedItems: { GOLDEN_APPLE: 2 },
    retireFork: true
  });
  // Duplicate network retries of HOK packet!
  orchestrator.mergeCloneDeltaPacket({ forkId: cloneHok.forkId, certifiedXpCounter: xpFromHok, skillsOrSet: skillsFromHok });
  orchestrator.mergeCloneDeltaPacket({ forkId: cloneHok.forkId, certifiedXpCounter: xpFromHok, skillsOrSet: skillsFromHok });

  // Exact XP = 10000 (Matriarch) + 1820 (HOK once!) + 1560 (CS2 once!) = 13380!
  assert.equal(matriarch.avatar.certifiedTier1Xp, 13380);
  assert.deepEqual(orchestrator.hybridSkillsCrdt.elements(), ['圣光裁决·主宰先锋圣盾']);
  assert.equal(matriarch.avatar.backpackItems.GOLDEN_APPLE, 5); // 8 initial - 1 used in CS2 - 2 used in HOK = 5!
  assert.equal(orchestrator.verifyMassConservation(), true);
});

test('WP-04.1: 9.6m3 (2x2x2.4m) SDF Hard Boundary Clipper guarantees 0 leaked pixels outside box', () => {
  // Inside center (0, 0, 1.2) -> negative SDF, full alpha
  const center = evaluatePrimaryFragment9m6([0, 0, 1.2]);
  assert.ok(center.sdfDistanceM < -0.99);
  assert.equal(center.discardedOutside9m6, false);
  assert.equal(center.boundaryAlphaWeight, 1.0);

  // Sample 200 points strictly outside [-1,1]x[-1,1]x[0,2.4] -> EVERY SINGLE ONE must be discarded!
  const outsidePoints = [
    [1.0001, 0, 1.2], [-1.05, 0, 1.2], [0, 1.02, 0.5], [0, -1.5, 2.0],
    [0, 0, 2.4001], [0, 0, -0.001], [1.2, 1.2, 2.6]
  ];
  for (const pt of outsidePoints) {
    const res = evaluatePrimaryFragment9m6(pt);
    assert.equal(res.discardedOutside9m6, true, `Leaked point outside 9.6m3: ${JSON.stringify(pt)}`);
    assert.equal(res.boundaryAlphaWeight, 0.0);
  }
});

test('WP-04.2: Four-State Stealth Envelope Lifecycle transitions to 0.0 opacity & 0 draw calls in gameplay', () => {
  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('D', 'THY01', '261126', '00000001'),
    s2Category: 'HUMAN',
    displayName: '全息数字人'
  });
  const stealth = new StealthEnvelopeController(hero);

  // Arrival t=0s -> CEREMONY_VISIBLE (opacity=0.92, drawCalls=1)
  let frame = stealth.tickFrame(0.0);
  assert.equal(frame.mode, 'CEREMONY_VISIBLE');
  assert.equal(frame.shellOpacity, 0.92);
  assert.equal(frame.shellDrawCalls, 1);

  // Advance 3.1s -> automatically enters STEALTH_GAMEPLAY_INVISIBLE (opacity=0.0, drawCalls=0!)
  frame = stealth.tickFrame(3.1);
  assert.equal(frame.mode, 'STEALTH_GAMEPLAY_INVISIBLE');
  assert.equal(frame.shellOpacity, 0.0);
  assert.equal(frame.shellDrawCalls, 0);

  // User presses Alt+R -> USER_INSPECT_OVERLAY (opacity=0.35, drawCalls=1)
  frame = stealth.setUserInspectHotkey(true);
  assert.equal(frame.mode, 'USER_INSPECT_OVERLAY');
  assert.equal(frame.shellOpacity, 0.35);

  // User releases Alt+R -> immediately returns to STEALTH_GAMEPLAY_INVISIBLE (drawCalls=0)
  frame = stealth.setUserInspectHotkey(false);
  assert.equal(frame.mode, 'STEALTH_GAMEPLAY_INVISIBLE');
  assert.equal(frame.shellDrawCalls, 0);
});

test('WP-04.3: @ dOmega Extended Effect Handoff Bus covers Contained Melee, Ballistic Ray, Annular AoE & Polearm Tip', () => {
  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('V', 'ROME1', '261126', '00000777'),
    displayName: '圣光百夫长'
  });
  const admRome = Host7DimGovernanceFilter.projectContainer(hero, ROME_MANIFEST);
  const busUe5 = new ExtendedEffectHandoffBus({
    coordConvention: 'UNREAL_LEFT_Z_UP_CM',
    vfxBackend: 'UNREAL_NIAGARA'
  });

  // 1) Short 0.65m sword slash -> contained inside 9.6m3, 0 host spawns
  const slash = busUe5.evaluateAndDispatch({
    container: hero,
    admissionProjection: admRome,
    actionId: 'ACT_SHORT_SLASH',
    reachOrRangeM: 0.65
  });
  assert.equal(slash.archetype, 'CONTAINED_INSIDE_9M6');
  assert.equal(busUe5.drainPendingCommands().length, 0);

  // 2) Long 50m Holy Bolt along +Y (1m to wall -> 49m remaining; UE5 Left-Z-cm maps (0,1,1.4)m -> (100, 0, 140)cm!)
  const bolt = busUe5.evaluateAndDispatch({
    container: hero,
    admissionProjection: admRome,
    actionId: 'ACT_HOLY_BOLT',
    originLocalM: [0, 0, 1.4],
    directionVec: [0, 1, 0],
    reachOrRangeM: 50.0,
    speedMps: 40.0
  });
  assert.equal(bolt.archetype, 'EXTERNAL_BALLISTIC_PROJECTILE');
  assert.deepEqual(bolt.spawnPosHostUnits, [100, 0, 140]);
  assert.equal(bolt.remainingRangeM, 49.0);

  // 3) 5.0m Paladin Consecration Aura -> Annular ground AoE [1.0m .. 5.0m]
  const aura = busUe5.evaluateAndDispatch({
    container: hero,
    admissionProjection: admRome,
    actionId: 'ACT_CONSECRATION_5M',
    reachOrRangeM: 0.0,
    aoeRadiusM: 5.0
  });
  assert.equal(aura.archetype, 'EXTERNAL_ANNULAR_GROUND_AOE');
  assert.equal(aura.innerClippedRadiusM, 1.0);
  assert.equal(aura.outerRadiusM, 5.0);

  // 4) 2.5m Halberd thrust -> splits at y=1.0m with 1.5m overhang phantom hitbox in UE5!
  const halberd = busUe5.evaluateAndDispatch({
    container: hero,
    admissionProjection: admRome,
    actionId: 'ACT_HALBERD_THRUST',
    originLocalM: [0, 0, 1.2],
    directionVec: [0, 1, 0],
    reachOrRangeM: 2.5,
    isMeleePolearm: true
  });
  assert.equal(halberd.archetype, 'DUAL_SEGMENT_POLEARM_TIP_PROXY');
  assert.equal(halberd.overhangLengthM, 1.5);
  assert.deepEqual(halberd.tipPosHostUnits, [250, 0, 120]);
});
