//! `S2RB-IPC/3.0` Local Sovereign Daemon Command Router & `< 3.0 ms` Preemptive Red Anchor Fuse.

use crate::overlay_hud::{AltROverlaySnapshot, OverlayTab};
use s2rb_bridge_core::{HostWorldManifest, Singleton2PcCoordinator};
use s2rb_protocol::GENESIS_HUB_ADDRESS;
use s2rb_renderer_kernel::{StealthEnvelopeController, WakeupReason};
use s2rb_ugo_inventory::{RelationalGraphEngine, UgoSemanticRegistry};
use std::collections::BTreeMap;
use std::time::Instant;

#[derive(Debug, Clone)]
pub enum DaemonIpcCommand {
    PingHealth,
    ToggleAltROverlay { open: bool, tab: OverlayTab },
    RegisterHostWorld(HostWorldManifest),
    PreemptiveRedAnchorFuseRecall { s2_did: String, reason: String },
}

#[derive(Debug, Clone)]
pub enum DaemonIpcResponse {
    HealthOk {
        protocol: &'static str,
        resident_containers: usize,
        registered_worlds: usize,
        memory_budget_mb: u32,
    },
    OverlayStateUpdated(AltROverlaySnapshot),
    WorldRegistered { world_suns: String },
    RedAnchorFuseCompleted {
        s2_did: String,
        recalled_to_suns: String,
        new_fencing_token: u64,
        elapsed_micros: u128,
        within_3ms_law1_sla: bool,
    },
    Error(String),
}

pub struct S2rbLocalDaemon {
    pub ugo_registry: UgoSemanticRegistry,
    pub graph: RelationalGraphEngine,
    pub registered_worlds: BTreeMap<String, HostWorldManifest>,
    pub singleton_routers: BTreeMap<String, Singleton2PcCoordinator>,
    pub stealth_controllers: BTreeMap<String, StealthEnvelopeController>,
    pub overlay_open: bool,
    pub active_overlay_tab: OverlayTab,
}

impl Default for S2rbLocalDaemon {
    fn default() -> Self {
        Self {
            ugo_registry: UgoSemanticRegistry::with_canonical_seed_catalog(),
            graph: RelationalGraphEngine::default(),
            registered_worlds: BTreeMap::new(),
            singleton_routers: BTreeMap::new(),
            stealth_controllers: BTreeMap::new(),
            overlay_open: false,
            active_overlay_tab: OverlayTab::SpatialBackpackUgo,
        }
    }
}

impl S2rbLocalDaemon {
    pub fn handle_ipc(
        &mut self,
        cmd: DaemonIpcCommand,
        chronicles: &mut BTreeMap<String, s2rb_container::ChronicleLedger>,
        now_ms: u64,
    ) -> DaemonIpcResponse {
        match cmd {
            // HIGHEST PRIORITY PREEMPTIVE PATH: Silicon Law 1 (< 3.0 ms Fail-Open Recall)
            DaemonIpcCommand::PreemptiveRedAnchorFuseRecall { s2_did, reason } => {
                let t0 = Instant::now();
                let Some(router) = self.singleton_routers.get_mut(&s2_did) else {
                    return DaemonIpcResponse::Error(format!("Unknown container DID {}", s2_did));
                };
                let Some(chron) = chronicles.get_mut(&s2_did) else {
                    return DaemonIpcResponse::Error("Missing chronicle ledger".to_string());
                };
                let safe_lease = router.rollback_to_genesis_sanctuary(chron, now_ms, &reason);
                if let Some(ctrl) = self.stealth_controllers.get_mut(&s2_did) {
                    ctrl.trigger_wakeup(WakeupReason::EmergencyRedAnchorRecall);
                }
                let elapsed_micros = t0.elapsed().as_micros();
                DaemonIpcResponse::RedAnchorFuseCompleted {
                    s2_did,
                    recalled_to_suns: GENESIS_HUB_ADDRESS.to_string(),
                    new_fencing_token: safe_lease.fencing_token,
                    elapsed_micros,
                    within_3ms_law1_sla: elapsed_micros <= 3_000,
                }
            }
            DaemonIpcCommand::PingHealth => DaemonIpcResponse::HealthOk {
                protocol: "S2RB-IPC/3.0",
                resident_containers: self.singleton_routers.len(),
                registered_worlds: self.registered_worlds.len(),
                memory_budget_mb: 64,
            },
            DaemonIpcCommand::RegisterHostWorld(manifest) => {
                if let Err(e) = s2rb_bridge_core::Host7DimGovernanceFilter::validate_manifest(&manifest) {
                    return DaemonIpcResponse::Error(format!("Rejected host manifest: {:?}", e));
                }
                let addr = manifest.world_suns.to_canonical_string();
                self.registered_worlds.insert(addr.clone(), manifest);
                DaemonIpcResponse::WorldRegistered { world_suns: addr }
            }
            DaemonIpcCommand::ToggleAltROverlay { open, tab } => {
                self.overlay_open = open;
                self.active_overlay_tab = tab;
                let first_did = self.stealth_controllers.keys().next().cloned().unwrap_or_default();
                let frame = if let Some(ctrl) = self.stealth_controllers.get_mut(&first_did) {
                    if open {
                        ctrl.trigger_wakeup(WakeupReason::UserHotkeyAltR);
                    } else {
                        ctrl.release_user_overlay();
                    }
                    ctrl.tick_frame(0.0)
                } else {
                    let mut tmp = StealthEnvelopeController::default();
                    tmp.tick_frame(3.5)
                };
                DaemonIpcResponse::OverlayStateUpdated(AltROverlaySnapshot {
                    overlay_visible: open,
                    active_tab: tab,
                    active_s2_did: first_did,
                    current_world_suns: GENESIS_HUB_ADDRESS.to_string(),
                    shell_frame: frame,
                    translated_backpack_items: Vec::new(),
                    ready_follow_tickets: Vec::new(),
                    imported_currency_locked_zero: 0.0,
                })
            }
        }
    }
}
