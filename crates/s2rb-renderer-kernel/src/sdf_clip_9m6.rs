//! Exact 3D Signed Distance Field (`sd_box_9m6`) for the `2.0m x 2.0m x 2.4m = 9.6 m3` Smart Space.

pub const BOX_CENTER_M: [f64; 3] = [0.0, 0.0, 1.2];
pub const BOX_HALF_EXTENTS_M: [f64; 3] = [1.0, 1.0, 1.2];
pub const SOFT_FALLOFF_BAND_M: f64 = 0.08;
pub const MIN_PRISM_ROUGHNESS_PCT: f64 = 5.5;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct FragmentClipSample {
    pub sdf_distance_m: f64,
    pub discarded_outside_9m6: bool,
    pub boundary_alpha_weight: f64,
    pub prism_rim_intensity: f64,
}

/// Signed distance from `p_local_m` to the `[-1, 1] x [-1, 1] x [0, 2.4]` m container box.
/// Negative inside `9.6 m3`, `0.0` exactly on `dOmega`, strictly positive outside.
pub fn sd_box_9m6(p_local_m: [f64; 3]) -> f64 {
    let qx = (p_local_m[0] - BOX_CENTER_M[0]).abs() - BOX_HALF_EXTENTS_M[0];
    let qy = (p_local_m[1] - BOX_CENTER_M[1]).abs() - BOX_HALF_EXTENTS_M[1];
    let qz = (p_local_m[2] - BOX_CENTER_M[2]).abs() - BOX_HALF_EXTENTS_M[2];

    let ox = qx.max(0.0);
    let oy = qy.max(0.0);
    let oz = qz.max(0.0);
    let outside_len = (ox * ox + oy * oy + oz * oz).sqrt();
    let inside_dist = qx.max(qy.max(qz)).min(0.0);
    outside_len + inside_dist
}

fn smoothstep(edge0: f64, edge1: f64, x: f64) -> f64 {
    let t = ((x - edge0) / (edge1 - edge0)).clamp(0.0, 1.0);
    t * t * (3.0 - 2.0 * t)
}

/// Evaluates GPU primary-pass clipping rules for any avatar mesh, cape, or near-body aura point.
pub fn evaluate_primary_fragment_9m6(p_local_m: [f64; 3]) -> FragmentClipSample {
    let sdf = sd_box_9m6(p_local_m);
    if sdf > 0.0 {
        return FragmentClipSample {
            sdf_distance_m: sdf,
            discarded_outside_9m6: true,
            boundary_alpha_weight: 0.0,
            prism_rim_intensity: 0.0,
        };
    }
    // Smooth Hermite fade across outer 8cm skin [-0.08m .. 0.0m]
    let alpha_weight = smoothstep(0.0, -SOFT_FALLOFF_BAND_M, sdf);
    // Iridescent 2cm boundary rim highlight when an aura brushes against dOmega
    let rim = 1.0 - smoothstep(-0.02, 0.0, sdf);
    FragmentClipSample {
        sdf_distance_m: sdf,
        discarded_outside_9m6: false,
        boundary_alpha_weight: alpha_weight,
        prism_rim_intensity: 1.0 - rim,
    }
}
