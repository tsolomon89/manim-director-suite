/**
 * Integration Tests: Project Save/Load
 * Tests the complete project serialization and deserialization workflow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ParameterManager } from '../../engine/ParameterManager';
import { KeyframeManager } from '../../timeline/KeyframeManager';
import { ProjectIO } from '../../state/ProjectIO';
import type { ProjectState } from '../../state/types';
import type { KeyframeSnapshot } from '../../timeline/types';

describe('Project Save/Load Integration', () => {
  let paramManager: ParameterManager;
  let keyframeManager: KeyframeManager;

  beforeEach(() => {
    paramManager = new ParameterManager();
    keyframeManager = new KeyframeManager();
  });

  describe('Round-trip Serialization', () => {
    it('should save and load a simple project without data loss', () => {
      const param = paramManager.createParameter('x', 42, {
        domain: { min: 0, max: 100 },
      })!;

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

      expect(loaded.metadata.name).toBe('Test Project');
      expect(loaded.parameters).toHaveLength(1);
      expect(loaded.parameters[0].name).toBe('x');
      expect(loaded.parameters[0].value).toBe(42);
      expect(loaded.keyframes).toHaveLength(1);
      expect(loaded.keyframes[0].label).toBe('Start');
    });

    it('should preserve all keyframe data', () => {
      const x = paramManager.createParameter('x', 0)!;
      const y = paramManager.createParameter('y', 0)!;

      const snapshot1: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 0, include: true, easing: 'linear' },
          [y.id]: { value: 10, include: false, easing: 'smoothstep' }
        },
        camera: { x: 0, y: 0, zoom: 1, rotation: 0, include: true },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(0, 'Start', snapshot1);

      const snapshot2: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 50, include: true, easing: 'ease-in' },
          [y.id]: { value: 20, include: true, easing: 'ease-out' }
        },
        camera: { x: 5, y: 2, zoom: 1.5, rotation: 0, include: false },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(5, 'Middle', snapshot2);

      const snapshot3: KeyframeSnapshot = {
        parameters: {
          [x.id]: { value: 100, include: true, easing: 'smoothstep' },
          [y.id]: { value: 30, include: true, easing: 'linear' }
        },
        camera: { x: 10, y: 5, zoom: 2, rotation: 0, include: true },
        warp: { type: 'identity', parameters: {}, include: false }
      };
      keyframeManager.createKeyframe(10, 'End', snapshot3);

      const state: ProjectState = {
        version: '1.0.0',
        metadata: {
          name: 'Keyframes',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        parameters: paramManager.getAllParameters(),
        functions: [],
        independentVariables: [],
        keyframes: keyframeManager.getAllKeyframes(),
        timeline: {
          duration: 10,
          currentTime: 5,
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

      expect(loaded.keyframes).toHaveLength(3);
      expect(loaded.timeline.currentTime).toBe(5);

      const loadedKf1 = loaded.keyframes.find(kf => kf.label === 'Start')!;
      expect(loadedKf1).toBeDefined();
      expect(loadedKf1.snapshot.parameters[x.id].value).toBe(0);
      expect(loadedKf1.snapshot.parameters[x.id].include).toBe(true);
      expect(loadedKf1.snapshot.parameters[x.id].easing).toBe('linear');
      expect(loadedKf1.snapshot.parameters[y.id].include).toBe(false);
      expect(loadedKf1.snapshot.camera.include).toBe(true);
    });

    it('should preserve scene configuration', () => {
      const state: ProjectState = {
        version: '1.0.0',
        metadata: {
          name: 'Scene',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        parameters: [],
        functions: [],
        independentVariables: [],
        keyframes: [],
        timeline: {
          duration: 10,
          currentTime: 0,
          playbackSpeed: 1,
          loopMode: 'once',
          fps: 60,
        },
        scene: {
          spaceType: 'polar',
          gridStyleId: 'polar-light',
          gridConfig: {
            axes: { color: '#000000', width: 1 },
            majorGrid: { color: '#CCCCCC', width: 1, spacing: 1 },
            minorGrid: { color: '#EEEEEE', width: 0.5, spacing: 0.2 },
            background: '#FFFFFF',
          },
        },
        camera: { x: 5, y: 3, zoom: 1.2, rotation: 45 },
        rendering: {
          resolution: '3840x2160',
          fps: 60,
          quality: 'high',
        },
      };

      const json = JSON.stringify(state);
      const loaded = ProjectIO.deserialize(json);

      expect(loaded.scene.spaceType).toBe('polar');
      expect(loaded.scene.gridStyleId).toBe('polar-light');
      expect(loaded.camera.zoom).toBe(1.2);
      expect(loaded.camera.rotation).toBe(45);
      expect(loaded.rendering.resolution).toBe('3840x2160');
      expect(loaded.rendering.fps).toBe(60);
    });
  });

  describe('Deterministic Reproduction', () => {
    it('should produce identical output on multiple loads', () => {
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

      const json1 = JSON.stringify(state);
      const loaded1 = ProjectIO.deserialize(json1);
      const json2 = JSON.stringify(loaded1);
      const loaded2 = ProjectIO.deserialize(json2);
      const json3 = JSON.stringify(loaded2);

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

    it('should reject incompatible version numbers', () => {
      const futureVersion = {
        version: '999.0.0',
        metadata: { name: 'Future', created: '', modified: '' },
        parameters: [],
        functions: [],
        independentVariables: [],
        keyframes: [],
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

      const json = JSON.stringify(futureVersion);

      expect(() => {
        ProjectIO.deserialize(json);
      }).toThrow('Incompatible project version');
    });
  });

  describe('Validation', () => {
    it('should validate project structure', () => {
      const validState: ProjectState = {
        version: '1.0.0',
        metadata: {
          name: 'Valid',
          created: new Date().toISOString(),
          modified: new Date().toISOString(),
        },
        parameters: [],
        functions: [],
        independentVariables: [],
        keyframes: [],
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

      const result = ProjectIO.validate(validState);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
