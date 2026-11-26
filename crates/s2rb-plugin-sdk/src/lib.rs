//! WP-07: Unified Host Plugin SDK & Affine Basis Converter across 8 Target Engines.
//! Bridges `s2rbd` shared memory to Unreal Engine 5, Unity 6, Minecraft Fabric,
//! Source 2 (CS2), Godot 4, WebGPU/Three.js, Taohuayuan World Model, and Physical Edge Gateways.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EngineFamily {
    Unreal5,
    Unity6,
    MinecraftFabric,
    Source2Cs2,
    Godot4,
    WebGpuMetaverse,
    TaohuayuanWorldModel,
    TaoyuanPhysicalEdge,
}

impl EngineFamily {
    pub fn canonical_shader_backend(&self) -> &'static str {
        match self {
            Self::Unreal5 | Self::Source2Cs2 => "HLSL_SM6",
            Self::Unity6 => "HLSL_URP_HDRP",
            Self::MinecraftFabric | Self::Godot4 => "GLSL_450",
            Self::WebGpuMetaverse | Self::TaohuayuanWorldModel => "WGSL_1_0",
            Self::TaoyuanPhysicalEdge => "OPENXR_HOLOLENS_SDF",
        }
    }
}

/// Forward transform from S2 Canonical (`Right-Handed +X Right, +Y Forward, +Z Up [0..2.4m]`) to Host Engine.
pub fn s2_meters_to_host(pt: [f64; 3], engine: EngineFamily, scale: f64) -> [f64; 3] {
    let (x, y, z) = (pt[0] * scale, pt[1] * scale, pt[2] * scale);
    match engine {
        EngineFamily::Unreal5 => [y * 100.0, x * 100.0, z * 100.0],
        EngineFamily::Unity6 => [x, z, y],
        EngineFamily::MinecraftFabric | EngineFamily::Godot4 | EngineFamily::WebGpuMetaverse => [x, z, -y],
        EngineFamily::Source2Cs2 => [x / 0.0254, y / 0.0254, z / 0.0254],
        EngineFamily::TaohuayuanWorldModel | EngineFamily::TaoyuanPhysicalEdge => [x, y, z],
    }
}

/// Exact inverse transform from Host Engine coordinates back to S2 Canonical meters (`9.6 m^3`).
pub fn host_to_s2_meters(hv: [f64; 3], engine: EngineFamily, scale: f64) -> [f64; 3] {
    let s = if scale.abs() < 1e-9 { 1.0 } else { scale };
    let raw = match engine {
        EngineFamily::Unreal5 => [hv[1] / 100.0, hv[0] / 100.0, hv[2] / 100.0],
        EngineFamily::Unity6 => [hv[0], hv[2], hv[1]],
        EngineFamily::MinecraftFabric | EngineFamily::Godot4 | EngineFamily::WebGpuMetaverse => [hv[0], -hv[2], hv[1]],
        EngineFamily::Source2Cs2 => [hv[0] * 0.0254, hv[1] * 0.0254, hv[2] * 0.0254],
        EngineFamily::TaohuayuanWorldModel | EngineFamily::TaoyuanPhysicalEdge => hv,
    };
    [raw[0] / s, raw[1] / s, raw[2] / s]
}
