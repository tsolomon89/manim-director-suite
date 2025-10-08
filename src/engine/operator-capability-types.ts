/**
 * Unified Operator Capability System
 *
 * Provides a DRY, extensible architecture for all operators (fractals, calculus, complex, etc.)
 * Operators declare their capabilities (how they can be visualized, what controls they need)
 * and the system generates appropriate UI and rendering logic dynamically.
 */

import type { Complex } from './complex-types';

/**
 * Operator category for organization
 */
export type OperatorCategory =
  | 'fractal'       // Newton, Mandelbrot, Julia, Koch, Sierpinski, etc.
  | 'calculus'      // Integrals, derivatives, sums, products
  | 'complex'       // Complex functions (conjugate, arg, etc.)
  | 'geometric'     // Space-filling curves, recursive patterns
  | 'transformation' // Warps, projections
  | 'custom';       // User-defined

/**
 * Visualization modes - how the operator can be plotted
 */
export interface VisualizationModes {
  /** Iteration-based (Mandelbrot, Newton) */
  iteration?: IterationPlotConfig;

  /** Parametric curve (Koch, Hilbert) */
  parametric?: ParametricPlotConfig;

  /** Implicit function (Newton: f(z) = 0) */
  implicit?: ImplicitPlotConfig;

  /** Geometric pattern (Sierpinski triangles) */
  geometric?: GeometricPlotConfig;

  /** Domain coloring (complex functions) */
  domainColoring?: DomainColoringConfig;
}

/**
 * Iteration-based plotting (escape-time, root-convergence)
 */
export interface IterationPlotConfig {
  /** Type of iteration */
  type: 'escape-time' | 'root-convergence' | 'orbit' | 'lyapunov';

  /** Iteration formula (e.g., "z^2 + c") */
  formula?: string;

  /** Method (Newton-Raphson, etc.) */
  method?: 'newton-raphson' | 'halley' | 'custom';

  /** What happens at convergence/escape */
  outcome: 'root-index' | 'iteration-count' | 'distance' | 'custom';
}

/**
 * Parametric curve plotting
 */
export interface ParametricPlotConfig {
  /** Curve type */
  type: 'space-filling' | 'fractal-curve' | 'general';

  /** Parameter domain */
  domain: [number, number];

  /** Sample count */
  samples?: number;
}

/**
 * Implicit function plotting
 */
export interface ImplicitPlotConfig {
  /** Type of implicit equation */
  type: 'algebraic' | 'transcendental' | 'complex';

  /** Equation format */
  format: 'f(z) = 0' | 'f(x,y) = 0';

  /** Root-finding method */
  method?: 'contour' | 'marching-squares' | 'bisection';
}

/**
 * Geometric pattern plotting
 */
export interface GeometricPlotConfig {
  /** Pattern type */
  type: 'recursive-subdivision' | 'ifs' | 'l-system';

  /** Recursion depth */
  maxDepth?: number;
}

/**
 * Domain coloring configuration
 */
export interface DomainColoringConfig {
  /** Phase to hue mapping */
  phaseToHue: boolean;

  /** Magnitude to brightness */
  magnitudeToBrightness: boolean;

  /** Grid overlay */
  showGrid?: boolean;
}

/**
 * Control specification - defines what UI controls an operator needs
 */
export interface ControlSpec {
  /** Unique ID */
  id: string;

  /** Control type */
  type: ControlType;

  /** Display label */
  label: string;

  /** Description/tooltip */
  description?: string;

  /** Default value */
  default: any;

  /** Validation rules */
  validation?: ValidationRule;

  /** Visibility condition (depends on other controls) */
  visibleWhen?: VisibilityCondition;
}

/**
 * Available control types
 */
export type ControlType =
  | 'number'          // Single number slider/input
  | 'range'           // Min/max range
  | 'complex'         // Complex number (real + imag)
  | 'polynomial'      // Polynomial coefficients editor
  | 'roots'           // Complex roots editor
  | 'color'           // Single color picker
  | 'color-array'     // Gradient/multi-color picker
  | 'boolean'         // Toggle switch
  | 'select'          // Dropdown menu
  | 'vector'          // 2D/3D vector
  | 'formula'         // Expression editor
  | 'code';           // Shader/code editor

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Minimum value */
  min?: number;

  /** Maximum value */
  max?: number;

  /** Step size */
  step?: number;

  /** Integer only */
  integer?: boolean;

  /** Required (cannot be empty) */
  required?: boolean;

  /** Custom validation function */
  custom?: (value: any) => { valid: boolean; error?: string };
}

/**
 * Visibility condition (show control only if condition met)
 */
export interface VisibilityCondition {
  /** Control ID to check */
  controlId: string;

  /** Operator (equals, greater, etc.) */
  operator: 'equals' | 'not-equals' | 'greater' | 'less' | 'contains';

  /** Value to compare */
  value: any;
}

/**
 * Operator generator function - creates plottable function from config
 */
export type OperatorGenerator = (
  config: OperatorConfig,
  capability: OperatorCapability
) => PlottableFunction;

/**
 * Operator configuration (user-provided values)
 */
export interface OperatorConfig {
  /** Operator ID */
  operatorId: string;

  /** Control values (keyed by control ID) */
  values: Record<string, any>;

  /** Selected visualization mode */
  visualizationMode?: keyof VisualizationModes;
}

/**
 * Plottable function - what the generator returns
 */
export interface PlottableFunction {
  /** Function ID */
  id: string;

  /** Display name */
  name: string;

  /** Visualization mode used */
  mode: keyof VisualizationModes;

  /** Iteration function (for iteration-based) */
  iterationFn?: (z: Complex, c?: Complex) => Complex;

  /** Convergence test (for root-finding) */
  convergenceTest?: (z: Complex, roots: Complex[], tolerance: number) => {
    converged: boolean;
    rootIndex?: number;
    distance?: number;
  };

  /** Escape test (for escape-time fractals) */
  escapeTest?: (z: Complex, escapeRadius: number) => boolean;

  /** Parametric function (for curves) */
  parametricFn?: (t: number) => { x: number; y: number };

  /** Implicit function (for implicit plots) */
  implicitFn?: (x: number, y: number) => number;

  /** Color function (maps result to color) */
  colorFn: (result: IterationResult) => [number, number, number, number];

  /** Metadata */
  metadata: {
    category: OperatorCategory;
    complexity: 'low' | 'medium' | 'high';
    gpuAccelerated: boolean;
  };
}

/**
 * Iteration result
 */
export interface IterationResult {
  /** Number of iterations */
  iterations: number;

  /** Final value */
  finalValue: Complex;

  /** Converged root index (Newton) */
  rootIndex?: number;

  /** Distance to root/set */
  distance?: number;

  /** Whether it converged */
  converged: boolean;
}

/**
 * Operator preset
 */
export interface OperatorPreset {
  /** Preset ID */
  id: string;

  /** Display name */
  name: string;

  /** Description */
  description: string;

  /** Operator ID this preset is for */
  operatorId: string;

  /** Configuration values */
  config: Record<string, any>;

  /** Tags for search/filtering */
  tags?: string[];

  /** Thumbnail URL */
  thumbnail?: string;
}

/**
 * Operator capability - defines everything about an operator
 */
export interface OperatorCapability {
  /** Unique identifier */
  id: string;

  /** Display name */
  name: string;

  /** Category */
  category: OperatorCategory;

  /** Description */
  description: string;

  /** Visualization modes this operator supports */
  visualizationModes: VisualizationModes;

  /** Controls needed for this operator */
  requiredControls: ControlSpec[];

  /** Generator function */
  generatorFn: OperatorGenerator;

  /** Built-in presets */
  presets?: Record<string, OperatorPreset>;

  /** LaTeX representation template */
  latexTemplate?: string;

  /** ManimCE export support */
  manimSupport?: {
    supported: boolean;
    exportFn?: (config: OperatorConfig) => string;
  };

  /** Examples/documentation */
  examples?: Array<{
    title: string;
    config: Record<string, any>;
    description: string;
  }>;

  /** Computational complexity hint */
  complexity: 'low' | 'medium' | 'high' | 'extreme';

  /** GPU acceleration available */
  gpuAccelerated: boolean;

  /** Custom shader code (if GPU accelerated) */
  shaderCode?: {
    vertex?: string;
    fragment?: string;
  };
}

/**
 * Operator registry entry
 */
export interface OperatorRegistryEntry {
  /** Capability definition */
  capability: OperatorCapability;

  /** Enabled state */
  enabled: boolean;

  /** Priority for UI ordering */
  priority: number;

  /** Usage statistics */
  stats?: {
    usageCount: number;
    lastUsed?: Date;
  };
}

/**
 * Selection options for select controls
 */
export interface SelectOption {
  value: string | number;
  label: string;
  description?: string;
}

/**
 * Extended control spec for select controls
 */
export interface SelectControlSpec extends ControlSpec {
  type: 'select';
  options: SelectOption[];
}
