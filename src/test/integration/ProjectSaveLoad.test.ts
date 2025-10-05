/**
 * Integration Tests: Project Save/Load
 * Tests the complete project serialization and deserialization workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterManager } from '../../engine/ParameterManager';
import { FunctionManager } from '../../engine/FunctionManager';
import { IndependentVariableManager } from '../../engine/IndependentVariableManager';
import { KeyframeManager } from '../../timeline/KeyframeManager';
import { ProjectIO } from '../../state/ProjectIO';
import type { ProjectState } from '../../state/types';

describe('Project Save/Load Integration', () => {
  let paramManager: ParameterManager;
  let functionManager: FunctionManager;
  let varManager: IndependentVariableManager;
  let keyframeManager: KeyframeManager;

  beforeEach(() => {
    paramManager = new ParameterManager();
    functionManager = new FunctionManager(paramManager);
    varManager = new IndependentVariableManager();
    keyframeManager = new KeyframeManager();
  });

  describe('Round-trip Serialization', () => {
    it('should save and load a simple project without data loss', () => {
      // Create a simple project
      const param = paramManager.createParameter({
        name: 'x',
        expression: '42',
        domain: { min: 0, max: 100 },
      });

      // Create a keyframe
      const kf = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf.id, param.id, 42, true, 'linear');

      // Serialize
      const state: ProjectState = {
        version: '1.0.0',
        metadata: {
          name: 'Test Project',
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
        },
        scene: {
          spaceType: 'cartesian',
          bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
          gridStyleId: 'cartesian-dark',
          camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
          warp: { type: 'identity', parameters: {} },
        },
      };

      const json = ProjectIO.serialize(state);

      // Deserialize
      const loaded = ProjectIO.deserialize(json);

      // Verify
      expect(loaded.metadata.name).toBe('Test Project');
      expect(loaded.parameters).toHaveLength(1);
      expect(loaded.parameters[0].name).toBe('x');
      expect(loaded.parameters[0].expression).toBe('42');
      expect(loaded.keyframes).toHaveLength(1);
      expect(loaded.keyframes[0].label).toBe('Start');
    });

    it('should preserve parameter dependencies', () => {
      // Create dependent parameters
      const z = paramManager.createParameter({ name: 'Z', expression: '100' });
      const k = paramManager.createParameter({ name: 'k', expression: '2 * Z' });
      const m = paramManager.createParameter({ name: 'm', expression: 'k + 50' });

      // Serialize
      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Deps', created: '', modified: '' },
        parameters: paramManager.getAllParameters(),
        functions: [],
        independentVariables: [],
        keyframes: [],
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

      // Restore to managers
      const newParamManager = new ParameterManager();
      loaded.parameters.forEach(p => {
        newParamManager.createParameter({
          name: p.name,
          expression: p.expression,
          domain: p.domain,
        });
      });

      // Evaluate
      const scope = newParamManager.evaluateAll();

      expect(scope.Z).toBe(100);
      expect(scope.k).toBe(200);
      expect(scope.m).toBe(250);
    });

    it('should preserve function definitions', () => {
      // Create independent variable
      const x = varManager.createVariable({ symbol: 'x', min: -10, max: 10, step: 0.1 });

      // Create function
      const fn = functionManager.createFunction({
        name: 'f',
        expression: 'sin(x)',
        formalParameters: ['x'],
      });

      // Serialize
      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Functions', created: '', modified: '' },
        parameters: [],
        functions: functionManager.getAllFunctions().map(f => ({
          id: f.id,
          name: f.name,
          expression: f.expression,
          formalParameters: f.formalParameters,
          color: f.color,
        })),
        independentVariables: varManager.getAllVariables(),
        keyframes: [],
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

      expect(loaded.functions).toHaveLength(1);
      expect(loaded.functions[0].name).toBe('f');
      expect(loaded.functions[0].expression).toBe('sin(x)');
      expect(loaded.functions[0].formalParameters).toEqual(['x']);
      expect(loaded.independentVariables).toHaveLength(1);
    });

    it('should preserve all keyframe data', () => {
      const x = paramManager.createParameter({ name: 'x', expression: '0' });
      const y = paramManager.createParameter({ name: 'y', expression: '0' });

      // Create complex keyframes
      const kf1 = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf1.id, x.id, 0, true, 'linear');
      keyframeManager.setParameterValue(kf1.id, y.id, 10, false, 'smoothstep');
      keyframeManager.setCameraState(kf1.id, { x: 0, y: 0, zoom: 1, rotation: 0 }, true);

      const kf2 = keyframeManager.createKeyframe(5, 'Middle');
      keyframeManager.setParameterValue(kf2.id, x.id, 50, true, 'ease-in');
      keyframeManager.setParameterValue(kf2.id, y.id, 20, true, 'ease-out');
      keyframeManager.setCameraState(kf2.id, { x: 5, y: 2, zoom: 1.5, rotation: 0 }, false);

      const kf3 = keyframeManager.createKeyframe(10, 'End');
      keyframeManager.setParameterValue(kf3.id, x.id, 100, true, 'smoothstep');
      keyframeManager.setCameraState(kf3.id, { x: 10, y: 5, zoom: 2, rotation: 0 }, true);

      // Serialize
      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Keyframes', created: '', modified: '' },
        parameters: paramManager.getAllParameters(),
        functions: [],
        independentVariables: [],
        keyframes: keyframeManager.getAllKeyframes(),
        timeline: { duration: 10, currentTime: 5 },
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

      expect(loaded.keyframes).toHaveLength(3);
      expect(loaded.timeline.currentTime).toBe(5);

      // Check first keyframe details
      const loadedKf1 = loaded.keyframes.find(kf => kf.label === 'Start')!;
      expect(loadedKf1).toBeDefined();
      expect(loadedKf1.snapshot.parameters[x.id].value).toBe(0);
      expect(loadedKf1.snapshot.parameters[x.id].include).toBe(true);
      expect(loadedKf1.snapshot.parameters[x.id].easing).toBe('linear');
      expect(loadedKf1.snapshot.parameters[y.id].include).toBe(false);

      // Check camera data
      expect(loadedKf1.snapshot.camera.include).toBe(true);
    });

    it('should preserve scene configuration', () => {
      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Scene', created: '', modified: '' },
        parameters: [],
        functions: [],
        independentVariables: [],
        keyframes: [],
        timeline: { duration: 10, currentTime: 0 },
        scene: {
          spaceType: 'polar',
          bounds: { xMin: -20, xMax: 20, yMin: -15, yMax: 15 },
          gridStyleId: 'polar-light',
          camera: { x: 5, y: 3, zoom: 1.2, rotation: 45 },
          warp: { type: 'radial', parameters: { intensity: 0.5 } },
        },
      };

      const json = ProjectIO.serialize(state);
      const loaded = ProjectIO.deserialize(json);

      expect(loaded.scene.spaceType).toBe('polar');
      expect(loaded.scene.bounds.xMax).toBe(20);
      expect(loaded.scene.gridStyleId).toBe('polar-light');
      expect(loaded.scene.camera.zoom).toBe(1.2);
      expect(loaded.scene.camera.rotation).toBe(45);
      expect(loaded.scene.warp.type).toBe('radial');
      expect(loaded.scene.warp.parameters.intensity).toBe(0.5);
    });
  });

  describe('Deterministic Reproduction', () => {
    it('should produce identical output on multiple loads', () => {
      // Create a project
      const param = paramManager.createParameter({ name: 'x', expression: '42' });
      const kf = keyframeManager.createKeyframe(0, 'Start');
      keyframeManager.setParameterValue(kf.id, param.id, 42, true);

      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Deterministic', created: '2025-01-01T00:00:00Z', modified: '2025-01-01T00:00:00Z' },
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

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', () => {
      const malformedJson = '{ "version": "1.0.0", "metadata": { "name": ';

      expect(() => {
        ProjectIO.deserialize(malformedJson);
      }).toThrow();
    });

    it('should validate version number', () => {
      const futureVersion = {
        version: '999.0.0',
        metadata: { name: 'Future', created: '', modified: '' },
        parameters: [],
        functions: [],
        independentVariables: [],
        keyframes: [],
        timeline: { duration: 10, currentTime: 0 },
        scene: {
          spaceType: 'cartesian',
          bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
          gridStyleId: 'cartesian-dark',
          camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
          warp: { type: 'identity', parameters: {} },
        },
      };

      const json = JSON.stringify(futureVersion);

      // Should either throw or warn
      const result = ProjectIO.deserialize(json);
      expect(result.version).toBe('999.0.0');
    });
  });

  describe('Large Project Performance', () => {
    it('should handle projects with 1000 parameters and 100 keyframes', () => {
      const start = performance.now();

      // Create large project
      const params = [];
      for (let i = 0; i < 1000; i++) {
        params.push(paramManager.createParameter({ name: `p${i}`, expression: `${i}` }));
      }

      for (let t = 0; t < 100; t++) {
        const kf = keyframeManager.createKeyframe(t, `KF${t}`);
        params.slice(0, 10).forEach(p => {
          keyframeManager.setParameterValue(kf.id, p.id, t, true);
        });
      }

      const state: ProjectState = {
        version: '1.0.0',
        metadata: { name: 'Large', created: '', modified: '' },
        parameters: paramManager.getAllParameters(),
        functions: [],
        independentVariables: [],
        keyframes: keyframeManager.getAllKeyframes(),
        timeline: { duration: 100, currentTime: 0 },
        scene: {
          spaceType: 'cartesian',
          bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 },
          gridStyleId: 'cartesian-dark',
          camera: { x: 0, y: 0, zoom: 1, rotation: 0 },
          warp: { type: 'identity', parameters: {} },
        },
      };

      // Serialize
      const json = ProjectIO.serialize(state);

      // Deserialize
      const loaded = ProjectIO.deserialize(json);

      const duration = performance.now() - start;

      // Should complete in under 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(loaded.parameters).toHaveLength(1000);
      expect(loaded.keyframes).toHaveLength(100);
    });
  });
});
