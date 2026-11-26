//! # S2RB Relational Graph, UGO v2.0 Ontology & Ark Stash (`WP-05`)

pub mod ark_stash;
pub mod relational_graph;
pub mod ugo_ontology;

pub use ark_stash::{PodBackpackLimits, StashError, TwoTierSpatialInventory};
pub use relational_graph::{
    CarbonSiliconBond, CompanionPermission, FollowJumpTicket, FriendPresenceEntry,
    PhysicalArtifactBinding, RelationalGraphEngine, TraversalModeChoice,
};
pub use ugo_ontology::{
    HostItemCapabilityProfile, ItemDegradationTier, ItemRarity, TranslatedHostItem, UgoItemSpec,
    UgoSemanticRegistry,
};
