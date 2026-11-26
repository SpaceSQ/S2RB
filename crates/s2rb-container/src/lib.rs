//! # S2RB Character Container Core (`WP-02`)
//! Encapsulates the `2.0m x 2.0m x 2.4m` (`9.6 m3`) Smart Space + Virtual Avatar Character
//! as an autonomous, standalone-capable, cross-world traversable entity.

pub mod avatar;
pub mod chronicle_ledger;
pub mod ffi_cabi;
pub mod game_overlay;
pub mod kinematics_9m6;

pub use avatar::{
    ActionPrimitive, AvatarVisualModality, HybridResonanceSkill, NormalizedPowerVector,
    OriginEscrowVault, SkillDescriptor, VirtualAvatarCharacter,
};
pub use chronicle_ledger::{
    ChronicleEvent, ChronicleEventKind, ChronicleLedger, MerkleInclusionProof, WorldTrustTier,
};
pub use game_overlay::{DamageSanitizeResult, SpaceGameOverlay};
pub use kinematics_9m6::{
    BoundaryExitEvent, ContainerFace, EnvelopeVisibilityMode, IntraPodKinematics, PostureState,
    CONTAINER_DEPTH_M, CONTAINER_HEIGHT_M, CONTAINER_VOLUME_M3, CONTAINER_WIDTH_M,
};
