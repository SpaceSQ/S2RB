//! Universal Game Ontology v2.0 (`UGO v2.0`)
//! Translates cross-world items across genres via a 3-Tier Graceful Degradation Ladder:
//! Tier A (Native World Mechanic) -> Tier B (Bounded Passive Affix) -> Tier C (Zero-Stat Cosmetic Charm).

use s2rb_bridge_core::BackpackPolicy;
use std::collections::{BTreeMap, BTreeSet};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemRarity {
    Common,
    Rare,
    Epic,
    Legendary,
    MythicGenesis,
}

#[derive(Debug, Clone, PartialEq)]
pub struct UgoItemSpec {
    pub ugo_id: String,
    pub display_name: String,
    pub origin_world_suns: String,
    pub rarity: ItemRarity,
    pub unit_volume_liters: f64,
    pub material_tags: Vec<String>,
    pub functional_primitives: Vec<String>,
    pub passive_affix_fallback: String,
    pub cosmetic_charm_fallback: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct HostItemCapabilityProfile {
    pub backpack_policy: BackpackPolicy,
    pub supported_primitives: BTreeSet<String>,
    pub allow_passive_affixes: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemDegradationTier {
    /// Full interactive item mechanic spawned in host world (e.g. 1m3 Obsidian barrier in UE5 Rome)
    TierANativeMechanic,
    /// Converted to bounded passive stat/utility talisman (e.g. +15% blast resist in Action RPG)
    TierBPassiveAffix,
    /// Zero-stat high-prestige weapon charm / emblem in strict competitive PvP (CS2 / HOK)
    TierCCosmeticCharmOnly,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct TranslatedHostItem {
    pub ugo_id: String,
    pub tier: ItemDegradationTier,
    pub matched_primitive: Option<String>,
    pub active_effect_description: String,
    pub gameplay_stat_bonus_active: bool,
}

pub struct UgoSemanticRegistry {
    specs: BTreeMap<String, UgoItemSpec>,
}

impl Default for UgoSemanticRegistry {
    fn default() -> Self {
        Self::with_canonical_seed_catalog()
    }
}

impl UgoSemanticRegistry {
    pub fn with_canonical_seed_catalog() -> Self {
        let mut reg = Self {
            specs: BTreeMap::new(),
        };
        reg.register(UgoItemSpec {
            ugo_id: "MAT_OBSIDIAN_BLOCK".to_string(),
            display_name: "黑曜石方块 (Minecraft)".to_string(),
            origin_world_suns: "GAME-EA-101-MINECRAFT2-008-2".to_string(),
            rarity: ItemRarity::Epic,
            unit_volume_liters: 4.0,
            material_tags: vec!["VOLCANIC_GLASS".to_string(), "HIGH_HARDNESS".to_string()],
            functional_primitives: vec!["PLACEABLE_BARRIER_1M3".to_string(), "BLAST_SHIELD".to_string()],
            passive_affix_fallback: "火山黑曜护符：爆炸与火焰冲击减免 +15%".to_string(),
            cosmetic_charm_fallback: "微缩黑曜石棱镜枪饰 / 泉水徽记 (0数值公平外观)".to_string(),
        });
        reg.register(UgoItemSpec {
            ugo_id: "CONS_ENCHANTED_GOLDEN_APPLE".to_string(),
            display_name: "附魔金苹果".to_string(),
            origin_world_suns: "GAME-EA-101-MINECRAFT2-008-2".to_string(),
            rarity: ItemRarity::Legendary,
            unit_volume_liters: 0.5,
            material_tags: vec!["AURUM_ORGANIC".to_string()],
            functional_primitives: vec!["INSTANT_ABSORPTION_SHIELD".to_string(), "VITAL_REGEN_BURST".to_string()],
            passive_affix_fallback: "黄金生机共鸣：脱战每秒生命恢复 +1.2%".to_string(),
            cosmetic_charm_fallback: "流光金苹果武器挂件 (0数值公平外观)".to_string(),
        });
        reg.register(UgoItemSpec {
            ugo_id: "REL_TAOHUAYUAN_SPIRIT_JADE".to_string(),
            display_name: "桃花源定气桃花玉佩".to_string(),
            origin_world_suns: "META-CN-001-TAOHUAYUAN2-001-2".to_string(),
            rarity: ItemRarity::MythicGenesis,
            unit_volume_liters: 0.2,
            material_tags: vec!["TAOYUAN_JADE".to_string(), "NFC_SOVEREIGN_SEAL".to_string()],
            functional_primitives: vec!["SANCTUARY_AURA_CALM".to_string(), "ACOUSTIC_CLARITY".to_string()],
            passive_affix_fallback: "桃源清心印：技能冷却热耗散效率 +8%".to_string(),
            cosmetic_charm_fallback: "东方赛博桃花玉步枪挂穗 / 腰间玉佩 (0数值公平外观)".to_string(),
        });
        reg
    }

    pub fn register(&mut self, spec: UgoItemSpec) {
        self.specs.insert(spec.ugo_id.clone(), spec);
    }

    pub fn get(&self, ugo_id: &str) -> Option<&UgoItemSpec> {
        self.specs.get(ugo_id)
    }

    pub fn translate_for_host(
        &self,
        ugo_id: &str,
        host_cap: &HostItemCapabilityProfile,
    ) -> Result<TranslatedHostItem, String> {
        let spec = self
            .specs
            .get(ugo_id)
            .ok_or_else(|| format!("Unknown UGO item id: {}", ugo_id))?;

        if host_cap.backpack_policy == BackpackPolicy::ActiveUse {
            if let Some(matched) = spec
                .functional_primitives
                .iter()
                .find(|p| host_cap.supported_primitives.contains(*p))
            {
                return Ok(TranslatedHostItem {
                    ugo_id: spec.ugo_id.clone(),
                    tier: ItemDegradationTier::TierANativeMechanic,
                    matched_primitive: Some(matched.clone()),
                    active_effect_description: format!(
                        "原生机制激活 [{}]：完整释放 {} 实体交互效果",
                        matched, spec.display_name
                    ),
                    gameplay_stat_bonus_active: true,
                });
            }
            if host_cap.allow_passive_affixes {
                return Ok(TranslatedHostItem {
                    ugo_id: spec.ugo_id.clone(),
                    tier: ItemDegradationTier::TierBPassiveAffix,
                    matched_primitive: None,
                    active_effect_description: spec.passive_affix_fallback.clone(),
                    gameplay_stat_bonus_active: true,
                });
            }
        }

        // Fallback Tier C: Competitive PvP safe cosmetic charm
        Ok(TranslatedHostItem {
            ugo_id: spec.ugo_id.clone(),
            tier: ItemDegradationTier::TierCCosmeticCharmOnly,
            matched_primitive: None,
            active_effect_description: spec.cosmetic_charm_fallback.clone(),
            gameplay_stat_bonus_active: false,
        })
    }
}
