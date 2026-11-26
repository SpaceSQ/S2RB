// WP-04: 9.6m3 Bounded SDF Clipper, @ dOmega Extended Effect Handoff Bus & 4-State Stealth Envelope
import { convertContainerPointToHost } from './protocol.js';

export const CEREMONY_DURATION_SEC = 3.0;

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Exact 3D Euclidean Box Signed Distance Field for `[-1, 1] x [-1, 1] x [0, 2.4]` meters (`9.6 m3`).
 * <= 0 inside/on boundary, > 0 strictly outside.
 */
export function sdBox9m6(pointLocalM) {
  const [x, y, z] = pointLocalM;
  const qx = Math.abs(x - 0.0) - 1.0;
  const qy = Math.abs(y - 0.0) - 1.0;
  const qz = Math.abs(z - 1.2) - 1.2;

  const ox = Math.max(qx, 0.0);
  const oy = Math.max(qy, 0.0);
  const oz = Math.max(qz, 0.0);
  const outsideDist = Math.hypot(ox, oy, oz);
  const insideDist = Math.min(Math.max(qx, Math.max(qy, qz)), 0.0);
  return outsideDist + insideDist;
}

/**
 * Simulates the exact WGSL/HLSL/GLSL primary container fragment shader rules.
 */
export function evaluatePrimaryFragment9m6(pointLocalM) {
  const sdf = sdBox9m6(pointLocalM);
  if (sdf > 0.0) {
    return {
      sdfDistanceM: sdf,
      discardedOutside9m6: true,
      boundaryAlphaWeight: 0.0,
      prismRimIntensity: 0.0
    };
  }
  const alphaWeight = smoothstep(0.0, -0.08, sdf);
  const rim = 1.0 - smoothstep(-0.025, 0.0, sdf);
  return {
    sdfDistanceM: sdf,
    discardedOutside9m6: false,
    boundaryAlphaWeight: Number(alphaWeight.toFixed(4)),
    prismRimIntensity: Number((1.0 - rim).toFixed(4))
  };
}

/**
 * Four-State Stealth Envelope Controller (`CEREMONY_VISIBLE -> STEALTH_GAMEPLAY_INVISIBLE`).
 */
export class StealthEnvelopeController {
  constructor(container) {
    this.container = container;
    this.ceremonyTimerSec = CEREMONY_DURATION_SEC;
    this.userOverlayPinned = false;
    this.systemWakeupPinned = false;
    this._syncMode();
  }

  triggerCeremony() {
    this.ceremonyTimerSec = CEREMONY_DURATION_SEC;
    return this._syncMode();
  }

  setUserInspectHotkey(active) {
    if (active) this.ceremonyTimerSec = 0;
    this.userOverlayPinned = Boolean(active);
    return this._syncMode();
  }

  setSystemTelemetryWakeup(active) {
    this.systemWakeupPinned = Boolean(active);
    return this._syncMode();
  }

  tickFrame(dtSec) {
    if (this.ceremonyTimerSec > 0) {
      this.ceremonyTimerSec = Math.max(0, Number((this.ceremonyTimerSec - Math.max(0, dtSec)).toFixed(4)));
    }
    return this._syncMode();
  }

  _syncMode() {
    let mode = 'STEALTH_GAMEPLAY_INVISIBLE';
    if (this.systemWakeupPinned) {
      mode = 'SYSTEM_TELEMETRY_WAKEUP';
    } else if (this.ceremonyTimerSec > 0) {
      mode = 'CEREMONY_VISIBLE';
    } else if (this.userOverlayPinned) {
      mode = 'USER_INSPECT_OVERLAY';
    }
    this.container.kinematics.visibilityMode = mode;
    const opacity = this.container.getEnvelopeOpacity();
    return {
      mode,
      shellOpacity: opacity,
      shellDrawCalls: opacity <= 1e-6 ? 0 : 1,
      prismRoughnessPct: opacity <= 1e-6 ? 0.0 : 5.5,
      ceremonyRemainingSec: this.ceremonyTimerSec
    };
  }
}

/**
 * `@ dOmega_9.6m3` Extended Boundary-Crossing Effect Handoff Bus.
 */
export class ExtendedEffectHandoffBus {
  constructor({ coordConvention = 'S2_CANONICAL_Z_UP_M', vfxBackend = 'UNREAL_NIAGARA', hostAvatarScale = 1.0 } = {}) {
    this.coordConvention = coordConvention;
    this.vfxBackend = vfxBackend;
    this.hostAvatarScale = hostAvatarScale;
    this.pendingHostCommands = [];
  }

  evaluateAndDispatch({
    container,
    admissionProjection,
    actionId,
    originLocalM = [0, 0, 1.4],
    directionVec = [0, 1, 0],
    reachOrRangeM = 0.6,
    speedMps = 0,
    aoeRadiusM = 0,
    isMeleePolearm = false
  }) {
    const combatAuthorized = Boolean(
      admissionProjection.combatSkillsEnabled || admissionProjection.weaponStatsActive
    );

    // Archetype 1: Wide-area Ground AoE (`aoeRadiusM > 1.0m`)
    if (aoeRadiusM > 1.0 && reachOrRangeM <= 1.0) {
      const centerHost = convertContainerPointToHost(
        container.kinematics.worldAnchorPosM,
        this.coordConvention,
        this.hostAvatarScale
      );
      const cmd = Object.freeze({
        actionId,
        vfxBackend: this.vfxBackend,
        combatDamageAuthorized: combatAuthorized,
        archetype: 'EXTERNAL_ANNULAR_GROUND_AOE',
        centerPosHostUnits: centerHost,
        innerClippedRadiusM: 1.0,
        outerRadiusM: aoeRadiusM,
        durationSec: 6.0
      });
      this.pendingHostCommands.push(cmd);
      return cmd;
    }

    // Solve Slab intersection against 9.6m3 boundary
    const exitEv = container.solveBoundaryExit({
      skillOrWeaponId: actionId,
      originLocalM,
      directionVec,
      maxRangeM: reachOrRangeM,
      targetAoeRadiusM: aoeRadiusM
    });

    if (!exitEv) {
      return Object.freeze({
        actionId,
        vfxBackend: this.vfxBackend,
        combatDamageAuthorized: combatAuthorized,
        archetype: 'CONTAINED_INSIDE_9M6',
        hostEntitiesSpawned: 0
      });
    }

    const spawnHost = convertContainerPointToHost(
      exitEv.exitPointWorldM,
      this.coordConvention,
      this.hostAvatarScale
    );

    if (isMeleePolearm) {
      const tipWorldM = [
        exitEv.exitPointWorldM[0] + exitEv.directionUnitVec[0] * exitEv.remainingRangeM,
        exitEv.exitPointWorldM[1] + exitEv.directionUnitVec[1] * exitEv.remainingRangeM,
        exitEv.exitPointWorldM[2] + exitEv.directionUnitVec[2] * exitEv.remainingRangeM
      ];
      const cmd = Object.freeze({
        actionId,
        vfxBackend: this.vfxBackend,
        combatDamageAuthorized: combatAuthorized,
        archetype: 'DUAL_SEGMENT_POLEARM_TIP_PROXY',
        exitHingeHostUnits: spawnHost,
        tipPosHostUnits: convertContainerPointToHost(tipWorldM, this.coordConvention, this.hostAvatarScale),
        overhangLengthM: exitEv.remainingRangeM
      });
      this.pendingHostCommands.push(cmd);
      return cmd;
    }

    const cmd = Object.freeze({
      actionId,
      vfxBackend: this.vfxBackend,
      combatDamageAuthorized: combatAuthorized,
      archetype: 'EXTERNAL_BALLISTIC_PROJECTILE',
      exitFace: exitEv.exitFace,
      spawnPosHostUnits: spawnHost,
      launchDirHost: convertContainerPointToHost(exitEv.directionUnitVec, this.coordConvention, 1.0),
      speedMps,
      remainingRangeM: exitEv.remainingRangeM
    });
    this.pendingHostCommands.push(cmd);
    return cmd;
  }

  drainPendingCommands() {
    const out = [...this.pendingHostCommands];
    this.pendingHostCommands.length = 0;
    return out;
  }
}
