//! # S2RB Local Sovereign Daemon (`s2rbd`) & Cross-Game `Alt+R` Overlay (`WP-06`)

pub mod ipc_server;
pub mod overlay_hud;

pub use ipc_server::{DaemonIpcCommand, DaemonIpcResponse, S2rbLocalDaemon};
pub use overlay_hud::{AltROverlaySnapshot, OverlayTab};
