//! Zero-Copy C99 Foreign Function Interface (`libs2rb_container`)
//! Allows UE5, Unity, Godot 4, and Source 2 host plugins to validate S2-DIDs,
//! enforce 9.6m3 bounds, and solve `dOmega` projectile boundary handoffs at `< 0.05ms`.

use crate::kinematics_9m6::{
    IntraPodKinematics, CONTAINER_DEPTH_M, CONTAINER_HEIGHT_M, CONTAINER_WIDTH_M,
};
use s2rb_protocol::ZeroImportedCurrency;

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct S2CabiEnvelopeSpec {
    pub width_m: f64,
    pub depth_m: f64,
    pub height_m: f64,
    pub imported_currency_locked_zero: f64,
    pub envelope_opacity: f64,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct S2CabiBoundaryExitResult {
    pub did_exit_boundary: i32,
    pub exit_point_local_m: [f64; 3],
    pub remaining_range_m: f64,
}

#[no_mangle]
pub extern "C" fn s2rb_cabi_default_envelope(stealth_gameplay: i32) -> S2CabiEnvelopeSpec {
    let zero_cur = ZeroImportedCurrency::new();
    S2CabiEnvelopeSpec {
        width_m: CONTAINER_WIDTH_M,
        depth_m: CONTAINER_DEPTH_M,
        height_m: CONTAINER_HEIGHT_M,
        imported_currency_locked_zero: zero_cur.amount_f64(),
        envelope_opacity: if stealth_gameplay != 0 { 0.0 } else { 0.92 },
    }
}

#[no_mangle]
pub extern "C" fn s2rb_cabi_solve_projectile_exit(
    ox: f64,
    oy: f64,
    oz: f64,
    dx: f64,
    dy: f64,
    dz: f64,
    max_range_m: f64,
) -> S2CabiBoundaryExitResult {
    let kin = IntraPodKinematics::default();
    match kin.solve_boundary_exit("CABI_PROJ", [ox, oy, oz], [dx, dy, dz], max_range_m, 0.0) {
        Some(ev) => S2CabiBoundaryExitResult {
            did_exit_boundary: 1,
            exit_point_local_m: ev.exit_point_local_m,
            remaining_range_m: ev.remaining_range_m,
        },
        None => S2CabiBoundaryExitResult {
            did_exit_boundary: 0,
            exit_point_local_m: [0.0, 0.0, 0.0],
            remaining_range_m: 0.0,
        },
    }
}
