// S2RB v3.0 WP-04 WebGPU Shader: 2.0m x 2.0m x 2.4m (9.6m3) Hard SDF Clip & Stealth Envelope
struct S2PodUniforms {
    view_proj: mat4x4<f32>,
    pod_world_matrix: mat4x4<f32>,
    // x: shell_opacity (0.0 in stealth mode), y: prism_roughness (>=0.055), z: is_shell_pass (0 or 1), w: time_sec
    params: vec4<f32>,
};

@group(0) @binding(0) var<uniform> u_s2: S2PodUniforms;

struct VertexOut {
    @builtin(position) clip_pos: vec4<f32>,
    @location(0) local_pos_m: vec3<f32>,
    @location(1) base_color: vec4<f32>,
};

fn sd_box_9m6(p_local: vec3<f32>) -> f32 {
    let center = vec3<f32>(0.0, 0.0, 1.2);
    let half_extents = vec3<f32>(1.0, 1.0, 1.2);
    let q = abs(p_local - center) - half_extents;
    return length(max(q, vec3<f32>(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
    // 1. Stealth Envelope Culling: zero fragment write when shell is invisible in normal gameplay
    if (u_s2.params.z > 0.5 && u_s2.params.x <= 0.0001) {
        discard;
    }

    // 2. Hard 9.6m3 Bounding Volume Enforcement: zero pixel leakage outside [-1,1]x[-1,1]x[0,2.4] m
    let sdf = sd_box_9m6(in.local_pos_m);
    if (sdf > 0.0) {
        discard;
    }

    // 3. Smooth 8cm Hermite falloff + Silicon Law 2 (>=5.0%) Prism Rim Iridescence
    let edge_fade = smoothstep(0.0, -0.08, sdf);
    let rim_band = 1.0 - smoothstep(-0.025, 0.0, sdf);
    let prism_tint = vec3<f32>(
        0.5 + 0.5 * sin(u_s2.params.w * 3.0 + in.local_pos_m.z * 4.0),
        0.85,
        0.98
    );

    if (u_s2.params.z > 0.5) {
        return vec4<f32>(prism_tint, u_s2.params.x * (0.25 + 0.75 * rim_band));
    }
    let final_rgb = mix(in.base_color.rgb, prism_tint, rim_band * u_s2.params.y);
    return vec4<f32>(final_rgb, in.base_color.a * edge_fade);
}
