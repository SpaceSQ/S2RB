import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_HUB_ADDRESS,
  GENESIS_LANDMARK_CODE,
  mintS2DidV4,
  CharacterContainer9m6,
  S2rbLocalDaemon,
  EIGHT_ENGINE_PLUGINS,
  generateHostTomlConfig,
  HostEnginePluginSimulator,
  TaohuayuanGenesisOperationsCenter
} from '../src/index.js';

function createPioneerContainer(did = mintS2DidV4('D', 'MILES', '261126', '88888888'), name = 'Miles_Ark_Pioneer') {
  return new CharacterContainer9m6({
    s2Did: did,
    s2Category: 'HUMAN',
    displayName: name,
    modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
    backpackItems: {
      MAT_OBSIDIAN_BLOCK: 12,
      WP_ASHBRINGER_GREATSWORD: 1,
      REL_TAOHUAYUAN_SPIRIT_JADE: 1
    },
    originCurrencies: { EMERALD: 640, LORD_GOLD: 12800 }
  });
}

test('WP-07.1 Eight native engine plugins mount cleanly with bijective forward/inverse affine transforms', () => {
  assert.equal(EIGHT_ENGINE_PLUGINS.length, 8);
  const daemon = new S2rbLocalDaemon();
  const samplePt = [0.65, -0.82, 1.75];

  for (const profile of EIGHT_ENGINE_PLUGINS) {
    const sim = new HostEnginePluginSimulator(daemon, profile.engineId);
    const hostPt = sim.toHostCoords(samplePt, 1.0);
    const roundTrip = sim.fromHostCoords(hostPt, 1.0);
    assert.ok(Math.abs(roundTrip[0] - samplePt[0]) < 1e-9, `${profile.engineId} X mismatch`);
    assert.ok(Math.abs(roundTrip[1] - samplePt[1]) < 1e-9, `${profile.engineId} Y mismatch`);
    assert.ok(Math.abs(roundTrip[2] - samplePt[2]) < 1e-9, `${profile.engineId} Z mismatch`);
  }
});

test('WP-07.2 UE5 Roman Empire vs Source2 CS2 & Godot 4 enforce Tier-A, Tier-B & Tier-C UGO governance accurately', () => {
  const daemon = new S2rbLocalDaemon();
  const hub = new TaohuayuanGenesisOperationsCenter(daemon);
  const c = createPioneerContainer();
  daemon.registerContainer(c);

  // 1) Jump to UE5 Roman Empire -> Obsidian activates Tier-A 1m3 physical barricade
  const jumpRoman = daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: c.s2Did,
    targetWorldSuns: 'FILM-WA-009-ROMANEMP2-108-2'
  });
  assert.equal(jumpRoman.ok, true);
  const ovRoman = daemon.dispatchIpc({ type: 'CMD_TOGGLE_ALT_R_OVERLAY', s2Did: c.s2Did, open: true });
  const obsRoman = ovRoman.translatedItems.find((i) => i.ugoId === 'MAT_OBSIDIAN_BLOCK');
  assert.equal(obsRoman.tier, 'TIER_A_NATIVE_MECHANIC');
  assert.equal(obsRoman.gameplayStatBonusActive, true);

  // 2) Jump to Godot 4 Open Indie -> Degrades gracefully to Tier-B Passive Affix
  const jumpGodot = daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: c.s2Did,
    targetWorldSuns: 'GAME-SA-006-OPENINDIE2-003-2'
  });
  assert.equal(jumpGodot.ok, true);
  const ovGodot = daemon.dispatchIpc({ type: 'CMD_TOGGLE_ALT_R_OVERLAY', s2Did: c.s2Did, open: true });
  const obsGodot = ovGodot.translatedItems.find((i) => i.ugoId === 'MAT_OBSIDIAN_BLOCK');
  assert.equal(obsGodot.tier, 'TIER_B_PASSIVE_AFFIX');

  // 3) Jump to Source 2 CS2 Tactical -> All cross-world items degrade strictly to Tier-C Zero-Stat Weapon Charm
  const jumpCs2 = daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: c.s2Did,
    targetWorldSuns: 'GAME-NA-003-CS2TACTIC2-012-4'
  });
  assert.equal(jumpCs2.ok, true);
  const ovCs2 = daemon.dispatchIpc({ type: 'CMD_TOGGLE_ALT_R_OVERLAY', s2Did: c.s2Did, open: true });
  for (const item of ovCs2.translatedItems) {
    assert.equal(item.tier, 'TIER_C_COSMETIC_CHARM');
    assert.equal(item.gameplayStatBonusActive, false);
  }
  assert.equal(hub.get4kCommandDeckSnapshot().connectedEngineCount, 8);
});

test('WP-07.3 Host s2rb-host.toml generator enforces zero-currency import firewall across all 8 plugins', () => {
  for (const p of EIGHT_ENGINE_PLUGINS) {
    const toml = generateHostTomlConfig(p.engineId);
    assert.match(toml, /allow_currency_import = false/);
    assert.match(toml, /volume_m3 = 9\.6/);
  }
  assert.throws(
    () => generateHostTomlConfig('unreal-s2rb', { allowCurrencyImport: true }),
    /S2RB_ERR_403_CURRENCY_IMPORT_FORBIDDEN/
  );
});

test('WP-08.1 Taoyuan Custom Travel Pass binds TC-001-ARCH NFC anchor and rejects currency smuggling', () => {
  const daemon = new S2rbLocalDaemon();
  const hub = new TaohuayuanGenesisOperationsCenter(daemon);
  const c = createPioneerContainer();
  const companionDid = mintS2DidV4('V', 'TAOHU', '261126', '00000108');
  daemon.registerContainer(c);

  const pass = hub.issueTaoyuanTravelPass({
    travelerDid: c.s2Did,
    companionDid,
    routeCode: 'TY-ROUTE-01-STAR_PLAZA'
  });
  assert.equal(pass.entryGateSuns, GENESIS_HUB_ADDRESS);
  assert.equal(pass.landmarkCode, GENESIS_LANDMARK_CODE);
  assert.equal(pass.cryoRecoveryMultiplier, 1.5);
  assert.equal(pass.importedCurrencyAmount, 0);

  assert.throws(
    () =>
      hub.issueTaoyuanTravelPass({
        travelerDid: c.s2Did,
        routeCode: 'TY-ROUTE-02-QINXI_BOAT',
        attemptedCurrencyCarry: 500
      }),
    /S2RB_ERR_403_CURRENCY_IMPORT_FORBIDDEN/
  );
  assert.equal(hub.get4kCommandDeckSnapshot().blockedCurrencyAttempts, 1);
});

test('WP-08.2 Operations Center 4K Global Red Anchor Fuse recalls multi-world containers within 3.0 ms SLA', () => {
  const daemon = new S2rbLocalDaemon();
  const hub = new TaohuayuanGenesisOperationsCenter(daemon);

  const c1 = createPioneerContainer(mintS2DidV4('D', 'MILES', '261126', '88888888'), 'Pioneer_Roman');
  const c2 = createPioneerContainer(mintS2DidV4('D', 'UTHER', '261126', '00029910'), 'Paladin_HoK');
  daemon.registerContainer(c1);
  daemon.registerContainer(c2);

  daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: c1.s2Did,
    targetWorldSuns: 'FILM-WA-009-ROMANEMP2-108-2'
  });
  daemon.dispatchIpc({
    type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
    s2Did: c2.s2Did,
    targetWorldSuns: 'GAME-CN-002-HONORKING2-005-2'
  });

  const receipt = hub.triggerGlobalRedAnchorDrill('Plaza TC-001-ARCH Hardware E-Stop Test');
  assert.equal(receipt.recalledCount, 2);
  assert.equal(receipt.withinLaw1Sla, true);
  assert.ok(receipt.totalElapsedMs <= 3.0, `Expected <= 3.0ms, got ${receipt.totalElapsedMs}ms`);
  assert.equal(c1.currentSuns, GENESIS_HUB_ADDRESS);
  assert.equal(c2.currentSuns, GENESIS_HUB_ADDRESS);
});
