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

    // Create keyframes
    const kf1 = keyframeManager.createKeyframe(0, 'Start');
    keyframeManager.setParameterValue(kf1.id, param.id, 0, true, 'linear');

    const kf2 = keyframeManager.createKeyframe(10, 'End');
    keyframeManager.setParameterValue(kf2.id, param.id, 100, true, 'linear');

    // Test interpolation
    const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());
    expect(state.parameters[param.id]).toBe(50);
  });

  it('should save and load project with parameter and keyframes', () => {
    // Create parameter
    const param = paramManager.createParameter('Z', 710)!;

    // Create keyframe
    const kf = keyframeManager.createKeyframe(0, 'Initial');
    keyframeManager.setParameterValue(kf.id, param.id, 710, true);

    // Serialize
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
      timeline: { duration: 10, currentTime: 0 },
      scene: {
        spaceType: 'cartesian',
        bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        gridStyleId: 'cartesian-dark',
        camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
        warp: { type: 'identity', parameters: {} },
      },
    };

    const json = ProjectIO.serialize(state);
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

    // Create keyframes
    const kf1 = keyframeManager.createKeyframe(0, 'Start');
    keyframeManager.setParameterValue(kf1.id, x.id, 0, true);
    keyframeManager.setParameterValue(kf1.id, y.id, 0, true);
    keyframeManager.setParameterValue(kf1.id, z.id, 0, true);

    const kf2 = keyframeManager.createKeyframe(10, 'End');
    keyframeManager.setParameterValue(kf2.id, x.id, 100, true);
    keyframeManager.setParameterValue(kf2.id, y.id, 200, true);
    keyframeManager.setParameterValue(kf2.id, z.id, 300, true);

    // Test interpolation at midpoint
    const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

    expect(state.parameters[x.id]).toBe(50);
    expect(state.parameters[y.id]).toBe(100);
    expect(state.parameters[z.id]).toBe(150);
  });

  it('should respect include flag in keyframes', () => {
    const a = paramManager.createParameter('a', 10)!;
    const b = paramManager.createParameter('b', 20)!;

    // Keyframe 1: both included
    const kf1 = keyframeManager.createKeyframe(0, 'Start');
    keyframeManager.setParameterValue(kf1.id, a.id, 10, true); // Include
    keyframeManager.setParameterValue(kf1.id, b.id, 20, false); // Don't include

    // Keyframe 2
    const kf2 = keyframeManager.createKeyframe(10, 'End');
    keyframeManager.setParameterValue(kf2.id, a.id, 50, true);
    keyframeManager.setParameterValue(kf2.id, b.id, 100, false);

    const state = tweeningEngine.getStateAtTime(5, keyframeManager.getAllKeyframes());

    expect(state.parameters[a.id]).toBe(30); // Interpolated
    expect(state.parameters[b.id]).toBe(20); // Held at initial value
  });

  it('should handle camera animation alongside parameters', () => {
    const x = paramManager.createParameter('x', 0)!;

    const kf1 = keyframeManager.createKeyframe(0, 'Start');
    keyframeManager.setParameterValue(kf1.id, x.id, 0, true);
    keyframeManager.setCameraState(kf1.id, { x: 0, y: 0, zoom: 1, rotation: 0 }, true);

    const kf2 = keyframeManager.createKeyframe(10, 'End');
    keyframeManager.setParameterValue(kf2.id, x.id, 100, true);
    keyframeManager.setCameraState(kf2.id, { x: 10, y: 5, zoom: 2, rotation: 0 }, true);

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
    const x = paramManager.createParameter('x', 0)!;

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

  it('should serialize and deserialize identical project state', () => {
    const param = paramManager.createParameter('x', 42)!;
    const kf = keyframeManager.createKeyframe(0, 'Start');
    keyframeManager.setParameterValue(kf.id, param.id, 42, true);

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
      timeline: { duration: 10, currentTime: 0 },
      scene: {
        spaceType: 'cartesian',
        bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
        gridStyleId: 'cartesian-dark',
        camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
        warp: { type: 'identity', parameters: {} },
      },
    };

    // Serialize once
    const json1 = ProjectIO.serialize(state);

    // Load and serialize again
    const loaded1 = ProjectIO.deserialize(json1);
    const json2 = ProjectIO.serialize(loaded1);

    // Load and serialize a third time
    const loaded2 = ProjectIO.deserialize(json2);
    const json3 = ProjectIO.serialize(loaded2);

    // All JSON strings should be identical
    expect(json1).toBe(json2);
    expect(json2).toBe(json3);
  });
});
