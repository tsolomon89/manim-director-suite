/**
 * Integration Tests: Parameter → Timeline Workflow
 * Tests the full flow from parameter creation to keyframe interpolation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterManager } from '../../engine/ParameterManager';
import { ExpressionEngine } from '../../engine/ExpressionEngine';
import { KeyframeManager } from '../../timeline/KeyframeManager';
import { TweeningEngine } from '../../timeline/TweeningEngine';
import type { CameraState } from '../../scene/types';

describe('Parameter to Timeline Integration', () => {
  let paramManager: ParameterManager;
  let exprEngine: ExpressionEngine;
  let keyframeManager: KeyframeManager;
  let tweeningEngine: TweeningEngine;

  beforeEach(() => {
    paramManager = new ParameterManager();
    exprEngine = new ExpressionEngine();
    keyframeManager = new KeyframeManager();
    tweeningEngine = new TweeningEngine();
  });

  describe('Simple Parameter Animation', () => {
    it('should animate a single parameter from 0 to 100', () => {
      // Create parameter
      const param = paramManager.createParameter('x', 0, {
        domain: { min: 0, max: 100 },
      })!;

      // Create two keyframes
      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, param.id, 0, true, 'linear');

      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, param.id, 100, true, 'linear');

      // Get value at halfway point
      const keyframes = keyframeManager.getAllKeyframes();
      const state = tweeningEngine.getStateAtTime(5, keyframes);

      expect(state.parameters[param.id]).toBe(50);
    });

    it('should handle updating parameter values', () => {
      // Create base parameter
      const z = paramManager.createParameter('Z', 100, {
        domain: { min: 0, max: 1000 },
      })!;

      // Create another parameter
      const k = paramManager.createParameter('k', 200, {
        domain: { min: 0, max: 2000 },
      })!;

      // Check initial values
      expect(z.value).toBe(100);
      expect(k.value).toBe(200);

      // Update Z
      paramManager.updateParameter(z.id, { value: 200 });

      // Get updated value
      const updatedZ = paramManager.getParameter(z.id);
      expect(updatedZ?.value).toBe(200);
    });
  });

  describe('Multi-Parameter Animation', () => {
    it('should interpolate multiple independent parameters', () => {
      // Create three parameters
      const x = paramManager.createParameter('x', 0)!;
      const y = paramManager.createParameter('y', 0)!;
      const z = paramManager.createParameter('z', 0)!;

      // Create keyframes
      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, x.id, 0, true);
      keyframeManager.setParameterValue(kf1.id, y.id, 0, true);
      keyframeManager.setParameterValue(kf1.id, z.id, 0, true);

      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, x.id, 100, true);
      keyframeManager.setParameterValue(kf2.id, y.id, 200, true);
      keyframeManager.setParameterValue(kf2.id, z.id, 300, true);

      // Check midpoint
      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      expect(state.parameters[x.id]).toBe(50);
      expect(state.parameters[y.id]).toBe(100);
      expect(state.parameters[z.id]).toBe(150);
    });

    it('should respect include flags per parameter', () => {
      const a = paramManager.createParameter({ name: 'a', expression: '10' });
      const b = paramManager.createParameter({ name: 'b', expression: '20' });

      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, a.id, 10, true); // Include
      keyframeManager.setParameterValue(kf1.id, b.id, 20, false); // Don't include

      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, a.id, 50, true);
      keyframeManager.setParameterValue(kf2.id, b.id, 100, false);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      expect(state.parameters[a.id]).toBe(30); // Interpolated
      expect(state.parameters[b.id]).toBe(20); // Held at initial value
    });
  });

  describe('Camera + Parameter Animation', () => {
    it('should animate camera and parameters simultaneously', () => {
      const x = paramManager.createParameter({ name: 'x', expression: '0' });

      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, x.id, 0, true);
      keyframeManager.setCameraState(kf1.id, { x: 0, y: 0, zoom: 1, rotation: 0 }, true);

      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, x.id, 100, true);
      keyframeManager.setCameraState(kf2.id, { x: 10, y: 5, zoom: 2, rotation: 0 }, true);

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

  describe('Expression Evaluation in Timeline', () => {
    it('should evaluate expressions with interpolated parameter values', () => {
      // Create parameters
      const z = paramManager.createParameter({ name: 'Z', expression: '100' });
      const k = paramManager.createParameter({ name: 'k', expression: '2 * Z' });

      // Keyframe 1: Z=100, k should be 200
      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, z.id, 100, true);

      // Keyframe 2: Z=200, k should be 400
      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, z.id, 200, true);

      // At t=5, Z should be 150, k should be 300
      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      // Update parameter manager with interpolated values
      paramManager.updateParameter(z.id, { expression: state.parameters[z.id].toString() });

      const scope = paramManager.evaluateAll();
      expect(scope.Z).toBe(150);
      expect(scope.k).toBe(300);
    });
  });

  describe('Greek Symbols in Keyframes', () => {
    it('should handle Greek symbol parameters in timeline', () => {
      // Create parameter with Greek symbol
      const pi = paramManager.createParameter({ name: 'π', expression: '3.14159' });

      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, pi.id, Math.PI, true);

      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, pi.id, 2 * Math.PI, true);

      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

      expect(state.parameters[pi.id]).toBeCloseTo(1.5 * Math.PI, 5);
    });
  });

  describe('Keyframe Edge Cases', () => {
    it('should handle adding keyframes out of order', () => {
      const x = paramManager.createParameter({ name: 'x', expression: '0' });

      // Add keyframes in non-chronological order
      const kf2 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf2.id, x.id, 100, true);

      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, x.id, 0, true);

      const kf3 = keyframeManager.createKeyframe(5, 'Middle');
      keyframeManager.setParameterValue(kf3.id, x.id, 50, true);

      // Should still interpolate correctly
      const state = tweeningEngine.getStateAtTime(2.5, keyframeManager.getAllKeyframes());
      expect(state.parameters[x.id]).toBe(25);
    });

    it('should handle deleting keyframes', () => {
      const x = paramManager.createParameter({ name: 'x', expression: '0' });

      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, x.id, 0, true);

      const kf2 = keyframeManager.createKeyframe(5, 'Middle');
      keyframeManager.setParameterValue(kf2.id, x.id, 50, true);

      const kf3 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf3.id, x.id, 100, true);

      // Delete middle keyframe
      keyframeManager.deleteKeyframe(kf2.id);

      // Should now interpolate directly from kf1 to kf3
      const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());
      expect(state.parameters[x.id]).toBe(50);
    });
  });

  describe('Performance', () => {
    it('should handle 100 parameters with 10 keyframes efficiently', () => {
      // Create 100 parameters
      const paramIds: string[] = [];
      for (let i = 0; i < 100; i++) {
        const param = paramManager.createParameter({
          name: `param${i}`,
          expression: '0',
        });
        paramIds.push(param.id);
      }

      // Create 10 keyframes
      for (let t = 0; t < 10; t++) {
        const kf = keyframeManager.createKeyframe(t, `KF${t}`);
        for (const paramId of paramIds) {
          keyframeManager.setParameterValue(kf.id, paramId, t * 10, true);
        }
      }

      // Benchmark interpolation
      const start = performance.now();

      for (let t = 0; t < 10; t += 0.1) {
        tweeningEngine.getStateAtTime(t, keyframeManager.getAllKeyframes());
      }

      const duration = performance.now() - start;

      // Should complete 100 samples in under 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
