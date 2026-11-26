import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_HUB_ADDRESS,
  GENESIS_LANDMARK_CODE,
  mintS2DidV4,
  CharacterContainer9m6,
  UgoSemanticRegistry,
  TwoTierSpatialInventory,
  RelationalGraphEngine,
  S2rbLocalDaemon
} from '../src/index.js';

test('WP-05.1: Carbon-Silicon Bond enforces Class-D -> Class-V & blocks currency delegation', () => {
  const graph = new RelationalGraphEngine();
  const humanDid = mintS2DidV4('D', 'MILES', '261126', '00000001');
  const aiAdjutantDid = mintS2DidV4('V', 'SONAR', '261126', '00000077');

  const bond = graph.bindCarbonSiliconCompanion({
    principalDid: humanDid,
    companionDid: aiAdjutantDid,
    orbitalSlotIndex: 1
  });
  assert.equal(bond.currencyAccessLockedFalse, true);

  // Attempting to delegate currency access to AI adjutant MUST throw
  assert.throws(
    () =>
      graph.bindCarbonSiliconCompanion({
        principalDid: humanDid,
        companionDid: aiAdjutantDid,
        permissions: ['TRANSFER_CURRENCY']
      }),
    /S2RB_BOND_FORBIDDEN/
  );
});

test('WP-05.2: Cross-Game Friend Presence & One-Click Follow-Jump allocates non-overlapping L6 berth', () => {
  const graph = new RelationalGraphEngine();
  const myDid = mintS2DidV4('D', 'HERO1', '261126', '00000101');
  const friendDid = mintS2DidV4('D', 'HERO2', '261126', '00000202');

  graph.linkMutualFriends(myDid, friendDid);
  graph.updateFriendPresence({
    friendDid,
    displayName: '圣光老友',
    currentWorldName: '古罗马帝国：军团纪元',
    currentSuns: 'FILM-WA-009-ROMANEMP2-108-2',
    occupiedBerths: [3] // Berths 2 and 3 occupied -> should allocate Berth 4!
  });

  const ticket = graph.resolveFollowJumpTicket({
    followerDid: myDid,
    leaderFriendDid: friendDid
  });
  assert.equal(ticket.allocatedL6Berth, 4);
  assert.equal(ticket.targetBerthSuns, 'FILM-WA-009-ROMANEMP2-108-4');
});

test('WP-05.3: Physical Taohuayuan OPC Craft Geo-Binding anchors to TC-001-ARCH', () => {
  const graph = new RelationalGraphEngine();
  const did = mintS2DidV4('D', 'TAOHU', '261126', '00000008');
  const anchor = graph.bindPhysicalOpcArtifact({
    artifactSerial: 'OPC-JADE-20261126-001',
    artifactCategory: '桃花玉激光微雕定气锚',
    boundS2Did: did,
    nfcFingerprint: 'SHA256:9F82C1E0'
  });
  assert.equal(anchor.originLandmark, GENESIS_LANDMARK_CODE);
});

test('WP-05.4: UGO v2.0 3-Tier Graceful Item Degradation (Sandbox Tier-A -> RPG Tier-B -> Competitive Tier-C)', () => {
  const ugo = new UgoSemanticRegistry();

  // 1) UE5 Roman Sandbox supports PLACEABLE_BARRIER_1M3 -> Tier-A Native Mechanic!
  const tierA = ugo.translateForHost('MAT_OBSIDIAN_BLOCK', {
    backpackPolicy: 'ACTIVE_USE',
    supportedPrimitives: ['PLACEABLE_BARRIER_1M3'],
    allowPassiveAffixes: true
  });
  assert.equal(tierA.tier, 'TIER_A_NATIVE_MECHANIC');
  assert.equal(tierA.gameplayStatBonusActive, true);

  // 2) Action RPG lacks voxel building -> Tier-B Passive Blast Resist Affix!
  const tierB = ugo.translateForHost('MAT_OBSIDIAN_BLOCK', {
    backpackPolicy: 'ACTIVE_USE',
    supportedPrimitives: ['MELEE_SLASH'],
    allowPassiveAffixes: true
  });
  assert.equal(tierB.tier, 'TIER_B_PASSIVE_AFFIX');
  assert.equal(tierB.gameplayStatBonusActive, true);

  // 3) CS2 Competitive Server disables backpack items -> Tier-C Zero-Stat Weapon Charm!
  const tierC = ugo.translateForHost('MAT_OBSIDIAN_BLOCK', {
    backpackPolicy: 'DISABLED',
    supportedPrimitives: [],
    allowPassiveAffixes: false
  });
  assert.equal(tierC.tier, 'TIER_C_COSMETIC_CHARM');
  assert.equal(tierC.gameplayStatBonusActive, false);
});

test('WP-05.5: Two-Tier 9.6m3 Pod Backpack (480L cap) auto-routes excess loot to Infinite Ark Mother-Stash', () => {
  const ugo = new UgoSemanticRegistry();
  const inv = new TwoTierSpatialInventory(ugo, 36, 480.0);

  // Each MAT_OBSIDIAN_BLOCK is 4.0L -> 480L fits at most 120 blocks; storing 150 puts 120 in Pod and 30 in Ark Stash!
  const res = inv.storeLootWithAutoOverflow('MAT_OBSIDIAN_BLOCK', 150);
  assert.equal(res.storedInPod, 120);
  assert.equal(res.routedToArkStash, 30);
  assert.equal(inv.getCurrentPodVolumeLiters(), 480.0);
  assert.equal(inv.arkMotherStash.get('MAT_OBSIDIAN_BLOCK'), 30);

  // Deposit 20 blocks from Pod to Ark Stash -> Pod drops to 100, Ark Stash rises to 50
  inv.transferPodToArk('MAT_OBSIDIAN_BLOCK', 20);
  assert.equal(inv.podBackpack.get('MAT_OBSIDIAN_BLOCK'), 100);
  assert.equal(inv.arkMotherStash.get('MAT_OBSIDIAN_BLOCK'), 50);
});

test('WP-06.1: s2rbd Daemon IPC <5ms Fast Local Jump & Alt+R Overlay Stealth Toggle', () => {
  const daemon = new S2rbLocalDaemon();
  daemon.registerHostWorld(
    {
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
    },
    { supportedPrimitives: [] }
  );

  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('D', 'THY01', '261126', '00000001'),
    s2Category: 'HUMAN',
    displayName: '桃花源全息数字人',
    backpackItems: { MAT_OBSIDIAN_BLOCK: 16, REL_TAOHUAYUAN_SPIRIT_JADE: 1 },
    originCurrencies: { TAOHUAYUAN_COIN: 58000 }
  });
  daemon.registerContainer(hero);

  // Jump into CS2 via s2rbd IPC
  const jump = daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: hero.s2Did,
    targetWorldSuns: 'GAME-WA-707-CS2ARENA2-016-4'
  });
  assert.equal(jump.ok, true);
  assert.ok(jump.ipcLatencyMs < 5.0);

  // Press Alt+R -> Overlay opens at 0.35 opacity and shows Obsidian & Jade safely degraded to Tier-C Cosmetic Charms!
  const openSnap = daemon.dispatchIpc({
    type: 'CMD_TOGGLE_ALT_R_OVERLAY',
    s2Did: hero.s2Did,
    open: true,
    tab: 'SPATIAL_BACKPACK_UGO'
  });
  assert.equal(openSnap.overlayVisible, true);
  assert.equal(openSnap.shellFrame.shellOpacity, 0.35);
  assert.equal(openSnap.translatedItems.every((i) => i.tier === 'TIER_C_COSMETIC_CHARM'), true);
  assert.equal(openSnap.importedCurrencyLockedZero, 0);

  // Release Alt+R after ceremony -> returns to 0.0 opacity & 0 shell draw calls!
  daemon.stealthControllers.get(hero.s2Did).tickFrame(3.5);
  const closeSnap = daemon.dispatchIpc({
    type: 'CMD_TOGGLE_ALT_R_OVERLAY',
    s2Did: hero.s2Did,
    open: false
  });
  assert.equal(closeSnap.shellFrame.shellOpacity, 0.0);
  assert.equal(closeSnap.shellFrame.shellDrawCalls, 0);
});

test('WP-06.2: s2rbd Follow-Jump IPC end-to-end join into adjacent L6 berth', () => {
  const daemon = new S2rbLocalDaemon();
  daemon.registerHostWorld(
    {
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
    },
    { supportedPrimitives: ['PLACEABLE_BARRIER_1M3'] }
  );

  const me = new CharacterContainer9m6({
    s2Did: mintS2DidV4('D', 'ME001', '261126', '00000011'),
    s2Category: 'HUMAN',
    displayName: '追随者玩家'
  });
  const friendDid = mintS2DidV4('D', 'FRD01', '261126', '00000022');
  daemon.registerContainer(me);
  daemon.graph.linkMutualFriends(me.s2Did, friendDid);
  daemon.graph.updateFriendPresence({
    friendDid,
    displayName: '古罗马战友',
    currentWorldName: '古罗马帝国：军团纪元',
    currentSuns: 'FILM-WA-009-ROMANEMP2-108-2'
  });

  const followRes = daemon.dispatchIpc({
    type: 'CMD_FOLLOW_FRIEND_JUMP',
    followerDid: me.s2Did,
    leaderFriendDid: friendDid
  });
  assert.equal(followRes.ok, true);
  assert.equal(followRes.lease.holderWorldSuns, 'FILM-WA-009-ROMANEMP2-108-3');
});

test('WP-06.3: Silicon Law 1 Preemptive Red Anchor Fuse completes in < 3.0 ms and bumps fencing token', () => {
  const daemon = new S2rbLocalDaemon();
  const hero = new CharacterContainer9m6({
    s2Did: mintS2DidV4('D', 'FUSE1', '261126', '00000099'),
    s2Category: 'HUMAN',
    displayName: '红锚熔断测试官'
  });
  daemon.registerContainer(hero);

  const fuseRes = daemon.dispatchIpc({
    type: 'CMD_RED_ANCHOR_FUSE_RECALL',
    s2Did: hero.s2Did,
    reason: 'External server hang simulated'
  });
  assert.equal(fuseRes.ok, true);
  assert.equal(fuseRes.withinLaw1ThreeMsSla, true);
  assert.equal(fuseRes.recalledToSuns, GENESIS_HUB_ADDRESS);
  assert.ok(fuseRes.newFencingToken >= 2);
});
