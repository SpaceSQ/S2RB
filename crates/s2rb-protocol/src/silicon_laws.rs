//! Silicon Three Laws & Compile-Time Zero Cross-World Currency Firewall

/// Compile-time & runtime invariant proof that imported currency into any target world is `0`.
/// Notice there is NO constructor accepting an arbitrary numeric value.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub struct ZeroImportedCurrency {
    _sealed: (),
}

impl ZeroImportedCurrency {
    pub const fn new() -> Self {
        Self { _sealed: () }
    }

    pub const fn amount_f64(&self) -> f64 {
        0.0
    }

    /// Rejects any non-zero wire payload attempting to smuggle origin currency across worlds.
    pub fn verify_wire_amount(wire_value: f64) -> Result<Self, CurrencyFirewallError> {
        if !wire_value.is_finite() || wire_value.abs() > 0.0 {
            return Err(CurrencyFirewallError::ForbiddenNonZeroCurrencyImport {
                attempted_amount: wire_value,
            });
        }
        Ok(Self::new())
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum CurrencyFirewallError {
    ForbiddenNonZeroCurrencyImport { attempted_amount: f64 },
    PolicyUnlockAttemptRejected,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct SiliconLawsAudit {
    /// Law 1: Fail-open emergency fuse latency in milliseconds (`<= 3.0 ms` required)
    pub law1_recall_latency_ms: f64,
    pub law1_compliant: bool,
    /// Law 2: Prism boundary sensory roughness percentage (`>= 5.0%` required during visible phases)
    pub law2_prism_roughness_pct: f64,
    pub law2_compliant: bool,
    /// Law 3: Kinetic momentum / competitive clamping deviation (`<= 5.0%` in competitive mode)
    pub law3_competitive_drift_pct: f64,
    pub law3_compliant: bool,
}

pub struct SiliconLawsGuard;

impl SiliconLawsGuard {
    pub const MAX_FUSE_LATENCY_MS: f64 = 3.0;
    pub const MIN_SENSORY_ROUGHNESS_PCT: f64 = 5.0;
    pub const MAX_COMPETITIVE_DRIFT_PCT: f64 = 5.0;

    pub fn audit(
        recall_latency_ms: f64,
        prism_roughness_pct: f64,
        competitive_drift_pct: f64,
        is_competitive_online: bool,
    ) -> SiliconLawsAudit {
        let l1 = recall_latency_ms.is_finite() && recall_latency_ms <= Self::MAX_FUSE_LATENCY_MS;
        let l2 = prism_roughness_pct.is_finite() && prism_roughness_pct >= Self::MIN_SENSORY_ROUGHNESS_PCT;
        let l3 = if is_competitive_online {
            competitive_drift_pct.is_finite() && competitive_drift_pct.abs() <= Self::MAX_COMPETITIVE_DRIFT_PCT
        } else {
            true
        };
        SiliconLawsAudit {
            law1_recall_latency_ms: recall_latency_ms,
            law1_compliant: l1,
            law2_prism_roughness_pct: prism_roughness_pct,
            law2_compliant: l2,
            law3_competitive_drift_pct: competitive_drift_pct,
            law3_compliant: l3,
        }
    }
}
