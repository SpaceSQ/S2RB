// S2RB v3.0 WP-04 Unreal Engine 5 / DirectX 12 / Unity URP-HDRP HLSL Clipping Function
// Attach to Custom Material OpacityMask / PixelShader on mounted S2RB Character Container Actors.

float S2RB_SdBox9m6_Meters(float3 localPosMeters)
{
    const float3 boxCenter = float3(0.0, 0.0, 1.2);
    const float3 halfExtents = float3(1.0, 1.0, 1.2); // 2.0m x 2.0m x 2.4m = 9.6 m3
    float3 q = abs(localPosMeters - boxCenter) - halfExtents;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
}

float4 S2RB_ApplyPrimaryContainerClip(
    float3 localPosMeters,
    float4 baseRgba,
    float shellOpacity,
    float isEnvelopeShellPass,
    float timeSeconds)
{
    if (isEnvelopeShellPass > 0.5 && shellOpacity <= 0.0001)
    {
        clip(-1.0); // Normal gameplay stealth mode: completely invisible
    }

    float sdf = S2RB_SdBox9m6_Meters(localPosMeters);
    clip(-sdf); // Strictly discard any fragment with sdf > 0.0!

    float edgeFade = smoothstep(0.0, -0.08, sdf);
    float rimMask = 1.0 - smoothstep(-0.025, 0.0, sdf);
    float3 prismRgb = float3(0.20 + 0.30 * sin(timeSeconds * 3.0 + localPosMeters.z * 4.0), 0.84, 0.96);

    if (isEnvelopeShellPass > 0.5)
    {
        return float4(prismRgb, shellOpacity * (0.25 + 0.75 * rimMask));
    }
    return float4(lerp(baseRgba.rgb, prismRgb, rimMask * 0.06), baseRgba.a * edgeFade);
}
