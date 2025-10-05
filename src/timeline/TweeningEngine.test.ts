/**
 * TweeningEngine Unit Tests
 * Tests interpolation, easing, and keyframe transitions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TweeningEngine } from './TweeningEngine';
import type { Keyframe } from './types';

describe('TweeningEngine', () => {
  let engine: TweeningEngine;

  beforeEach(() => {
    engine = new TweeningEngine();
  });

  // Helper to create test keyframes
  const createKeyframe = (time: number, paramId: string, value: number, include = true, easing = 'linear'): Keyframe => ({
    id: `kf-${time}`,
    time,
    label: `t=${time}`,
    snapshot: {
      parameters: {
        [paramId]: { value, include, easing },
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false },
    },
  });

  describe('getStateAtTime', () => {
    it('should return first keyframe value when before all keyframes', () => {
      const keyframes = [
        createKeyframe(1, 'k', 100),
        createKeyframe(2, 'k', 200),
      ];

      const result = engine.getStateAtTime(0.5, keyframes);
      expect(result.parameters['k']).toBe(100);
    });

    it('should return last keyframe value when after all keyframes', () => {
      const keyframes = [
        createKeyframe(1, 'k', 100),
        createKeyframe(2, 'k', 200),
      ];

      const result = engine.getStateAtTime(3, keyframes);
      expect(result.parameters['k']).toBe(200);
    });

    it('should interpolate linearly between keyframes', () => {
      const keyframes = [
        createKeyframe(0, 'k', 0),
        createKeyframe(2, 'k', 100),
      ];

      // At t=1, should be 50% between 0 and 100
      const result = engine.getStateAtTime(1, keyframes);
      expect(result.parameters['k']).toBeCloseTo(50, 5);
    });

    it('should handle exact keyframe times', () => {
      const keyframes = [
        createKeyframe(0, 'k', 100),
        createKeyframe(1, 'k', 200),
        createKeyframe(2, 'k', 300),
      ];

      const result = engine.getStateAtTime(1, keyframes);
      expect(result.parameters['k']).toBe(200);
    });

    it('should handle multiple parameters independently', () => {
      const keyframes: Keyframe[] = [
        {
          id: 'kf-0',
          time: 0,
          label: 't=0',
          snapshot: {
            parameters: {
              'k': { value: 0, include: true, easing: 'linear' },
              'z': { value: 100, include: true, easing: 'linear' },
            },
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
        {
          id: 'kf-2',
          time: 2,
          label: 't=2',
          snapshot: {
            parameters: {
              'k': { value: 100, include: true, easing: 'linear' },
              'z': { value: 200, include: true, easing: 'linear' },
            },
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
      ];

      const result = engine.getStateAtTime(1, keyframes);
      expect(result.parameters['k']).toBeCloseTo(50, 5);
      expect(result.parameters['z']).toBeCloseTo(150, 5);
    });

    it('should respect include flag (hold previous value)', () => {
      const keyframes: Keyframe[] = [
        {
          id: 'kf-0',
          time: 0,
          label: 't=0',
          snapshot: {
            parameters: {
              'k': { value: 100, include: true, easing: 'linear' },
            },
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
        {
          id: 'kf-2',
          time: 2,
          label: 't=2',
          snapshot: {
            parameters: {
              'k': { value: 200, include: false, easing: 'linear' }, // include=false
            },
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
      ];

      // Should hold previous value (100) instead of interpolating
      const result = engine.getStateAtTime(1, keyframes);
      expect(result.parameters['k']).toBe(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty keyframes array', () => {
      const result = engine.getStateAtTime(1, []);
      expect(result.parameters).toEqual({});
    });

    it('should handle single keyframe', () => {
      const keyframes = [createKeyframe(1, 'k', 100)];

      const result0 = engine.getStateAtTime(0, keyframes);
      const result1 = engine.getStateAtTime(1, keyframes);
      const result2 = engine.getStateAtTime(2, keyframes);

      expect(result0.parameters['k']).toBe(100);
      expect(result1.parameters['k']).toBe(100);
      expect(result2.parameters['k']).toBe(100);
    });

    it('should handle keyframes with same time', () => {
      const keyframes = [
        createKeyframe(1, 'k', 100),
        createKeyframe(1, 'k', 200), // Same time
      ];

      // Should use first matching keyframe
      const result = engine.getStateAtTime(1, keyframes);
      expect(result.parameters['k']).toBeDefined();
    });

    it('should handle negative time', () => {
      const keyframes = [
        createKeyframe(0, 'k', 100),
        createKeyframe(1, 'k', 200),
      ];

      const result = engine.getStateAtTime(-1, keyframes);
      expect(result.parameters['k']).toBe(100);
    });

    it('should handle very small time differences', () => {
      const keyframes = [
        createKeyframe(0, 'k', 0),
        createKeyframe(0.001, 'k', 1),
      ];

      const result = engine.getStateAtTime(0.0005, keyframes);
      expect(result.parameters['k']).toBeCloseTo(0.5, 1);
    });
  });

  describe('Camera Interpolation', () => {
    it('should interpolate camera position', () => {
      const keyframes: Keyframe[] = [
        {
          id: 'kf-0',
          time: 0,
          label: 't=0',
          snapshot: {
            parameters: {},
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: true },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
        {
          id: 'kf-2',
          time: 2,
          label: 't=2',
          snapshot: {
            parameters: {},
            camera: { x: 10, y: 20, zoom: 2, rotation: 0, include: true },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
      ];

      const result = engine.getStateAtTime(1, keyframes);
      expect(result.camera.x).toBeCloseTo(5, 5);
      expect(result.camera.y).toBeCloseTo(10, 5);
      expect(result.camera.zoom).toBeCloseTo(1.5, 5);
    });

    it('should not interpolate camera when include=false', () => {
      const keyframes: Keyframe[] = [
        {
          id: 'kf-0',
          time: 0,
          label: 't=0',
          snapshot: {
            parameters: {},
            camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: true },
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
        {
          id: 'kf-2',
          time: 2,
          label: 't=2',
          snapshot: {
            parameters: {},
            camera: { x: 10, y: 10, zoom: 2, rotation: 0, include: false }, // include=false
            warp: { type: 'identity', parameters: {}, include: false },
          },
        },
      ];

      const result = engine.getStateAtTime(1, keyframes);
      // Should hold previous values
      expect(result.camera.x).toBe(0);
      expect(result.camera.y).toBe(0);
      expect(result.camera.zoom).toBe(1);
    });
  });

  describe('Performance', () => {
    it('should handle many keyframes efficiently', () => {
      // Create 100 keyframes
      const keyframes = Array.from({ length: 100 }, (_, i) =>
        createKeyframe(i, 'k', i * 10)
      );

      const start = performance.now();

      // Sample 1000 times
      for (let i = 0; i < 1000; i++) {
        const t = Math.random() * 99;
        engine.getStateAtTime(t, keyframes);
      }

      const elapsed = performance.now() - start;

      // Should complete in reasonable time (< 100ms for 1000 samples)
      expect(elapsed).toBeLessThan(100);
    });
  });
});
