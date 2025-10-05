/**
 * ConfigManager Unit Tests
 * Tests configuration loading, validation, and access
 */

import { describe, it, expect, beforeAll, vi } from 'vitest';
import { configManager } from './ConfigManager';
import type { GridStyleConfig, ColorSchemeConfig, EasingCurveConfig } from './types';

// Mock fetch for Node.js test environment
global.fetch = vi.fn();

// Helper to mock config files
function mockConfigFiles() {
  (global.fetch as any).mockImplementation((url: string) => {
    const path = url.replace('/config/', '');

    // Mock different config files
    const mocks: Record<string, any> = {
      'defaults.json': {
        camera: { zoomMin: 0.1, zoomMax: 10, panSpeed: 1 },
        grid: { defaultStyleId: 'cartesian-dark' },
        scene: { bounds: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 } },
        parameters: { defaults: { min: -10, max: 10, step: 0.1 } },
        timeline: { defaultDuration: 10 },
        performance: { debounceMs: 16 },
      },
      'validation-rules.json': {},
      'user-settings.json': { theme: 'auto', autoSave: true },
      'presets/grid-styles/index.json': { files: ['cartesian-dark.json', 'polar-light.json', 'minimal.json', 'blueprint.json'] },
      'presets/grid-styles/cartesian-dark.json': {
        id: 'cartesian-dark',
        name: 'Dark Cartesian',
        axes: { color: '#FFFFFF', width: 2 },
        majorGrid: { color: '#444444', width: 1, spacing: 1.0 },
        minorGrid: { color: '#2A2A2A', width: 0.5 },
        background: '#000000',
      },
      'presets/grid-styles/polar-light.json': {
        id: 'polar-light',
        name: 'Light Polar',
        axes: { color: '#000000', width: 2 },
        majorGrid: { color: '#CCCCCC', width: 1, spacing: 1.0 },
        minorGrid: { color: '#E0E0E0', width: 0.5 },
        background: '#FFFFFF',
      },
      'presets/grid-styles/minimal.json': {
        id: 'minimal',
        name: 'Minimal',
        axes: { color: '#666666', width: 1 },
        majorGrid: { color: '#DDDDDD', width: 1, spacing: 1.0 },
        minorGrid: { color: '#F0F0F0', width: 0.5 },
        background: '#FAFAFA',
      },
      'presets/grid-styles/blueprint.json': {
        id: 'blueprint',
        name: 'Blueprint',
        axes: { color: '#FFFFFF', width: 2 },
        majorGrid: { color: '#4A90E2', width: 1, spacing: 1.0 },
        minorGrid: { color: '#2A5080', width: 0.5 },
        background: '#0A1E3E',
      },
      'presets/color-schemes/index.json': { files: ['scientific.json', 'vibrant.json', 'monochrome.json'] },
      'presets/color-schemes/scientific.json': {
        id: 'scientific',
        name: 'Scientific',
        palette: ['#FF0000', '#00FF00', '#0000FF'],
      },
      'presets/color-schemes/vibrant.json': {
        id: 'vibrant',
        name: 'Vibrant',
        palette: ['#E91E63', '#9C27B0', '#2196F3', '#4CAF50'],
      },
      'presets/color-schemes/monochrome.json': {
        id: 'monochrome',
        name: 'Monochrome',
        palette: ['#000000', '#666666', '#CCCCCC', '#FFFFFF'],
      },
      'presets/easing-curves/index.json': { files: ['linear.json', 'smoothstep.json', 'ease-in.json', 'ease-out.json', 'ease-in-out.json'] },
      'presets/easing-curves/linear.json': {
        id: 'linear',
        name: 'Linear',
        type: 'linear',
      },
      'presets/easing-curves/smoothstep.json': {
        id: 'smoothstep',
        name: 'Smooth Step',
        type: 'cubic',
      },
      'presets/easing-curves/ease-in.json': {
        id: 'ease-in',
        name: 'Ease In',
        type: 'cubic',
      },
      'presets/easing-curves/ease-out.json': {
        id: 'ease-out',
        name: 'Ease Out',
        type: 'cubic',
      },
      'presets/easing-curves/ease-in-out.json': {
        id: 'ease-in-out',
        name: 'Ease In Out',
        type: 'cubic',
      },
      'presets/warps/index.json': { files: ['identity.json', 'radial.json'] },
      'presets/warps/identity.json': {
        id: 'identity',
        name: 'Identity',
        type: 'identity',
      },
      'presets/warps/radial.json': {
        id: 'radial',
        name: 'Radial Distortion',
        type: 'radial',
      },
    };

    const data = mocks[path];
    if (data) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(data),
      });
    }

    return Promise.reject(new Error(`Not found: ${url}`));
  });
}

describe('ConfigManager', () => {
  // Load config before all tests
  beforeAll(async () => {
    mockConfigFiles();
    await configManager.loadAll();
  });

  describe('get', () => {
    it('should retrieve top-level config values', () => {
      const grid = configManager.get('grid');
      expect(grid).toBeDefined();
      expect(typeof grid).toBe('object');
    });

    it('should retrieve nested config values with dot notation', () => {
      const zoomMin = configManager.get<number>('camera.zoomMin');
      expect(typeof zoomMin).toBe('number');
      expect(zoomMin).toBeGreaterThan(0);
    });

    it('should return undefined for non-existent keys', () => {
      const value = configManager.get('nonexistent.key');
      expect(value).toBeUndefined();
    });

    it('should handle deeply nested paths', () => {
      const value = configManager.get('grid.defaultStyleId');
      expect(typeof value).toBe('string');
    });
  });

  describe('set', () => {
    it('should set top-level values', () => {
      const original = configManager.get('grid.defaultStyleId');

      configManager.set('grid.defaultStyleId', 'test-style');
      expect(configManager.get('grid.defaultStyleId')).toBe('test-style');

      // Restore original
      configManager.set('grid.defaultStyleId', original);
    });

    it('should set nested values with dot notation', () => {
      const original = configManager.get<number>('camera.zoomMin');

      configManager.set('camera.zoomMin', 0.5);
      expect(configManager.get<number>('camera.zoomMin')).toBe(0.5);

      // Restore original
      configManager.set('camera.zoomMin', original);
    });

    it('should create intermediate objects if needed', () => {
      configManager.set('test.nested.deep.value', 42);
      expect(configManager.get('test.nested.deep.value')).toBe(42);

      // Cleanup
      configManager.set('test', undefined);
    });
  });

  describe('getPreset', () => {
    it('should load grid style presets', () => {
      const preset = configManager.getPreset('grid-styles', 'cartesian-dark');
      expect(preset).toBeDefined();
      expect(preset?.name).toBeDefined();
      expect(preset?.axes).toBeDefined();
    });

    it('should load color scheme presets', () => {
      const preset = configManager.getPreset('color-schemes', 'scientific');
      expect(preset).toBeDefined();
      expect(preset?.palette).toBeDefined();
    });

    it('should load easing curve presets', () => {
      const preset = configManager.getPreset('easing-curves', 'smoothstep');
      expect(preset).toBeDefined();
      expect(preset?.type).toBeDefined();
    });

    it('should return undefined for non-existent presets', () => {
      const preset = configManager.getPreset('grid-styles', 'nonexistent');
      expect(preset).toBeUndefined();
    });

    it('should return undefined for non-existent categories', () => {
      const preset = configManager.getPreset('nonexistent-category', 'test');
      expect(preset).toBeUndefined();
    });
  });

  describe('getPresetIds', () => {
    it('should list all grid style IDs', () => {
      const ids = configManager.getPresetIds('grid-styles');
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids).toContain('cartesian-dark');
    });

    it('should list all color scheme IDs', () => {
      const ids = configManager.getPresetIds('color-schemes');
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent categories', () => {
      const ids = configManager.getPresetIds('nonexistent');
      expect(ids).toEqual([]);
    });
  });

  describe('Configuration Structure', () => {
    it('should have camera configuration', () => {
      const camera = configManager.get('camera');
      expect(camera).toBeDefined();
      expect(configManager.get<number>('camera.zoomMin')).toBeDefined();
      expect(configManager.get<number>('camera.zoomMax')).toBeDefined();
      expect(configManager.get<number>('camera.panSpeed')).toBeDefined();
    });

    it('should have scene configuration', () => {
      const scene = configManager.get('scene');
      expect(scene).toBeDefined();
      expect(configManager.get('scene.bounds')).toBeDefined();
    });

    it('should have parameters configuration', () => {
      const params = configManager.get('parameters');
      expect(params).toBeDefined();
      expect(configManager.get('parameters.defaults')).toBeDefined();
    });

    it('should have timeline configuration', () => {
      const timeline = configManager.get('timeline');
      expect(timeline).toBeDefined();
      expect(configManager.get<number>('timeline.defaultDuration')).toBeDefined();
    });

    it('should have performance configuration', () => {
      const perf = configManager.get('performance');
      expect(perf).toBeDefined();
      expect(configManager.get<number>('performance.debounceMs')).toBeDefined();
    });
  });

  describe('Preset Categories', () => {
    it('should have at least 4 grid style presets', () => {
      const ids = configManager.getPresetIds('grid-styles');
      expect(ids.length).toBeGreaterThanOrEqual(4);
    });

    it('should have at least 3 color scheme presets', () => {
      const ids = configManager.getPresetIds('color-schemes');
      expect(ids.length).toBeGreaterThanOrEqual(3);
    });

    it('should have at least 5 easing curves', () => {
      const ids = configManager.getPresetIds('easing-curves');
      expect(ids.length).toBeGreaterThanOrEqual(5);
    });

    it('should have at least 2 warp functions', () => {
      const ids = configManager.getPresetIds('warps');
      expect(ids.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Validation', () => {
    it('should have numeric camera zoom values', () => {
      const zoomMin = configManager.get<number>('camera.zoomMin');
      const zoomMax = configManager.get<number>('camera.zoomMax');

      expect(typeof zoomMin).toBe('number');
      expect(typeof zoomMax).toBe('number');
      expect(zoomMin).toBeLessThan(zoomMax);
    });

    it('should have valid scene bounds', () => {
      const bounds = configManager.get('scene.bounds');

      expect(bounds).toBeDefined();
      expect(typeof bounds.xMin).toBe('number');
      expect(typeof bounds.xMax).toBe('number');
      expect(typeof bounds.yMin).toBe('number');
      expect(typeof bounds.yMax).toBe('number');

      expect(bounds.xMin).toBeLessThan(bounds.xMax);
      expect(bounds.yMin).toBeLessThan(bounds.yMax);
    });

    it('should have positive debounce value', () => {
      const debounce = configManager.get<number>('performance.debounceMs');
      expect(debounce).toBeGreaterThan(0);
    });
  });

  describe('Grid Style Presets', () => {
    it('should have complete cartesian-dark preset', () => {
      const preset = configManager.getPreset('grid-styles', 'cartesian-dark');

      expect(preset?.axes).toBeDefined();
      expect(preset?.axes.color).toBeDefined();
      expect(preset?.axes.width).toBeGreaterThan(0);

      expect(preset?.majorGrid).toBeDefined();
      expect(preset?.majorGrid.color).toBeDefined();
      expect(preset?.majorGrid.spacing).toBeGreaterThan(0);

      expect(preset?.minorGrid).toBeDefined();
      expect(preset?.background).toBeDefined();
    });

    it('should have valid colors in all grid presets', () => {
      const ids = configManager.getPresetIds('grid-styles');

      ids.forEach(id => {
        const preset = configManager.getPreset('grid-styles', id);
        expect(preset?.axes?.color).toMatch(/^#[0-9A-F]{6}$/i);
        expect(preset?.majorGrid?.color).toMatch(/^#[0-9A-F]{6}$/i);
      });
    });
  });

  describe('Type Safety', () => {
    it('should work with generic type parameter', () => {
      const zoomMin = configManager.get<number>('camera.zoomMin');
      const defaultStyleId = configManager.get<string>('grid.defaultStyleId');
      const bounds = configManager.get<{ xMin: number; xMax: number }>('scene.bounds');

      expect(typeof zoomMin).toBe('number');
      expect(typeof defaultStyleId).toBe('string');
      expect(typeof bounds).toBe('object');
    });
  });
});
