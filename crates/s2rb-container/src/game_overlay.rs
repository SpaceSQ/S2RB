//! Superimposed Game Functional Attributes derived from the 14 Space2 Spatial Elements
//! plus Divergent Module 04: Dual-Layer Container-to-Body Anti-Overflow Damage Sanitizer.

use s2rb_protocol::{ElementCode, FourteenElementsState};

#[derive(Debug, Clone, PartialEq)]
pub struct SpaceGameOverlay {
    /// E01_LUMINA -> Flashbang / blind duration reduction `[0.0 .. 0.65]`
    pub optical_flash_resist: f64,
    /// E01_LUMINA -> Mandatory Law 2 prism rim visibility roughness (`>= 5.0%`)
    pub prism_rim_roughness_pct: f64,
    /// E02_ATMOS -> Remaining closed-loop breathable oxygen in seconds (`0 .. 360s`)
    pub o2_reserve_seconds: f64,
    /// E03_ACOUSTIC -> Companion AI acoustic footstep radar radius in meters
    pub acoustic_radar_radius_m: f64,
    /// E03_ACOUSTIC -> Footstep sound dampening stealth factor `[0.0 .. 0.80]`
    pub stealth_sound_dampening: f64,
    /// E04_THERMAL -> Skill cooldown thermal dissipation multiplier `[0.70 .. 1.35]`
    pub cooldown_dissipation_mult: f64,
    /// E05_MOMENTUM -> Knockback & stagger poise rating `[0.0 .. 100.0]`
    pub poise_tenacity_score: f64,
    /// E06_METABOLIC -> Mana / Energy / Stamina regeneration multiplier
    pub energy_regen_mult: f64,
    /// E08_WAVE -> Fog-of-war mini-map scan radius in meters
    pub wave_minimap_sense_m: f64,
    /// E09_ODOR -> Bio-toxin / miasma corrosion immunity `[0.0 .. 1.0]`
    pub toxin_immunity_ratio: f64,
    /// E10_VIBRATION -> 9.6m3 spatial protective shield structural integrity `[0.0 .. 100.0]`
    pub container_shield_integrity: f64,
    /// E11_HYDRO_NUTRIENT -> Passive out-of-combat HP recovery per second (% of max HP)
    pub passive_vital_regen_pct_per_sec: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct DamageSanitizeResult {
    pub raw_incoming_damage: f64,
    pub sanitized_valid_number: bool,
    pub absorbed_by_container_shield: f64,
    pub net_avatar_hp_loss: f64,
    pub overflow_clamped: bool,
}

impl SpaceGameOverlay {
    pub fn compute_from_14d(state: &FourteenElementsState, armor_poise_bonus: f64) -> Self {
        let e01 = state.get(ElementCode::E01Lumina);
        let e02 = state.get(ElementCode::E02Atmos);
        let e03 = state.get(ElementCode::E03Acoustic);
        let e04 = state.get(ElementCode::E04Thermal);
        let e05 = state.get(ElementCode::E05Momentum);
        let e06 = state.get(ElementCode::E06Metabolic);
        let e08 = state.get(ElementCode::E08Wave);
        let e09 = state.get(ElementCode::E09Odor);
        let e10 = state.get(ElementCode::E10Vibration);
        let e11 = state.get(ElementCode::E11HydroNutrient);

        Self {
            optical_flash_resist: (e01 * 0.45).clamp(0.0, 0.65),
            prism_rim_roughness_pct: 5.5, // Strictly >= 5.0% per Silicon Law 2
            o2_reserve_seconds: (e02 * 360.0).clamp(0.0, 360.0),
            acoustic_radar_radius_m: 8.0 + e03 * 22.0,
            stealth_sound_dampening: (e03 * 0.55).clamp(0.0, 0.80),
            cooldown_dissipation_mult: (0.75 + e04 * 0.50).clamp(0.70, 1.35),
            poise_tenacity_score: (e05 * 70.0 + armor_poise_bonus).clamp(0.0, 100.0),
            energy_regen_mult: (0.50 + e06 * 0.90).clamp(0.30, 1.60),
            wave_minimap_sense_m: 12.0 + e08 * 28.0,
            toxin_immunity_ratio: (e09 * 0.85).clamp(0.0, 1.0),
            container_shield_integrity: (e10 * 100.0).clamp(0.0, 100.0),
            passive_vital_regen_pct_per_sec: (e11 * 1.8).clamp(0.1, 2.5),
        }
    }

    /// Divergent Module 04: Protects persistent character state from bugged/malicious host-engine
    /// `NaN`, `Infinity`, negative heal exploits, or `999,999,999` one-shot integer overflows.
    pub fn sanitize_and_absorb_damage(
        &mut self,
        raw_host_damage: f64,
        avatar_max_hp: f64,
        max_single_hit_cap_pct: f64, // e.g., 0.65 = max 65% of MaxHP in one frame
        emergency_recall_active: bool,
    ) -> DamageSanitizeResult {
        if emergency_recall_active {
            return DamageSanitizeResult {
                raw_incoming_damage: raw_host_damage,
                sanitized_valid_number: raw_host_damage.is_finite(),
                absorbed_by_container_shield: raw_host_damage.max(0.0),
                net_avatar_hp_loss: 0.0,
                overflow_clamped: true,
            };
        }

        if !raw_host_damage.is_finite() || raw_host_damage <= 0.0 {
            return DamageSanitizeResult {
                raw_incoming_damage: raw_host_damage,
                sanitized_valid_number: false,
                absorbed_by_container_shield: 0.0,
                net_avatar_hp_loss: 0.0,
                overflow_clamped: false,
            };
        }

        let safe_max_hp = avatar_max_hp.max(1.0);
        let cap = safe_max_hp * max_single_hit_cap_pct.clamp(0.05, 1.0);
        let overflow_clamped = raw_host_damage > cap;
        let clamped_dmg = raw_host_damage.min(cap);

        // E10_VIBRATION envelope absorbs 20% of incoming kinetic/elemental shock while integrity > 10
        let shield_absorb = if self.container_shield_integrity > 10.0 {
            let absorb = clamped_dmg * 0.20;
            self.container_shield_integrity = (self.container_shield_integrity - 2.5).max(0.0);
            absorb
        } else {
            0.0
        };

        DamageSanitizeResult {
            raw_incoming_damage: raw_host_damage,
            sanitized_valid_number: true,
            absorbed_by_container_shield: shield_absorb,
            net_avatar_hp_loss: (clamped_dmg - shield_absorb).max(0.0),
            overflow_clamped,
        }
    }
}
