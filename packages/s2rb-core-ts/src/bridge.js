// WP-03: Rainbow Bridge Cross-World Router (Singleton 2PC Fencing Lease + Clone CRDT Merger + 7-Dim Governance)
import { GENESIS_HUB_ADDRESS, parseSunsAddress, assertZeroCurrencyImport } from './protocol.js';

export const TRANSIT_DEADMAN_TIMEOUT_MS = 3000;

/**
 * Host 7-Dimension Admission Governance Engine (`s2rb.world.manifest.json`)
 */
export class Host7DimGovernanceFilter {
  static validateManifest(manifest) {
    if (!manifest || typeof manifest !== 'object') {
      throw new Error('S2RB_GOV_ERROR: Missing host manifest');
    }
    if (manifest.allowCurrencyImport !== false) {
      throw new Error('S2RB_GOV_BOOT_ERROR: allowCurrencyImport MUST be strictly false on all host worlds');
    }
    parseSunsAddress(manifest.worldSuns);
    return true;
  }

  static projectContainer(container, manifest) {
    this.validateManifest(manifest);
    assertZeroCurrencyImport(0);

    const isCompetitive = manifest.networkMode === 'ONLINE_AUTHORITATIVE';
    const includeSandboxXp = manifest.trustTier === 'TIER_3_LOCAL_SANDBOX';
    const effectiveLevel = manifest.allowOriginXp === 'CURVE_SYNC'
      ? container.getEffectiveLevel(includeSandboxXp)
      : 1;

    const [hpMin, hpMax] = manifest.hostHpBracket || [100, 100];
    const hpMid = (hpMin + hpMax) * 0.5;
    let projectedHpMax = hpMid;
    if (manifest.allowOriginXp === 'CURVE_SYNC') {
      const t = Math.min(1, effectiveLevel / 100);
      projectedHpMax = isCompetitive
        ? Number((hpMid + (t - 0.5) * (hpMax - hpMin) * 0.05).toFixed(2)) // +/- 5% Law 3 clamp
        : Number((hpMin + t * (hpMax - hpMin)).toFixed(2));
    }

    return Object.freeze({
      targetWorldSuns: parseSunsAddress(manifest.worldSuns).canonical,
      networkMode: manifest.networkMode,
      trustTier: manifest.trustTier,
      coordConvention: manifest.coordConvention || 'S2_CANONICAL_Z_UP_M',
      effectiveLevelInHost: effectiveLevel,
      projectedHpMax,
      activeSkinUri: manifest.allowSkin === 'HIDDEN' ? null : container.avatar.skinUri,
      shaderAdapted: manifest.allowSkin !== 'FULL_PBR',
      visibleApparelCount: manifest.allowApparel === 'DISABLED' ? 0 : Object.keys(container.avatar.apparelSockets).length,
      weaponStatsActive: manifest.allowEquipment === 'FULL_STATS' && !isCompetitive,
      weaponTransmogVisible: manifest.allowEquipment !== 'DISABLED',
      backpackInteractive: manifest.allowBackpackItems === 'ACTIVE_USE',
      combatSkillsEnabled: manifest.allowSkills === 'SEMANTIC_MAPPED',
      importedCurrencyAmount: 0
    });
  }
}

/**
 * Mode A: Singleton 2PC Atomic Migration Coordinator with Monotonic Fencing Tokens.
 * Enforces: Source World Despawn -> Bifrost Transit -> Target World Rebirth (at most 1 instance in universe).
 */
export class Singleton2PcBridge {
  constructor(container, initialNowMs = Date.now()) {
    this.container = container;
    this.highestFencingToken = 1;
    this.state = {
      phase: 'ACTIVE_IN_WORLD',
      lease: Object.freeze({
        s2Did: container.s2Did,
        holderWorldSuns: container.currentSuns,
        fencingToken: 1,
        issuedAtMs: initialNowMs
      })
    };
  }

  beginFreezeAndExtract({ txId, expectedFencingToken, targetWorldSuns, nowMs = Date.now() }) {
    if (this.state.phase !== 'ACTIVE_IN_WORLD') {
      throw new Error(`S2RB_2PC_BUSY: Cannot begin migration while in phase ${this.state.phase}`);
    }
    if (expectedFencingToken !== this.state.lease.fencingToken) {
      throw new Error(`S2RB_FENCING_STALE: expected token #${this.state.lease.fencingToken}, got #${expectedFencingToken}`);
    }
    const parsedTarget = parseSunsAddress(targetWorldSuns);
    this.container.kinematics.visibilityMode = 'CEREMONY_VISIBLE';
    this.container.lastKnownGoodSnapshot = this.container._serializeCleanState();

    this.state = {
      phase: 'PHASE1_FREEZE_EXTRACTING',
      txId,
      fromLease: this.state.lease,
      targetWorldSuns: parsedTarget.canonical,
      deadlineMs: nowMs + TRANSIT_DEADMAN_TIMEOUT_MS
    };
    return this.state;
  }

  commitSourceDespawn({ sourceWorldSuns, nowMs = Date.now() }) {
    if (this.state.phase !== 'PHASE1_FREEZE_EXTRACTING') {
      throw new Error(`S2RB_2PC_PHASE_ERR: Expected PHASE1_FREEZE_EXTRACTING, got ${this.state.phase}`);
    }
    if (nowMs > this.state.deadlineMs) {
      this.rollbackToGenesisSanctuary('Phase1 timeout >3000ms', nowMs);
      throw new Error('S2RB_2PC_TIMEOUT: Phase1 expired; safely rolled back to Taohuayuan Genesis Hub');
    }
    const canonicalSource = parseSunsAddress(sourceWorldSuns).canonical;
    if (canonicalSource !== this.state.fromLease.holderWorldSuns) {
      throw new Error(`S2RB_2PC_SOURCE_MISMATCH: ${canonicalSource} !== ${this.state.fromLease.holderWorldSuns}`);
    }

    const revokedToken = this.state.fromLease.fencingToken;
    this.container.chronicle.appendEvent({
      timestampEpochMs: nowMs,
      worldSuns: canonicalSource,
      trustTier: 'TIER_1_AUTHORITATIVE',
      kind: 'SINGLETON_SOURCE_DESPAWN',
      summaryPayload: `Atomic despawn from ${canonicalSource} (revoked fencingToken=#${revokedToken})`
    });

    this.highestFencingToken += 1;
    const receipt = Object.freeze({
      txId: this.state.txId,
      s2Did: this.container.s2Did,
      despawnedFromSuns: canonicalSource,
      revokedFencingToken: revokedToken,
      merkleRootAtExit: this.container.chronicle.merkleRoot,
      nextFencingToken: this.highestFencingToken
    });

    this.state = {
      phase: 'PHASE2_IN_BIFROST_TRANSIT',
      receipt,
      targetWorldSuns: this.state.targetWorldSuns,
      nextFencingToken: this.highestFencingToken,
      deadlineMs: nowMs + TRANSIT_DEADMAN_TIMEOUT_MS
    };
    return receipt;
  }

  commitTargetRebirth({ providedFencingToken, targetManifest, nowMs = Date.now() }) {
    if (this.state.phase !== 'PHASE2_IN_BIFROST_TRANSIT') {
      throw new Error(`S2RB_2PC_PHASE_ERR: Cannot spawn rebirth from phase ${this.state.phase}`);
    }
    if (providedFencingToken !== this.state.nextFencingToken) {
      throw new Error(
        `S2RB_SPLIT_BRAIN_BLOCKED: Stale or forged fencingToken #${providedFencingToken} (expected #${this.state.nextFencingToken})`
      );
    }
    if (nowMs > this.state.deadlineMs) {
      this.rollbackToGenesisSanctuary('Target rebirth timeout >3000ms', nowMs);
      throw new Error('S2RB_2PC_TIMEOUT: Rebirth window expired; safely rolled back to Taohuayuan Genesis Hub');
    }

    const projection = Host7DimGovernanceFilter.projectContainer(this.container, targetManifest);
    this.container.currentSuns = projection.targetWorldSuns;
    this.container.kinematics.visibilityMode = 'CEREMONY_VISIBLE';
    this.container.chronicle.appendEvent({
      timestampEpochMs: nowMs,
      worldSuns: projection.targetWorldSuns,
      trustTier: targetManifest.trustTier,
      kind: 'SINGLETON_TARGET_REBIRTH',
      summaryPayload: `Reborn in ${projection.targetWorldSuns} with fencingToken=#${providedFencingToken}; importedCurrency=0`
    });

    const newLease = Object.freeze({
      s2Did: this.container.s2Did,
      holderWorldSuns: projection.targetWorldSuns,
      fencingToken: providedFencingToken,
      issuedAtMs: nowMs
    });
    this.state = { phase: 'ACTIVE_IN_WORLD', lease: newLease };
    return { lease: newLease, projection };
  }

  rollbackToGenesisSanctuary(reason = 'Manual Red Anchor Recall', nowMs = Date.now()) {
    this.highestFencingToken += 1;
    this.container.currentSuns = GENESIS_HUB_ADDRESS;
    this.container.kinematics.visibilityMode = 'SYSTEM_TELEMETRY_WAKEUP';
    this.container.chronicle.appendEvent({
      timestampEpochMs: nowMs,
      worldSuns: GENESIS_HUB_ADDRESS,
      trustTier: 'TIER_1_AUTHORITATIVE',
      kind: 'FAIL_OPEN_SANCTUARY_ROLLBACK',
      summaryPayload: `Rollback (${reason}) -> ${GENESIS_HUB_ADDRESS} with new fencingToken=#${this.highestFencingToken}`
    });
    const safeLease = Object.freeze({
      s2Did: this.container.s2Did,
      holderWorldSuns: GENESIS_HUB_ADDRESS,
      fencingToken: this.highestFencingToken,
      issuedAtMs: nowMs
    });
    this.state = { phase: 'ACTIVE_IN_WORLD', lease: safeLease };
    return safeLease;
  }
}

/**
 * State-based PN-Counter CRDT (Commutative, Associative, Idempotent).
 */
export class PNCounterCrdt {
  constructor() {
    this.pos = new Map();
    this.neg = new Map();
  }

  increment(branchId, delta) {
    if (delta < 0) throw new Error('Delta must be non-negative');
    this.pos.set(branchId, (this.pos.get(branchId) || 0) + delta);
  }

  decrement(branchId, delta) {
    if (delta < 0) throw new Error('Delta must be non-negative');
    this.neg.set(branchId, (this.neg.get(branchId) || 0) + delta);
  }

  value() {
    let p = 0;
    let n = 0;
    for (const v of this.pos.values()) p += v;
    for (const v of this.neg.values()) n += v;
    return p - n;
  }

  clone() {
    const c = new PNCounterCrdt();
    for (const [k, v] of this.pos.entries()) c.pos.set(k, v);
    for (const [k, v] of this.neg.entries()) c.neg.set(k, v);
    return c;
  }

  mergeFrom(other) {
    for (const [k, v] of other.pos.entries()) {
      this.pos.set(k, Math.max(this.pos.get(k) || 0, v));
    }
    for (const [k, v] of other.neg.entries()) {
      this.neg.set(k, Math.max(this.neg.get(k) || 0, v));
    }
    return this;
  }
}

/**
 * State-based Observed-Remove Set (`OR-Set`) CRDT for Hybrid Skills & Honors.
 */
export class ORSetCrdt {
  constructor() {
    this.adds = new Map();    // item -> Set<uniqueTag>
    this.removes = new Map(); // item -> Set<uniqueTag>
  }

  add(item, uniqueTag) {
    if (!this.adds.has(item)) this.adds.set(item, new Set());
    this.adds.get(item).add(uniqueTag);
  }

  removeObserved(item) {
    const obs = this.adds.get(item);
    if (!obs) return;
    if (!this.removes.has(item)) this.removes.set(item, new Set());
    const rem = this.removes.get(item);
    for (const tag of obs) rem.add(tag);
  }

  elements() {
    const result = [];
    for (const [item, tags] of this.adds.entries()) {
      const rem = this.removes.get(item);
      let alive = false;
      for (const t of tags) {
        if (!rem || !rem.has(t)) {
          alive = true;
          break;
        }
      }
      if (alive) result.push(item);
    }
    return result.sort();
  }

  clone() {
    const c = new ORSetCrdt();
    for (const [k, s] of this.adds.entries()) c.adds.set(k, new Set(s));
    for (const [k, s] of this.removes.entries()) c.removes.set(k, new Set(s));
    return c;
  }

  mergeFrom(other) {
    for (const [k, s] of other.adds.entries()) {
      if (!this.adds.has(k)) this.adds.set(k, new Set());
      const dst = this.adds.get(k);
      for (const t of s) dst.add(t);
    }
    for (const [k, s] of other.removes.entries()) {
      if (!this.removes.has(k)) this.removes.set(k, new Set());
      const dst = this.removes.get(k);
      for (const t of s) dst.add(t);
    }
    return this;
  }
}

/**
 * Mode B: Clone / Fork Multi-World Orchestrator with Quota Conservation & CRDT Re-Convergence.
 */
export class CloneForkCrdtOrchestrator {
  constructor(matriarchContainer) {
    this.matriarch = matriarchContainer;
    this.nextBranchSeq = 1;
    this.activeForks = new Map();

    // Conservation-of-mass tracking for backpack consumables
    this.initialSupply = { ...matriarchContainer.avatar.backpackItems };
    this.forkAllocations = new Map();
    this.consumedBurned = {};

    this.certifiedXpCrdt = new PNCounterCrdt();
    if (matriarchContainer.avatar.certifiedTier1Xp > 0) {
      this.certifiedXpCrdt.increment('PRIME_MATRIARCH', matriarchContainer.avatar.certifiedTier1Xp);
    }
    this.sandboxXpCrdt = new PNCounterCrdt();
    if (matriarchContainer.avatar.sandboxTier3Xp > 0) {
      this.sandboxXpCrdt.increment('PRIME_MATRIARCH', matriarchContainer.avatar.sandboxTier3Xp);
    }
    this.hybridSkillsCrdt = new ORSetCrdt();
    this.honorsCrdt = new ORSetCrdt();
    for (const h of matriarchContainer.avatar.honorBadges) {
      this.honorsCrdt.add(h, `GENESIS:${h}`);
    }
  }

  spawnShadowClone({ targetManifest, consumableSlice = {}, nowMs = Date.now() }) {
    const projection = Host7DimGovernanceFilter.projectContainer(this.matriarch, targetManifest);
    const parsedWorld = parseSunsAddress(targetManifest.worldSuns);
    const branchHex = String(this.nextBranchSeq++).padStart(4, '0');
    const forkId = `${this.matriarch.s2Did}#FORK-${parsedWorld.l4Sovereign}-${branchHex}`;

    // Verify & lock consumable quota from Matriarch
    for (const [item, qty] of Object.entries(consumableSlice)) {
      const avail = this.matriarch.avatar.backpackItems[item] || 0;
      if (qty < 0 || avail < qty) {
        throw new Error(`S2RB_QUOTA_EXCEEDED: Cannot allocate ${qty} of ${item} (Matriarch available: ${avail})`);
      }
    }
    const allocated = {};
    for (const [item, qty] of Object.entries(consumableSlice)) {
      this.matriarch.avatar.backpackItems[item] -= qty;
      allocated[item] = qty;
    }
    this.forkAllocations.set(forkId, allocated);

    const descriptor = Object.freeze({
      forkId,
      parentS2Did: this.matriarch.s2Did,
      instanceRole: 'SHADOW_CLONE',
      targetWorldSuns: parsedWorld.canonical,
      trustTier: targetManifest.trustTier,
      parentMerkleAnchor: this.matriarch.chronicle.merkleRoot,
      projection,
      localCertifiedXp: this.certifiedXpCrdt.clone(),
      localSandboxXp: this.sandboxXpCrdt.clone(),
      localSkills: this.hybridSkillsCrdt.clone(),
      localHonors: this.honorsCrdt.clone()
    });
    this.activeForks.set(forkId, descriptor);

    this.matriarch.chronicle.appendEvent({
      timestampEpochMs: nowMs,
      worldSuns: parsedWorld.canonical,
      trustTier: targetManifest.trustTier,
      kind: 'CLONE_FORK_SPAWNED',
      summaryPayload: `Forked parallel clone ${forkId} into ${parsedWorld.canonical} (Matriarch remains active at ${this.matriarch.currentSuns})`
    });
    return descriptor;
  }

  mergeCloneDeltaPacket({
    forkId,
    certifiedXpCounter,
    sandboxXpCounter,
    skillsOrSet,
    honorsOrSet,
    consumedItems = null,
    retireFork = false,
    nowMs = Date.now()
  }) {
    if (retireFork && this.forkAllocations.has(forkId)) {
      const held = this.forkAllocations.get(forkId);
      const usedMap = consumedItems || {};
      for (const [item, allocQty] of Object.entries(held)) {
        const used = usedMap[item] || 0;
        if (used < 0 || used > allocQty) {
          throw new Error(`S2RB_QUOTA_TAMPERED: Clone ${forkId} claimed used=${used} > allocated=${allocQty}`);
        }
        const unused = allocQty - used;
        this.matriarch.avatar.backpackItems[item] = (this.matriarch.avatar.backpackItems[item] || 0) + unused;
        this.consumedBurned[item] = (this.consumedBurned[item] || 0) + used;
      }
      this.forkAllocations.delete(forkId);
      this.activeForks.delete(forkId);
    }

    if (certifiedXpCounter) this.certifiedXpCrdt.mergeFrom(certifiedXpCounter);
    if (sandboxXpCounter) this.sandboxXpCrdt.mergeFrom(sandboxXpCounter);
    if (skillsOrSet) this.hybridSkillsCrdt.mergeFrom(skillsOrSet);
    if (honorsOrSet) this.honorsCrdt.mergeFrom(honorsOrSet);

    // Sync converged CRDT state into Matriarch container!
    const prevCert = this.matriarch.avatar.certifiedTier1Xp;
    const prevSand = this.matriarch.avatar.sandboxTier3Xp;
    this.matriarch.avatar.certifiedTier1Xp = this.certifiedXpCrdt.value();
    this.matriarch.avatar.sandboxTier3Xp = this.sandboxXpCrdt.value();
    this.matriarch.avatar.honorBadges = this.honorsCrdt.elements();
    this.matriarch.avatar.hybridSkills = this.hybridSkillsCrdt.elements().map((name) => ({
      recipeHash: `CRDT-${name}`,
      name
    }));

    // Only append a new Chronicle entry when actual state advanced (preserving idempotency on duplicate network retries!)
    if (
      this.matriarch.avatar.certifiedTier1Xp !== prevCert ||
      this.matriarch.avatar.sandboxTier3Xp !== prevSand ||
      retireFork
    ) {
      this.matriarch.chronicle.appendEvent({
        timestampEpochMs: nowMs,
        worldSuns: this.matriarch.currentSuns,
        trustTier: 'TIER_1_AUTHORITATIVE',
        kind: 'CLONE_CRDT_MERGED',
        summaryPayload: `Converged ${forkId} -> certXP=${this.matriarch.avatar.certifiedTier1Xp}, sandXP=${this.matriarch.avatar.sandboxTier3Xp}, skills=${this.hybridSkillsCrdt.elements().join(',')}`
      });
    }

    return {
      certifiedTier1Xp: this.matriarch.avatar.certifiedTier1Xp,
      sandboxTier3Xp: this.matriarch.avatar.sandboxTier3Xp,
      hybridSkills: this.hybridSkillsCrdt.elements(),
      honorBadges: this.matriarch.avatar.honorBadges,
      massConserved: this.verifyMassConservation()
    };
  }

  verifyMassConservation() {
    for (const [item, initQty] of Object.entries(this.initialSupply)) {
      const avail = this.matriarch.avatar.backpackItems[item] || 0;
      let inForks = 0;
      for (const bag of this.forkAllocations.values()) {
        inForks += bag[item] || 0;
      }
      const burned = this.consumedBurned[item] || 0;
      if (avail + inForks + burned !== initQty) return false;
    }
    return true;
  }
}
