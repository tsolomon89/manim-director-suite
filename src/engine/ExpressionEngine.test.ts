/**
 * ExpressionEngine Unit Tests
 * Tests expression parsing, evaluation, and implicit multiplication
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ExpressionEngine } from './ExpressionEngine';

describe('ExpressionEngine', () => {
  let engine: ExpressionEngine;

  beforeEach(() => {
    engine = new ExpressionEngine();
  });

  describe('evaluate', () => {
    it('should evaluate simple numeric expressions', () => {
      const result = engine.evaluate('2 + 2', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe(4);
    });

    it('should evaluate expressions with variables', () => {
      const result = engine.evaluate('k * 2', { k: 5 });
      expect(result.success).toBe(true);
      expect(result.value).toBe(10);
    });

    it('should handle math functions', () => {
      const result = engine.evaluate('sin(pi)', {});
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(0, 10);
    });

    it('should handle Greek symbols', () => {
      const result = engine.evaluate('π * 2', {});
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(Math.PI * 2, 10);
    });

    it('should return error for invalid expressions', () => {
      const result = engine.evaluate('2 +', {});
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for undefined variables', () => {
      const result = engine.evaluate('k + 1', {});
      expect(result.success).toBe(false);
      expect(result.error).toContain('k');
    });

    it('should handle division by zero', () => {
      const result = engine.evaluate('1 / 0', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe(Infinity);
    });

    it('should handle complex expressions', () => {
      const result = engine.evaluate('sin(k * pi) + cos(k * pi)', { k: 1 });
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(-1, 10);
    });
  });

  describe('insertImplicitMultiplication', () => {
    it('should insert * between number and letter', () => {
      const result = engine.insertImplicitMultiplication('2x');
      expect(result).toBe('2*x');
    });

    it('should insert * between letter and number', () => {
      const result = engine.insertImplicitMultiplication('x2');
      expect(result).toBe('x*2');
    });

    it('should insert * between two letters', () => {
      const result = engine.insertImplicitMultiplication('xy');
      expect(result).toBe('x*y');
    });

    it('should insert * before Greek letters', () => {
      const result = engine.insertImplicitMultiplication('2π');
      expect(result).toBe('2*π');
    });

    it('should not insert * in function calls', () => {
      const result = engine.insertImplicitMultiplication('sin(x)');
      expect(result).toBe('sin(x)');
    });

    it('should handle complex implicit multiplication', () => {
      const result = engine.insertImplicitMultiplication('2πx');
      expect(result).toBe('2*π*x');
    });

    it('should not affect numbers with dots', () => {
      const result = engine.insertImplicitMultiplication('3.14x');
      expect(result).toBe('3.14*x');
    });

    it('should handle parentheses correctly', () => {
      const result = engine.insertImplicitMultiplication('2(x+1)');
      expect(result).toBe('2*(x+1)');
    });
  });

  describe('parseExpression', () => {
    it('should parse parameter definition (no LHS)', () => {
      const result = engine.parseExpression('Z=710');
      expect(result.success).toBe(true);
      expect(result.lhs?.kind).toBe('parameter');
      expect(result.lhs?.name).toBe('Z');
      expect(result.rhs).toBe('710');
    });

    it('should parse function definition', () => {
      const result = engine.parseExpression('f(x) = sin(x)');
      expect(result.success).toBe(true);
      expect(result.lhs?.kind).toBe('function');
      expect(result.lhs?.name).toBe('f');
      expect(result.lhs?.formalParams).toEqual(['x']);
      expect(result.rhs).toBe('sin(x)');
    });

    it('should parse anonymous plot', () => {
      const result = engine.parseExpression('y = sin(x)');
      expect(result.success).toBe(true);
      expect(result.lhs?.kind).toBe('anonymous');
    });

    it('should handle subscripts', () => {
      const result = engine.parseExpression('k_{gain} = 2');
      expect(result.success).toBe(true);
      expect(result.lhs?.name).toBe('k');
      expect(result.lhs?.subscript).toBe('gain');
      expect(result.lhs?.fullName).toBe('k_{gain}');
    });

    it('should return error for invalid syntax', () => {
      const result = engine.parseExpression('2 = 3');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('normalizeExpression', () => {
    it('should replace Greek symbol names', () => {
      const result = engine.normalizeExpression('\\pi');
      expect(result).toBe('π');
    });

    it('should handle multiple Greek symbols', () => {
      const result = engine.normalizeExpression('\\alpha + \\beta');
      expect(result).toBe('α + β');
    });

    it('should handle mixed content', () => {
      const result = engine.normalizeExpression('2\\pi * r');
      expect(result).toBe('2π * r');
    });
  });

  describe('extractFreeSymbols', () => {
    it('should identify free symbols', () => {
      const symbols = engine.extractFreeSymbols('k * x + y', []);
      expect(symbols.sort()).toEqual(['k', 'x', 'y']);
    });

    it('should exclude formal parameters', () => {
      const symbols = engine.extractFreeSymbols('k * x + y', ['x']);
      expect(symbols.sort()).toEqual(['k', 'y']);
    });

    it('should exclude built-in functions', () => {
      const symbols = engine.extractFreeSymbols('sin(x) + k', []);
      expect(symbols.sort()).toEqual(['k', 'x']);
    });

    it('should handle Greek symbols', () => {
      const symbols = engine.extractFreeSymbols('π * r', []);
      expect(symbols).toContain('r');
      expect(symbols).toContain('π');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty expression', () => {
      const result = engine.evaluate('', {});
      expect(result.success).toBe(false);
    });

    it('should handle very large numbers', () => {
      const result = engine.evaluate('1e100', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe(1e100);
    });

    it('should handle nested functions', () => {
      const result = engine.evaluate('sin(cos(tan(0)))', {});
      expect(result.success).toBe(true);
      expect(result.value).toBeCloseTo(Math.sin(1), 10);
    });

    it('should handle expressions with parentheses', () => {
      const result = engine.evaluate('(2 + 3) * (4 + 5)', {});
      expect(result.success).toBe(true);
      expect(result.value).toBe(45);
    });
  });
});
