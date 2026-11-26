//! # S2RB Bounded & Extended Hybrid Renderer Kernel (`WP-04`)
//! Enforces:
//! 1. Strict `2.0m x 2.0m x 2.4m = 9.6 m3` Euclidean SDF clipping (`0` leaked pixels outside container)
//! 2. `@ dOmega` boundary-crossing handoff bus for projectiles, annular ground AoEs & polearm tips
//! 3. Four-state Stealth Envelope controller (`opacity = 0.0` & `0` shell draw calls during normal gameplay)

pub mod ffi_renderer_cabi;
pub mod handoff_bus;
pub mod sdf_clip_9m6;
pub mod stealth_envelope;

pub use handoff_bus::{
    ExtendedEffectHandoffBus, HostEffectArchetype, HostEffectSpawnCommand, HostVfxBackend,
};
pub use sdf_clip_9m6::{evaluate_primary_fragment_9m6, sd_box_9m6, FragmentClipSample};
pub use stealth_envelope::{RenderShellFrameState, StealthEnvelopeController, WakeupReason};
