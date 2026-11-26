//! # S2RB Cross-World Bridge Router Core (`WP-03`)
//! Connects heterogeneous single-player and online virtual worlds via:
//! - Mode A: `Singleton2PcCoordinator` (atomic despawn in source -> rebirth in target with monotonic fencing tokens)
//! - Mode B: `CloneForkOrchestrator` (Matriarch stays active + parallel multi-world clones + quota conservation + CRDT merge)
//! - `Host7DimGovernanceFilter` (7-dimension host admission policy with hard-locked zero currency import)

pub mod clone_crdt;
pub mod governance_7dim;
pub mod singleton_2pc;

pub use clone_crdt::{
    CloneForkDescriptor, CloneForkOrchestrator, ConsumableQuotaEscrow, ORSetCrdt, PNCounterCrdt,
};
pub use governance_7dim::{
    AdmittedContainerProjection, ApparelPolicy, BackpackPolicy, EquipmentPolicy,
    GovernanceError, Host7DimGovernanceFilter, HostNetworkMode, HostWorldManifest, OriginXpPolicy,
    SkillPolicy, SkinPolicy,
};
pub use singleton_2pc::{
    DespawnCommitReceipt, ExclusivePresenceLease, MigrationError, Singleton2PcCoordinator,
    SingletonPresenceState,
};
