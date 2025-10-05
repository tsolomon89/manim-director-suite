/**
 * Integration Tests: Simple Workflows
 * Tests basic end-to-end workflows with correct APIs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterManager } from '../../engine/ParameterManager';
import { KeyframeManager } from '../../timeline/KeyframeManager';
import { TweeningEngine } from '../../timeline/TweeningEngine';
import { ProjectIO } from '../../state/ProjectIO';
import type { ProjectState } from '../../state/types';
import type { KeyframeSnapshot } from '../../timeline/types';

describe('Simple Workflow Integration', () => {
  let paramManager: ParameterManager;
  let keyframeManager: KeyframeManager;
  let tweeningEngine: TweeningEngine;

  beforeEach(() => {
    paramManager = new ParameterManager();
    keyframeManager = new KeyframeManager();
    tweeningEngine = new TweeningEngine();
  });

  it('should create parameter and animate it in timeline', () => {
    // Create parameter
    const param = paramManager.createParameter('x', 0, {
      domain: { min: 0, max: 100 },
    })!;

    expect(param).toBeDefined();
    expect(param.name).toBe('x');
    expect(param.value).toBe(0);

    // Create keyframe 1 at t=0 with x=0
    const snapshot1: KeyframeSnapshot = {
      parameters: {
        [param.id]: { value: 0, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(0, 'Start', snapshot1);

    // Create keyframe 2 at t=10 with x=100
    const snapshot2: KeyframeSnapshot = {
      parameters: {
        [param.id]: { value: 100, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(10, 'End', snapshot2);

    // Test interpolation at t=5 (should be 50)
    const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());
    expect(state.parameters[param.id]).toBe(50);
  });

  it('should save and load project with parameter and keyframes', () => {
    // Create parameter
    const param = paramManager.createParameter('Z', 710)!;

    // Create keyframe
    const snapshot: KeyframeSnapshot = {
      parameters: {
        [param.id]: { value: 710, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(0, 'Initial', snapshot);

    // Serialize directly as ProjectState JSON
    const state: ProjectState = {
      version: '1.0.0',
      metadata: {
        name: 'Test',
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
      },
      parameters: paramManager.getAllParameters(),
      functions: [],
      independentVariables: [],
      keyframes: keyframeManager.getAllKeyframes(),
      timeline: {
        duration: 10,
        currentTime: 0,
        playbackSpeed: 1,
        loopMode: 'once',
        fps: 60,
      },
      scene: {
        spaceType: 'cartesian',
        gridStyleId: 'cartesian-dark',
        gridConfig: {
          axes: { color: '#FFFFFF', width: 2 },
          majorGrid: { color: '#444444', width: 1, spacing: 1 },
          minorGrid: { color: '#222222', width: 0.5, spacing: 0.2 },
          background: '#000000',
        },
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
      rendering: {
        resolution: '1920x1080',
        fps: 30,
        quality: 'medium',
      },
    };

    const json = JSON.stringify(state);
    const loaded = ProjectIO.deserialize(json);

    // Verify
    expect(loaded.parameters).toHaveLength(1);
    expect(loaded.parameters[0].name).toBe('Z');
    expect(loaded.parameters[0].value).toBe(710);
    expect(loaded.keyframes).toHaveLength(1);
    expect(loaded.keyframes[0].label).toBe('Initial');
  });

  it('should handle multiple parameters in keyframes', () => {
    // Create multiple parameters
    const x = paramManager.createParameter('x', 0)!;
    const y = paramManager.createParameter('y', 0)!;
    const z = paramManager.createParameter('z', 0)!;

    // Create keyframe 1
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

    // Create keyframe 2
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

    // Test interpolation at midpoint
    const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

    expect(state.parameters[x.id]).toBe(50);
    expect(state.parameters[y.id]).toBe(100);
    expect(state.parameters[z.id]).toBe(150);
  });

  it('should respect include flag in keyframes', () => {
    const a = paramManager.createParameter('a', 10)!;
    const b = paramManager.createParameter('b', 20)!;

    // Keyframe 1: a included, b not included
    const snapshot1: KeyframeSnapshot = {
      parameters: {
        [a.id]: { value: 10, include: true, easing: 'linear' },
        [b.id]: { value: 20, include: false, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(0, 'Start', snapshot1);

    // Keyframe 2
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

  it('should handle camera animation alongside parameters', () => {
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

    // Camera interpolated (uses smoothstep, so not exactly halfway)
    expect(state.camera.x).toBeGreaterThan(0);
    expect(state.camera.x).toBeLessThan(10);
    expect(state.camera.zoom).toBeGreaterThan(1);
    expect(state.camera.zoom).toBeLessThan(2);
  });

  it('should handle keyframes added out of order', () => {
    const x = paramManager.createParameter('x', 0)!;

    // Add keyframes in non-chronological order
    const snapshot2: KeyframeSnapshot = {
      parameters: {
        [x.id]: { value: 100, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(10, 'End', snapshot2);

    const snapshot1: KeyframeSnapshot = {
      parameters: {
        [x.id]: { value: 0, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(0, 'Start', snapshot1);

    const snapshot3: KeyframeSnapshot = {
      parameters: {
        [x.id]: { value: 50, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(5, 'Middle', snapshot3);

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

  it('should serialize and deserialize identical project state', () => {
    const param = paramManager.createParameter('x', 42)!;

    const snapshot: KeyframeSnapshot = {
      parameters: {
        [param.id]: { value: 42, include: true, easing: 'linear' }
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: false },
      warp: { type: 'identity', parameters: {}, include: false }
    };
    keyframeManager.createKeyframe(0, 'Start', snapshot);

    const state: ProjectState = {
      version: '1.0.0',
      metadata: {
        name: 'Deterministic',
        created: '2025-01-01T00:00:00Z',
        modified: '2025-01-01T00:00:00Z',
      },
      parameters: paramManager.getAllParameters(),
      functions: [],
      independentVariables: [],
      keyframes: keyframeManager.getAllKeyframes(),
      timeline: {
        duration: 10,
        currentTime: 0,
        playbackSpeed: 1,
        loopMode: 'once',
        fps: 60,
      },
      scene: {
        spaceType: 'cartesian',
        gridStyleId: 'cartesian-dark',
        gridConfig: {
          axes: { color: '#FFFFFF', width: 2 },
          majorGrid: { color: '#444444', width: 1, spacing: 1 },
          minorGrid: { color: '#222222', width: 0.5, spacing: 0.2 },
          background: '#000000',
        },
      },
      camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
      rendering: {
        resolution: '1920x1080',
        fps: 30,
        quality: 'medium',
      },
    };

    // Serialize once
    const json1 = JSON.stringify(state);

    // Load and serialize again
    const loaded1 = ProjectIO.deserialize(json1);
    const json2 = JSON.stringify(loaded1);

    // Load and serialize a third time
    const loaded2 = ProjectIO.deserialize(json2);
    const json3 = JSON.stringify(loaded2);

    // All JSON strings should be identical
    expect(json1).toBe(json2);
    expect(json2).toBe(json3);
  });
});
