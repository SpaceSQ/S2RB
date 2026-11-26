// WP-06: s2rbd Local Sovereign Daemon (`S2RB-IPC/3.0`), <3ms Preemptive Red Anchor Fuse & Alt+R Overlay
import { performance } from 'node:perf_hooks';
import { GENESIS_HUB_ADDRESS } from './protocol.js';
import { Host7DimGovernanceFilter, Singleton2PcBridge, CloneForkCrdtOrchestrator } from './bridge.js';
import { StealthEnvelopeController } from './renderer.js';
import { UgoSemanticRegistry, TwoTierSpatialInventory, RelationalGraphEngine } from './nexus_ugo.js';

export class S2rbLocalDaemon {
  constructor() {
    this.protocolVersion = 'S2RB-IPC/3.0';
    this.memoryBudgetMb = 64;
    this.ugoRegistry = new UgoSemanticRegistry();
    this.graph = new RelationalGraphEngine();
    this.registeredWorlds = new Map();
    this.containers = new Map();
    this.inventories = new Map();
    this.singletonBridges = new Map();
    this.cloneOrchestrators = new Map();
    this.stealthControllers = new Map();
    this.overlayState = {
      visible: false,
      activeDid: null,
      activeTab: 'SPATIAL_BACKPACK_UGO'
    };
    this.ipcAuditLog = [];
  }

  registerHostWorld(manifest, capabilityProfile = {}) {
    Host7DimGovernanceFilter.validateManifest(manifest);
    const key = manifest.worldSuns;
    this.registeredWorlds.set(key, { manifest, capabilityProfile });
    this._log('WORLD_REGISTER', `Mounted host plugin ${manifest.worldName} @ ${key}`);
    return key;
  }

  registerContainer(container) {
    const did = container.s2Did;
    this.containers.set(did, container);
    const inv = new TwoTierSpatialInventory(this.ugoRegistry);
    for (const [itemId, qty] of Object.entries(container.avatar.backpackItems)) {
      if (this.ugoRegistry.get(itemId)) {
        inv.storeLootWithAutoOverflow(itemId, qty);
      }
    }
    this.inventories.set(did, inv);
    this.singletonBridges.set(did, new Singleton2PcBridge(container));
    this.cloneOrchestrators.set(did, new CloneForkCrdtOrchestrator(container));
    const stealth = new StealthEnvelopeController(container);
    stealth.tickFrame(3.5); // Default to normal stealth gameplay (0 draw calls) after boot
    this.stealthControllers.set(did, stealth);
    if (!this.overlayState.activeDid) this.overlayState.activeDid = did;
    this._log('CONTAINER_MOUNT', `Resident 9.6m3 container ${did} (${container.displayName}) online in s2rbd`);
    return did;
  }

  /**
   * Dispatches an `S2RB-IPC/3.0` frame command synchronously (`< 1 ms` local shared-memory simulation).
   */
  dispatchIpc(command) {
    const t0 = performance.now();

    // HIGHEST-PRIORITY PREEMPTIVE INTERRUPT: Silicon Law 1 (< 3.0 ms Red Anchor Emergency Recall)
    if (command.type === 'CMD_RED_ANCHOR_FUSE_RECALL') {
      const { s2Did, reason = 'User pressed Red Anchor hardware/overlay fuse' } = command;
      const container = this.containers.get(s2Did);
      const bridge = this.singletonBridges.get(s2Did);
      const stealth = this.stealthControllers.get(s2Did);
      if (!container || !bridge || !stealth) {
        throw new Error(`S2RB_DAEMON_ERR: Unknown container ${s2Did}`);
      }
      const safeLease = bridge.rollbackToGenesisSanctuary(reason);
      container.triggerEmergencyRedAnchorRecall();
      const shellFrame = stealth.setSystemTelemetryWakeup(true);
      const elapsedMs = Number((performance.now() - t0).toFixed(4));
      this._log('RED_ANCHOR_FUSE', `Recalled ${s2Did} -> ${GENESIS_HUB_ADDRESS} in ${elapsedMs}ms (token #${safeLease.fencingToken})`);
      return {
        ok: true,
        s2Did,
        recalledToSuns: GENESIS_HUB_ADDRESS,
        newFencingToken: safeLease.fencingToken,
        shellFrame,
        elapsedMs,
        withinLaw1ThreeMsSla: elapsedMs <= 3.0
      };
    }

    switch (command.type) {
      case 'CMD_PING_HEALTH':
        return {
          ok: true,
          protocol: this.protocolVersion,
          residentContainers: this.containers.size,
          registeredWorlds: this.registeredWorlds.size,
          memoryBudgetMb: this.memoryBudgetMb
        };

      case 'CMD_TOGGLE_ALT_R_OVERLAY': {
        const did = command.s2Did || this.overlayState.activeDid;
        const container = this.containers.get(did);
        const stealth = this.stealthControllers.get(did);
        const inv = this.inventories.get(did);
        if (!container || !stealth || !inv) throw new Error(`Unknown active container ${did}`);

        this.overlayState.visible = Boolean(command.open);
        this.overlayState.activeDid = did;
        if (command.tab) this.overlayState.activeTab = command.tab;

        const shellFrame = stealth.setUserInspectHotkey(this.overlayState.visible);
        const worldRec = this.registeredWorlds.get(container.currentSuns);
        const capProfile = worldRec
          ? {
              backpackPolicy: worldRec.manifest.allowBackpackItems,
              supportedPrimitives: worldRec.capabilityProfile.supportedPrimitives || [],
              allowPassiveAffixes: worldRec.capabilityProfile.allowPassiveAffixes ?? true
            }
          : { backpackPolicy: 'ACTIVE_USE', supportedPrimitives: ['SANCTUARY_AURA_CALM'], allowPassiveAffixes: true };

        const translatedItems = [];
        for (const [ugoId, qty] of inv.podBackpack.entries()) {
          translatedItems.push({
            ...this.ugoRegistry.translateForHost(ugoId, capProfile),
            quantity: qty
          });
        }

        const elapsedMs = Number((performance.now() - t0).toFixed(4));
        return {
          ok: true,
          overlayVisible: this.overlayState.visible,
          activeTab: this.overlayState.activeTab,
          s2Did: did,
          currentWorldSuns: container.currentSuns,
          shellFrame,
          podVolumeUsedLiters: inv.getCurrentPodVolumeLiters(),
          translatedItems,
          importedCurrencyLockedZero: 0,
          ipcLatencyMs: elapsedMs
        };
      }

      case 'CMD_FAST_LOCAL_SINGLETON_JUMP': {
        const { s2Did, targetWorldSuns } = command;
        const container = this.containers.get(s2Did);
        const bridge = this.singletonBridges.get(s2Did);
        const stealth = this.stealthControllers.get(s2Did);
        const worldRec = this.registeredWorlds.get(targetWorldSuns);
        if (!container || !bridge || !worldRec) {
          throw new Error(`Missing container or target world registration for ${targetWorldSuns}`);
        }
        const prevSuns = container.currentSuns;
        bridge.beginFreezeAndExtract({
          txId: `IPC-JUMP-${Date.now()}`,
          expectedFencingToken: bridge.state.lease.fencingToken,
          targetWorldSuns
        });
        const receipt = bridge.commitSourceDespawn({ sourceWorldSuns: prevSuns });
        const { lease, projection } = bridge.commitTargetRebirth({
          providedFencingToken: receipt.nextFencingToken,
          targetManifest: worldRec.manifest
        });
        stealth.triggerCeremony();
        const elapsedMs = Number((performance.now() - t0).toFixed(4));
        this._log('LOCAL_IPC_JUMP', `${s2Did} jumped ${prevSuns} -> ${targetWorldSuns} in ${elapsedMs}ms`);
        return { ok: true, lease, projection, ipcLatencyMs: elapsedMs };
      }

      case 'CMD_FOLLOW_FRIEND_JUMP': {
        const { followerDid, leaderFriendDid } = command;
        const ticket = this.graph.resolveFollowJumpTicket({
          followerDid,
          leaderFriendDid,
          mode: 'SINGLETON_MIGRATION'
        });
        // Auto-register the allocated L6 berth under the same host world template if needed
        const leaderPres = this.graph.livePresence.get(leaderFriendDid);
        const baseWorldKey = [...this.registeredWorlds.keys()].find((k) =>
          k.startsWith(ticket.targetBerthSuns.slice(0, -1))
        );
        if (baseWorldKey && !this.registeredWorlds.has(ticket.targetBerthSuns)) {
          const baseRec = this.registeredWorlds.get(baseWorldKey);
          this.registerHostWorld(
            { ...baseRec.manifest, worldSuns: ticket.targetBerthSuns },
            baseRec.capabilityProfile
          );
        }
        const jumpRes = this.dispatchIpc({
          type: 'CMD_FAST_LOCAL_SINGLETON_JUMP',
          s2Did: followerDid,
          targetWorldSuns: ticket.targetBerthSuns
        });
        return {
          ok: true,
          ticket,
          leaderWorldName: leaderPres?.currentWorldName,
          lease: jumpRes.lease,
          projection: jumpRes.projection
        };
      }

      default:
        throw new Error(`Unsupported S2RB-IPC command: ${command.type}`);
    }
  }

  _log(tag, msg) {
    this.ipcAuditLog.unshift({ ts: Date.now(), tag, msg });
    if (this.ipcAuditLog.length > 50) this.ipcAuditLog.length = 50;
  }
}
