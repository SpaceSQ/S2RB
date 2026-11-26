//! `@ dOmega_9.6m3` Extended Boundary-Crossing Effect Handoff Bus (`WP-04`)
//! Bridges `WP-02` (`IntraPodKinematics::solve_boundary_exit`) and `WP-03` (`AdmittedContainerProjection`)
//! to native Host Game Engine VFX & Physics Spawners!

use s2rb_bridge_core::AdmittedContainerProjection;
use s2rb_container::IntraPodKinematics;
use s2rb_protocol::{CoordinateConvention, EngineBasisTransform};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostVfxBackend {
    UnrealNiagara,
    UnityVfxGraph,
    GodotGpuParticles,
    Source2ParticleSystem,
    WebGpuComputeParticles,
}

#[derive(Debug, Clone, PartialEq)]
pub enum HostEffectArchetype {
    /// Short melee slash or personal shield (`<= 9.6 m3`): `0` host-world entities needed!
    ContainedInside9m6,
    /// Bullet, arrow, or ranged energy wave continuing outside `dOmega`
    ExternalBallisticProjectile {
        spawn_pos_host_units: [f64; 3],
        launch_dir_host: [f64; 3],
        speed_mps: f64,
        remaining_range_m: f64,
    },
    /// Wide-area ground aura/domain (`aoe_radius > 1.0m`): inner core stays in `9.6 m3`, outer ring `[1.0m..R]` spawns on host terrain
    ExternalAnnularGroundAoe {
        center_pos_host_units: [f64; 3],
        inner_clipped_radius_m: f64,
        outer_radius_m: f64,
        duration_sec: f64,
    },
    /// Long melee weapon (`length > 1.0m`) whose tip extends past `dOmega` during a thrust
    DualSegmentPolearmTipProxy {
        exit_hinge_host_units: [f64; 3],
        tip_pos_host_units: [f64; 3],
        overhang_length_m: f64,
    },
}

#[derive(Debug, Clone, PartialEq)]
pub struct HostEffectSpawnCommand {
    pub action_id: String,
    pub vfx_backend: HostVfxBackend,
    pub combat_damage_authorized: bool,
    pub archetype: HostEffectArchetype,
}

pub struct ExtendedEffectHandoffBus {
    pub basis: EngineBasisTransform,
    pub vfx_backend: HostVfxBackend,
    pending_commands: Vec<HostEffectSpawnCommand>,
}

impl ExtendedEffectHandoffBus {
    pub fn new(convention: CoordinateConvention, vfx_backend: HostVfxBackend) -> Self {
        Self {
            basis: EngineBasisTransform::for_engine(convention),
            vfx_backend,
            pending_commands: Vec::new(),
        }
    }

    /// Evaluates a combat/skill action launched inside the `9.6 m3` container and queues
    /// a host-engine handoff command if and only if the effect crosses `dOmega_9.6m3`.
    pub fn evaluate_and_dispatch(
        &mut self,
        action_id: &str,
        kinematics: &IntraPodKinematics,
        admission: &AdmittedContainerProjection,
        origin_local_m: [f64; 3],
        direction_local: [f64; 3],
        reach_or_range_m: f64,
        speed_mps: f64,
        aoe_radius_m: f64,
        is_melee_polearm: bool,
    ) -> HostEffectSpawnCommand {
        let combat_authorized = admission.combat_skills_enabled || admission.weapon_stats_active;

        // 1. Wide-area Ground AoE (`aoe_radius_m > 1.0m`, e.g. 5.0m Paladin Consecration)
        if aoe_radius_m > 1.0 && reach_or_range_m <= 1.0 {
            let center_host = self.basis.container_to_host_point(kinematics.world_anchor_pos_m);
            let cmd = HostEffectSpawnCommand {
                action_id: action_id.to_string(),
                vfx_backend: self.vfx_backend,
                combat_damage_authorized: combat_authorized,
                archetype: HostEffectArchetype::ExternalAnnularGroundAoe {
                    center_pos_host_units: center_host,
                    inner_clipped_radius_m: 1.0,
                    outer_radius_m: aoe_radius_m,
                    duration_sec: 6.0,
                },
            };
            self.pending_commands.push(cmd.clone());
            return cmd;
        }

        // 2. Ray-Box intersection against `[-1,1] x [-1,1] x [0,2.4]` m
        match kinematics.solve_boundary_exit(
            action_id,
            origin_local_m,
            direction_local,
            reach_or_range_m,
            aoe_radius_m,
        ) {
            None => HostEffectSpawnCommand {
                action_id: action_id.to_string(),
                vfx_backend: self.vfx_backend,
                combat_damage_authorized: combat_authorized,
                archetype: HostEffectArchetype::ContainedInside9m6,
            },
            Some(exit_ev) => {
                let spawn_host = self.basis.container_to_host_point(exit_ev.exit_point_world_m);
                let archetype = if is_melee_polearm {
                    let tip_world_m = [
                        exit_ev.exit_point_world_m[0] + exit_ev.direction_unit_vec[0] * exit_ev.remaining_range_m,
                        exit_ev.exit_point_world_m[1] + exit_ev.direction_unit_vec[1] * exit_ev.remaining_range_m,
                        exit_ev.exit_point_world_m[2] + exit_ev.direction_unit_vec[2] * exit_ev.remaining_range_m,
                    ];
                    HostEffectArchetype::DualSegmentPolearmTipProxy {
                        exit_hinge_host_units: spawn_host,
                        tip_pos_host_units: self.basis.container_to_host_point(tip_world_m),
                        overhang_length_m: exit_ev.remaining_range_m,
                    }
                } else {
                    let dir_host = self.basis.container_to_host_point(exit_ev.direction_unit_vec);
                    HostEffectArchetype::ExternalBallisticProjectile {
                        spawn_pos_host_units: spawn_host,
                        launch_dir_host: dir_host,
                        speed_mps,
                        remaining_range_m: exit_ev.remaining_range_m,
                    }
                };

                let cmd = HostEffectSpawnCommand {
                    action_id: action_id.to_string(),
                    vfx_backend: self.vfx_backend,
                    combat_damage_authorized: combat_authorized,
                    archetype,
                };
                self.pending_commands.push(cmd.clone());
                cmd
            }
        }
    }

    pub fn drain_pending_commands(&mut self) -> Vec<HostEffectSpawnCommand> {
        std::mem::take(&mut self.pending_commands)
    }
}
