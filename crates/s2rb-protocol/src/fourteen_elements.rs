//! Space2 Smart Space 14 Elements (`E01_LUMINA`..`E14_CARBON_SOVEREIGNTY`)
//! and Divergent Module 01: 14x14 Cross-Element Physical/Gameplay Coupling Solver.

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
#[repr(usize)]
pub enum ElementCode {
    // 6 Explicit Physical & Dynamic Tensors
    E01Lumina = 0,
    E02Atmos = 1,
    E03Acoustic = 2,
    E04Thermal = 3,
    E05Momentum = 4,
    E06Metabolic = 5,
    // 8 Implicit Bio-Sensory, Memory, Social & Sovereignty Tensors
    E07Biosensor = 6,
    E08Wave = 7,
    E09Odor = 8,
    E10Vibration = 9,
    E11HydroNutrient = 10,
    E12LogicMemory = 11,
    E13SocialTrust = 12,
    E14CarbonSovereignty = 13,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ElementGroup {
    ExplicitPhysicalDynamic,
    ImplicitBioCognitiveSovereign,
}

impl ElementCode {
    pub const ALL: [ElementCode; 14] = [
        Self::E01Lumina,
        Self::E02Atmos,
        Self::E03Acoustic,
        Self::E04Thermal,
        Self::E05Momentum,
        Self::E06Metabolic,
        Self::E07Biosensor,
        Self::E08Wave,
        Self::E09Odor,
        Self::E10Vibration,
        Self::E11HydroNutrient,
        Self::E12LogicMemory,
        Self::E13SocialTrust,
        Self::E14CarbonSovereignty,
    ];

    pub fn code_str(&self) -> &'static str {
        match self {
            Self::E01Lumina => "E01_LUMINA",
            Self::E02Atmos => "E02_ATMOS",
            Self::E03Acoustic => "E03_ACOUSTIC",
            Self::E04Thermal => "E04_THERMAL",
            Self::E05Momentum => "E05_MOMENTUM",
            Self::E06Metabolic => "E06_METABOLIC",
            Self::E07Biosensor => "E07_BIOSENSOR",
            Self::E08Wave => "E08_WAVE",
            Self::E09Odor => "E09_ODOR",
            Self::E10Vibration => "E10_VIBRATION",
            Self::E11HydroNutrient => "E11_HYDRO_NUTRIENT",
            Self::E12LogicMemory => "E12_LOGIC_MEMORY",
            Self::E13SocialTrust => "E13_SOCIAL_TRUST",
            Self::E14CarbonSovereignty => "E14_CARBON_SOVEREIGNTY",
        }
    }

    pub fn group(&self) -> ElementGroup {
        if (*self as usize) < 6 {
            ElementGroup::ExplicitPhysicalDynamic
        } else {
            ElementGroup::ImplicitBioCognitiveSovereign
        }
    }
}

/// Real-time 14-Element Spatial State inside the `2.0m x 2.0m x 2.4m` (`9.6 m3`) Container.
/// Each normalized axis lies in `[0.0, 1.0]` (`0.80` = ideal Taohuayuan homeostasis baseline),
/// accompanied by physical engineering readouts.
#[derive(Debug, Clone, PartialEq)]
pub struct FourteenElementsState {
    pub normalized_axes: [f64; 14],
    pub ambient_temp_celsius: f64,
    pub oxygen_partial_kpa: f64,
    pub illuminance_lux: f64,
    pub acoustic_db: f64,
    pub emergency_recall_latched: bool,
}

impl Default for FourteenElementsState {
    fn default() -> Self {
        Self::taohuayuan_homeostasis()
    }
}

impl FourteenElementsState {
    /// Ideal carbon-silicon homeostasis calibrated to Taohuayuan Ancient Town Plaza (`META-CN-001-TAOHUAYUAN2-001-2`).
    pub fn taohuayuan_homeostasis() -> Self {
        let mut axes = [0.85; 14];
        axes[ElementCode::E12LogicMemory as usize] = 1.0;
        axes[ElementCode::E13SocialTrust as usize] = 0.90;
        axes[ElementCode::E14CarbonSovereignty as usize] = 1.0;
        Self {
            normalized_axes: axes,
            ambient_temp_celsius: 22.5,
            oxygen_partial_kpa: 21.2,
            illuminance_lux: 480.0,
            acoustic_db: 42.0,
            emergency_recall_latched: false,
        }
    }

    pub fn get(&self, code: ElementCode) -> f64 {
        self.normalized_axes[code as usize]
    }

    /// Divergent Module 01: Advances one coupled spatial-physics tick (`dt_sec`) under external host environment stress.
    pub fn step_coupled_environment(
        &mut self,
        external_temp_c: f64,
        external_o2_kpa: f64,
        external_flash_lux: f64,
        thermal_insulation_factor: f64, // [0.0..0.95] from armor
        dt_sec: f64,
    ) {
        let dt = dt_sec.clamp(0.0, 60.0);
        let insul = thermal_insulation_factor.clamp(0.0, 0.95);

        // 1. E04_THERMAL relaxation toward external temperature damped by container thermal shield
        let leak_rate = (1.0 - insul) * 0.08 * dt;
        self.ambient_temp_celsius += (external_temp_c - self.ambient_temp_celsius) * leak_rate.min(1.0);
        let temp_deviation = (self.ambient_temp_celsius - 22.0).abs();
        self.normalized_axes[ElementCode::E04Thermal as usize] =
            (1.0 - temp_deviation / 80.0).clamp(0.05, 1.0);

        // 2. E02_ATMOS closed-loop micro-oxygen reserve (supports vacuum/underwater for ~360s)
        if external_o2_kpa < 14.0 {
            let o2_burn = 0.025 * dt;
            self.oxygen_partial_kpa = (self.oxygen_partial_kpa - o2_burn).max(0.0);
        } else {
            self.oxygen_partial_kpa = (self.oxygen_partial_kpa + 0.15 * dt).min(21.2);
        }
        self.normalized_axes[ElementCode::E02Atmos as usize] =
            (self.oxygen_partial_kpa / 21.2).clamp(0.0, 1.0);

        // 3. Cross-coupling: extreme thermal deviation drains E06_METABOLIC & slightly stiffens E05_MOMENTUM
        if temp_deviation > 15.0 {
            let stress = ((temp_deviation - 15.0) / 100.0) * dt * 0.12;
            self.normalized_axes[ElementCode::E06Metabolic as usize] =
                (self.normalized_axes[ElementCode::E06Metabolic as usize] - stress).clamp(0.05, 1.0);
            self.normalized_axes[ElementCode::E05Momentum as usize] =
                (self.normalized_axes[ElementCode::E05Momentum as usize] - stress * 0.5).clamp(0.20, 1.0);
        }

        // 4. Cross-coupling: severe hypoxia (< 8 kPa) degrades E07_BIOSENSOR vitality
        if self.oxygen_partial_kpa < 8.0 {
            let hypoxia_damage = ((8.0 - self.oxygen_partial_kpa) / 8.0) * 0.04 * dt;
            self.normalized_axes[ElementCode::E07Biosensor as usize] =
                (self.normalized_axes[ElementCode::E07Biosensor as usize] - hypoxia_damage).clamp(0.01, 1.0);
        }

        // 5. Optical flashbang / glare shock coupling on E01_LUMINA
        self.illuminance_lux = external_flash_lux.max(0.0);
        if external_flash_lux > 25_000.0 {
            self.normalized_axes[ElementCode::E01Lumina as usize] = 0.25;
        } else {
            self.normalized_axes[ElementCode::E01Lumina as usize] = 0.88;
        }

        // 6. Silicon Law 1 Emergency Recall Latch locks E10_VIBRATION shield to maximum 1.0
        if self.emergency_recall_latched {
            self.normalized_axes[ElementCode::E10Vibration as usize] = 1.0;
            self.normalized_axes[ElementCode::E14CarbonSovereignty as usize] = 1.0;
        }
    }
}
