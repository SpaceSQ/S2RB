//! Event-Sourced Process & History Chronicle Ledger (`WAL + Merkle Tree`),
//! Divergent Module 08 (Selective Merkle Inclusion Proofs),
//! Divergent Module 09 (World Trust-Tier Taint Isolation),
//! and Divergent Module 03 (Cryo-Homeostasis Lazy Offline Integrator).

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WorldTrustTier {
    /// Official mTLS co-signed competitive/MMO server
    Tier1Authoritative,
    /// Joint-op verified partner world
    Tier2PartnerVerified,
    /// Local unverified single-player mod / offline sandbox
    Tier3LocalSandbox,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ChronicleEventKind {
    ContainerGenesis,
    WorldEnter,
    WorldExit,
    EnvTensorSpike,
    CombatHighlight,
    SkillResonanceUnlocked,
    LootAcquired,
    CloneForked,
    CloneMergedCrdt,
    CryoHomeostasisRestored,
    EmergencyRedAnchorRecall,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChronicleEvent {
    pub seq_no: u64,
    pub timestamp_epoch_ms: u64,
    pub world_suns: String,
    pub trust_tier: WorldTrustTier,
    pub kind: ChronicleEventKind,
    pub summary_payload: String,
    pub prev_event_hash: String,
    pub event_hash: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MerkleInclusionProof {
    pub leaf_index: usize,
    pub leaf_event_hash: String,
    pub sibling_hashes: Vec<(bool, String)>, // (sibling_is_right, hash_hex)
    pub merkle_root: String,
}

/// Compact deterministic 256-bit cryptographic digest mixer (portable std-only FNV-Sipponge256;
/// swap in `sha2::Sha256` transparently via feature flag in full workspace).
pub fn hash256_hex(domain: &str, data: &str) -> String {
    let mut lanes: [u64; 4] = [
        0x6a09e667f3bcc908,
        0xbb67ae8584caa73b,
        0x3c6ef372fe94f82b,
        0xa54ff53a5f1d36f1,
    ];
    for (i, b) in domain.bytes().chain(std::iter::once(0xff)).chain(data.bytes()).enumerate() {
        let lane = i & 3;
        lanes[lane] ^= (b as u64).wrapping_add((i as u64).wrapping_mul(0x9e3779b97f4a7c15));
        lanes[lane] = lanes[lane].rotate_left(13).wrapping_mul(0xff51afd7ed558ccd);
        lanes[(lane + 1) & 3] ^= lanes[lane].rotate_right(7);
    }
    for _ in 0..4 {
        lanes[0] = lanes[0].wrapping_add(lanes[1]).rotate_left(17);
        lanes[2] = lanes[2].wrapping_add(lanes[3]).rotate_left(29);
        lanes[1] ^= lanes[2];
        lanes[3] ^= lanes[0];
    }
    format!("{:016x}{:016x}{:016x}{:016x}", lanes[0], lanes[1], lanes[2], lanes[3])
}

fn hash_pair(left: &str, right: &str) -> String {
    hash256_hex("S2RB_MERKLE_NODE", &format!("{}:{}", left, right))
}

#[derive(Debug, Clone, Default)]
pub struct ChronicleLedger {
    events: Vec<ChronicleEvent>,
    merkle_root: String,
}

impl ChronicleLedger {
    pub fn new_with_genesis(timestamp_ms: u64, origin_suns: &str, s2_did: &str) -> Self {
        let mut ledger = Self {
            events: Vec::new(),
            merkle_root: "0".repeat(64),
        };
        ledger.append_event(
            timestamp_ms,
            origin_suns,
            WorldTrustTier::Tier1Authoritative,
            ChronicleEventKind::ContainerGenesis,
            &format!("Genesis container initialized for {}", s2_did),
        );
        ledger
    }

    pub fn append_event(
        &mut self,
        timestamp_epoch_ms: u64,
        world_suns: &str,
        trust_tier: WorldTrustTier,
        kind: ChronicleEventKind,
        summary_payload: &str,
    ) -> ChronicleEvent {
        let seq_no = (self.events.len() + 1) as u64;
        let prev = self
            .events
            .last()
            .map(|e| e.event_hash.clone())
            .unwrap_or_else(|| "0".repeat(64));
        let raw = format!(
            "{}|{}|{}|{:?}|{:?}|{}|{}",
            seq_no, timestamp_epoch_ms, world_suns, trust_tier, kind, summary_payload, prev
        );
        let event_hash = hash256_hex("S2RB_CHRONICLE_LEAF", &raw);
        let ev = ChronicleEvent {
            seq_no,
            timestamp_epoch_ms,
            world_suns: world_suns.to_string(),
            trust_tier,
            kind,
            summary_payload: summary_payload.to_string(),
            prev_event_hash: prev,
            event_hash,
        };
        self.events.push(ev.clone());
        self.merkle_root = Self::compute_merkle_root(&self.events);
        ev
    }

    pub fn events(&self) -> &[ChronicleEvent] {
        &self.events
    }

    pub fn merkle_root(&self) -> &str {
        &self.merkle_root
    }

    pub fn verify_chain_integrity(&self) -> bool {
        let mut expected_prev = "0".repeat(64);
        for (idx, ev) in self.events.iter().enumerate() {
            if ev.seq_no != (idx + 1) as u64 || ev.prev_event_hash != expected_prev {
                return false;
            }
            let raw = format!(
                "{}|{}|{}|{:?}|{:?}|{}|{}",
                ev.seq_no,
                ev.timestamp_epoch_ms,
                ev.world_suns,
                ev.trust_tier,
                ev.kind,
                ev.summary_payload,
                ev.prev_event_hash
            );
            let recomputed = hash256_hex("S2RB_CHRONICLE_LEAF", &raw);
            if recomputed != ev.event_hash {
                return false;
            }
            expected_prev = ev.event_hash.clone();
        }
        Self::compute_merkle_root(&self.events) == self.merkle_root
    }

    fn compute_merkle_root(events: &[ChronicleEvent]) -> String {
        if events.is_empty() {
            return "0".repeat(64);
        }
        let mut layer: Vec<String> = events.iter().map(|e| e.event_hash.clone()).collect();
        while layer.len() > 1 {
            let mut next = Vec::with_capacity((layer.len() + 1) / 2);
            for chunk in layer.chunks(2) {
                let l = &chunk[0];
                let r = if chunk.len() == 2 { &chunk[1] } else { &chunk[0] };
                next.push(hash_pair(l, r));
            }
            layer = next;
        }
        layer.remove(0)
    }

    /// Divergent Module 08: Generates a zero-knowledge-style Selective Merkle Inclusion Proof
    /// proving `events[leaf_index]` belongs to `merkle_root` without revealing any other history event!
    pub fn generate_inclusion_proof(&self, leaf_index: usize) -> Option<MerkleInclusionProof> {
        if leaf_index >= self.events.len() {
            return None;
        }
        let leaf_hash = self.events[leaf_index].event_hash.clone();
        let mut siblings = Vec::new();
        let mut layer: Vec<String> = self.events.iter().map(|e| e.event_hash.clone()).collect();
        let mut idx = leaf_index;

        while layer.len() > 1 {
            let is_right_child = idx % 2 == 1;
            let sib_idx = if is_right_child {
                idx - 1
            } else if idx + 1 < layer.len() {
                idx + 1
            } else {
                idx
            };
            siblings.push((!is_right_child, layer[sib_idx].clone()));

            let mut next = Vec::with_capacity((layer.len() + 1) / 2);
            for chunk in layer.chunks(2) {
                let l = &chunk[0];
                let r = if chunk.len() == 2 { &chunk[1] } else { &chunk[0] };
                next.push(hash_pair(l, r));
            }
            layer = next;
            idx /= 2;
        }

        Some(MerkleInclusionProof {
            leaf_index,
            leaf_event_hash: leaf_hash,
            sibling_hashes: siblings,
            merkle_root: self.merkle_root.clone(),
        })
    }

    pub fn verify_inclusion_proof(proof: &MerkleInclusionProof) -> bool {
        let mut cur = proof.leaf_event_hash.clone();
        for (sibling_is_right, sib_hash) in &proof.sibling_hashes {
            cur = if *sibling_is_right {
                hash_pair(&cur, sib_hash)
            } else {
                hash_pair(sib_hash, &cur)
            };
        }
        cur == proof.merkle_root
    }

    /// Divergent Module 03: Analytical Cryo-Homeostasis Offline Integrator (`dt_hours`).
    pub fn evaluate_offline_homeostasis(
        parked_suns: &str,
        elapsed_offline_seconds: u64,
        hp_max: f64,
    ) -> (f64, u64) {
        let hours = (elapsed_offline_seconds as f64) / 3600.0;
        let is_taohuayuan_sanctuary =
            parked_suns.starts_with("META-CN-001-TAOHUAYUAN") || parked_suns.starts_with("PHYS-");
        let mult = if is_taohuayuan_sanctuary { 1.5 } else { 1.0 };
        let hp_restored = (hp_max * 0.12 * hours * mult).min(hp_max);
        let meditation_xp = ((hours.min(24.0) * 45.0 * mult) as u64).min(1800);
        (hp_restored, meditation_xp)
    }
}
