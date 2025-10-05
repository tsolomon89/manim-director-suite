/**
 * Expression UX & Workflow Type Definitions
 * Defines types for LHS parsing, function definitions, and parameter roles
 */

import type { ParameterRole } from './types';

/**
 * Kind of expression based on LHS structure
 */
export type ExpressionKind = 'parameter' | 'function' | 'anonymous';

/**
 * Parsed left-hand side of an expression
 */
export interface ParsedLHS {
  /** Kind of expression (parameter, function, or anonymous) */
  kind: ExpressionKind;

  /** Base name (single letter) */
  name: string;

  /** Optional subscript (e.g., 'gain' in x_{gain}) */
  subscript?: string;

  /** Full symbol name (e.g., 'x_{gain}' or just 'x') */
  fullName: string;

  /** Function arity (number of arguments, undefined for parameters) */
  arity?: number;

  /** Formal parameters for functions (e.g., ['x'] for f(x)) */
  formalParams?: string[];

  /** Raw LHS string before parsing */
  raw: string;
}

/**
 * Function definition with metadata
 */
export interface FunctionDefinition {
  /** Unique identifier */
  id: string;

  /** Parsed LHS information */
  lhs: ParsedLHS;

  /** Right-hand side expression */
  expression: string;

  /** ID of the independent variable parameter (e.g., x) */
  independentVarId: string;

  /** Free symbols discovered in RHS (excluding formals) */
  dependencies: string[];

  /** Visual style */
  style: {
    color: string;
    opacity: number;
    lineWidth: number;
    lineType: 'solid' | 'dashed' | 'points' | 'spline';
  };

  /** Visibility toggle */
  visible: boolean;

  /** Computed statistics (read-only) */
  stats?: FunctionStats;

  /** Error message if evaluation fails */
  error?: string;
}

/**
 * Computed statistics for a function
 */
export interface FunctionStats {
  /** Number of samples evaluated */
  sampleCount: number;

  /** Minimum y value */
  yMin: number;

  /** Maximum y value */
  yMax: number;

  /** Number of zero crossings detected */
  zeroCrossings: number;

  /** Mean value over the domain */
  mean: number;

  /** Whether the function is continuous (no gaps) */
  continuous: boolean;
}

/**
 * Result of parsing an expression with LHS
 */
export interface ParseResult {
  /** Success flag */
  success: boolean;

  /** Parsed LHS */
  lhs?: ParsedLHS;

  /** Normalized RHS expression */
  rhs?: string;

  /** Error message if parsing failed */
  error?: string;

  /** Warnings (non-fatal) */
  warnings?: string[];
}

/**
 * Validation result for LHS naming
 */
export interface LHSValidationResult {
  /** Is valid */
  valid: boolean;

  /** Error messages */
  errors?: string[];

  /** Warnings */
  warnings?: string[];

  /** Fix-it suggestions */
  suggestions?: string[];
}

/**
 * Auto-parameterization result
 */
export interface AutoParameterizationResult {
  /** Symbols that were auto-created */
  created: string[];

  /** Symbols that already existed */
  existing: string[];

  /** Symbols that are built-ins (excluded) */
  builtins: string[];

  /** Errors during auto-creation */
  errors?: string[];
}

/**
 * Function call signature for validation
 */
export interface FunctionCall {
  /** Function name being called */
  name: string;

  /** Number of arguments provided */
  argsProvided: number;

  /** Expected arity of the function */
  arityExpected?: number;
}

/**
 * Enhanced parameter interface with role
 */
export interface ParameterWithRole {
  /** Unique identifier */
  id: string;

  /** Parameter name (single letter + optional subscript) */
  name: string;

  /** Kind of value (number or list) */
  kind: 'number' | 'list';

  /** Expression (must be numeric-only, no operators) */
  expression: string;

  /** Current value */
  value: number | number[];

  /** Domain constraints (for numbers only) */
  domain?: {
    min: number;
    max: number;
  };

  /** UI control configuration */
  uiControl?: {
    type: 'slider' | 'number' | 'stepper';
    min: number;
    max: number;
    step: number;
  };

  /** Role in the system */
  role?: ParameterRole;

  /** Dependencies (IDs of other parameters) */
  dependencies?: string[];

  /** Error message if evaluation fails */
  error?: string;

  /** Metadata */
  metadata?: {
    source?: 'user' | 'desmos' | 'auto' | 'import';
    created?: string;
    modified?: string;
    description?: string;
  };
}

/**
 * Independent variable configuration
 */
export interface IndependentVariable {
  /** Parameter ID */
  id: string;

  /** Name (e.g., 'x', 't', 'x_{f}') */
  name: string;

  /** Domain for plotting */
  domain: {
    min: number;
    max: number;
    step: number;
  };

  /** List of function IDs using this variable */
  linkedFunctions: string[];
}

/**
 * Result of binding free symbols to parameters
 */
export interface BindingResult {
  /** Successfully bound symbols */
  bound: Map<string, string>; // symbol name → parameter ID

  /** Symbols that couldn't be resolved */
  unresolved: string[];

  /** Errors during binding */
  errors: string[];
}

/**
 * Fix-it action for error recovery
 */
export interface FixItAction {
  /** Action type */
  type: 'convert-to-function' | 'demote-to-parameter' | 'rename-symbol' | 'add-argument';

  /** Display label */
  label: string;

  /** Description of what the action does */
  description: string;

  /** Data needed to perform the action */
  data: any;
}
