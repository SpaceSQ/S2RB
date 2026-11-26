//! Mode A: Singleton Atomic Migration Coordinator (`2PC + Monotonic Fencing Token Lease`)
//! Guarantees a Singleton character exists in AT MOST ONE world at any instant:
//! Source World Despawn -> Bifrost Transit -> Target World Rebirth (with 3000ms Deadman Sanctuary Rollback).

use crate::governance_7dim::{
    AdmittedContainerProjection, GovernanceError, Host7DimGovernanceFilter, HostWorldManifest,
};
use s2rb_container::{
    ChronicleEventKind, ChronicleLedger, VirtualAvatarCharacter, WorldTrustTier,
};
use s2rb_protocol::{SunsAddress, GENESIS_HUB_ADDRESS};

pub const TRANSIT_DEADMAN_TIMEOUT_MS: u64 = 3_000;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExclusivePresenceLease {
    pub s2_did: String,
    pub holder_world_suns: String,
    pub fencing_token: u64,
    pub issued_at_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DespawnCommitReceipt {
    pub tx_id: String,
    pub s2_did: String,
    pub despawned_from_suns: String,
    pub revoked_fencing_token: u64,
    pub state_merkle_root: String,
    pub committed_at_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum SingletonPresenceState {
    ActiveInWorld(ExclusivePresenceLease),
    Phase1FreezeExtracting {
        tx_id: String,
        from_lease: ExclusivePresenceLease,
        target_suns: String,
        deadline_ms: u64,
        backup_merkle_root: String,
    },
    Phase2InBifrostTransit {
        receipt: DespawnCommitReceipt,
        target_suns: String,
        next_fencing_token: u64,
        deadline_ms: u64,
    },
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MigrationError {
    AlreadyInTransit,
    NotInExpectedPhase,
    FencingTokenStale { expected: u64, provided: u64 },
    SourceWorldMismatch,
    TransitDeadlineExpired,
    GovernanceRejected(GovernanceError),
}

pub struct Singleton2PcCoordinator {
    pub state: SingletonPresenceState,
    highest_fencing_token: u64,
}

impl Singleton2PcCoordinator {
    pub fn new_at_world(s2_did: &str, initial_world: &SunsAddress, now_ms: u64) -> Self {
        let lease = ExclusivePresenceLease {
            s2_did: s2_did.to_string(),
            holder_world_suns: initial_world.to_canonical_string(),
            fencing_token: 1,
            issued_at_ms: now_ms,
        };
        Self {
            state: SingletonPresenceState::ActiveInWorld(lease),
            highest_fencing_token: 1,
        }
    }

    pub fn highest_fencing_token(&self) -> u64 {
        self.highest_fencing_token
    }

    /// Phase 1: Freeze character inputs in Source World A & lock pre-transit snapshot.
    pub fn begin_freeze_and_extract(
        &mut self,
        tx_id: &str,
        expected_fencing_token: u64,
        target_world: &SunsAddress,
        chronicle: &ChronicleLedger,
        now_ms: u64,
    ) -> Result<(), MigrationError> {
        let current_lease = match &self.state {
            SingletonPresenceState::ActiveInWorld(l) => l.clone(),
            _ => return Err(MigrationError::AlreadyInTransit),
        };
        if current_lease.fencing_token != expected_fencing_token {
            return Err(MigrationError::FencingTokenStale {
                expected: current_lease.fencing_token,
                provided: expected_fencing_token,
            });
        }
        self.state = SingletonPresenceState::Phase1FreezeExtracting {
            tx_id: tx_id.to_string(),
            from_lease: current_lease,
            target_suns: target_world.to_canonical_string(),
            deadline_ms: now_ms + TRANSIT_DEADMAN_TIMEOUT_MS,
            backup_merkle_root: chronicle.merkle_root().to_string(),
        };
        Ok(())
    }

    /// Phase 2: Source World A confirms entity has been completely removed/despawned from its scene.
    pub fn commit_source_despawn(
        &mut self,
        source_world_suns: &str,
        chronicle: &mut ChronicleLedger,
        now_ms: u64,
    ) -> Result<DespawnCommitReceipt, MigrationError> {
        let (tx_id, from_lease, target_suns, deadline_ms) = match &self.state {
            SingletonPresenceState::Phase1FreezeExtracting {
                tx_id,
                from_lease,
                target_suns,
                deadline_ms,
                ..
            } => (
                tx_id.clone(),
                from_lease.clone(),
                target_suns.clone(),
                *deadline_ms,
            ),
            _ => return Err(MigrationError::NotInExpectedPhase),
        };

        if now_ms > deadline_ms {
            self.rollback_to_genesis_sanctuary(chronicle, now_ms, "Phase1 deadline expired");
            return Err(MigrationError::TransitDeadlineExpired);
        }
        if from_lease.holder_world_suns != source_world_suns {
            return Err(MigrationError::SourceWorldMismatch);
        }

        chronicle.append_event(
            now_ms,
            source_world_suns,
            WorldTrustTier::Tier1Authoritative,
            ChronicleEventKind::WorldExit,
            &format!("Singleton atomic despawn from {} (revoked token #{})", source_world_suns, from_lease.fencing_token),
        );

        self.highest_fencing_token += 1;
        let receipt = DespawnCommitReceipt {
            tx_id,
            s2_did: from_lease.s2_did.clone(),
            despawned_from_suns: from_lease.holder_world_suns,
            revoked_fencing_token: from_lease.fencing_token,
            state_merkle_root: chronicle.merkle_root().to_string(),
            committed_at_ms: now_ms,
        };
        self.state = SingletonPresenceState::Phase2InBifrostTransit {
            receipt: receipt.clone(),
            target_suns,
            next_fencing_token: self.highest_fencing_token,
            deadline_ms: now_ms + TRANSIT_DEADMAN_TIMEOUT_MS,
        };
        Ok(receipt)
    }

    /// Phase 3: Target World B presents `next_fencing_token`, applies 7-Dim Host Rules, and spawns Rebirth!
    pub fn commit_target_rebirth(
        &mut self,
        provided_fencing_token: u64,
        avatar: &VirtualAvatarCharacter,
        target_manifest: &HostWorldManifest,
        chronicle: &mut ChronicleLedger,
        now_ms: u64,
    ) -> Result<(ExclusivePresenceLease, AdmittedContainerProjection), MigrationError> {
        let (receipt, target_suns, next_token, deadline_ms) = match &self.state {
            SingletonPresenceState::Phase2InBifrostTransit {
                receipt,
                target_suns,
                next_fencing_token,
                deadline_ms,
            } => (
                receipt.clone(),
                target_suns.clone(),
                *next_fencing_token,
                *deadline_ms,
            ),
            _ => return Err(MigrationError::NotInExpectedPhase),
        };

        if provided_fencing_token != next_token {
            return Err(MigrationError::FencingTokenStale {
                expected: next_token,
                provided: provided_fencing_token,
            });
        }
        if now_ms > deadline_ms {
            self.rollback_to_genesis_sanctuary(chronicle, now_ms, "Target rebirth timed out >3000ms");
            return Err(MigrationError::TransitDeadlineExpired);
        }

        let projection = Host7DimGovernanceFilter::project_avatar_into_host(avatar, target_manifest)
            .map_err(MigrationError::GovernanceRejected)?;

        chronicle.append_event(
            now_ms,
            &target_suns,
            target_manifest.trust_tier,
            ChronicleEventKind::WorldEnter,
            &format!("Singleton rebirth in {} with fencing token #{}", target_suns, next_token),
        );

        let new_lease = ExclusivePresenceLease {
            s2_did: receipt.s2_did,
            holder_world_suns: target_suns,
            fencing_token: next_token,
            issued_at_ms: now_ms,
        };
        self.state = SingletonPresenceState::ActiveInWorld(new_lease.clone());
        Ok((new_lease, projection))
    }

    /// Silicon Law 1 (`< 3ms` Fail-Open Recall) or `3000ms` Deadman Timeout Rollback:
    /// Immediately bumps `fencing_token` (killing any late zombie packets) and restores presence to Genesis Hub!
    pub fn rollback_to_genesis_sanctuary(
        &mut self,
        chronicle: &mut ChronicleLedger,
        now_ms: u64,
        reason: &str,
    ) -> ExclusivePresenceLease {
        let did = match &self.state {
            SingletonPresenceState::ActiveInWorld(l) => l.s2_did.clone(),
            SingletonPresenceState::Phase1FreezeExtracting { from_lease, .. } => from_lease.s2_did.clone(),
            SingletonPresenceState::Phase2InBifrostTransit { receipt, .. } => receipt.s2_did.clone(),
        };
        self.highest_fencing_token += 1;
        chronicle.append_event(
            now_ms,
            GENESIS_HUB_ADDRESS,
            WorldTrustTier::Tier1Authoritative,
            ChronicleEventKind::EmergencyRedAnchorRecall,
            &format!("Fail-Open Sanctuary Recovery ({}) -> fencing token #{}", reason, self.highest_fencing_token),
        );
        let safe_lease = ExclusivePresenceLease {
            s2_did: did,
            holder_world_suns: GENESIS_HUB_ADDRESS.to_string(),
            fencing_token: self.highest_fencing_token,
            issued_at_ms: now_ms,
        };
        self.state = SingletonPresenceState::ActiveInWorld(safe_lease.clone());
        safe_lease
    }
}
