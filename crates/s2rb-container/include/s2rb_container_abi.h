/*
 * S2RB v3.0 Super Game Connector — Zero-Copy C99 ABI Header (WP-02)
 * Compatible with Unreal Engine 5 C++, Unity NativePlugin, Godot GDExtension & Source 2
 */
#ifndef S2RB_CONTAINER_ABI_H
#define S2RB_CONTAINER_ABI_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    double width_m;                       /* Strictly 2.0 */
    double depth_m;                       /* Strictly 2.0 */
    double height_m;                      /* Strictly 2.4 (Volume = 9.6 m3) */
    double imported_currency_locked_zero; /* Strictly 0.0 (Currency Firewall) */
    double envelope_opacity;              /* 0.0 in normal stealth gameplay */
} S2CabiEnvelopeSpec;

typedef struct {
    int32_t did_exit_boundary;            /* 1 if crossed dOmega_9.6m3, 0 if contained */
    double exit_point_local_m[3];         /* Exact intersection on [-1,1]x[-1,1]x[0,2.4] */
    double remaining_range_m;             /* Remaining travel distance for host engine */
} S2CabiBoundaryExitResult;

S2CabiEnvelopeSpec s2rb_cabi_default_envelope(int32_t stealth_gameplay);

S2CabiBoundaryExitResult s2rb_cabi_solve_projectile_exit(
    double ox, double oy, double oz,
    double dx, double dy, double dz,
    double max_range_m
);

#ifdef __cplusplus
}
#endif

#endif /* S2RB_CONTAINER_ABI_H */
