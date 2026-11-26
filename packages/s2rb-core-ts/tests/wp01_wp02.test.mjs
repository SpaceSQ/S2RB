import test from 'node:test';
import assert from 'node:assert/strict';
import {
  GENESIS_HUB_ADDRESS,
  FOURTEEN_ELEMENTS_DICT,
  mintS2DidV4,
  parseOrMigrateS2Did,
  parseSunsAddress,
  validateS2Category,
  convertContainerPointToHost,
  assertZeroCurrencyImport,
  CharacterContainer9m6,
  ChronicleMerkleLedger
} from '../src/index.js';

test('WP-01.1: S2-DID v4.0 minting, strict 22-char checksum & v3.0 lossless migration', () => {
  const did = mintS2DidV4('D', 'TAOHU', '261126', '00000001');
  assert.equal(did.length, 22);
  const parsed = parseOrMigrateS2Did(did, true);
  assert.equal(parsed.did, did);
  assert.equal(parsed.migratedFromV3, false);

  // Legacy v3.0 migration (checksum at indices 12..14)
  const migrated = parseOrMigrateS2Did('VTAOHU260412JE70806749', true);
  assert.equal(migrated.migratedFromV3, true);
  assert.equal(migrated.did.length, 22);
  assert.equal(migrated.serial, '70806749');

  // Tampered checksum rejected
  const bad = did.slice(0, 20) + (did.endsWith('AA') ? 'ZZ' : 'AA');
  assert.throws(() => parseOrMigrateS2Did(bad, true), /S2RB_DID_CHECKSUM_MISMATCH/);
});

test('WP-01.2: S2 7-category taxonomy enforces MYTH and blocks MATH', () => {
  assert.equal(validateS2Category('MYTH'), 'MYTH');
  assert.throws(() => validateS2Category('MATH'), /strictly MYTH/);
});

test('WP-01.3: CD-U6A 6-segment SUNS address parser & Taohuayuan Genesis Hub', () => {
  const hub = parseSunsAddress(GENESIS_HUB_ADDRESS);
  assert.equal(hub.l1, 'META');
  assert.equal(hub.l2, 'CN');
  assert.equal(hub.l4Sovereign, 'TAOHUAYUAN');
  assert.equal(hub.l6Berth, 2);
  assert.equal(hub.isPublicCommons, true);
  assert.throws(() => parseSunsAddress('INVALID-ADDR'), /Expected 6 segments/);
});

test('WP-01.4: Divergent Module 02 - Cross-Engine Coordinate Basis Converter (UE5, Unity, glTF, Source2)', () => {
  const topCorner = [1.0, 1.0, 2.4];
  assert.deepEqual(convertContainerPointToHost(topCorner, 'UNREAL_LEFT_Z_UP_CM'), [100, 100, 240]);
  assert.deepEqual(convertContainerPointToHost(topCorner, 'UNITY_LEFT_Y_UP_M'), [1.0, 2.4, 1.0]);
  assert.deepEqual(convertContainerPointToHost(topCorner, 'GLTF_RIGHT_Y_UP_M'), [1.0, 2.4, -1.0]);
});

test('WP-02.1: 9.6m3 (2.0m x 2.0m x 2.4m) 14-Element Container initialization & Stealth Mode', () => {
  assert.equal(FOURTEEN_ELEMENTS_DICT.length, 14);
  const did = mintS2DidV4('D', 'MILES', '261126', '88888888');
  const container = new CharacterContainer9m6({
    s2Did: did,
    s2Category: 'HUMAN',
    displayName: '桃花源全息数字人·零号先遣官',
    modality: 'VOLUMETRIC_HUMAN_HOLOGRAM',
    originCurrencies: { TAOHUAYUAN_COIN: 58000 }
  });
  assert.equal(container.bounds.volumeM3, 9.6);
  const overlay = container.computeGameOverlay();
  assert.equal(overlay.shellOpacity, 0.0); // Normal gameplay stealth mode!
  assert.ok(overlay.prismRimRoughnessPct >= 5.0); // Silicon Law 2
  assert.equal(overlay.o2ReserveSeconds, 360);
});

test('WP-02.2: Divergent Module 01 & 04 - 14-Element Coupling & Anti-Overflow Damage Sanitizer', () => {
  const did = mintS2DidV4('V', 'WOW01', '261126', '00029910');
  const paladin = new CharacterContainer9m6({
    s2Did: did,
    displayName: '白银之手重装圣骑士',
    hpMax: 4000,
    thermalInsulation: 0.2
  });

  // Vacuum + extreme cold coupling test
  const overlayAfterColdVacuum = paladin.stepEnvironmentCoupling({
    externalTempC: -55,
    externalO2Kpa: 0,
    dtSec: 20
  });
  assert.ok(overlayAfterColdVacuum.o2ReserveSeconds < 360);
  assert.ok(paladin.elements.E06_METABOLIC < 0.90);

  // Bugged host engine sends NaN and 999,999,999 overflow damage
  const nanRes = paladin.applyIncomingHostDamage(Number.NaN);
  assert.equal(nanRes.netHpLoss, 0);

  const overflowRes = paladin.applyIncomingHostDamage(999_999_999, 0.65);
  assert.equal(overflowRes.overflowClamped, true);
  assert.ok(paladin.avatar.hpCurrent >= 1); // Character never corrupted or one-shot by overflow!
});

test('WP-02.3: Divergent Module 05 - @ dOmega_9.6m3 Boundary-Crossing Projectile & Short Melee Solver', () => {
  const did = mintS2DidV4('D', 'CS201', '261126', '00000101');
  const agent = new CharacterContainer9m6({ s2Did: did, displayName: '战术数字人' });

  // 1) Short 0.55m melee knife slash stays strictly inside 9.6m3 -> no host handoff needed
  const melee = agent.solveBoundaryExit({
    skillOrWeaponId: 'MELEE_DAGGER',
    originLocalM: [0, 0, 1.3],
    directionVec: [0, 1, 0],
    maxRangeM: 0.55
  });
  assert.equal(melee, null);

  // 2) Long-range 80m rifle shot exits +Y face at y = +1.0m with 79.0m remaining range for host engine!
  const shot = agent.solveBoundaryExit({
    skillOrWeaponId: 'M4A1_BALLISTIC_RAY',
    originLocalM: [0, 0, 1.5],
    directionVec: [0, 1, 0],
    maxRangeM: 80.0
  });
  assert.ok(shot !== null);
  assert.equal(shot.exitFace, '+Y');
  assert.deepEqual(shot.exitPointLocalM, [0, 1, 1.5]);
  assert.equal(shot.remainingRangeM, 79.0);
});

test('WP-02.4: Divergent Module 07, 08, 09 & 10 - Trust Taint Isolation, Skill Resonance, Merkle Proofs & Currency Firewall', () => {
  const did = mintS2DidV4('V', 'MC001', '261126', '00010842');
  const knight = new CharacterContainer9m6({
    s2Did: did,
    displayName: '方块创客骑士',
    originSuns: 'GAME-EA-101-MINECRAFT2-008-2',
    originCurrencies: { MC_EMERALD: 640 },
    originSkills: [
      { skillId: 'SK_VOXEL_WALL', name: '方块瞬时筑垒', primitive: 'VOXEL_CONSTRUCT' }
    ]
  });

  // 1) Currency import attack MUST throw hard 403 firewall error
  assert.throws(
    () =>
      knight.recordAdventureEvolution({
        worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
        trustTier: 'TIER_3_LOCAL_SANDBOX',
        xpDelta: 1000,
        attemptedCurrencyImport: 640
      }),
    /S2RB_ERR_403_CURRENCY_IMPORT_FORBIDDEN/
  );
  assert.throws(() => assertZeroCurrencyImport(0.01), /CURRENCY_IMPORT_FORBIDDEN/);

  // 2) Single-player Tier-3 modded XP is quarantined from Tier-1 competitive level!
  knight.recordAdventureEvolution({
    worldSuns: 'FILM-WA-009-ROMANEMP2-108-2',
    trustTier: 'TIER_3_LOCAL_SANDBOX',
    xpDelta: 500_000,
    originSkillId: 'SK_VOXEL_WALL',
    hostWorldLawTag: 'ROMAN_SIEGE_LAW'
  });
  assert.equal(knight.getEffectiveLevel(false), 1); // Tier-1 competitive level unaffected by local mod!
  assert.ok(knight.getEffectiveLevel(true) > 25);   // Tier-3 sandbox enjoys full progression!
  assert.equal(knight.avatar.hybridSkills[0].name, '红石机械龟甲筑城术');

  // 3) Selective Merkle Inclusion Proof & Tamper Detection
  assert.equal(knight.chronicle.verifyIntegrity(), true);
  const proof = knight.chronicle.generateInclusionProof(1);
  assert.equal(ChronicleMerkleLedger.verifyInclusionProof(proof), true);

  const forgedProof = { ...proof, leafEventHash: 'f'.repeat(64) };
  assert.equal(ChronicleMerkleLedger.verifyInclusionProof(forgedProof), false);

  // 4) Offline Cryo-Homeostasis at Taohuayuan Sanctuary + Silicon Law 1 Recall
  const recall = knight.triggerEmergencyRedAnchorRecall();
  assert.equal(recall.recalledTo, GENESIS_HUB_ADDRESS);
  const rest = knight.applyOfflineHomeostasis(8 * 3600);
  assert.equal(rest.isTaohuayuanSanctuaryBonus, true);
  assert.ok(rest.meditationXp > 0);
});
