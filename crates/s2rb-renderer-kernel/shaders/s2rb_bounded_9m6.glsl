#version 450
// S2RB v3.0 WP-04 Godot 4 / Vulkan / Source 2 GLSL Fragment Shader

layout(location = 0) in vec3 v_local_pos_m;
layout(location = 1) in vec4 v_base_color;
layout(location = 0) out vec4 out_rgba;

layout(push_constant) uniform S2PushConstants {
    float shell_opacity;
    float prism_roughness;
    float is_shell_pass;
    float time_sec;
} u_pc;

float sd_box_9m6(vec3 p) {
    vec3 q = abs(p - vec3(0.0, 0.0, 1.2)) - vec3(1.0, 1.0, 1.2);
    return length(max(q, vec3(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
}

void main() {
    if (u_pc.is_shell_pass > 0.5 && u_pc.shell_opacity <= 0.0001) {
        discard;
    }
    float sdf = sd_box_9m6(v_local_pos_m);
    if (sdf > 0.0) {
        discard;
    }
    float edge_fade = smoothstep(0.0, -0.08, sdf);
    float rim = 1.0 - smoothstep(-0.025, 0.0, sdf);
    vec3 prism = vec3(0.25 + 0.25 * sin(u_pc.time_sec * 3.0 + v_local_pos_m.z * 4.0), 0.85, 0.98);
    if (u_pc.is_shell_pass > 0.5) {
        out_rgba = vec4(prism, u_pc.shell_opacity * (0.25 + 0.75 * rim));
    } else {
        out_rgba = vec4(mix(v_base_color.rgb, prism, rim * u_pc.prism_roughness), v_base_color.a * edge_fade);
    }
}
