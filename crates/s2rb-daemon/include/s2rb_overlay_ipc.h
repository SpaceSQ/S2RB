/*
 * S2RB v3.0 WP-06 Swapchain In-Game Overlay (Alt+R) & s2rbd Shared-Memory IPC Header
 * Injects cleanly into Vulkan / DirectX 12 / Metal / OpenGL Present() hooks (< 1.5% FPS cost).
 */
#ifndef S2RB_OVERLAY_IPC_H
#define S2RB_OVERLAY_IPC_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

#define S2RB_HOTKEY_ALT_R_MASK 0x00520004U
#define S2RB_LAW1_FUSE_MAX_MICROS 3000U

typedef struct {
    uint32_t overlay_visible;         /* 0 = Stealth Gameplay (0 shell draw calls), 1 = Alt+R Open */
    uint32_t active_tab_id;           /* 0: Backpack/UGO, 1: Friends/Forks, 2: 14-Elements, 3: Fuse */
    double shell_opacity;             /* 0.0 stealth | 0.35 Alt+R | 0.85 Red Anchor | 0.92 Ceremony */
    uint64_t active_fencing_token;    /* Monotonic anti-split-brain lease token */
    double imported_currency_zero;    /* Strictly 0.0 */
} S2OverlaySharedFramePage;

#ifdef __cplusplus
}
#endif

#endif /* S2RB_OVERLAY_IPC_H */
