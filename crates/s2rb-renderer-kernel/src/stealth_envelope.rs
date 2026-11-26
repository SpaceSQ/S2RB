//! Four-State Stealth Envelope Controller & Zero-DrawCall Culler (`WP-04`)

use s2rb_container::EnvelopeVisibilityMode;

pub const CEREMONY_DURATION_SEC: f64 = 3.0;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WakeupReason {
    ArrivalOrExtractionCeremony,
    UserHotkeyAltR,
    BackendAuditOrHazardShield,
    EmergencyRedAnchorRecall,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RenderShellFrameState {
    pub mode: EnvelopeVisibilityMode,
    pub shell_opacity: f64,
    pub shell_draw_calls: u32,
    pub prism_roughness_pct: f64,
    pub ceremony_remaining_sec: f64,
}

pub struct StealthEnvelopeController {
    mode: EnvelopeVisibilityMode,
    ceremony_timer_sec: f64,
    user_overlay_pinned: bool,
    system_wakeup_pinned: bool,
}

impl Default for StealthEnvelopeController {
    fn default() -> Self {
        Self::new_with_arrival_ceremony()
    }
}

impl StealthEnvelopeController {
    /// Spawns in `CEREMONY_VISIBLE` (`3.0s`) and automatically fades to `STEALTH_GAMEPLAY_INVISIBLE` (`0` draw calls).
    pub fn new_with_arrival_ceremony() -> Self {
        Self {
            mode: EnvelopeVisibilityMode::CeremonyVisible,
            ceremony_timer_sec: CEREMONY_DURATION_SEC,
            user_overlay_pinned: false,
            system_wakeup_pinned: false,
        }
    }

    pub fn trigger_wakeup(&mut self, reason: WakeupReason) {
        match reason {
            WakeupReason::ArrivalOrExtractionCeremony => {
                self.ceremony_timer_sec = CEREMONY_DURATION_SEC;
                self.mode = EnvelopeVisibilityMode::CeremonyVisible;
            }
            WakeupReason::UserHotkeyAltR => {
                self.ceremony_timer_sec = 0.0;
                self.user_overlay_pinned = true;
                if !self.system_wakeup_pinned {
                    self.mode = EnvelopeVisibilityMode::UserInspectOverlay;
                }
            }
            WakeupReason::BackendAuditOrHazardShield | WakeupReason::EmergencyRedAnchorRecall => {
                self.system_wakeup_pinned = true;
                self.mode = EnvelopeVisibilityMode::SystemTelemetryWakeup;
            }
        }
    }

    pub fn release_user_overlay(&mut self) {
        self.user_overlay_pinned = false;
        self.recompute_mode();
    }

    pub fn release_system_wakeup(&mut self) {
        self.system_wakeup_pinned = false;
        self.recompute_mode();
    }

    pub fn tick_frame(&mut self, dt_sec: f64) -> RenderShellFrameState {
        if self.ceremony_timer_sec > 0.0 {
            self.ceremony_timer_sec = (self.ceremony_timer_sec - dt_sec.max(0.0)).max(0.0);
        }
        self.recompute_mode();
        let opacity = self.mode.shell_opacity();
        RenderShellFrameState {
            mode: self.mode,
            shell_opacity: opacity,
            shell_draw_calls: if opacity <= 1e-6 { 0 } else { 1 },
            prism_roughness_pct: if opacity <= 1e-6 { 0.0 } else { 5.5 },
            ceremony_remaining_sec: self.ceremony_timer_sec,
        }
    }

    fn recompute_mode(&mut self) {
        if self.system_wakeup_pinned {
            self.mode = EnvelopeVisibilityMode::SystemTelemetryWakeup;
        } else if self.ceremony_timer_sec > 0.0 {
            self.mode = EnvelopeVisibilityMode::CeremonyVisible;
        } else if self.user_overlay_pinned {
            self.mode = EnvelopeVisibilityMode::UserInspectOverlay;
        } else {
            self.mode = EnvelopeVisibilityMode::StealthGameplayInvisible;
        }
    }
}
