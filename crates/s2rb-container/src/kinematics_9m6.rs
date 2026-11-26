//! `2.0m x 2.0m x 2.4m = 9.6 m3` 6-DoF Intra-Container Kinematics, Stealth Visibility State Machine,
//! and `@ dOmega` Slab-Method Boundary-Crossing Ray/Projectile Intersection Solver.

pub const CONTAINER_WIDTH_M: f64 = 2.0;
pub const CONTAINER_DEPTH_M: f64 = 2.0;
pub const CONTAINER_HEIGHT_M: f64 = 2.4;
pub const CONTAINER_VOLUME_M3: f64 = 9.6;

pub const MIN_BOUNDS_M: [f64; 3] = [-1.0, -1.0, 0.0];
pub const MAX_BOUNDS_M: [f64; 3] = [1.0, 1.0, 2.4];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PostureState {
    Standing,
    TacticalCrouch,
    ProneDodge,
    AirborneHover,
    ArkMeditating,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EnvelopeVisibilityMode {
    /// 2.5-3.0s arrival/extraction prism beam (`opacity = 0.92`)
    CeremonyVisible,
    /// Default normal in-game mode: container shell completely invisible (`opacity = 0.0`, 0 shell draw calls)
    StealthGameplayInvisible,
    /// User pressed `Alt+R` to open 3D backpack or inspect 14 elements (`opacity = 0.35`)
    UserInspectOverlay,
    /// Backend GM audit, environmental hazard shield trigger, or 3ms emergency recall (`opacity = 0.85`)
    SystemTelemetryWakeup,
}

impl EnvelopeVisibilityMode {
    pub fn shell_opacity(&self) -> f64 {
        match self {
            Self::CeremonyVisible => 0.92,
            Self::StealthGameplayInvisible => 0.0,
            Self::UserInspectOverlay => 0.35,
            Self::SystemTelemetryWakeup => 0.85,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContainerFace {
    PosXRight,
    NegXLeft,
    PosYForward,
    NegYBack,
    PosZCeiling,
    NegZFloor,
}

/// Emitted at the exact millisecond a long-range projectile, beam, or AoE wave crosses `dOmega_9.6m3`
/// so Module 3 (`S2-Renderer`) & the host game engine can spawn native external ballistics/VFX.
#[derive(Debug, Clone, PartialEq)]
pub struct BoundaryExitEvent {
    pub skill_or_weapon_id: String,
    pub exit_point_local_m: [f64; 3],
    pub exit_point_world_m: [f64; 3],
    pub direction_unit_vec: [f64; 3],
    pub exit_face: ContainerFace,
    pub remaining_range_m: f64,
    pub target_aoe_radius_m: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct IntraPodKinematics {
    pub world_anchor_pos_m: [f64; 3],
    pub world_yaw_rad: f64,
    pub avatar_local_offset_m: [f64; 3],
    pub posture: PostureState,
    pub visibility_mode: EnvelopeVisibilityMode,
    pub companion_orbit_angle_rad: f64,
}

impl Default for IntraPodKinematics {
    fn default() -> Self {
        Self {
            world_anchor_pos_m: [0.0, 0.0, 0.0],
            world_yaw_rad: 0.0,
            avatar_local_offset_m: [0.0, 0.0, 0.0],
            posture: PostureState::Standing,
            visibility_mode: EnvelopeVisibilityMode::StealthGameplayInvisible,
            companion_orbit_angle_rad: 0.0,
        }
    }
}

impl IntraPodKinematics {
    pub fn is_point_strictly_inside_9m6(p_local_m: [f64; 3]) -> bool {
        p_local_m[0] >= MIN_BOUNDS_M[0]
            && p_local_m[0] <= MAX_BOUNDS_M[0]
            && p_local_m[1] >= MIN_BOUNDS_M[1]
            && p_local_m[1] <= MAX_BOUNDS_M[1]
            && p_local_m[2] >= MIN_BOUNDS_M[2]
            && p_local_m[2] <= MAX_BOUNDS_M[2]
    }

    /// Clamps any local body/cape/aura coordinate strictly inside the `2.0m x 2.0m x 2.4m` box.
    pub fn clamp_to_9m6(p_local_m: [f64; 3]) -> [f64; 3] {
        [
            p_local_m[0].clamp(MIN_BOUNDS_M[0], MAX_BOUNDS_M[0]),
            p_local_m[1].clamp(MIN_BOUNDS_M[1], MAX_BOUNDS_M[1]),
            p_local_m[2].clamp(MIN_BOUNDS_M[2], MAX_BOUNDS_M[2]),
        ]
    }

    /// Returns the Class-V companion AI's orbital position inside the upper shoulder quadrant (`r=0.70m, z=1.65m`).
    pub fn companion_local_position_m(&self) -> [f64; 3] {
        let r = 0.70;
        [
            self.companion_orbit_angle_rad.cos() * r,
            self.companion_orbit_angle_rad.sin() * r,
            1.65,
        ]
    }

    /// Divergent Module 05: Kay-Kajiya Slab AABB exit solver.
    /// Given an action/projectile launched from `origin_local_m` inside `9.6 m3` along `velocity_vec_m`
    /// with total `max_range_m`, returns `Some(BoundaryExitEvent)` if and only if the trajectory exits `9.6 m3`.
    pub fn solve_boundary_exit(
        &self,
        skill_or_weapon_id: &str,
        origin_local_m: [f64; 3],
        direction_vec: [f64; 3],
        max_range_m: f64,
        target_aoe_radius_m: f64,
    ) -> Option<BoundaryExitEvent> {
        let len = (direction_vec[0].powi(2) + direction_vec[1].powi(2) + direction_vec[2].powi(2)).sqrt();
        if len < 1e-9 || !Self::is_point_strictly_inside_9m6(origin_local_m) {
            return None;
        }
        let dir = [direction_vec[0] / len, direction_vec[1] / len, direction_vec[2] / len];

        let mut t_exit = f64::INFINITY;
        let mut exit_face = ContainerFace::PosYForward;

        let faces = [
            (0, MAX_BOUNDS_M[0], ContainerFace::PosXRight),
            (0, MIN_BOUNDS_M[0], ContainerFace::NegXLeft),
            (1, MAX_BOUNDS_M[1], ContainerFace::PosYForward),
            (1, MIN_BOUNDS_M[1], ContainerFace::NegYBack),
            (2, MAX_BOUNDS_M[2], ContainerFace::PosZCeiling),
            (2, MIN_BOUNDS_M[2], ContainerFace::NegZFloor),
        ];

        for (axis, bound, face) in faces {
            let d = dir[axis];
            if d.abs() > 1e-9 {
                let t = (bound - origin_local_m[axis]) / d;
                if t > 0.0 && t < t_exit {
                    t_exit = t;
                    exit_face = face;
                }
            }
        }

        // If max_range_m stays completely within 9.6m3 (e.g. a 0.6m short dagger slash) and AoE <= 1.0m, no handoff needed
        if max_range_m <= t_exit && target_aoe_radius_m <= 1.0 {
            return None;
        }

        let p_exit_local = [
            (origin_local_m[0] + dir[0] * t_exit).clamp(MIN_BOUNDS_M[0], MAX_BOUNDS_M[0]),
            (origin_local_m[1] + dir[1] * t_exit).clamp(MIN_BOUNDS_M[1], MAX_BOUNDS_M[1]),
            (origin_local_m[2] + dir[2] * t_exit).clamp(MIN_BOUNDS_M[2], MAX_BOUNDS_M[2]),
        ];

        let cos_y = self.world_yaw_rad.cos();
        let sin_y = self.world_yaw_rad.sin();
        let p_exit_world = [
            self.world_anchor_pos_m[0] + p_exit_local[0] * cos_y - p_exit_local[1] * sin_y,
            self.world_anchor_pos_m[1] + p_exit_local[0] * sin_y + p_exit_local[1] * cos_y,
            self.world_anchor_pos_m[2] + p_exit_local[2],
        ];

        Some(BoundaryExitEvent {
            skill_or_weapon_id: skill_or_weapon_id.to_string(),
            exit_point_local_m: p_exit_local,
            exit_point_world_m: p_exit_world,
            direction_unit_vec: dir,
            exit_face,
            remaining_range_m: (max_range_m - t_exit).max(0.0),
            target_aoe_radius_m,
        })
    }
}
