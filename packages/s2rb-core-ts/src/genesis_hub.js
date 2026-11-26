// WP-08: Dual Official `/s2RB` Portals (`s2rb.space2.world` & `taohuayuan.world/s2RB`)
// & Taohuayuan Ancient Town Operations Center 4K Command Deck Coordinator
import { performance } from 'node:perf_hooks';
import {
  GENESIS_HUB_ADDRESS,
  GENESIS_LANDMARK_CODE,
  parseOrMigrateS2Did,
  parseSunsAddress,
  assertZeroCurrencyImport
} from './protocol.js';
import { sha256Hex } from './container.js';
import { EIGHT_ENGINE_PLUGINS, HostEnginePluginSimulator } from './engine_adapters.js';

export const PORTAL_CHANNELS = Object.freeze({
  ROBOT0_TECH_PORTAL: 'https://s2rb.space2.world/',
  TAOHUAYUAN_CULTURAL_PORTAL: 'https://www.taohuayuan.world/s2RB'
});

export const TAOYUAN_CUSTOM_ROUTES = Object.freeze([
  {
    routeCode: 'TY-ROUTE-01-STAR_PLAZA',
    title: '桃花源古镇中心广场 #001 创世星门打卡线',
    entrySuns: GENESIS_HUB_ADDRESS,
    landmarkCode: GENESIS_LANDMARK_CODE,
    cryoMultiplier: 1.5,
    highlights: ['古镇中心广场 2m×2m×2.4m 全息星门实景合拍', 'TC-001-ARCH 实体牌坊 NFC 定气锚授印', '跨游戏数字英雄降临古镇巡游']
  },
  {
    routeCode: 'TY-ROUTE-02-QINXI_BOAT',
    title: '秦溪夜泊 · 碳硅双生伴游定制线',
    entrySuns: 'PHYS-CN-001-TAOYUANARCH7-002-3',
    landmarkCode: GENESIS_LANDMARK_CODE,
    cryoMultiplier: 1.5,
    highlights: ['Class-V 硅基伴游灵体实时诗词/剧情导览', '两岸水幕投影联动玩家角色容器', '零货币铁闸文创纪念勋章铸造']
  },
  {
    routeCode: 'TY-ROUTE-03-YIWANGXI_EXPEDITION',
    title: '桃源夷望溪 · 虚实奇境探险定制线',
    entrySuns: 'PHYS-CN-001-TAOYUANARCH7-003-4',
    landmarkCode: GENESIS_LANDMARK_CODE,
    cryoMultiplier: 1.5,
    highlights: ['户外 AR 实景触发 9.6m³ 容器环境要素共鸣', '跨世界好友 Follow-Jump 云端同船伴游', '返回桃花源母港享 1.5x 静息恢复加成']
  }
]);

export class TaohuayuanGenesisOperationsCenter {
  constructor(daemon) {
    this.daemon = daemon;
    this.hubSuns = GENESIS_HUB_ADDRESS;
    this.landmarkCode = GENESIS_LANDMARK_CODE;
    this.portals = PORTAL_CHANNELS;
    this.mountedAdapters = new Map();
    this.issuedTravelPasses = [];
    this.blockedCurrencyAttempts = 0;
    this.lastGlobalFuseReceipt = null;

    for (const plugin of EIGHT_ENGINE_PLUGINS) {
      const sim = new HostEnginePluginSimulator(this.daemon, plugin.engineId);
      this.mountedAdapters.set(plugin.engineId, sim);
    }
  }

  issueTaoyuanTravelPass({ travelerDid, companionDid = null, routeCode, attemptedCurrencyCarry = 0 }) {
    try {
      assertZeroCurrencyImport(attemptedCurrencyCarry);
    } catch (err) {
      this.blockedCurrencyAttempts += 1;
      throw err;
    }
    const parsedTraveler = parseOrMigrateS2Did(travelerDid, true);
    const parsedCompanion = companionDid ? parseOrMigrateS2Did(companionDid, true) : null;
    const route = TAOYUAN_CUSTOM_ROUTES.find((r) => r.routeCode === routeCode);
    if (!route) {
      throw new Error(`S2RB_WP08_ERR: Unknown Taoyuan custom route "${routeCode}"`);
    }
    parseSunsAddress(route.entrySuns);

    const nfcHash = sha256Hex('S2RB_NFC_ANCHOR', `${parsedTraveler.did}:${route.routeCode}:${this.issuedTravelPasses.length + 1}`);
    const anchorRecord = this.daemon.graph.bindPhysicalOpcArtifact({
      artifactSerial: `TY-OPC-${String(this.issuedTravelPasses.length + 1).padStart(5, '0')}`,
      artifactCategory: 'THING',
      boundS2Did: parsedTraveler.did,
      nfcFingerprint: nfcHash.slice(0, 32)
    });

    const issuedAtIso = '2026-11-26T16:40:00Z';
    const passHash = sha256Hex('S2RB_TAOYUAN_PASS_V3', {
      traveler: parsedTraveler.did,
      companion: parsedCompanion ? parsedCompanion.did : null,
      routeCode: route.routeCode,
      entrySuns: route.entrySuns,
      landmarkCode: this.landmarkCode,
      issuedAtIso
    });

    const pass = Object.freeze({
      passId: `PASS-TY-${passHash.slice(0, 12).toUpperCase()}`,
      brandHeader: '桃源县 · 定制旅行线路之都 & AI穿越世界入口',
      portalUrl: PORTAL_CHANNELS.TAOHUAYUAN_CULTURAL_PORTAL,
      travelerDid: parsedTraveler.did,
      companionDid: parsedCompanion ? parsedCompanion.did : null,
      routeCode: route.routeCode,
      routeTitle: route.title,
      entryGateSuns: route.entrySuns,
      landmarkCode: this.landmarkCode,
      cryoRecoveryMultiplier: route.cryoMultiplier,
      importedCurrencyAmount: 0,
      nfcFingerprint: anchorRecord.nfcFingerprint,
      signatureHex: passHash,
      issuedAtIso
    });
    this.issuedTravelPasses.push(pass);
    return pass;
  }

  triggerGlobalRedAnchorDrill(reason = 'Taohuayuan Operations Center Law-1 Global Fuse Drill') {
    const t0 = performance.now();
    const recalled = [];
    for (const [did] of this.daemon.containers.entries()) {
      const res = this.daemon.dispatchIpc({
        type: 'CMD_RED_ANCHOR_FUSE_RECALL',
        s2Did: did,
        reason
      });
      recalled.push({
        s2Did: did,
        recalledToSuns: res.recalledToSuns,
        ipcElapsedMs: res.elapsedMs
      });
    }
    const totalElapsedMs = Number((performance.now() - t0).toFixed(4));
    if (totalElapsedMs > 3.0) {
      throw new Error(`S2RB_LAW1_GLOBAL_SLA_BREACH: Global recall took ${totalElapsedMs} ms (> 3.0 ms)`);
    }
    this.lastGlobalFuseReceipt = Object.freeze({
      hubSuns: this.hubSuns,
      landmarkCode: this.landmarkCode,
      recalledCount: recalled.length,
      recalledContainers: recalled,
      totalElapsedMs,
      withinLaw1Sla: totalElapsedMs <= 3.0
    });
    return this.lastGlobalFuseReceipt;
  }

  get4kCommandDeckSnapshot() {
    const engineNodes = EIGHT_ENGINE_PLUGINS.map((p) => {
      let residentCount = 0;
      for (const c of this.daemon.containers.values()) {
        if (c.currentSuns === p.defaultWorldSuns) residentCount += 1;
      }
      return {
        engineId: p.engineId,
        shortLabel: p.shortLabel,
        worldSuns: p.defaultWorldSuns,
        shaderBackend: p.shaderBackend,
        trustTier: p.trustTier,
        residentContainers: residentCount,
        allowCurrencyImport: false
      };
    });

    return {
      hubSuns: this.hubSuns,
      landmarkCode: this.landmarkCode,
      portals: this.portals,
      connectedEngineCount: engineNodes.length,
      engineNodes,
      totalResidentContainers: this.daemon.containers.size,
      issuedTravelPassesCount: this.issuedTravelPasses.length,
      blockedCurrencyAttempts: this.blockedCurrencyAttempts,
      lastGlobalFuseReceipt: this.lastGlobalFuseReceipt
    };
  }
}
