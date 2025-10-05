/**
 * Integration Tests: Parameter → Timeline Workflow
 * Tests the full flow from parameter creation to keyframe interpolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterManager } from '../../engine/ParameterManager';
import { KeyframeManager } from '../../timeline/KeyframeManager';
import { TweeningEngine } from '../../timeline/TweeningEngine';
import type { KeyframeSnapshot } from '../../timeline/types';

describe('Parameter to Timeline Integration', () => {
  let paramManager: ParameterManager;
  let keyframeManager: KeyframeManager;
  let tweeningEngine: TweeningEngine;

  beforeEach(() => {
    paramManager = new ParameterManager();
    keyframeManager = new KeyframeManager();
    tweeningEngine = new TweeningEngine();
  });

  describe('Simple Parameter Animation', () => {
    it('should animate a single parameter from 0 to 100', () => {
      const param = paramManager.createParameter('x', 0, {
        domain: { min: 0, max: 100 },
      })!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [param.id]: { value: 0, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [param.id]: { value: 100, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot2);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());
      expect(state.parameters[param.id]).toBe(50);
    });

    it('should handle updating parameter values', () => {
      const z = paramManager.createParameter('Z', 100, {
        domain: { min: 0, max: 1000 },
      })!;

      const k = paramManager.createParameter('k', 200, {
        domain: { min: 0, max: 2000 },
      })!;

      expect(z.value).toBe(100);
      expect(k.value).toBe(200);

      paramManager.updateValue(z.id, 200);
      const updatedZ = paramManager.getParameter(z.id);
      expect(updatedZ?.value).toBe(200);
    });
  });

  describe('Multi-Parameter Animation', () => {
    it('should interpolate multiple independent parameters', () => {
      const x = paramManager.createParameter('x', 0)!;
      const y = paramManager.createParameter('y', 0)!;
      const z = paramManager.createParameter('z', 0)!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 0, include: true, easing: 'linear' },
          [y.id]: { value: 0, include: true, easing: 'linear' },
          [z.id]: { value: 0, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 100, include: true, easing: 'linear' },
          [y.id]: { value: 200, include: true, easing: 'linear' },
          [z.id]: { value: 300, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot2);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      expect(state.parameters[x.id]).toBe(50);
      expect(state.parameters[y.id]).toBe(100);
      expect(state.parameters[z.id]).toBe(150);
    });

    it('should respect include flags per parameter', () => {
      const a = paramManager.createParameter('a', 10)!;
      const b = paramManager.createParameter('b', 20)!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [a.id]: { value: 10, include: true, easing: 'linear' },
          [b.id]: { value: 20, include: false, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [a.id]: { value: 50, include: true, easing: 'linear' },
          [b.id]: { value: 100, include: false, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot2);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      expect(state.parameters[a.id]).toBe(30); // Interpolated
      expect(state.parameters[b.id]).toBe(20); // Held at initial value
    });
  });

  describe('Camera + Parameter Animation', () => {
    it('should animate camera and parameters simultaneously', () => {
      const x = paramManager.createParameter('x', 0)!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 0, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: true },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 100, include: true, easing: 'linear' }
        },
        camera: { x: 10, y: 5, zoom: 2, rotation: 0, include: true },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot2);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      // Parameter interpolated
      expect(state.parameters[x.id]).toBe(50);

      // Camera interpolated (uses smoothstep by default)
      expect(state.camera.x).toBeGreaterThan(0);
      expect(state.camera.x).toBeLessThan(10);
      expect(state.camera.zoom).toBeGreaterThan(1);
      expect(state.camera.zoom).toBeLessThan(2);
    });
  });

  describe('Keyframe Edge Cases', () => {
    it('should handle adding keyframes out of order', () => {
      const x = paramManager.createParameter('x', 0)!;

      // Add in reverse order
      const snapshot3: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 100, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot3);

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 0, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 50, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(5, 'Middle', snapshot2);

      // Should still interpolate correctly
      const state = tweeningEngine.getStateAtTime(2.5, keyframeManager.getAllKeyframes());
      expect(state.parameters[x.id]).toBe(25);
    });

    it('should handle deleting keyframes', () => {
      const x = paramManager.createParameter('x', 0)!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 0, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      const kf1 = keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 50, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      const kf2 = keyframeManager.createKeyframe(5, 'Middle', snapshot2);

      const snapshot3: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 100, include: true, easing: 'linear' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      const kf3 = keyframeManager.createKeyframe(10, 'End', snapshot3);

      // Delete middle keyframe
      keyframeManager.deleteKeyframe(kf2.id);

      // Should now interpolate directly from kf1 to kf3
      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());
      expect(state.parameters[x.id]).toBe(50);
    });
  });
});
