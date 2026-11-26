//! Four-Domain Relational Graph Engine:
//! 1. Carbon-Silicon Principal-Adjutant Bonds (`Class D` <-> `Class V`)
//! 2. Matriarch-Clone Lineage Links
//! 3. Cross-Game Friend Presence & One-Click Follow-Jump Berth Allocator (`L6` berths `2..9`)
//! 4. Taohuayuan Physical OPC Craft Geo-Bindings (`TC-001-ARCH`)

use s2rb_protocol::{S2Did, SpeciesClass, SunsAddress};
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub enum CompanionPermission {
    AcousticSonarRead,
    WaveTacticalRadio,
    AutoLootPickup,
    MeditationHomeostasisAssist,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CarbonSiliconBond {
    pub principal_human_did: String,
    pub companion_agent_did: String,
    pub orbital_slot_index: u8,
    pub permissions: BTreeSet<CompanionPermission>,
    /// Hard invariant: Class-V companion can NEVER touch currency or root sovereignty keys.
    pub currency_access_locked_false: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TraversalModeChoice {
    SingletonMigration,
    ShadowCloneFork,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FriendPresenceEntry {
    pub friend_did: String,
    pub display_name: String,
    pub current_world_name: String,
    pub current_suns: SunsAddress,
    pub occupied_room_berths: BTreeSet<u8>,
    pub joinable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct FollowJumpTicket {
    pub ticket_id: String,
    pub follower_did: String,
    pub leader_friend_did: String,
    pub target_berth_suns: String,
    pub allocated_l6_berth: u8,
    pub mode: TraversalModeChoice,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PhysicalArtifactBinding {
    pub artifact_serial: String,
    pub artifact_category: String, // e.g. "桃花玉定气锚", "WJP全彩3D跨界英雄手办"
    pub bound_s2_did: String,
    pub origin_landmark: String,   // e.g. "TC-001-ARCH"
    pub nfc_pubkey_fingerprint: String,
}

#[derive(Default)]
pub struct RelationalGraphEngine {
    pub bonds_by_principal: BTreeMap<String, Vec<CarbonSiliconBond>>,
    pub social_friends: BTreeMap<String, BTreeSet<String>>,
    pub live_presence: BTreeMap<String, FriendPresenceEntry>,
    pub physical_artifacts: BTreeMap<String, Vec<PhysicalArtifactBinding>>,
    next_ticket_seq: u64,
}

impl RelationalGraphEngine {
    pub fn bind_companion_agent(
        &mut self,
        principal: &S2Did,
        companion: &S2Did,
        orbital_slot_index: u8,
        permissions: BTreeSet<CompanionPermission>,
    ) -> Result<CarbonSiliconBond, String> {
        if principal.species != SpeciesClass::DigitalHumanD {
            return Err("Principal must hold Class-D DigitalHuman S2-DID".to_string());
        }
        if companion.species != SpeciesClass::CompanionAgentV {
            return Err("Companion adjutant must hold Class-V S2-DID".to_string());
        }
        let bond = CarbonSiliconBond {
            principal_human_did: principal.as_str().to_string(),
            companion_agent_did: companion.as_str().to_string(),
            orbital_slot_index,
            permissions,
            currency_access_locked_false: true,
        };
        self.bonds_by_principal
            .entry(principal.as_str().to_string())
            .or_default()
            .push(bond.clone());
        Ok(bond)
    }

    pub fn link_mutual_friends(&mut self, did_a: &str, did_b: &str) {
        self.social_friends
            .entry(did_a.to_string())
            .or_default()
            .insert(did_b.to_string());
        self.social_friends
            .entry(did_b.to_string())
            .or_default()
            .insert(did_a.to_string());
    }

    pub fn update_friend_presence(&mut self, entry: FriendPresenceEntry) {
        self.live_presence.insert(entry.friend_did.clone(), entry);
    }

    /// Resolves a One-Click Follow-Jump Ticket into an adjacent unoccupied `L6` berth (`2..9`)
    /// inside the exact same `L1-L2-L3-L4-L5` room instance so two `9.6 m3` containers never overlap!
    pub fn resolve_follow_jump(
        &mut self,
        follower_did: &str,
        leader_friend_did: &str,
        mode: TraversalModeChoice,
    ) -> Result<FollowJumpTicket, String> {
        let is_friend = self
            .social_friends
            .get(follower_did)
            .map_or(false, |s| s.contains(leader_friend_did));
        if !is_friend {
            return Err("Target player is not in mutual S2-DID friend graph".to_string());
        }
        let presence = self
            .live_presence
            .get(leader_friend_did)
            .ok_or_else(|| "Target friend is currently offline".to_string())?;
        if !presence.joinable {
            return Err("Target friend's current instance is locked/full".to_string());
        }

        let mut chosen_berth = None;
        for candidate_l6 in 2..=9u8 {
            if candidate_l6 != presence.current_suns.l6_berth
                && !presence.occupied_room_berths.contains(&candidate_l6)
            {
                chosen_berth = Some(candidate_l6);
                break;
            }
        }
        let allocated_l6 = chosen_berth.ok_or_else(|| "All 8 L6 berths (2..9) in friend's room are full".to_string())?;

        let mut target_addr = presence.current_suns.clone();
        target_addr.l6_berth = allocated_l6;
        self.next_ticket_seq += 1;

        Ok(FollowJumpTicket {
            ticket_id: format!("FJUMP-{:06}", self.next_ticket_seq),
            follower_did: follower_did.to_string(),
            leader_friend_did: leader_friend_did.to_string(),
            target_berth_suns: target_addr.to_canonical_string(),
            allocated_l6_berth: allocated_l6,
            mode,
        })
    }

    pub fn bind_taohuayuan_opc_artifact(&mut self, binding: PhysicalArtifactBinding) {
        self.physical_artifacts
            .entry(binding.bound_s2_did.clone())
            .or_default()
            .push(binding);
    }
}
