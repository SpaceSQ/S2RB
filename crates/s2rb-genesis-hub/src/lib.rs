//! WP-08: Taohuayuan Ancient Town Operations Center (`META-CN-001-TAOHUAYUAN2-001-2` / `TC-001-ARCH`)
//! and Dual `/s2RB` Portal Coordinator (`www.s2rb.space2.world` + `www.taohuayuan.world/s2RB`).

pub const GENESIS_PORTAL_ROBOT0: &str = "https://s2rb.space2.world/";
pub const GENESIS_PORTAL_TAOHUAYUAN: &str = "https://www.taohuayuan.world/s2RB";
pub const GENESIS_PLAZA_SUNS: &str = "META-CN-001-TAOHUAYUAN2-001-2";
pub const GENESIS_ARCH_LANDMARK: &str = "TC-001-ARCH";
pub const TAOYUAN_SANCTUARY_RECOVERY_MULT: f64 = 1.5;

#[derive(Debug, Clone)]
pub struct OperationsTelemetrySnapshot {
    pub hub_suns: &'static str,
    pub landmark_code: &'static str,
    pub connected_engines: usize,
    pub active_singleton_leases: u64,
    pub active_clone_forks: u64,
    pub blocked_currency_attempts: u64,
    pub last_red_anchor_latency_ms: f64,
}
