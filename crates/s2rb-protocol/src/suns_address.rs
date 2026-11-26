//! CD-U6A / S2-SUNS 6-Segment Universal Spatial Addressing & Cross-Engine Coordinate Adapter

pub const GENESIS_HUB_ADDRESS: &str = "META-CN-001-TAOHUAYUAN2-001-2";
pub const GENESIS_LANDMARK_CODE: &str = "TC-001-ARCH";

pub const VALID_L1_ROOTS: [&str; 10] = [
    "FILM", "MARS", "META", "MYTH", "ACGN", "GAME", "PHYS", "MOON", "STAR", "ZERO",
];

pub const VALID_L2_SECTORS: [&str; 9] = [
    "CN", "EA", "WA", "NA", "SA", "NE", "NW", "SE", "SW",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AddressError {
    WrongSegmentCount(usize),
    InvalidL1Root(String),
    InvalidL2Sector(String),
    InvalidL3Grid(String),
    InvalidL4Sovereign(String),
    InvalidL5Instance(String),
    InvalidL6Berth(String),
}

/// `[L1]-[L2]-[L3]-[L4][C]-[L5]-[L6]` covering 81 Quadrillion (`8.1e16`) micro-berths.
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SunsAddress {
    pub l1_root: String,
    pub l2_sector: String,
    pub l3_grid: u16,
    pub l4_sovereign: String,
    pub l4_check_digit: u8,
    pub l5_room: u32,
    pub l6_berth: u8,
}

impl SunsAddress {
    pub fn genesis_taohuayuan_plaza() -> Self {
        Self::parse(GENESIS_HUB_ADDRESS).expect("Genesis Hub constant is valid")
    }

    pub fn parse(raw: &str) -> Result<Self, AddressError> {
        let up = raw.trim().to_ascii_uppercase();
        let parts: Vec<&str> = up.split('-').collect();
        if parts.len() != 6 {
            return Err(AddressError::WrongSegmentCount(parts.len()));
        }
        if !VALID_L1_ROOTS.contains(&parts[0]) {
            return Err(AddressError::InvalidL1Root(parts[0].to_string()));
        }
        if !VALID_L2_SECTORS.contains(&parts[1]) {
            return Err(AddressError::InvalidL2Sector(parts[1].to_string()));
        }
        if parts[2].len() != 3 || !parts[2].chars().all(|c| c.is_ascii_digit()) {
            return Err(AddressError::InvalidL3Grid(parts[2].to_string()));
        }
        let l3: u16 = parts[2].parse().map_err(|_| AddressError::InvalidL3Grid(parts[2].to_string()))?;
        if l3 == 0 || l3 > 999 {
            return Err(AddressError::InvalidL3Grid(parts[2].to_string()));
        }

        let p3 = parts[3];
        if p3.len() < 3 {
            return Err(AddressError::InvalidL4Sovereign(p3.to_string()));
        }
        let (sov, chk_str) = p3.split_at(p3.len() - 1);
        if !sov.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(AddressError::InvalidL4Sovereign(p3.to_string()));
        }
        let chk: u8 = chk_str.parse().map_err(|_| AddressError::InvalidL4Sovereign(p3.to_string()))?;

        let l5: u32 = parts[4].parse().map_err(|_| AddressError::InvalidL5Instance(parts[4].to_string()))?;
        if l5 == 0 || l5 > 99_999 {
            return Err(AddressError::InvalidL5Instance(parts[4].to_string()));
        }

        let l6: u8 = parts[5].parse().map_err(|_| AddressError::InvalidL6Berth(parts[5].to_string()))?;
        if !(2..=9).contains(&l6) {
            return Err(AddressError::InvalidL6Berth(parts[5].to_string()));
        }

        Ok(Self {
            l1_root: parts[0].to_string(),
            l2_sector: parts[1].to_string(),
            l3_grid: l3,
            l4_sovereign: sov.to_string(),
            l4_check_digit: chk,
            l5_room: l5,
            l6_berth: l6,
        })
    }

    pub fn is_public_sovereign_commons(&self) -> bool {
        self.l2_sector == "CN" && (1..=9).contains(&self.l3_grid)
    }

    pub fn to_canonical_string(&self) -> String {
        format!(
            "{}-{}-{:03}-{}{}-{:03}-{}",
            self.l1_root,
            self.l2_sector,
            self.l3_grid,
            self.l4_sovereign,
            self.l4_check_digit,
            self.l5_room,
            self.l6_berth
        )
    }
}

/// Divergent Module 02: Engine Coordinate Handedness, Axis & Scale Conventions.
/// Canonical S2-Container space is Right-Handed, `+X` Right, `+Y` Forward, `+Z` Up (`[0, 2.4m]`), in Meters.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CoordinateConvention {
    /// Canonical S2 Container (`Right-Handed, +X Right, +Y Forward, +Z Up`, 1 unit = 1.0 m)
    S2CanonicalRightZUpMeters,
    /// Unreal Engine 5 (`Left-Handed, +X Forward, +Y Right, +Z Up`, 1 unit = 0.01 m / 1 cm)
    UnrealLeftZUpCentimeters,
    /// Unity (`Left-Handed, +X Right, +Y Up, +Z Forward`, 1 unit = 1.0 m)
    UnityLeftYUpMeters,
    /// Godot 4 / glTF 2.0 / WebGPU (`Right-Handed, +X Right, +Y Up, -Z Forward`, 1 unit = 1.0 m)
    GltfRightYUpMeters,
    /// Source 2 (`Right-Handed Z-Up, 1 Hammer inch unit = 0.0254 m`)
    Source2RightZUpInches,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct EngineBasisTransform {
    pub convention: CoordinateConvention,
    pub host_avatar_scale: f64,
    pub host_gravity_mps2: f64,
}

impl EngineBasisTransform {
    pub fn for_engine(convention: CoordinateConvention) -> Self {
        Self {
            convention,
            host_avatar_scale: 1.0,
            host_gravity_mps2: 9.80665,
        }
    }

    /// Maps a local S2-Container point `(x, y, z)` in meters (`[-1,1] x [-1,1] x [0,2.4]`)
    /// into target host engine coordinates without flipping winding order unexpectedly.
    pub fn container_to_host_point(&self, p_s2_m: [f64; 3]) -> [f64; 3] {
        let s = self.host_avatar_scale;
        let [x, y, z] = [p_s2_m[0] * s, p_s2_m[1] * s, p_s2_m[2] * s];
        match self.convention {
            CoordinateConvention::S2CanonicalRightZUpMeters => [x, y, z],
            CoordinateConvention::UnrealLeftZUpCentimeters => [y * 100.0, x * 100.0, z * 100.0],
            CoordinateConvention::UnityLeftYUpMeters => [x, z, y],
            CoordinateConvention::GltfRightYUpMeters => [x, z, -y],
            CoordinateConvention::Source2RightZUpInches => [x / 0.0254, y / 0.0254, z / 0.0254],
        }
    }

    /// Inverse mapping from host engine local offset back into S2-Container meters.
    pub fn host_to_container_point(&self, p_host: [f64; 3]) -> [f64; 3] {
        let s = if self.host_avatar_scale.abs() < 1e-9 { 1.0 } else { self.host_avatar_scale };
        let [hx, hy, hz] = p_host;
        let unscaled = match self.convention {
            CoordinateConvention::S2CanonicalRightZUpMeters => [hx, hy, hz],
            CoordinateConvention::UnrealLeftZUpCentimeters => [hy * 0.01, hx * 0.01, hz * 0.01],
            CoordinateConvention::UnityLeftYUpMeters => [hx, hz, hy],
            CoordinateConvention::GltfRightYUpMeters => [hx, -hz, hy],
            CoordinateConvention::Source2RightZUpInches => [hx * 0.0254, hy * 0.0254, hz * 0.0254],
        };
        [unscaled[0] / s, unscaled[1] / s, unscaled[2] / s]
    }
}
