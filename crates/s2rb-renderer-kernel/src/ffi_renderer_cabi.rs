//! Zero-Copy C99 ABI for `WP-04` (`libs2rb_renderer_kernel`)

use crate::sdf_clip_9m6::evaluate_primary_fragment_9m6;

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct S2CabiSdfSample {
    pub sdf_distance_m: f64,
    pub discarded_outside_9m6: i32,
    pub boundary_alpha_weight: f64,
    pub prism_rim_intensity: f64,
}

#[no_mangle]
pub extern "C" fn s2rb_renderer_eval_sdf_9m6(px_m: f64, py_m: f64, pz_m: f64) -> S2CabiSdfSample {
    let s = evaluate_primary_fragment_9m6([px_m, py_m, pz_m]);
    S2CabiSdfSample {
        sdf_distance_m: s.sdf_distance_m,
        discarded_outside_9m6: if s.discarded_outside_9m6 { 1 } else { 0 },
        boundary_alpha_weight: s.boundary_alpha_weight,
        prism_rim_intensity: s.prism_rim_intensity,
    }
}
