//! Mode B: Clone / Fork Multi-World Orchestrator, Bounded Consumable Quota Escrow,
//! and Commutative/Associative/Idempotent CRDT Matriarch Re-Convergence (`PN-Counter + OR-Set`).

use s2rb_container::{ChronicleEventKind, ChronicleLedger, WorldTrustTier};
use s2rb_protocol::SunsAddress;
use std::collections::{BTreeMap, BTreeSet};

/// State-based PN-Counter CRDT keyed by `branch_id` (`fork_id`).
/// Satisfies `merge(A, B) == merge(B, A)` and `merge(A, A) == A` (idempotent under packet retries!).
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PNCounterCrdt {
    pos_by_branch: BTreeMap<String, u64>,
    neg_by_branch: BTreeMap<String, u64>,
}

impl PNCounterCrdt {
    pub fn increment(&mut self, branch_id: &str, delta: u64) {
        let entry = self.pos_by_branch.entry(branch_id.to_string()).or_insert(0);
        *entry = entry.saturating_add(delta);
    }

    pub fn decrement(&mut self, branch_id: &str, delta: u64) {
        let entry = self.neg_by_branch.entry(branch_id.to_string()).or_insert(0);
        *entry = entry.saturating_add(delta);
    }

    pub fn value(&self) -> i128 {
        let p: u128 = self.pos_by_branch.values().map(|&v| v as u128).sum();
        let n: u128 = self.neg_by_branch.values().map(|&v| v as u128).sum();
        (p as i128) - (n as i128)
    }

    pub fn merge_from(&mut self, other: &PNCounterCrdt) {
        for (branch, &val) in &other.pos_by_branch {
            let cur = self.pos_by_branch.entry(branch.clone()).or_insert(0);
            *cur = (*cur).max(val);
        }
        for (branch, &val) in &other.neg_by_branch {
            let cur = self.neg_by_branch.entry(branch.clone()).or_insert(0);
            *cur = (*cur).max(val);
        }
    }
}

/// Observed-Remove Set (`OR-Set`) CRDT for unlocked cross-world hybrid skills & honor badges.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ORSetCrdt {
    adds: BTreeMap<String, BTreeSet<String>>,    // element -> set of unique add_tags
    removes: BTreeMap<String, BTreeSet<String>>, // element -> set of tombstoned add_tags
}

impl ORSetCrdt {
    pub fn add(&mut self, item: &str, unique_tag: &str) {
        self.adds
            .entry(item.to_string())
            .or_default()
            .insert(unique_tag.to_string());
    }

    pub fn remove_observed(&mut self, item: &str) {
        if let Some(observed_tags) = self.adds.get(item) {
            let rem = self.removes.entry(item.to_string()).or_default();
            for t in observed_tags {
                rem.insert(t.clone());
            }
        }
    }

    pub fn elements(&self) -> Vec<String> {
        let mut out = Vec::new();
        for (item, add_tags) in &self.adds {
            let rem_tags = self.removes.get(item);
            let alive = add_tags
                .iter()
                .any(|t| rem_tags.map_or(true, |r| !r.contains(t)));
            if alive {
                out.push(item.clone());
            }
        }
        out
    }

    pub fn merge_from(&mut self, other: &ORSetCrdt) {
        for (item, tags) in &other.adds {
            let entry = self.adds.entry(item.clone()).or_default();
            for t in tags {
                entry.insert(t.clone());
            }
        }
        for (item, tags) in &other.removes {
            let entry = self.removes.entry(item.clone()).or_default();
            for t in tags {
                entry.insert(t.clone());
            }
        }
    }
}

/// Conservation-of-mass escrow preventing item duplication across parallel clones.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ConsumableQuotaEscrow {
    initial_supply: BTreeMap<String, u32>,
    matriarch_available: BTreeMap<String, u32>,
    fork_allocations: BTreeMap<String, BTreeMap<String, u32>>,
    consumed_burned: BTreeMap<String, u32>,
}

impl ConsumableQuotaEscrow {
    pub fn new(initial_items: BTreeMap<String, u32>) -> Self {
        Self {
            initial_supply: initial_items.clone(),
            matriarch_available: initial_items,
            fork_allocations: BTreeMap::new(),
            consumed_burned: BTreeMap::new(),
        }
    }

    pub fn matriarch_available_of(&self, item_id: &str) -> u32 {
        self.matriarch_available.get(item_id).copied().unwrap_or(0)
    }

    pub fn allocate_to_fork(
        &mut self,
        fork_id: &str,
        requested: &BTreeMap<String, u32>,
    ) -> Result<(), String> {
        for (item, &qty) in requested {
            if self.matriarch_available_of(item) < qty {
                return Err(format!("Insufficient matriarch quota for {}", item));
            }
        }
        let fork_bag = self.fork_allocations.entry(fork_id.to_string()).or_default();
        for (item, &qty) in requested {
            *self.matriarch_available.entry(item.clone()).or_insert(0) -= qty;
            *fork_bag.entry(item.clone()).or_insert(0) += qty;
        }
        Ok(())
    }

    pub fn settle_fork_consumption(
        &mut self,
        fork_id: &str,
        consumed_in_world: &BTreeMap<String, u32>,
    ) -> Result<(), String> {
        let fork_bag = self
            .fork_allocations
            .remove(fork_id)
            .ok_or_else(|| format!("Unknown fork_id {}", fork_id))?;
        for (item, &held) in &fork_bag {
            let used = consumed_in_world.get(item).copied().unwrap_or(0);
            if used > held {
                return Err(format!("Fork {} attempted to consume {} > allocated {}", fork_id, used, held));
            }
            let unused = held - used;
            *self.matriarch_available.entry(item.clone()).or_insert(0) += unused;
            *self.consumed_burned.entry(item.clone()).or_insert(0) += used;
        }
        Ok(())
    }

    pub fn verify_mass_conservation(&self) -> bool {
        for (item, &init_qty) in &self.initial_supply {
            let avail = self.matriarch_available_of(item);
            let in_forks: u32 = self
                .fork_allocations
                .values()
                .map(|m| m.get(item).copied().unwrap_or(0))
                .sum();
            let burned = self.consumed_burned.get(item).copied().unwrap_or(0);
            if avail + in_forks + burned != init_qty {
                return false;
            }
        }
        true
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CloneForkDescriptor {
    pub fork_id: String,
    pub parent_s2_did: String,
    pub target_world_suns: String,
    pub parent_merkle_anchor: String,
    pub trust_tier: WorldTrustTier,
}

pub struct CloneForkOrchestrator {
    pub matriarch_did: String,
    next_branch_seq: u32,
    pub active_forks: BTreeMap<String, CloneForkDescriptor>,
    pub quota_escrow: ConsumableQuotaEscrow,
    pub certified_xp_crdt: PNCounterCrdt,
    pub sandbox_xp_crdt: PNCounterCrdt,
    pub hybrid_skills_crdt: ORSetCrdt,
    pub honors_crdt: ORSetCrdt,
}

impl CloneForkOrchestrator {
    pub fn new(matriarch_did: &str, initial_consumables: BTreeMap<String, u32>) -> Self {
        Self {
            matriarch_did: matriarch_did.to_string(),
            next_branch_seq: 1,
            active_forks: BTreeMap::new(),
            quota_escrow: ConsumableQuotaEscrow::new(initial_consumables),
            certified_xp_crdt: PNCounterCrdt::default(),
            sandbox_xp_crdt: PNCounterCrdt::default(),
            hybrid_skills_crdt: ORSetCrdt::default(),
            honors_crdt: ORSetCrdt::default(),
        }
    }

    pub fn spawn_shadow_clone(
        &mut self,
        target_world: &SunsAddress,
        trust_tier: WorldTrustTier,
        consumable_slice: &BTreeMap<String, u32>,
        chronicle: &mut ChronicleLedger,
        now_ms: u64,
    ) -> Result<CloneForkDescriptor, String> {
        let branch_hex = format!("{:04X}", self.next_branch_seq);
        self.next_branch_seq += 1;
        let fork_id = format!("{}#FORK-{}-{}", self.matriarch_did, target_world.l4_sovereign, branch_hex);

        self.quota_escrow.allocate_to_fork(&fork_id, consumable_slice)?;
        let desc = CloneForkDescriptor {
            fork_id: fork_id.clone(),
            parent_s2_did: self.matriarch_did.clone(),
            target_world_suns: target_world.to_canonical_string(),
            parent_merkle_anchor: chronicle.merkle_root().to_string(),
            trust_tier,
        };
        self.active_forks.insert(fork_id.clone(), desc.clone());

        chronicle.append_event(
            now_ms,
            &desc.target_world_suns,
            trust_tier,
            ChronicleEventKind::CloneForked,
            &format!("Spawned parallel shadow clone {} while Matriarch stays active", fork_id),
        );
        Ok(desc)
    }

    /// Asynchronous CRDT merge from a clone session back into the Matriarch!
    pub fn merge_clone_crdt_delta(
        &mut self,
        fork_id: &str,
        remote_certified_xp: &PNCounterCrdt,
        remote_sandbox_xp: &PNCounterCrdt,
        remote_skills: &ORSetCrdt,
        remote_honors: &ORSetCrdt,
        consumed_items: Option<&BTreeMap<String, u32>>,
        chronicle: &mut ChronicleLedger,
        now_ms: u64,
    ) -> Result<(), String> {
        if let Some(used) = consumed_items {
            if self.active_forks.contains_key(fork_id) {
                self.quota_escrow.settle_fork_consumption(fork_id, used)?;
                self.active_forks.remove(fork_id);
            }
        }
        self.certified_xp_crdt.merge_from(remote_certified_xp);
        self.sandbox_xp_crdt.merge_from(remote_sandbox_xp);
        self.hybrid_skills_crdt.merge_from(remote_skills);
        self.honors_crdt.merge_from(remote_honors);

        chronicle.append_event(
            now_ms,
            "META-CN-001-TAOHUAYUAN2-001-2",
            WorldTrustTier::Tier1Authoritative,
            ChronicleEventKind::CloneMergedCrdt,
            &format!(
                "CRDT re-converged {} -> certXP={}, skills={:?}",
                fork_id,
                self.certified_xp_crdt.value(),
                self.hybrid_skills_crdt.elements()
            ),
        );
        Ok(())
    }
}
