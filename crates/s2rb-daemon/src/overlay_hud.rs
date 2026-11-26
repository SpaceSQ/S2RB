//! Swapchain-Injected Cross-Game `Alt+R` Holographic Overlay Snapshot Model

use s2rb_renderer_kernel::RenderShellFrameState;
use s2rb_ugo_inventory::{FollowJumpTicket, TranslatedHostItem};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OverlayTab {
    SpatialBackpackUgo,
    SocialFollowAndLineage,
    FourteenElementsPod,
    DaemonSecurityAndFuse,
}

#[derive(Debug, Clone, PartialEq)]
pub struct AltROverlaySnapshot {
    pub overlay_visible: bool,
    pub active_tab: OverlayTab,
    pub active_s2_did: String,
    pub current_world_suns: String,
    pub shell_frame: RenderShellFrameState,
    pub translated_backpack_items: Vec<TranslatedHostItem>,
    pub ready_follow_tickets: Vec<FollowJumpTicket>,
    pub imported_currency_locked_zero: f64,
}
