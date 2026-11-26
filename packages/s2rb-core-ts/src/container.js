// WP-02: 9.6m3 (2.0m x 2.0m x 2.4m) 14-Element Smart Space Character Container & Merkle Chronicle Ledger
import crypto from 'node:crypto';
import {
  GENESIS_HUB_ADDRESS,
  GENESIS_LANDMARK_CODE,
  FOURTEEN_ELEMENTS_DICT,
  parseOrMigrateS2Did,
  parseSunsAddress,
  validateS2Category,
  assertZeroCurrencyImport
} from './protocol.js';

export const CONTAINER_DIMENSIONS_M = Object.freeze({
  widthM: 2.0,
  depthM: 2.0,
  heightM: 2.4,
  volumeM3: 9.6
});

export function sha256Hex(domain, payload) {
  return crypto.createHash('sha256').update(`${domain}:${payload}`, 'utf8').digest('hex');
}

function hashMerklePair(leftHex, rightHex) {
  return sha256Hex('S2RB_MERKLE_NODE', `${leftHex}:${rightHex}`);
}

export class ChronicleMerkleLedger {
  constructor(s2Did, originSuns, genesisTimestampMs = Date.now()) {
    this.events = [];
    this.merkleRoot = '0'.repeat(64);
    this.appendEvent({
      timestampEpochMs: genesisTimestampMs,
      worldSuns: originSuns,
      trustTier: 'TIER_1_AUTHORITATIVE',
      kind: 'CONTAINER_GENESIS',
      summaryPayload: `Initialized 9.6m3 Character Container for ${s2Did}`
    });
  }

  appendEvent({ timestampEpochMs = Date.now(), worldSuns, trustTier, kind, summaryPayload }) {
    parseSunsAddress(worldSuns);
    if (!['TIER_1_AUTHORITATIVE', 'TIER_2_PARTNER_VERIFIED', 'TIER_3_LOCAL_SANDBOX'].includes(trustTier)) {
      throw new Error(`Invalid trustTier: ${trustTier}`);
    }
    const seqNo = this.events.length + 1;
    const prevEventHash = this.events.length > 0 ? this.events[this.events.length - 1].eventHash : '0'.repeat(64);
    const canonicalLine = `${seqNo}|${timestampEpochMs}|${worldSuns}|${trustTier}|${kind}|${summaryPayload}|${prevEventHash}`;
    const eventHash = sha256Hex('S2RB_CHRONICLE_LEAF', canonicalLine);
    const ev = Object.freeze({
      seqNo,
      timestampEpochMs,
      worldSuns,
      trustTier,
      kind,
      summaryPayload,
      prevEventHash,
      eventHash
    });
    this.events.push(ev);
    this.merkleRoot = ChronicleMerkleLedger.computeMerkleRoot(this.events);
    return ev;
  }

  static computeMerkleRoot(events) {
    if (events.length === 0) return '0'.repeat(64);
    let layer = events.map((e) => e.eventHash);
    while (layer.length > 1) {
      const next = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
        next.push(hashMerklePair(left, right));
      }
      layer = next;
    }
    return layer[0];
  }

  verifyIntegrity() {
    let expectedPrev = '0'.repeat(64);
    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (ev.seqNo !== i + 1 || ev.prevEventHash !== expectedPrev) return false;
      const raw = `${ev.seqNo}|${ev.timestampEpochMs}|${ev.worldSuns}|${ev.trustTier}|${ev.kind}|${ev.summaryPayload}|${ev.prevEventHash}`;
      if (sha256Hex('S2RB_CHRONICLE_LEAF', raw) !== ev.eventHash) return false;
      expectedPrev = ev.eventHash;
    }
    return ChronicleMerkleLedger.computeMerkleRoot(this.events) === this.merkleRoot;
  }

  generateInclusionProof(leafIndex) {
    if (leafIndex < 0 || leafIndex >= this.events.length) {
      throw new Error(`Leaf index ${leafIndex} out of bounds`);
    }
    const leafEventHash = this.events[leafIndex].eventHash;
    const siblingHashes = [];
    let layer = this.events.map((e) => e.eventHash);
    let idx = leafIndex;

    while (layer.length > 1) {
      const isRightChild = idx % 2 === 1;
      const sibIdx = isRightChild ? idx - 1 : (idx + 1 < layer.length ? idx + 1 : idx);
      siblingHashes.push({
        siblingIsRight: !isRightChild,
        hashHex: layer[sibIdx]
      });
      const next = [];
      for (let i = 0; i < layer.length; i += 2) {
        const left = layer[i];
        const right = i + 1 < layer.length ? layer[i + 1] : layer[i];
        next.push(hashMerklePair(left, right));
      }
      layer = next;
      idx = Math.floor(idx / 2);
    }

    return {
      leafIndex,
      leafEventHash,
      siblingHashes,
      merkleRoot: this.merkleRoot
    };
  }

  static verifyInclusionProof(proof) {
    let cur = proof.leafEventHash;
    for (const step of proof.siblingHashes) {
      cur = step.siblingIsRight ? hashMerklePair(cur, step.hashHex) : hashMerklePair(step.hashHex, cur);
    }
    return cur === proof.merkleRoot;
  }
}

export class CharacterContainer9m6 {
  constructor(config) {
    const didParsed = parseOrMigrateS2Did(config.s2Did, config.strictDidChecksum ?? true);
    const originAddr = parseSunsAddress(config.originSuns || GENESIS_HUB_ADDRESS);
    this.s2Did = didParsed.did;
    this.speciesClass = didParsed.species;
    this.s2Category = validateS2Category(config.s2Category || 'SILICON');
    this.displayName = config.displayName;
    this.originSuns = originAddr.canonical;
    this.currentSuns = originAddr.canonical;
    this.bounds = CONTAINER_DIMENSIONS_M;

    // 14 Elements State (Homeostasis calibrated to Taohuayuan Plaza)
    this.elements = {
      E01_LUMINA: 0.88,
      E02_ATMOS: 1.0,
      E03_ACOUSTIC: 0.86,
      E04_THERMAL: 0.92,
      E05_MOMENTUM: 0.85,
      E06_METABOLIC: 0.90,
      E07_BIOSENSOR: 1.0,
      E08_WAVE: 0.84,
      E09_ODOR: 0.82,
      E10_VIBRATION: 0.95,
      E11_HYDRO_NUTRIENT: 0.90,
      E12_LOGIC_MEMORY: 1.0,
      E13_SOCIAL_TRUST: 0.92,
      E14_CARBON_SOVEREIGNTY: 1.0
    };
    this.physicalSensors = {
      ambientTempC: 22.5,
      oxygenPartialKpa: 21.2,
      illuminanceLux: 480.0
    };

    // Virtual Avatar Character Attributes
    this.avatar = {
      modality: config.modality || 'REALISTIC_PBR_HUMANOID',
      skinUri: config.skinUri || 'capsule://skins/default.glb',
      apparelSockets: { ...(config.apparelSockets || {}) },
      equippedWeapons: [...(config.equippedWeapons || [])],
      backpackItems: { ...(config.backpackItems || {}) },
      hpMax: config.hpMax || 1000,
      hpCurrent: config.hpMax || 1000,
      energyMax: config.energyMax || 500,
      energyCurrent: config.energyMax || 500,
      armorPoiseBonus: config.armorPoiseBonus || 15,
      thermalInsulation: config.thermalInsulation ?? 0.55,
      certifiedTier1Xp: config.certifiedTier1Xp || 0,
      sandboxTier3Xp: config.sandboxTier3Xp || 0,
      originSkills: [...(config.originSkills || [])],
      hybridSkills: [],
      guildName: config.guildName || null,
      honorBadges: [...(config.honorBadges || [])]
    };

    // Segregated Read-Only Origin Escrow Vault (Cross-world currency import locked to 0)
    this.originEscrowVault = { ...(config.originCurrencies || {}) };

    // 6-DoF Intra-Pod Kinematics & Stealth Envelope State
    this.kinematics = {
      worldAnchorPosM: [0, 0, 0],
      worldYawRad: 0,
      avatarLocalOffsetM: [0, 0, 0],
      posture: 'STANDING',
      visibilityMode: 'STEALTH_GAMEPLAY_INVISIBLE',
      emergencyRecallLatched: false
    };

    this.chronicle = new ChronicleMerkleLedger(
      this.s2Did,
      this.originSuns,
      config.genesisTimestampMs || Date.now()
    );
    this.lastKnownGoodSnapshot = this._serializeCleanState();
  }

  /**
   * Computes Superimposed Game Functional Attributes from live 14-Element Spatial Tensors.
   */
  computeGameOverlay() {
    const e = this.elements;
    return {
      opticalFlashResist: Math.min(0.65, Number((e.E01_LUMINA * 0.45).toFixed(4))),
      prismRimRoughnessPct: 5.5, // Strictly >= 5.0% per Silicon Law 2
      o2ReserveSeconds: Math.round(e.E02_ATMOS * 360),
      acousticRadarRadiusM: Number((8.0 + e.E03_ACOUSTIC * 22.0).toFixed(2)),
      stealthSoundDampening: Math.min(0.80, Number((e.E03_ACOUSTIC * 0.55).toFixed(4))),
      cooldownDissipationMult: Number((0.75 + e.E04_THERMAL * 0.50).toFixed(4)),
      poiseTenacityScore: Math.min(100, Number((e.E05_MOMENTUM * 70 + this.avatar.armorPoiseBonus).toFixed(2))),
      energyRegenMult: Number((0.50 + e.E06_METABOLIC * 0.90).toFixed(4)),
      waveMinimapSenseM: Number((12.0 + e.E08_WAVE * 28.0).toFixed(2)),
      toxinImmunityRatio: Number((e.E09_ODOR * 0.85).toFixed(4)),
      containerShieldIntegrity: Number((e.E10_VIBRATION * 100).toFixed(2)),
      passiveVitalRegenPctPerSec: Number((e.E11_HYDRO_NUTRIENT * 1.8).toFixed(3)),
      shellOpacity: this.getEnvelopeOpacity()
    };
  }

  getEnvelopeOpacity() {
    switch (this.kinematics.visibilityMode) {
      case 'CEREMONY_VISIBLE': return 0.92;
      case 'STEALTH_GAMEPLAY_INVISIBLE': return 0.0;
      case 'USER_INSPECT_OVERLAY': return 0.35;
      case 'SYSTEM_TELEMETRY_WAKEUP': return 0.85;
      default: return 0.0;
    }
  }

  /**
   * Divergent Module 01: Coupled 14-Element Environmental Physics Step.
   */
  stepEnvironmentCoupling({ externalTempC = 22.5, externalO2Kpa = 21.2, externalFlashLux = 480, dtSec = 1.0 }) {
    const dt = Math.max(0, Math.min(60, dtSec));
    const leak = (1.0 - this.avatar.thermalInsulation) * 0.08 * dt;
    this.physicalSensors.ambientTempC += (externalTempC - this.physicalSensors.ambientTempC) * Math.min(1, leak);
    const tempDev = Math.abs(this.physicalSensors.ambientTempC - 22.0);
    this.elements.E04_THERMAL = Math.max(0.05, Math.min(1.0, 1.0 - tempDev / 80.0));

    if (externalO2Kpa < 14.0) {
      this.physicalSensors.oxygenPartialKpa = Math.max(0, this.physicalSensors.oxygenPartialKpa - 0.025 * dt);
    } else {
      this.physicalSensors.oxygenPartialKpa = Math.min(21.2, this.physicalSensors.oxygenPartialKpa + 0.15 * dt);
    }
    this.elements.E02_ATMOS = Number((this.physicalSensors.oxygenPartialKpa / 21.2).toFixed(4));

    if (tempDev > 15.0) {
      const stress = ((tempDev - 15.0) / 100.0) * dt * 0.12;
      this.elements.E06_METABOLIC = Math.max(0.05, this.elements.E06_METABOLIC - stress);
      this.elements.E05_MOMENTUM = Math.max(0.20, this.elements.E05_MOMENTUM - stress * 0.5);
    }

    if (externalFlashLux > 25000) {
      this.elements.E01_LUMINA = 0.25;
      this.chronicle.appendEvent({
        worldSuns: this.currentSuns,
        trustTier: 'TIER_1_AUTHORITATIVE',
        kind: 'ENV_TENSOR_SPIKE',
        summaryPayload: `Optical flash spike ${externalFlashLux} lux mitigated inside 9.6m3 pod`
      });
    }
    return this.computeGameOverlay();
  }

  /**
   * Divergent Module 04: Dual-Layer Container-to-Body Anti-Overflow Damage Sanitizer.
   */
  applyIncomingHostDamage(rawDamage, maxSingleHitCapPct = 0.65) {
    if (this.kinematics.emergencyRecallLatched) {
      return { absorbedByShield: Math.max(0, rawDamage || 0), netHpLoss: 0, overflowClamped: true };
    }
    if (typeof rawDamage !== 'number' || !Number.isFinite(rawDamage) || rawDamage <= 0) {
      return { absorbedByShield: 0, netHpLoss: 0, overflowClamped: false, rejectedInvalidNumber: true };
    }
    const cap = this.avatar.hpMax * Math.max(0.05, Math.min(1.0, maxSingleHitCapPct));
    const overflowClamped = rawDamage > cap;
    const clamped = Math.min(rawDamage, cap);

    let absorbedByShield = 0;
    if (this.elements.E10_VIBRATION > 0.10) {
      absorbedByShield = clamped * 0.20;
      this.elements.E10_VIBRATION = Math.max(0, Number((this.elements.E10_VIBRATION - 0.025).toFixed(4)));
    }
    const netHpLoss = Math.max(0, clamped - absorbedByShield);
    this.avatar.hpCurrent = Math.max(1, Number((this.avatar.hpCurrent - netHpLoss).toFixed(2)));
    return { absorbedByShield, netHpLoss, overflowClamped, remainingHp: this.avatar.hpCurrent };
  }

  /**
   * Divergent Module 05: Slab-Method Ray/Projectile Exit Solver at @ dOmega_9.6m3.
   */
  solveBoundaryExit({ skillOrWeaponId, originLocalM = [0, 0, 1.4], directionVec, maxRangeM, targetAoeRadiusM = 0 }) {
    const [ox, oy, oz] = originLocalM;
    if (ox < -1 || ox > 1 || oy < -1 || oy > 1 || oz < 0 || oz > 2.4) {
      throw new Error(`Origin point [${originLocalM}] violates 9.6m3 container bounds`);
    }
    const [dx, dy, dz] = directionVec;
    const len = Math.hypot(dx, dy, dz);
    if (len < 1e-9) return null;
    const dir = [dx / len, dy / len, dz / len];

    const planes = [
      { axis: 0, bound: 1.0, face: '+X' },
      { axis: 0, bound: -1.0, face: '-X' },
      { axis: 1, bound: 1.0, face: '+Y' },
      { axis: 1, bound: -1.0, face: '-Y' },
      { axis: 2, bound: 2.4, face: '+Z' },
      { axis: 2, bound: 0.0, face: '-Z' }
    ];

    let tExit = Infinity;
    let exitFace = '+Y';
    for (const p of planes) {
      const comp = dir[p.axis];
      if (Math.abs(comp) > 1e-9) {
        const t = (p.bound - originLocalM[p.axis]) / comp;
        if (t > 0 && t < tExit) {
          tExit = t;
          exitFace = p.face;
        }
      }
    }

    if (maxRangeM <= tExit && targetAoeRadiusM <= 1.0) {
      return null; // Strictly contained inside 9.6m3 renderer!
    }

    const exitLocal = [
      Math.max(-1, Math.min(1, ox + dir[0] * tExit)),
      Math.max(-1, Math.min(1, oy + dir[1] * tExit)),
      Math.max(0, Math.min(2.4, oz + dir[2] * tExit))
    ];
    const cosY = Math.cos(this.kinematics.worldYawRad);
    const sinY = Math.sin(this.kinematics.worldYawRad);
    const [wx, wy, wz] = this.kinematics.worldAnchorPosM;
    const exitWorld = [
      Number((wx + exitLocal[0] * cosY - exitLocal[1] * sinY).toFixed(4)),
      Number((wy + exitLocal[0] * sinY + exitLocal[1] * cosY).toFixed(4)),
      Number((wz + exitLocal[2]).toFixed(4))
    ];

    return {
      skillOrWeaponId,
      exitPointLocalM: exitLocal.map((v) => Number(v.toFixed(4))),
      exitPointWorldM: exitWorld,
      directionUnitVec: dir.map((v) => Number(v.toFixed(4))),
      exitFace,
      remainingRangeM: Number(Math.max(0, maxRangeM - tExit).toFixed(4)),
      targetAoeRadiusM
    };
  }

  /**
   * Divergent Module 07 & 09: Taint-Tracked XP Gain & Cross-World Skill Resonance Synthesis.
   */
  recordAdventureEvolution({ worldSuns, trustTier, xpDelta, hostWorldLawTag, originSkillId, attemptedCurrencyImport = 0 }) {
    assertZeroCurrencyImport(attemptedCurrencyImport);
    const parsedWorld = parseSunsAddress(worldSuns);
    this.currentSuns = parsedWorld.canonical;

    if (xpDelta > 0) {
      if (trustTier === 'TIER_1_AUTHORITATIVE') {
        this.avatar.certifiedTier1Xp += xpDelta;
      } else {
        this.avatar.sandboxTier3Xp += xpDelta;
      }
    }

    let unlockedHybrid = null;
    if (originSkillId && hostWorldLawTag) {
      const baseSkill = this.avatar.originSkills.find((s) => s.skillId === originSkillId);
      if (baseSkill) {
        const recipeHash = 'RES-' + sha256Hex('S2RB_RESONANCE', `${originSkillId}:${hostWorldLawTag}`).slice(0, 16).toUpperCase();
        unlockedHybrid = this.avatar.hybridSkills.find((h) => h.recipeHash === recipeHash) || null;
        if (!unlockedHybrid) {
          const fusionMap = {
            'VOXEL_CONSTRUCT:ROMAN_SIEGE_LAW': '红石机械龟甲筑城术',
            'PROTECTIVE_SHIELD:MOBA_CANYON_LAW': '圣光裁决·主宰先锋圣盾',
            'ACOUSTIC_WAVE_SCAN:TACTICAL_CQB_LAW': '硅基全息声纹透视脉冲'
          };
          const name = fusionMap[`${baseSkill.primitive}:${hostWorldLawTag}`] || `跨界共鸣·${baseSkill.name}×${hostWorldLawTag}`;
          unlockedHybrid = {
            recipeHash,
            name,
            originSkillId,
            hostWorldLawTag,
            trustTier
          };
          this.avatar.hybridSkills.push(unlockedHybrid);
        }
      }
    }

    const ev = this.chronicle.appendEvent({
      worldSuns: this.currentSuns,
      trustTier,
      kind: unlockedHybrid ? 'SKILL_RESONANCE_UNLOCKED' : 'COMBAT_PROGRESSION',
      summaryPayload: `Gained +${xpDelta} XP (${trustTier})${unlockedHybrid ? ` & unlocked ${unlockedHybrid.name}` : ''}; importedCurrency=0`
    });
    return { event: ev, unlockedHybrid, certifiedLevel: this.getEffectiveLevel(false), sandboxLevel: this.getEffectiveLevel(true) };
  }

  getEffectiveLevel(includeSandboxTier3 = false) {
    const totalXp = includeSandboxTier3
      ? this.avatar.certifiedTier1Xp + this.avatar.sandboxTier3Xp
      : this.avatar.certifiedTier1Xp;
    return Math.min(120, 1 + Math.floor(Math.sqrt(totalXp / 500)));
  }

  /**
   * Divergent Module 03: Offline Cryo-Homeostasis Restoration.
   */
  applyOfflineHomeostasis(elapsedOfflineSeconds) {
    const hours = Math.max(0, elapsedOfflineSeconds) / 3600.0;
    const isTaohuayuan = this.currentSuns.startsWith('META-CN-001-TAOHUAYUAN') || this.currentSuns.startsWith('PHYS-');
    const mult = isTaohuayuan ? 1.5 : 1.0;
    const restoredHp = Math.min(this.avatar.hpMax - this.avatar.hpCurrent, this.avatar.hpMax * 0.12 * hours * mult);
    const meditationXp = Math.min(1800, Math.floor(Math.min(24, hours) * 45 * mult));
    this.avatar.hpCurrent = Number((this.avatar.hpCurrent + restoredHp).toFixed(2));
    this.avatar.certifiedTier1Xp += meditationXp;
    this.chronicle.appendEvent({
      worldSuns: this.currentSuns,
      trustTier: 'TIER_1_AUTHORITATIVE',
      kind: 'CRYO_HOMEOSTASIS_RESTORED',
      summaryPayload: `Offline ${hours.toFixed(1)}h at ${this.currentSuns}: +${restoredHp.toFixed(1)} HP, +${meditationXp} meditation XP`
    });
    return { restoredHp, meditationXp, isTaohuayuanSanctuaryBonus: isTaohuayuan };
  }

  /**
   * Silicon Law 1: 5N / 3ms Fail-Open Carbon-Sovereignty Emergency Recall.
   */
  triggerEmergencyRedAnchorRecall() {
    this.kinematics.emergencyRecallLatched = true;
    this.kinematics.visibilityMode = 'SYSTEM_TELEMETRY_WAKEUP';
    this.elements.E10_VIBRATION = 1.0;
    this.elements.E14_CARBON_SOVEREIGNTY = 1.0;
    this.currentSuns = GENESIS_HUB_ADDRESS;
    this.chronicle.appendEvent({
      worldSuns: GENESIS_HUB_ADDRESS,
      trustTier: 'TIER_1_AUTHORITATIVE',
      kind: 'EMERGENCY_RED_ANCHOR_RECALL',
      summaryPayload: 'Silicon Law 1 (<3ms Fail-Open) recalled container safely to Taohuayuan Genesis Hub'
    });
    return { recalledTo: GENESIS_HUB_ADDRESS, landmark: GENESIS_LANDMARK_CODE, latencyBudgetMs: 3.0 };
  }

  _serializeCleanState() {
    return JSON.stringify({
      s2Did: this.s2Did,
      originSuns: this.originSuns,
      bounds: this.bounds,
      elements: this.elements,
      avatar: this.avatar,
      originEscrowVault: this.originEscrowVault
    });
  }

  toContainerManifest() {
    return {
      schema: 'space2.s2rb.container/v3.0.0',
      s2Did: this.s2Did,
      speciesClass: this.speciesClass,
      s2Category: this.s2Category,
      displayName: this.displayName,
      genesisHubAnchor: GENESIS_HUB_ADDRESS,
      physicalLandmark: GENESIS_LANDMARK_CODE,
      originSuns: this.originSuns,
      currentSuns: this.currentSuns,
      spatialEnvelope: this.bounds,
      fourteenElements: { ...this.elements },
      fourteenElementsCatalogCount: FOURTEEN_ELEMENTS_DICT.length,
      superimposedGameOverlay: this.computeGameOverlay(),
      avatar: structuredClone(this.avatar),
      economyFirewall: {
        allowCurrencyImport: false,
        importedCurrencyAmount: 0,
        frozenOriginEscrowVault: { ...this.originEscrowVault }
      },
      chronicleSummary: {
        totalEvents: this.chronicle.events.length,
        merkleRoot: this.chronicle.merkleRoot,
        events: this.chronicle.events
      }
    };
  }
}
