/**
 * Unit tests for coordinate parsing (P1)
 */

import { describe, it, expect } from 'vitest';
import { ExpressionEngine } from './ExpressionEngine';

describe('ExpressionEngine - Coordinate Parsing', () => {
  const engine = new ExpressionEngine();

  describe('Single point parsing', () => {
    it('should parse simple coordinate (0, 0)', () => {
      const result = engine.parseCoordinates('(0, 0)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(1);
      expect(result.points![0]).toEqual({ x: 0, y: 0 });
    });

    it('should parse coordinate with expressions (2*3, 5+1)', () => {
      const result = engine.parseCoordinates('(2*3, 5+1)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(1);
      expect(result.points![0]).toEqual({ x: 6, y: 6 });
    });

    it('should parse coordinate with parameters', () => {
      const result = engine.parseCoordinates('(a, b)', { a: 10, b: 20 });
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(1);
      expect(result.points![0]).toEqual({ x: 10, y: 20 });
    });
  });

  describe('List range parsing', () => {
    it('should parse simple range [0..2]', () => {
      const result = engine.parseCoordinates('([0..2], 5)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(3);
      expect(result.points).toEqual([
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
      ]);
    });

    it('should parse range with parameter [0..Z]', () => {
      const result = engine.parseCoordinates('([0..Z], 0)', { Z: 3 });
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(4);
      expect(result.points).toEqual([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
      ]);
    });

    it('should parse range with custom step [0..10..2]', () => {
      const result = engine.parseCoordinates('([0..10..2], 1)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(6);
      expect(result.points).toEqual([
        { x: 0, y: 1 },
        { x: 2, y: 1 },
        { x: 4, y: 1 },
        { x: 6, y: 1 },
        { x: 8, y: 1 },
        { x: 10, y: 1 },
      ]);
    });

    it('should parse negative step [10..0..-2]', () => {
      const result = engine.parseCoordinates('([10..0..-2], 0)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(6);
      expect(result.points![0]).toEqual({ x: 10, y: 0 });
      expect(result.points![5]).toEqual({ x: 0, y: 0 });
    });
  });

  describe('Explicit list parsing', () => {
    it('should parse explicit list [0,1,2]', () => {
      const result = engine.parseCoordinates('([0,1,2], 5)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(3);
      expect(result.points).toEqual([
        { x: 0, y: 5 },
        { x: 1, y: 5 },
        { x: 2, y: 5 },
      ]);
    });

    it('should parse list with expressions [2*1, 2*2, 2*3]', () => {
      const result = engine.parseCoordinates('([2*1, 2*2, 2*3], 0)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(3);
      expect(result.points).toEqual([
        { x: 2, y: 0 },
        { x: 4, y: 0 },
        { x: 6, y: 0 },
      ]);
    });
  });

  describe('Cartesian product (grid generation)', () => {
    it('should create grid from two ranges ([0..2], [0..2])', () => {
      const result = engine.parseCoordinates('([0..2], [0..2])');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(9);

      // Check corners
      expect(result.points).toContainEqual({ x: 0, y: 0 });
      expect(result.points).toContainEqual({ x: 0, y: 2 });
      expect(result.points).toContainEqual({ x: 2, y: 0 });
      expect(result.points).toContainEqual({ x: 2, y: 2 });
    });

    it('should create grid from explicit lists', () => {
      const result = engine.parseCoordinates('([0,1], [10,20])');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(4);
      expect(result.points).toEqual([
        { x: 0, y: 10 },
        { x: 0, y: 20 },
        { x: 1, y: 10 },
        { x: 1, y: 20 },
      ]);
    });
  });

  describe('Broadcasting (single value expansion)', () => {
    it('should broadcast x value to all y values', () => {
      const result = engine.parseCoordinates('(5, [0,1,2])');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(3);
      expect(result.points).toEqual([
        { x: 5, y: 0 },
        { x: 5, y: 1 },
        { x: 5, y: 2 },
      ]);
    });

    it('should broadcast y value to all x values', () => {
      const result = engine.parseCoordinates('([0,1,2], 10)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(3);
      expect(result.points).toEqual([
        { x: 0, y: 10 },
        { x: 1, y: 10 },
        { x: 2, y: 10 },
      ]);
    });
  });

  describe('Large grid generation (performance check)', () => {
    it('should handle 100x100 grid efficiently', () => {
      const start = performance.now();
      const result = engine.parseCoordinates('([0..99], [0..99])');
      const elapsed = performance.now() - start;

      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(10000);
      expect(elapsed).toBeLessThan(100); // Should be < 100ms
    });
  });

  describe('Error handling', () => {
    it('should reject non-tuple expression', () => {
      const result = engine.parseCoordinates('5');
      expect(result.success).toBe(false);
      expect(result.error).toContain('tuple');
    });

    it('should reject tuple with only one value', () => {
      const result = engine.parseCoordinates('(5)');
      expect(result.success).toBe(false);
      expect(result.error).toContain('tuple');
    });

    it('should reject invalid range syntax', () => {
      const result = engine.parseCoordinates('([0..], 5)'); // Missing end value
      expect(result.success).toBe(false);
    });

    it('should reject undefined parameters', () => {
      const result = engine.parseCoordinates('(a, b)'); // No parameters provided
      expect(result.success).toBe(false);
    });
  });

  describe('Greek symbols and implicit multiplication', () => {
    it('should support Greek symbols in coordinates', () => {
      const result = engine.parseCoordinates('(π, τ)');
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(1);
      expect(result.points![0].x).toBeCloseTo(Math.PI);
      expect(result.points![0].y).toBeCloseTo(2 * Math.PI);
    });

    it('should support implicit multiplication in ranges', () => {
      const result = engine.parseCoordinates('([0..2*3], 0)'); // 2*3 = 6
      expect(result.success).toBe(true);
      expect(result.points).toHaveLength(7); // 0,1,2,3,4,5,6
    });
  });
});
