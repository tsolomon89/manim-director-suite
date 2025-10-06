/**
 * Unit tests for Marching Squares algorithm
 */

import { describe, it, expect } from 'vitest';
import { MarchingSquares } from './MarchingSquares';

describe('MarchingSquares', () => {
  const ms = new MarchingSquares();

  describe('Circle detection', () => {
    it('should find contours for unit circle x² + y² = 1', () => {
      const evaluator = (x: number, y: number) => x * x + y * y;
      const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
      const targetValue = 1; // x² + y² = 1
      const resolution = 20;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);
      expect(result.gridSize).toBe(20);
      expect(result.evaluationCount).toBe((resolution + 1) * (resolution + 1));

      // Verify some segments are roughly on the circle
      for (const segment of result.segments) {
        const { start, end } = segment;
        const distStart = Math.sqrt(start.x ** 2 + start.y ** 2);
        const distEnd = Math.sqrt(end.x ** 2 + end.y ** 2);

        // Should be close to radius 1
        expect(distStart).toBeGreaterThan(0.8);
        expect(distStart).toBeLessThan(1.2);
        expect(distEnd).toBeGreaterThan(0.8);
        expect(distEnd).toBeLessThan(1.2);
      }
    });

    it('should find larger circle x² + y² = 4', () => {
      const evaluator = (x: number, y: number) => x * x + y * y;
      const bounds = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };
      const targetValue = 4; // radius = 2
      const resolution = 20;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);

      // Check points are near radius 2
      for (const segment of result.segments.slice(0, 5)) {
        const distStart = Math.sqrt(segment.start.x ** 2 + segment.start.y ** 2);
        expect(distStart).toBeGreaterThan(1.5);
        expect(distStart).toBeLessThan(2.5);
      }
    });
  });

  describe('Line detection', () => {
    it('should find vertical line x = 0', () => {
      const evaluator = (x: number, _y: number) => x;
      const bounds = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
      const targetValue = 0; // x = 0
      const resolution = 10;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);

      // All x coordinates should be close to 0
      for (const segment of result.segments) {
        expect(Math.abs(segment.start.x)).toBeLessThan(0.15);
        expect(Math.abs(segment.end.x)).toBeLessThan(0.15);
      }
    });

    it('should find horizontal line y = 0', () => {
      const evaluator = (_x: number, y: number) => y;
      const bounds = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
      const targetValue = 0; // y = 0
      const resolution = 10;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);

      // All y coordinates should be close to 0
      for (const segment of result.segments) {
        expect(Math.abs(segment.start.y)).toBeLessThan(0.15);
        expect(Math.abs(segment.end.y)).toBeLessThan(0.15);
      }
    });

    it('should find diagonal line x - y = 0', () => {
      const evaluator = (x: number, y: number) => x - y;
      const bounds = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
      const targetValue = 0; // x = y
      const resolution = 10;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);

      // Points should satisfy x ≈ y
      for (const segment of result.segments) {
        expect(Math.abs(segment.start.x - segment.start.y)).toBeLessThan(0.2);
        expect(Math.abs(segment.end.x - segment.end.y)).toBeLessThan(0.2);
      }
    });
  });

  describe('Ellipse detection', () => {
    it('should find ellipse x²/4 + y²/1 = 1', () => {
      const evaluator = (x: number, y: number) => (x * x) / 4 + y * y;
      const bounds = { xMin: -3, xMax: 3, yMin: -2, yMax: 2 };
      const targetValue = 1;
      const resolution = 20;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBeGreaterThan(0);

      // Major axis along x (should reach ±2)
      // Minor axis along y (should reach ±1)
      const xValues = result.segments.flatMap(s => [s.start.x, s.end.x]);
      const yValues = result.segments.flatMap(s => [s.start.y, s.end.y]);

      expect(Math.max(...xValues)).toBeGreaterThan(1.5);
      expect(Math.min(...xValues)).toBeLessThan(-1.5);
      expect(Math.max(...yValues)).toBeGreaterThan(0.8);
      expect(Math.min(...yValues)).toBeLessThan(-0.8);
    });
  });

  describe('Edge cases', () => {
    it('should handle function with no contours in bounds', () => {
      const evaluator = (x: number, y: number) => x * x + y * y;
      const bounds = { xMin: 5, xMax: 10, yMin: 5, yMax: 10 };
      const targetValue = 1; // Circle is at origin, far from bounds
      const resolution = 10;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      expect(result.segments.length).toBe(0);
      expect(result.evaluationCount).toBe(11 * 11);
    });

    it('should handle constant function', () => {
      const evaluator = (_x: number, _y: number) => 5;
      const bounds = { xMin: -1, xMax: 1, yMin: -1, yMax: 1 };
      const targetValue = 5;
      const resolution = 10;

      const result = ms.findContours(evaluator, bounds, targetValue, resolution);

      // Constant function touching target value everywhere - edge case
      // Marching squares will produce segments at grid boundaries
      expect(result.evaluationCount).toBe(11 * 11);
    });
  });

  describe('Performance', () => {
    it('should handle high resolution efficiently', () => {
      const evaluator = (x: number, y: number) => x * x + y * y;
      const bounds = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
      const targetValue = 1;
      const resolution = 100; // 10,201 evaluations

      const start = performance.now();
      const result = ms.findContours(evaluator, bounds, targetValue, resolution);
      const elapsed = performance.now() - start;

      expect(result.segments.length).toBeGreaterThan(0);
      expect(elapsed).toBeLessThan(100); // Should complete in < 100ms
    });
  });
});
