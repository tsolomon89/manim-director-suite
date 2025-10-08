/**
 * Advanced Operator System
 *
 * Supports custom operators like integrals, joins, repeats, nth roots, etc.
 * Compatible with Desmos LaTeX and Manim syntax
 */

import type { Complex, ComplexNumber } from './complex-types';
import type { Parameter } from './types';

/**
 * Operator category for organization
 */
export type OperatorCategory =
  | 'arithmetic'     // +, -, *, /, ^
  | 'calculus'       // ∫, d/dx, ∑, ∏
  | 'logic'          // AND, OR, NOT, ==, <, >
  | 'list'           // join, repeat, length, filter
  | 'complex'        // conj, Re, Im, arg, abs
  | 'special'        // custom user-defined
  | 'trigonometric'  // sin, cos, tan, etc.
  | 'statistical';   // mean, median, std

/**
 * Operator arity (number of operands)
 */
export type OperatorArity = 'unary' | 'binary' | 'ternary' | 'variadic';

/**
 * Value type that operators can accept/return
 */
export type OperatorValueType =
  | 'number'
  | 'complex'
  | 'list'
  | 'boolean'
  | 'function'
  | 'any';

/**
 * Operator signature for type checking
 */
export interface OperatorSignature {
  /** Parameter types */
  params: OperatorValueType[];

  /** Return type */
  returns: OperatorValueType;

  /** Whether it accepts variable number of arguments */
  variadic?: boolean;
}

/**
 * Operator definition
 */
export interface OperatorDefinition {
  /** Unique identifier (e.g., "integrate", "join", "sqrt") */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: OperatorCategory;

  /** Arity */
  arity: OperatorArity;

  /** Type signature */
  signature: OperatorSignature;

  /** LaTeX representation (for Desmos/Manim export) */
  latex: string;

  /** Math.js function name (if available) */
  mathJsName?: string;

  /** Custom implementation function */
  implementation?: OperatorFunction;

  /** Description for documentation */
  description: string;

  /** Usage examples */
  examples: string[];
}

/**
 * Operator implementation function
 */
export type OperatorFunction = (...args: OperatorValue[]) => OperatorValue;

/**
 * Values that operators can manipulate
 */
export type OperatorValue =
  | number
  | Complex
  | number[]
  | Complex[]
  | boolean
  | ((x: number) => number)
  | ((z: Complex) => Complex);

/**
 * Integral operator configuration
 */
export interface IntegralConfig {
  /** Lower bound */
  lowerBound: number | string; // Can be expression like "a" or "0"

  /** Upper bound */
  upperBound: number | string;

  /** Integration variable (e.g., "x", "t") */
  variable: string;

  /** Integrand expression */
  expression: string;

  /** Numerical method */
  method?: 'simpson' | 'trapezoidal' | 'romberg' | 'adaptive';

  /** Number of subdivisions */
  subdivisions?: number;

  /** Tolerance for adaptive methods */
  tolerance?: number;
}

/**
 * Sum/Product operator configuration
 */
export interface SeriesConfig {
  /** Index variable (e.g., "n", "k") */
  indexVar: string;

  /** Start value */
  start: number | string;

  /** End value */
  end: number | string;

  /** Expression to sum/multiply */
  expression: string;
}

/**
 * List operator configuration (join, repeat, etc.)
 */
export interface ListOperatorConfig {
  /** Operation type */
  operation: 'join' | 'repeat' | 'map' | 'filter' | 'reduce';

  /** Lists to operate on */
  lists?: OperatorValue[];

  /** Repeat count (for repeat) */
  count?: number;

  /** Mapping/filter function */
  fn?: (item: OperatorValue, index?: number) => OperatorValue;

  /** Reducer function (for reduce) */
  reducer?: (acc: OperatorValue, item: OperatorValue) => OperatorValue;

  /** Initial value for reduce */
  initialValue?: OperatorValue;
}

/**
 * Nth root configuration
 */
export interface NthRootConfig {
  /** Radicand (value under root) */
  radicand: number | Complex;

  /** Index (which root: 2 for square, 3 for cube, etc.) */
  index: number;

  /** For complex numbers, which root to return (principal or all) */
  principal?: boolean;
}

/**
 * Operator registry entry
 */
export interface OperatorRegistryEntry {
  definition: OperatorDefinition;
  enabled: boolean;
  priority: number; // For parsing precedence
}

/**
 * Built-in operator definitions
 */
export const BUILTIN_OPERATORS: Record<string, OperatorDefinition> = {
  // ===== Calculus Operators =====
  integrate: {
    id: 'integrate',
    name: 'Definite Integral',
    category: 'calculus',
    arity: 'variadic',
    signature: {
      params: ['function', 'number', 'number'],
      returns: 'number',
      variadic: true,
    },
    latex: '\\int_{{{lower}}}^{{{upper}}} {{{expr}}} \\, d{{{var}}}',
    description: 'Compute definite integral of expression from lower to upper bound',
    examples: [
      '\\int_{0}^{1} x^2 dx',
      '\\int_{a}^{b} sin(k*x) dx',
    ],
  },

  derivative: {
    id: 'derivative',
    name: 'Derivative',
    category: 'calculus',
    arity: 'binary',
    signature: {
      params: ['function', 'any'],
      returns: 'function',
    },
    latex: '\\frac{d}{d{{{var}}}} {{{expr}}}',
    mathJsName: 'derivative',
    description: 'Compute derivative of expression with respect to variable',
    examples: [
      'd/dx (x^2 + 3x)',
      '∂/∂t (e^(kt))',
    ],
  },

  sum: {
    id: 'sum',
    name: 'Summation',
    category: 'calculus',
    arity: 'variadic',
    signature: {
      params: ['any', 'number', 'number'],
      returns: 'number',
      variadic: true,
    },
    latex: '\\sum_{{{var}}={{{start}}}}^{{{end}}} {{{expr}}}',
    description: 'Sum expression over range of index variable',
    examples: [
      '∑_{n=1}^{10} n^2',
      '∑_{k=0}^{N} (1/k!)',
    ],
  },

  product: {
    id: 'product',
    name: 'Product',
    category: 'calculus',
    arity: 'variadic',
    signature: {
      params: ['any', 'number', 'number'],
      returns: 'number',
      variadic: true,
    },
    latex: '\\prod_{{{var}}={{{start}}}}^{{{end}}} {{{expr}}}',
    description: 'Multiply expression over range of index variable',
    examples: [
      '∏_{k=1}^{n} k  (factorial)',
      '∏_{i=1}^{5} (1 + 1/i)',
    ],
  },

  // ===== List Operators =====
  join: {
    id: 'join',
    name: 'Join Lists',
    category: 'list',
    arity: 'variadic',
    signature: {
      params: ['list'],
      returns: 'list',
      variadic: true,
    },
    latex: '\\operatorname{join}\\left({{{lists}}}\\right)',
    description: 'Concatenate multiple lists into one',
    examples: [
      'join([1,2,3], [4,5,6]) → [1,2,3,4,5,6]',
      'join(A, B, C)',
    ],
  },

  repeat: {
    id: 'repeat',
    name: 'Repeat List',
    category: 'list',
    arity: 'binary',
    signature: {
      params: ['list', 'number'],
      returns: 'list',
    },
    latex: '\\operatorname{repeat}\\left({{{list}}}, {{{count}}}\\right)',
    description: 'Repeat list elements n times',
    examples: [
      'repeat([1,2,3], 2) → [1,2,3,1,2,3]',
      'repeat(L, k)',
    ],
  },

  length: {
    id: 'length',
    name: 'List Length',
    category: 'list',
    arity: 'unary',
    signature: {
      params: ['list'],
      returns: 'number',
    },
    latex: '\\operatorname{length}\\left({{{list}}}\\right)',
    mathJsName: 'size',
    description: 'Return number of elements in list',
    examples: [
      'length([1,2,3,4,5]) → 5',
      'length(A)',
    ],
  },

  // ===== Nth Root =====
  nthroot: {
    id: 'nthroot',
    name: 'Nth Root',
    category: 'arithmetic',
    arity: 'binary',
    signature: {
      params: ['number', 'number'],
      returns: 'number',
    },
    latex: '\\sqrt[{{{index}}}]{{{radicand}}}',
    description: 'Compute nth root of value',
    examples: [
      '√[3]{27} → 3 (cube root)',
      '√[2]{16} → 4 (square root)',
    ],
  },

  // ===== Complex Operators =====
  conjugate: {
    id: 'conjugate',
    name: 'Complex Conjugate',
    category: 'complex',
    arity: 'unary',
    signature: {
      params: ['complex'],
      returns: 'complex',
    },
    latex: '\\overline{{{z}}}',
    description: 'Return complex conjugate (a+bi → a-bi)',
    examples: [
      'conj(3+4i) → 3-4i',
      'conj(z)',
    ],
  },

  arg: {
    id: 'arg',
    name: 'Complex Argument',
    category: 'complex',
    arity: 'unary',
    signature: {
      params: ['complex'],
      returns: 'number',
    },
    latex: '\\operatorname{arg}\\left({{{z}}}\\right)',
    mathJsName: 'arg',
    description: 'Return angle of complex number in radians',
    examples: [
      'arg(1+i) → π/4',
      'arg(z)',
    ],
  },

  re: {
    id: 're',
    name: 'Real Part',
    category: 'complex',
    arity: 'unary',
    signature: {
      params: ['complex'],
      returns: 'number',
    },
    latex: '\\operatorname{Re}\\left({{{z}}}\\right)',
    mathJsName: 're',
    description: 'Return real part of complex number',
    examples: [
      'Re(3+4i) → 3',
      'Re(z)',
    ],
  },

  im: {
    id: 'im',
    name: 'Imaginary Part',
    category: 'complex',
    arity: 'unary',
    signature: {
      params: ['complex'],
      returns: 'number',
    },
    latex: '\\operatorname{Im}\\left({{{z}}}\\right)',
    mathJsName: 'im',
    description: 'Return imaginary part of complex number',
    examples: [
      'Im(3+4i) → 4',
      'Im(z)',
    ],
  },

  abs: {
    id: 'abs',
    name: 'Absolute Value / Magnitude',
    category: 'complex',
    arity: 'unary',
    signature: {
      params: ['any'],
      returns: 'number',
    },
    latex: '\\left|{{{value}}}\\right|',
    mathJsName: 'abs',
    description: 'Return absolute value (real) or magnitude (complex)',
    examples: [
      'abs(-5) → 5',
      'abs(3+4i) → 5',
    ],
  },
};
