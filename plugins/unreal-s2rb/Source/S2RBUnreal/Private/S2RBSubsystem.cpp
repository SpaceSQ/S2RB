#include "S2RBSubsystem.h"
#include "s2rb_plugin_sdk.h"

void US2RBSubsystem::Initialize(FSubsystemCollectionBase& Collection) {
    Super::Initialize(Collection);
    S2rbHostAdmissionConfigC HostCfg = {
        "FILM-WA-009-ROMANEMP2-108-2",
        3,     /* Tier-3 Standalone / Co-Op Open World */
        true,  /* allow_custom_skin */
        true,  /* allow_origin_weapons */
        1,     /* Tier-A Native Mechanic (1m3 Obsidian Barricade enabled) */
        true,  /* allow_domega_handoff */
        true,  /* allow_origin_xp_sync */
        true,  /* enable_14elem_shield */
        false  /* HARD INVARIANT: allow_currency_import = false */
    };
    s2rb_plugin_mount_host(&HostCfg, S2RB_ENGINE_UNREAL_5);
}

void US2RBSubsystem::Deinitialize() {
    Super::Deinitialize();
}

FVector US2RBSubsystem::S2MetersToUnrealCm(const FVector& S2Meters, float AvatarScale) {
    S2rbVec3C In = { S2Meters.X, S2Meters.Y, S2Meters.Z };
    S2rbVec3C Out = s2rb_plugin_s2_to_host_vec3(In, S2RB_ENGINE_UNREAL_5, AvatarScale);
    return FVector((float)Out.x, (float)Out.y, (float)Out.z);
}

void US2RBSubsystem::DispatchBoundaryExitToNiagara(const FString& S2Did, const FVector& ExitPosCm, const FVector& ExitVelCmPerSec) {
    // Spawns native UE5 Niagara ballistic / decal continuation outside the 200cm x 200cm x 240cm container box
}
