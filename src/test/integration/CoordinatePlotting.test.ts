/**
 * Integration test for P1: Coordinate Point/List Plotting
 */

import { describe, it, expect } from 'vitest';
import { ExpressionEngine } from '../../engine/ExpressionEngine';

describe('P1 Integration: Coordinate Plotting', () => {
  const engine = new ExpressionEngine();

  it('should plot a 1000-point grid efficiently', () => {
    const expression = '([0..31], [0..31])'; // 32x32 = 1024 points
    const parameters = {};

    const start = performance.now();
    const result = engine.parseCoordinates(expression, parameters);
    const parseTime = performance.now() - start;

    expect(result.success).toBe(true);
    expect(result.points).toHaveLength(1024);
    expect(parseTime).toBeLessThan(50); // Should parse in < 50ms
  });

  it('should validate large datasets', () => {
    const expression = '([0..99], [0..99])'; // 10,000 points
    const parameters = {};

    const result = engine.parseCoordinates(expression, parameters);

    expect(result.success).toBe(true);
    expect(result.points).toHaveLength(10000);
  });

  it('should handle parametric coordinate expressions', () => {
    const expression = '([0..Z], k)';
    const parameters = { Z: 5, k: 10 };

    const result = engine.parseCoordinates(expression, parameters);

    expect(result.success).toBe(true);
    expect(result.points).toHaveLength(6); // 0,1,2,3,4,5
    expect(result.points![0]).toEqual({ x: 0, y: 10 });
    expect(result.points![5]).toEqual({ x: 5, y: 10 });
  });

  it('should create Mandelbrot-ready grid', () => {
    // Grid for Mandelbrot set: integer steps work better for precision
    const expression = '([-20..10..1], [-15..15..1])';
    const parameters = {};

    const start = performance.now();
    const result = engine.parseCoordinates(expression, parameters);
    const elapsed = performance.now() - start;

    expect(result.success).toBe(true);
    expect(result.points!.length).toBe(31 * 31); // 31 x-values * 31 y-values = 961
    expect(elapsed).toBeLessThan(100); // Should be fast
  });

  it('should handle tessellation patterns', () => {
    // Hexagonal tessellation starter grid
    const expression = '([0..10], [0..10])';
    const parameters = {};

    const result = engine.parseCoordinates(expression, parameters);

    expect(result.success).toBe(true);
    expect(result.points).toHaveLength(121); // 11 * 11
  });
});
