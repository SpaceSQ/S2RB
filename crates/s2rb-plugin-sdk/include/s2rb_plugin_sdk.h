#ifndef S2RB_PLUGIN_SDK_H
#define S2RB_PLUGIN_SDK_H

#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum S2rbEngineFamily {
    S2RB_ENGINE_UNREAL_5        = 1,
    S2RB_ENGINE_UNITY_6         = 2,
    S2RB_ENGINE_MINECRAFT_FAB   = 3,
    S2RB_ENGINE_SOURCE2_CS2     = 4,
    S2RB_ENGINE_GODOT_4         = 5,
    S2RB_ENGINE_WEBGPU_META     = 6,
    S2RB_ENGINE_TAOHUAYUAN_WM   = 7,
    S2RB_ENGINE_TAOYUAN_EDGE_IO = 8
} S2rbEngineFamily;

typedef struct S2rbHostAdmissionConfigC {
    const char* world_suns;
    uint8_t     trust_tier;             /* 1 = Authoritative Online, 3 = Local Sandbox */
    bool        allow_custom_skin;
    bool        allow_origin_weapons;
    uint8_t     max_ugo_tier;           /* 1 = Tier-A, 2 = Tier-B, 3 = Tier-C Cosmetic */
    bool        allow_domega_handoff;
    bool        allow_origin_xp_sync;
    bool        enable_14elem_shield;
    bool        allow_currency_import;  /* MUST BE FALSE: enforced by S2RB_ERR_403 */
} S2rbHostAdmissionConfigC;

typedef struct S2rbVec3C {
    double x;
    double y;
    double z;
} S2rbVec3C;

int32_t s2rb_plugin_mount_host(const S2rbHostAdmissionConfigC* cfg, S2rbEngineFamily family);
S2rbVec3C s2rb_plugin_s2_to_host_vec3(S2rbVec3C s2_meters, S2rbEngineFamily family, double avatar_scale);
S2rbVec3C s2rb_plugin_host_to_s2_vec3(S2rbVec3C host_vec, S2rbEngineFamily family, double avatar_scale);
int32_t s2rb_plugin_trigger_red_anchor_fuse(const char* s2_did);

#ifdef __cplusplus
}
#endif

#endif /* S2RB_PLUGIN_SDK_H */
