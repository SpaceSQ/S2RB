/*
 * S2RB v3.0 Super Game Connector — WP-04 Hybrid Renderer Zero-Copy C99 ABI Header
 */
#ifndef S2RB_RENDERER_ABI_H
#define S2RB_RENDERER_ABI_H

#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    double sdf_distance_m;        /* <= 0.0 inside 9.6m3, > 0.0 outside */
    int32_t discarded_outside_9m6;/* 1 = hard discard, 0 = inside 2x2x2.4m */
    double boundary_alpha_weight; /* Smooth 8cm Hermite attenuation */
    double prism_rim_intensity;   /* Law 2 iridescent boundary highlight */
} S2CabiSdfSample;

S2CabiSdfSample s2rb_renderer_eval_sdf_9m6(double px_m, double py_m, double pz_m);

#ifdef __cplusplus
}
#endif

#endif /* S2RB_RENDERER_ABI_H */
