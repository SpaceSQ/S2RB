//! Multi-Modal Virtual Avatar Character, Dual-Track Progression, Cross-World Skill Resonance Alchemist,
//! and Segregated Origin Currency Escrow Vault.

use s2rb_protocol::{S2Did, ZeroImportedCurrency};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AvatarVisualModality {
    /// Realistic high-poly glTF 2.0 / OpenUSD character (e.g., WoW Armored Paladin)
    RealisticPbrHumanoid,
    /// Hybrid Voxel-PBR mesh (e.g., Minecraft Creator Knight)
    VoxelHybridMesh,
    /// Lifelike volumetric cyan-blue human hologram (e.g., Taohuayuan Digital Human)
    VolumetricHumanHologram,
    /// Stylized Cel-Shaded / Anime VRM 1.0 character
    StylizedCelVrm,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ActionPrimitive {
    MeleeCleave,
    DashCharge,
    BallisticProjectile,
    AoeDomainField,
    ProtectiveShield,
    VoxelConstruct,
    AcousticWaveScan,
    HologramDecoy,
    HolyPurifyHeal,
    GrappleHook,
    ElementalInfusion,
    SummonCompanion,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SkillDescriptor {
    pub skill_id: String,
    pub display_name: String,
    pub primitive: ActionPrimitive,
    pub element_tag: String,
    pub max_range_m: f64,
    pub aoe_radius_m: f64,
    pub cooldown_sec: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct HybridResonanceSkill {
    pub recipe_hash: String,
    pub name: String,
    pub origin_skill_id: String,
    pub host_world_law_tag: String,
    pub combined_primitive: ActionPrimitive,
    pub power_coeff: f64,
}

/// Divergent Module 06: Universal Normalized Power Vector in `[0.0, 1000.0]`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct NormalizedPowerVector {
    pub offense: f64,
    pub defense: f64,
    pub mobility: f64,
    pub arcane_tech: f64,
    pub vitality: f64,
}

impl NormalizedPowerVector {
    /// Maps arbitrary raw origin stats `(raw_val, genre_reference_mid)` onto `[0.0, 1000.0]` via smooth log-rational scaling.
    pub fn normalize_stat(raw_val: f64, genre_reference_mid: f64) -> f64 {
        if !raw_val.is_finite() || raw_val <= 0.0 {
            return 0.0;
        }
        let mid = genre_reference_mid.max(1.0);
        let ratio = (1.0 + raw_val).ln() / (1.0 + mid).ln();
        (1000.0 * (ratio / (1.0 + ratio)) * 1.35).clamp(10.0, 1000.0)
    }

    /// Projects normalized `[0..1000]` stat into a host game's `[host_min, host_max]` envelope.
    pub fn project_to_host(norm_score: f64, host_min: f64, host_max: f64, competitive_clamp: bool) -> f64 {
        let t = (norm_score / 1000.0).clamp(0.0, 1.0);
        if competitive_clamp {
            let mid = (host_min + host_max) * 0.5;
            let band = (host_max - host_min) * 0.05; // +/- 5% Silicon Law 3 competitive ceiling
            mid + (t - 0.5) * 2.0 * band
        } else {
            host_min + t * (host_max - host_min)
        }
    }
}

/// Segregated Read-Only Origin Currency Escrow Vault.
/// Balances remain locked in their respective origin worlds; cross-world imported currency is strictly `ZeroImportedCurrency`.
#[derive(Debug, Clone, PartialEq, Default)]
pub struct OriginEscrowVault {
    frozen_balances: BTreeMap<String, u64>,
}

impl OriginEscrowVault {
    pub fn record_frozen_origin_balance(&mut self, currency_code: &str, amount: u64) {
        self.frozen_balances.insert(currency_code.to_string(), amount);
    }

    pub fn frozen_balance_of(&self, currency_code: &str) -> u64 {
        self.frozen_balances.get(currency_code).copied().unwrap_or(0)
    }

    pub fn export_for_target_world(&self) -> ZeroImportedCurrency {
        ZeroImportedCurrency::new()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct VirtualAvatarCharacter {
    pub s2_did: S2Did,
    pub display_name: String,
    pub origin_world_suns: String,
    pub modality: AvatarVisualModality,
    pub skin_uri: String,
    pub apparel_sockets: BTreeMap<String, String>,
    pub equipped_weapons: Vec<String>,
    pub backpack_items: BTreeMap<String, u32>,
    pub certified_tier1_xp: u64,
    pub sandbox_tier3_xp: u64,
    pub hp_current: f64,
    pub hp_max: f64,
    pub energy_current: f64,
    pub energy_max: f64,
    pub power_vector: NormalizedPowerVector,
    pub origin_skills: Vec<SkillDescriptor>,
    pub hybrid_skills: Vec<HybridResonanceSkill>,
    pub guild_name: Option<String>,
    pub honor_badges: Vec<String>,
    pub origin_vault: OriginEscrowVault,
}

impl VirtualAvatarCharacter {
    /// Effective level computed solely from certified XP when entering `Tier-1` competitive worlds,
    /// or combined XP when playing in `Tier-3` single-player sandboxes.
    pub fn effective_genesis_level(&self, include_sandbox_xp: bool) -> u32 {
        let xp = if include_sandbox_xp {
            self.certified_tier1_xp.saturating_add(self.sandbox_tier3_xp)
        } else {
            self.certified_tier1_xp
        };
        (1 + ((xp as f64 / 500.0).sqrt() as u32)).min(120)
    }

    /// Divergent Module 07: Deterministic Cross-World Skill Resonance Alchemist.
    pub fn synthesize_resonance_skill(
        &mut self,
        origin_skill_id: &str,
        host_world_law_tag: &str,
    ) -> Option<HybridResonanceSkill> {
        let base = self.origin_skills.iter().find(|s| s.skill_id == origin_skill_id)?;
        let recipe_key = format!("{}::{}::{:?}", base.skill_id, host_world_law_tag, base.primitive);
        let mut h: u64 = 0xcbf29ce484222325;
        for b in recipe_key.bytes() {
            h ^= b as u64;
            h = h.wrapping_mul(0x100000001b3);
        }
        let recipe_hash = format!("RES-{:016X}", h);
        if let Some(existing) = self.hybrid_skills.iter().find(|s| s.recipe_hash == recipe_hash) {
            return Some(existing.clone());
        }

        let (fusion_name, combined_prim) = match (base.primitive, host_world_law_tag) {
            (ActionPrimitive::VoxelConstruct, "ROMAN_SIEGE_LAW") => (
                "红石机械龟甲筑城术".to_string(),
                ActionPrimitive::ProtectiveShield,
            ),
            (ActionPrimitive::ProtectiveShield, "MOBA_CANYON_LAW") => (
                "圣光裁决·主宰先锋圣盾".to_string(),
                ActionPrimitive::AoeDomainField,
            ),
            (ActionPrimitive::AcousticWaveScan, "TACTICAL_CQB_LAW") => (
                "硅基全息声纹透视脉冲".to_string(),
                ActionPrimitive::AcousticWaveScan,
            ),
            _ => (
                format!("跨界共鸣·{}×{}", base.display_name, host_world_law_tag),
                base.primitive,
            ),
        };

        let hybrid = HybridResonanceSkill {
            recipe_hash,
            name: fusion_name,
            origin_skill_id: base.skill_id.clone(),
            host_world_law_tag: host_world_law_tag.to_string(),
            combined_primitive: combined_prim,
            power_coeff: 1.25,
        };
        self.hybrid_skills.push(hybrid.clone());
        Some(hybrid)
    }
}
