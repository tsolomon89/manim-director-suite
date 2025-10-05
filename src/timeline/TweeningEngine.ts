/**
 * TweeningEngine
 * Interpolation logic for smooth transitions between keyframes
 * Phase 5: Keyframes & Timeline
 *
 * Implements reference implementation from CLAUDE.md
 */

import { easingRegistry } from './EasingRegistry';
import type { Keyframe, TweenResult } from './types';
import type { CameraState } from '../scene/types';

/**
 * Linear interpolation utility
 * @param t - Normalized time [0, 1]
 * @param a - Start value
 * @param b - End value
 * @returns Interpolated value
 */
export function lerp(t: number, a: number, b: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Engine for interpolating values between keyframes
 */
export class TweeningEngine {
  /**
   * Calculate interpolated state at a specific time
   * @param currentTime - Current timeline position
   * @param keyframes - Sorted array of keyframes
   * @returns Interpolated state
   */
  getStateAtTime(currentTime: number, keyframes: Keyframe[]): TweenResult {
    const [before, after] = this.getSurroundingKeyframes(currentTime, keyframes);

    // No keyframes - return default state
    if (!before && !after) {
      return this.getDefaultState();
    }

    // Before first keyframe - hold first keyframe state
    if (!before && after) {
      return this.keyframeToResult(after);
    }

    // After last keyframe - hold last keyframe state
    if (before && !after) {
      return this.keyframeToResult(before);
    }

    // Between two keyframes - interpolate
    if (before && after) {
      return this.interpolateBetweenKeyframes(currentTime, before, after);
    }

    return this.getDefaultState();
  }

  /**
   * Get interpolated value for a specific parameter
   * @param currentTime - Current timeline position
   * @param keyframes - Sorted array of keyframes
   * @param paramId - Parameter ID to interpolate
   * @returns Interpolated value or null if parameter not in any keyframe
   */
  getParameterValueAtTime(
    currentTime: number,
    keyframes: Keyframe[],
    paramId: string
  ): number | null {
    const [before, after] = this.getSurroundingKeyframes(currentTime, keyframes);

    // Edge cases
    if (!before && !after) return null;
    if (!before) return after!.snapshot.parameters[paramId]?.value ?? null;
    if (!after) return before.snapshot.parameters[paramId]?.value ?? null;

    const paramBefore = before.snapshot.parameters[paramId];
    const paramAfter = after.snapshot.parameters[paramId];

    // Parameter not in keyframes
    if (!paramBefore || !paramAfter) {
      return paramBefore?.value ?? paramAfter?.value ?? null;
    }

    // If not included in tweening, hold previous value
    if (!paramBefore.include) {
      return paramBefore.value;
    }

    // Calculate normalized time [0, 1]
    const t = (currentTime - before.time) / (after.time - before.time);
    const clampedT = clamp(t, 0, 1);

    // Apply easing
    const easingId = paramBefore.easing || 'linear';
    const easingFn = easingRegistry.get(easingId);
    const easedT = easingFn(clampedT);

    // Interpolate
    return lerp(easedT, paramBefore.value, paramAfter.value);
  }

  /**
   * Get camera state at time
   */
  getCameraAtTime(currentTime: number, keyframes: Keyframe[]): CameraState {
    const [before, after] = this.getSurroundingKeyframes(currentTime, keyframes);

    // Default camera
    const defaultCamera: CameraState = { x: 0, y: 0, zoom: 1, rotation: 0 };

    if (!before && !after) return defaultCamera;
    if (!before) return this.extractCamera(after!);
    if (!after) return this.extractCamera(before);

    const camBefore = before.snapshot.camera;
    const camAfter = after.snapshot.camera;

    // If not included in tweening, hold previous state
    if (!camBefore.include) {
      return this.extractCamera(before);
    }

    // Calculate normalized time [0, 1]
    const t = (currentTime - before.time) / (after.time - before.time);
    const clampedT = clamp(t, 0, 1);

    // Camera typically uses smoothstep easing
    const easingFn = easingRegistry.get('smoothstep');
    const easedT = easingFn(clampedT);

    // Interpolate camera properties
    return {
      x: lerp(easedT, camBefore.x, camAfter.x),
      y: lerp(easedT, camBefore.y, camAfter.y),
      zoom: lerp(easedT, camBefore.zoom, camAfter.zoom),
      rotation: lerp(easedT, camBefore.rotation, camAfter.rotation),
    };
  }

  /**
   * Find keyframes surrounding the given time
   * @returns [before, after] tuple, either may be null
   */
  private getSurroundingKeyframes(
    time: number,
    keyframes: Keyframe[]
  ): [Keyframe | null, Keyframe | null] {
    // Keyframes should already be sorted, but ensure it
    const sorted = [...keyframes].sort((a, b) => a.time - b.time);

    let before: Keyframe | null = null;
    let after: Keyframe | null = null;

    for (const kf of sorted) {
      if (kf.time <= time) {
        before = kf;
      } else if (kf.time > time && !after) {
        after = kf;
        break;
      }
    }

    return [before, after];
  }

  /**
   * Interpolate all values between two keyframes
   */
  private interpolateBetweenKeyframes(
    currentTime: number,
    before: Keyframe,
    after: Keyframe
  ): TweenResult {
    const t = (currentTime - before.time) / (after.time - before.time);
    const clampedT = clamp(t, 0, 1);

    const result: TweenResult = {
      parameters: {},
      camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
      warp: { type: 'identity', parameters: {} },
    };

    // Interpolate all parameters
    const allParamIds = new Set([
      ...Object.keys(before.snapshot.parameters),
      ...Object.keys(after.snapshot.parameters),
    ]);

    for (const paramId of allParamIds) {
      const paramBefore = before.snapshot.parameters[paramId];
      const paramAfter = after.snapshot.parameters[paramId];

      if (!paramBefore || !paramAfter) {
        // Parameter only in one keyframe - use its value
        result.parameters[paramId] = paramBefore?.value ?? paramAfter?.value ?? 0;
        continue;
      }

      if (!paramBefore.include) {
        // Not tweening - hold value
        result.parameters[paramId] = paramBefore.value;
        continue;
      }

      // Apply easing and interpolate
      const easingFn = easingRegistry.get(paramBefore.easing || 'linear');
      const easedT = easingFn(clampedT);
      result.parameters[paramId] = lerp(easedT, paramBefore.value, paramAfter.value);
    }

    // Interpolate camera
    const camBefore = before.snapshot.camera;
    const camAfter = after.snapshot.camera;

    if (camBefore.include) {
      const easingFn = easingRegistry.get('smoothstep');
      const easedT = easingFn(clampedT);

      result.camera = {
        x: lerp(easedT, camBefore.x, camAfter.x),
        y: lerp(easedT, camBefore.y, camAfter.y),
        zoom: lerp(easedT, camBefore.zoom, camAfter.zoom),
        rotation: lerp(easedT, camBefore.rotation, camAfter.rotation),
      };
    } else {
      result.camera = this.extractCamera(before);
    }

    // Warp (no interpolation for MVP, just switch)
    result.warp = before.snapshot.warp.include
      ? before.snapshot.warp
      : { type: 'identity', parameters: {} };

    return result;
  }

  /**
   * Convert keyframe to result (no interpolation)
   */
  private keyframeToResult(keyframe: Keyframe): TweenResult {
    const result: TweenResult = {
      parameters: {},
      camera: this.extractCamera(keyframe),
      warp: keyframe.snapshot.warp,
    };

    // Extract parameter values
    for (const [id, param] of Object.entries(keyframe.snapshot.parameters)) {
      result.parameters[id] = param.value;
    }

    return result;
  }

  /**
   * Extract camera state from keyframe
   */
  private extractCamera(keyframe: Keyframe): CameraState {
    const cam = keyframe.snapshot.camera;
    return {
      x: cam.x,
      y: cam.y,
      zoom: cam.zoom,
      rotation: cam.rotation,
    };
  }

  /**
   * Get default state when no keyframes exist
   */
  private getDefaultState(): TweenResult {
    return {
      parameters: {},
      camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
      warp: { type: 'identity', parameters: {} },
    };
  }
}
