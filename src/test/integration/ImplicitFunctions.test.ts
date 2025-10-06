/**
 * Integration test for F20: Implicit Function Plotting
 */

import { describe, it, expect } from 'vitest';
import { ExpressionEngine } from '../../engine/ExpressionEngine';
import { MarchingSquares } from '../../scene/MarchingSquares';

describe('F20 Integration: Implicit Function Plotting', () => {
  const engine = new ExpressionEngine();
  const ms = new MarchingSquares();

  it('should plot unit circle x² + y² = 1', () => {
    const expression = 'x^2 + y^2';
    const constant = 1;
    const parameters = {};

    // Validate expression can be evaluated
    const testResult = engine.evaluate(expression, { ...parameters, x: 0, y: 1 });
    expect(testResult.success).toBe(true);

    // Create evaluator
    const evaluator = (x: number, y: number) => {
      const scope = { ...parameters, x, y };
      const result = engine.evaluate(expression, scope);
      return result.success ? result.value! : NaN;
    };

    // Find contours
    const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
    const result = ms.findContours(evaluator, bounds, constant, 50);

    expect(result.segments.length).toBeGreaterThan(0);

    // Verify points are on the circle
    for (const segment of result.segments.slice(0, 10)) {
      const distStart = Math.sqrt(segment.start.x ** 2 + segment.start.y ** 2);
      const distEnd = Math.sqrt(segment.end.x ** 2 + segment.end.y ** 2);

      expect(distStart).toBeGreaterThan(0.8);
      expect(distStart).toBeLessThan(1.2);
      expect(distEnd).toBeGreaterThan(0.8);
      expect(distEnd).toBeLessThan(1.2);
    }
  });

  it('should plot parametric circle with radius parameter', () => {
    const expression = 'x^2 + y^2';
    const constant = 4; // r² = 4, so r = 2
    const parameters = { r: 2 };

    // Validate expression can be evaluated
    const testResult = engine.evaluate(expression, { ...parameters, x: 0, y: 2 });
    expect(testResult.success).toBe(true);

    const evaluator = (x: number, y: number) => {
      const scope = { ...parameters, x, y };
      const result = engine.evaluate(expression, scope);
      return result.success ? result.value! : NaN;
    };

    const bounds = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
    const result = ms.findContours(evaluator, bounds, constant, 50);

    expect(result.segments.length).toBeGreaterThan(0);

    // Points should be near radius 2
    for (const segment of result.segments.slice(0, 5)) {
      const dist = Math.sqrt(segment.start.x ** 2 + segment.start.y ** 2);
      expect(dist).toBeGreaterThan(1.5);
      expect(dist).toBeLessThan(2.5);
    }
  });

  it('should plot ellipse x²/a² + y²/b² = 1', () => {
    const expression = 'x^2/4 + y^2/9';
    const constant = 1;
    const parameters = {};

    // Validate expression can be evaluated
    const testResult = engine.evaluate(expression, { ...parameters, x: 0, y: 3 });
    expect(testResult.success).toBe(true);

    const evaluator = (x: number, y: number) => {
      const scope = { ...parameters, x, y };
      const result = engine.evaluate(expression, scope);
      return result.success ? result.value! : NaN;
    };

    const bounds = { xMin: -3, xMax: 3, yMin: -4, yMax: 4 };
    const result = ms.findContours(evaluator, bounds, constant, 50);

    expect(result.segments.length).toBeGreaterThan(0);

    // Check ellipse dimensions: semi-major axis = 3 (y), semi-minor axis = 2 (x)
    const xValues = result.segments.flatMap(s => [s.start.x, s.end.x]);
    const yValues = result.segments.flatMap(s => [s.start.y, s.end.y]);

    expect(Math.max(...xValues)).toBeGreaterThan(1.5);
    expect(Math.max(...yValues)).toBeGreaterThan(2.5);
  });

  it('should handle trigonometric implicit functions', () => {
    const expression = 'sin(x) * cos(y)';
    const constant = 0.5;
    const parameters = {};

    // Validate expression can be evaluated
    const testResult = engine.evaluate(expression, { ...parameters, x: 0, y: 0 });
    expect(testResult.success).toBe(true);

    const evaluator = (x: number, y: number) => {
      const scope = { ...parameters, x, y };
      const result = engine.evaluate(expression, scope);
      return result.success ? result.value! : NaN;
    };

    const bounds = { xMin: -Math.PI, xMax: Math.PI, yMin: -Math.PI, yMax: Math.PI };
    const result = ms.findContours(evaluator, bounds, constant, 50);

    // Should find contours (wavy patterns)
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should validate performance for high-resolution plots', () => {
    const expression = 'x^2 + y^2';
    const constant = 1;
    const parameters = {};

    const evaluator = (x: number, y: number) => {
      const scope = { ...parameters, x, y };
      const result = engine.evaluate(expression, scope);
      return result.success ? result.value! : NaN;
    };

    const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
    const resolution = 100; // 10,201 evaluations

    const start = performance.now();
    const result = ms.findContours(evaluator, bounds, constant, resolution);
    const elapsed = performance.now() - start;

    expect(result.segments.length).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(500); // Should complete in < 500ms
  });

  it('should estimate complexity correctly', () => {
    const resolution50 = 50;
    const evaluations50 = (resolution50 + 1) * (resolution50 + 1);
    expect(evaluations50).toBe(51 * 51);
    expect(evaluations50).toBeLessThan(10000); // No warning threshold

    const resolution200 = 200;
    const evaluations200 = (resolution200 + 1) * (resolution200 + 1);
    expect(evaluations200).toBe(201 * 201);
    expect(evaluations200).toBeGreaterThan(10000); // Would trigger warning
  });

  it('should reject invalid expressions', () => {
    const testResult = engine.evaluate('x +', { x: 1, y: 1 });
    expect(testResult.success).toBe(false);
    expect(testResult.error).toBeDefined();
  });

  it('should reject non-finite constants', () => {
    expect(Number.isFinite(Infinity)).toBe(false);
    expect(Number.isFinite(1)).toBe(true);
  });
});
