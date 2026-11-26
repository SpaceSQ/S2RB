using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace Space2.S2RB {
    public sealed class S2RBBridgeBehaviour : MonoBehaviour {
        public const float ContainerWidthM = 2.0f;
        public const float ContainerDepthM = 2.0f;
        public const float ContainerHeightM = 2.4f;
        public const bool AllowCurrencyImport = false; // Constitutional hard lock

        [Header("Host World Governance (MOBA Competitive Default)")]
        public string worldSuns = "GAME-CN-002-HONORKING2-005-2";
        public int trustTier = 1; // Tier-1 Authoritative Server (+/-5% power ceiling)

        public static Vector3 S2MetersToUnity(Vector3 s2Meters, float scale = 1.0f) {
            // S2 (+X Right, +Y Forward, +Z Up) -> Unity Left-Handed (+X Right, +Y Up, +Z Forward)
            return new Vector3(s2Meters.x * scale, s2Meters.z * scale, s2Meters.y * scale);
        }

        public static Vector3 UnityToS2Meters(Vector3 unityPos, float scale = 1.0f) {
            float s = Mathf.Approximately(scale, 0f) ? 1.0f : scale;
            return new Vector3(unityPos.x / s, unityPos.z / s, unityPos.y / s);
        }
    }
}
