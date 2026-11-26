#include <stdint.h>
#include "s2rb_plugin_sdk.h"

// Admits Volumetric Lifelike Hologram Digital Human alongside SWAT CT squad
// Enforces Tier-C Zero-Stat Weapon Charm degradation & strict zero currency import
int InitCs2S2rbTacticalBridge() {
    S2rbHostAdmissionConfigC cfg = {
        "GAME-NA-003-CS2TACTIC2-012-4",
        1,     /* Tier-1 Competitive Server */
        true,  /* allow_custom_skin: Lifelike Hologram Tactical Operator */
        false, /* allow_origin_weapons: False -> UGO degrades origin gear to Tier-C Gun Charm */
        3,     /* Tier-C Cosmetic Only */
        false, /* allow_domega_handoff: Standard CS2 ballistics only */
        false, /* allow_origin_xp_sync: Competitive parity */
        false, /* enable_14elem_shield: Disabled in ranked rounds; E03_ACOUSTIC passive radar only in co-op */
        false  /* HARD INVARIANT: allow_currency_import = false ($800/$16000 CS2 economy untouched) */
    };
    return s2rb_plugin_mount_host(&cfg, S2RB_ENGINE_SOURCE2_CS2);
}
