// WP-05: 4D Relational Graph, Follow-Jump Berth Resolver, UGO v2.0 Ontology & Two-Tier Ark Stash
import { parseOrMigrateS2Did, parseSunsAddress, GENESIS_LANDMARK_CODE } from './protocol.js';

export const CANONICAL_UGO_CATALOG = Object.freeze([
  {
    ugoId: 'MAT_OBSIDIAN_BLOCK',
    displayName: '黑曜石方块 (Minecraft)',
    originWorldSuns: 'GAME-EA-101-MINECRAFT2-008-2',
    rarity: 'EPIC',
    unitVolumeLiters: 4.0,
    materialTags: ['VOLCANIC_GLASS', 'HIGH_HARDNESS'],
    functionalPrimitives: ['PLACEABLE_BARRIER_1M3', 'BLAST_SHIELD'],
    passiveAffixFallback: '火山黑曜护符：爆炸与火焰冲击减免 +15%',
    cosmeticCharmFallback: '微缩黑曜石棱镜枪饰 / 泉水战旗徽记 (0数值公平外观)'
  },
  {
    ugoId: 'CONS_ENCHANTED_GOLDEN_APPLE',
    displayName: '附魔金苹果',
    originWorldSuns: 'GAME-EA-101-MINECRAFT2-008-2',
    rarity: 'LEGENDARY',
    unitVolumeLiters: 0.5,
    materialTags: ['AURUM_ORGANIC'],
    functionalPrimitives: ['INSTANT_ABSORPTION_SHIELD', 'VITAL_REGEN_BURST'],
    passiveAffixFallback: '黄金生机共鸣：脱战每秒生命恢复 +1.2%',
    cosmeticCharmFallback: '流光金苹果武器挂件 (0数值公平外观)'
  },
  {
    ugoId: 'WP_ASHBRINGER_GREATSWORD',
    displayName: '灰烬圣剑·复仇之怒',
    originWorldSuns: 'GAME-NA-204-AZEROTH2-080-3',
    rarity: 'MYTHIC_GENESIS',
    unitVolumeLiters: 12.0,
    materialTags: ['SANCTIFIED_TITANSTEEL', 'HOLY_CRYSTAL'],
    functionalPrimitives: ['MELEE_HOLY_CLEAVE', 'UNDEAD_PURGE_WAVE'],
    passiveAffixFallback: '白银之手圣印：神圣与破甲威能 +18%',
    cosmeticCharmFallback: '微缩灰烬圣剑全息枪托铭牌 / 纯外观幻化巨剑 (0数值)'
  },
  {
    ugoId: 'REL_TAOHUAYUAN_SPIRIT_JADE',
    displayName: '桃花源定气桃花玉佩',
    originWorldSuns: 'META-CN-001-TAOHUAYUAN2-001-2',
    rarity: 'MYTHIC_GENESIS',
    unitVolumeLiters: 0.2,
    materialTags: ['TAOYUAN_JADE', 'NFC_SOVEREIGN_SEAL'],
    functionalPrimitives: ['SANCTUARY_AURA_CALM', 'ACOUSTIC_CLARITY'],
    passiveAffixFallback: '桃源清心印：技能过热冷却散热效率 +8%',
    cosmeticCharmFallback: '东方赛博桃花玉步枪挂穗 / 腰间玉佩 (0数值公平外观)'
  }
]);

export class UgoSemanticRegistry {
  constructor(seedItems = CANONICAL_UGO_CATALOG) {
    this.specs = new Map();
    for (const item of seedItems) {
      this.register(item);
    }
  }

  register(spec) {
    this.specs.set(spec.ugoId, Object.freeze({ ...spec }));
  }

  get(ugoId) {
    return this.specs.get(ugoId) || null;
  }

  /**
   * 3-Tier Graceful Item Degradation Engine (`TIER_A_NATIVE_MECHANIC -> TIER_B_PASSIVE_AFFIX -> TIER_C_COSMETIC_CHARM`)
   */
  translateForHost(ugoId, hostCapabilityProfile) {
    const spec = this.get(ugoId);
    if (!spec) {
      throw new Error(`S2RB_UGO_UNKNOWN_ITEM: ${ugoId}`);
    }
    const {
      backpackPolicy = 'DISABLED',
      supportedPrimitives = [],
      allowPassiveAffixes = false
    } = hostCapabilityProfile || {};

    if (backpackPolicy === 'ACTIVE_USE') {
      const matched = spec.functionalPrimitives.find((p) => supportedPrimitives.includes(p));
      if (matched) {
        return Object.freeze({
          ugoId: spec.ugoId,
          displayName: spec.displayName,
          tier: 'TIER_A_NATIVE_MECHANIC',
          matchedPrimitive: matched,
          effectDescription: `原生机制激活 [${matched}]：完整释放 ${spec.displayName} 实体交互功能`,
          gameplayStatBonusActive: true
        });
      }
      if (allowPassiveAffixes) {
        return Object.freeze({
          ugoId: spec.ugoId,
          displayName: spec.displayName,
          tier: 'TIER_B_PASSIVE_AFFIX',
          matchedPrimitive: null,
          effectDescription: spec.passiveAffixFallback,
          gameplayStatBonusActive: true
        });
      }
    }

    return Object.freeze({
      ugoId: spec.ugoId,
      displayName: spec.displayName,
      tier: 'TIER_C_COSMETIC_CHARM',
      matchedPrimitive: null,
      effectDescription: spec.cosmeticCharmFallback,
      gameplayStatBonusActive: false
    });
  }
}

export class TwoTierSpatialInventory {
  constructor(registry = new UgoSemanticRegistry(), maxSlots = 36, maxVolumeLiters = 480.0) {
    this.registry = registry;
    this.maxSlots = maxSlots;
    this.maxVolumeLiters = maxVolumeLiters;
    this.podBackpack = new Map();     // ugoId -> qty inside 9.6m3 pod
    this.arkMotherStash = new Map();  // ugoId -> infinite sanctuary storage qty
  }

  getCurrentPodVolumeLiters() {
    let total = 0;
    for (const [id, qty] of this.podBackpack.entries()) {
      const spec = this.registry.get(id);
      total += (spec ? spec.unitVolumeLiters : 1.0) * qty;
    }
    return Number(total.toFixed(3));
  }

  storeLootWithAutoOverflow(ugoId, quantity) {
    const spec = this.registry.get(ugoId);
    if (!spec) throw new Error(`S2RB_UGO_UNKNOWN_ITEM: ${ugoId}`);
    if (quantity <= 0) return { storedInPod: 0, routedToArkStash: 0 };

    const hasSlot = this.podBackpack.has(ugoId) || this.podBackpack.size < this.maxSlots;
    if (!hasSlot) {
      this.arkMotherStash.set(ugoId, (this.arkMotherStash.get(ugoId) || 0) + quantity);
      return { storedInPod: 0, routedToArkStash: quantity };
    }

    const availVol = Math.max(0, this.maxVolumeLiters - this.getCurrentPodVolumeLiters());
    const fitQty = spec.unitVolumeLiters <= 0
      ? quantity
      : Math.min(quantity, Math.floor(availVol / spec.unitVolumeLiters));
    const overflowQty = quantity - fitQty;

    if (fitQty > 0) {
      this.podBackpack.set(ugoId, (this.podBackpack.get(ugoId) || 0) + fitQty);
    }
    if (overflowQty > 0) {
      this.arkMotherStash.set(ugoId, (this.arkMotherStash.get(ugoId) || 0) + overflowQty);
    }
    return { storedInPod: fitQty, routedToArkStash: overflowQty };
  }

  transferPodToArk(ugoId, qty) {
    const cur = this.podBackpack.get(ugoId) || 0;
    if (qty <= 0 || cur < qty) {
      throw new Error(`S2RB_STASH_INSUFFICIENT: pod has ${cur} of ${ugoId}, tried to deposit ${qty}`);
    }
    if (cur === qty) this.podBackpack.delete(ugoId);
    else this.podBackpack.set(ugoId, cur - qty);
    this.arkMotherStash.set(ugoId, (this.arkMotherStash.get(ugoId) || 0) + qty);
  }

  transferArkToPod(ugoId, qty) {
    const stashCur = this.arkMotherStash.get(ugoId) || 0;
    if (qty <= 0 || stashCur < qty) {
      throw new Error(`S2RB_STASH_INSUFFICIENT: ark stash has ${stashCur} of ${ugoId}`);
    }
    const { storedInPod, routedToArkStash } = this.storeLootWithAutoOverflow(ugoId, qty);
    // Deduct the net amount moved out of stash (`qty` was temporarily re-added on overflow)
    this.arkMotherStash.set(ugoId, stashCur - qty + routedToArkStash);
    if (this.arkMotherStash.get(ugoId) === 0) this.arkMotherStash.delete(ugoId);
    return { movedToPod: storedInPod, remainedInStash: routedToArkStash };
  }
}

export class RelationalGraphEngine {
  constructor() {
    this.bondsByPrincipal = new Map();
    this.mutualFriends = new Map();
    this.livePresence = new Map();
    this.physicalOpcAnchors = new Map();
    this.nextTicketSeq = 1;
  }

  bindCarbonSiliconCompanion({ principalDid, companionDid, orbitalSlotIndex = 0, permissions = ['ACOUSTIC_SONAR_READ', 'WAVE_TACTICAL_RADIO'] }) {
    const p = parseOrMigrateS2Did(principalDid, true);
    const c = parseOrMigrateS2Did(companionDid, true);
    if (p.species !== 'D') throw new Error('S2RB_BOND_ERROR: Principal must hold Class-D S2-DID');
    if (c.species !== 'V') throw new Error('S2RB_BOND_ERROR: Companion adjutant must hold Class-V S2-DID');
    if (permissions.includes('TRANSFER_CURRENCY')) {
      throw new Error('S2RB_BOND_FORBIDDEN: Class-V companion can never hold currency permissions');
    }

    const bond = Object.freeze({
      principalDid: p.did,
      companionDid: c.did,
      orbitalSlotIndex,
      permissions: Object.freeze([...permissions]),
      currencyAccessLockedFalse: true
    });
    if (!this.bondsByPrincipal.has(p.did)) this.bondsByPrincipal.set(p.did, []);
    this.bondsByPrincipal.get(p.did).push(bond);
    return bond;
  }

  linkMutualFriends(didA, didB) {
    const a = parseOrMigrateS2Did(didA, true).did;
    const b = parseOrMigrateS2Did(didB, true).did;
    if (!this.mutualFriends.has(a)) this.mutualFriends.set(a, new Set());
    if (!this.mutualFriends.has(b)) this.mutualFriends.set(b, new Set());
    this.mutualFriends.get(a).add(b);
    this.mutualFriends.get(b).add(a);
  }

  updateFriendPresence({ friendDid, displayName, currentWorldName, currentSuns, occupiedBerths = [], joinable = true }) {
    const f = parseOrMigrateS2Did(friendDid, true).did;
    const parsedAddr = parseSunsAddress(currentSuns);
    this.livePresence.set(f, {
      friendDid: f,
      displayName,
      currentWorldName,
      parsedAddr,
      occupiedBerths: new Set([parsedAddr.l6Berth, ...occupiedBerths]),
      joinable
    });
  }

  /**
   * Allocates an adjacent open L6 berth (`2..9`) in the target friend's room instance for One-Click Follow-Jump!
   */
  resolveFollowJumpTicket({ followerDid, leaderFriendDid, mode = 'SINGLETON_MIGRATION' }) {
    const follower = parseOrMigrateS2Did(followerDid, true).did;
    const leader = parseOrMigrateS2Did(leaderFriendDid, true).did;
    const friends = this.mutualFriends.get(follower);
    if (!friends || !friends.has(leader)) {
      throw new Error('S2RB_SOCIAL_DENIED: Target player is not in mutual S2-DID friend graph');
    }
    const pres = this.livePresence.get(leader);
    if (!pres || !pres.joinable) {
      throw new Error('S2RB_SOCIAL_UNAVAILABLE: Friend instance is offline or locked');
    }

    let allocatedL6 = null;
    for (let berth = 2; berth <= 9; berth++) {
      if (!pres.occupiedBerths.has(berth)) {
        allocatedL6 = berth;
        break;
      }
    }
    if (allocatedL6 === null) {
      throw new Error('S2RB_ROOM_FULL: All 8 L6 berths (2..9) in friend instance are occupied');
    }

    const a = pres.parsedAddr;
    const targetBerthSuns = `${a.l1}-${a.l2}-${String(a.l3Grid).padStart(3, '0')}-${a.l4Sovereign}${a.l4CheckDigit}-${String(a.l5Room).padStart(3, '0')}-${allocatedL6}`;
    pres.occupiedBerths.add(allocatedL6);

    return Object.freeze({
      ticketId: `FJUMP-${String(this.nextTicketSeq++).padStart(6, '0')}`,
      followerDid: follower,
      leaderFriendDid: leader,
      leaderWorldName: pres.currentWorldName,
      targetBerthSuns,
      allocatedL6Berth: allocatedL6,
      mode
    });
  }

  bindPhysicalOpcArtifact({ artifactSerial, artifactCategory, boundS2Did, nfcFingerprint }) {
    const did = parseOrMigrateS2Did(boundS2Did, true).did;
    const rec = Object.freeze({
      artifactSerial,
      artifactCategory,
      boundS2Did: did,
      originLandmark: GENESIS_LANDMARK_CODE,
      nfcFingerprint
    });
    if (!this.physicalOpcAnchors.has(did)) this.physicalOpcAnchors.set(did, []);
    this.physicalOpcAnchors.get(did).push(rec);
    return rec;
  }
}
