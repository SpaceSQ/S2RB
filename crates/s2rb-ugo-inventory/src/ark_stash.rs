//! Two-Tier Spatial Inventory:
//! - Tier 1: `9.6 m3` Active Pod Backpack (`max 36 slots`, `max 480.0 liters`)
//! - Tier 2: Local/Cloud Infinite Ark Mother-Stash (`方舟无限母库`)

use crate::ugo_ontology::UgoSemanticRegistry;
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PodBackpackLimits {
    pub max_slots: usize,
    pub max_volume_liters: f64,
}

impl Default for PodBackpackLimits {
    fn default() -> Self {
        Self {
            max_slots: 36,
            max_volume_liters: 480.0,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum StashError {
    UnknownItem(String),
    PodSlotLimitExceeded,
    PodVolumeLimitExceeded,
    InsufficientQuantity,
}

pub struct TwoTierSpatialInventory {
    pub limits: PodBackpackLimits,
    pub pod_backpack: BTreeMap<String, u32>,
    pub ark_mother_stash: BTreeMap<String, u64>,
}

impl Default for TwoTierSpatialInventory {
    fn default() -> Self {
        Self {
            limits: PodBackpackLimits::default(),
            pod_backpack: BTreeMap::new(),
            ark_mother_stash: BTreeMap::new(),
        }
    }
}

impl TwoTierSpatialInventory {
    pub fn current_pod_volume_liters(&self, registry: &UgoSemanticRegistry) -> f64 {
        self.pod_backpack
            .iter()
            .map(|(id, &qty)| {
                let unit_v = registry.get(id).map(|s| s.unit_volume_liters).unwrap_or(1.0);
                unit_v * (qty as f64)
            })
            .sum()
    }

    /// Deposits loot into the `9.6 m3` Pod Backpack if within `[36 slots, 480L]`,
    /// or automatically routes excess overflow into the Infinite Ark Mother-Stash!
    pub fn store_loot_with_auto_overflow(
        &mut self,
        ugo_id: &str,
        quantity: u32,
        registry: &UgoSemanticRegistry,
    ) -> Result<(u32, u32), StashError> {
        let spec = registry
            .get(ugo_id)
            .ok_or_else(|| StashError::UnknownItem(ugo_id.to_string()))?;

        let has_slot = self.pod_backpack.contains_key(ugo_id) || self.pod_backpack.len() < self.limits.max_slots;
        if !has_slot {
            *self.ark_mother_stash.entry(ugo_id.to_string()).or_insert(0) += quantity as u64;
            return Ok((0, quantity));
        }

        let used_vol = self.current_pod_volume_liters(registry);
        let avail_vol = (self.limits.max_volume_liters - used_vol).max(0.0);
        let fit_qty = if spec.unit_volume_liters <= 1e-6 {
            quantity
        } else {
            ((avail_vol / spec.unit_volume_liters).floor() as u32).min(quantity)
        };
        let overflow_qty = quantity - fit_qty;

        if fit_qty > 0 {
            *self.pod_backpack.entry(ugo_id.to_string()).or_insert(0) += fit_qty;
        }
        if overflow_qty > 0 {
            *self.ark_mother_stash.entry(ugo_id.to_string()).or_insert(0) += overflow_qty as u64;
        }
        Ok((fit_qty, overflow_qty))
    }

    pub fn transfer_pod_to_ark(&mut self, ugo_id: &str, qty: u32) -> Result<(), StashError> {
        let cur = self.pod_backpack.get(ugo_id).copied().unwrap_or(0);
        if qty == 0 || cur < qty {
            return Err(StashError::InsufficientQuantity);
        }
        if cur == qty {
            self.pod_backpack.remove(ugo_id);
        } else {
            self.pod_backpack.insert(ugo_id.to_string(), cur - qty);
        }
        *self.ark_mother_stash.entry(ugo_id.to_string()).or_insert(0) += qty as u64;
        Ok(())
    }
}
