/**
 * Fractal Function Types
 *
 * Extends FunctionDefinition to support:
 * - Complex polynomial functions
 * - Newton/Mandelbrot/Julia fractals
 * - Multi-root coloring
 * - Iteration-based rendering
 */

import type { Complex, ComplexNumber } from './complex-types';
import type { FunctionDefinition } from './expression-types';

/**
 * Fractal type
 */
export type FractalType = 'newton' | 'mandelbrot' | 'julia' | 'burning-ship' | 'custom';

/**
 * Color mode for fractal rendering
 */
export type FractalColorMode =
  | 'single'           // Single color (traditional function)
  | 'gradient'         // Gradient based on value/iteration
  | 'root-based'       // Different color per convergence root (Newton)
  | 'iteration-based'  // Color ramp based on iteration count (Mandelbrot)
  | 'domain-coloring'; // Complex domain coloring (phase/magnitude)

/**
 * Gradient configuration
 */
export interface GradientConfig {
  /** Gradient type */
  type: 'linear' | 'radial' | 'conic';

  /** Color stops */
  stops: Array<{
    /** Position in [0, 1] */
    offset: number;
    /** Color (hex, rgb, rgba) */
    color: string;
  }>;

  /** Smoothing function */
  smoothing?: 'linear' | 'smooth' | 'smoother';
}

/**
 * Root-based coloring configuration
 */
export interface RootColorConfig {
  /** Colors assigned to each root */
  rootColors: string[];

  /** Color for non-convergent points */
  divergentColor?: string;

  /** Blend mode for basin boundaries */
  blendMode?: 'sharp' | 'smooth' | 'distance';

  /** Distance-based shading */
  distanceShading?: boolean;
}

/**
 * Iteration-based coloring configuration
 */
export interface IterationColorConfig {
  /** Minimum iterations (inside set) */
  minIterations: number;

  /** Maximum iterations (escape threshold) */
  maxIterations: number;

  /** Color scale (array of colors to interpolate) */
  colorScale: string[];

  /** Color for points inside set (never escape) */
  insideColor: string;

  /** Color for points outside set (divergent) */
  outsideColor?: string;

  /** Smoothing method */
  smoothing?: 'none' | 'linear' | 'log' | 'sqrt';

  /** Reverse color scale */
  reverse?: boolean;
}

/**
 * Domain coloring configuration (for complex functions)
 */
export interface DomainColorConfig {
  /** Use phase (angle) for hue */
  phaseToHue: boolean;

  /** Use magnitude for brightness/saturation */
  magnitudeToBrightness: boolean;

  /** Magnitude scale (log, linear, sqrt) */
  magnitudeScale?: 'linear' | 'log' | 'sqrt';

  /** Show grid lines at integer values */
  showGrid?: boolean;

  /** Grid line color */
  gridColor?: string;
}

/**
 * Extended function style for fractals
 */
export interface FractalStyle {
  /** Color mode */
  colorMode: FractalColorMode;

  /** Single color (for colorMode='single') */
  color?: string;

  /** Gradient config (for colorMode='gradient') */
  gradient?: GradientConfig;

  /** Root coloring (for colorMode='root-based') */
  rootColors?: RootColorConfig;

  /** Iteration coloring (for colorMode='iteration-based') */
  iterationColors?: IterationColorConfig;

  /** Domain coloring (for colorMode='domain-coloring') */
  domainColors?: DomainColorConfig;

  /** Opacity */
  opacity: number;

  /** Line width (for contours/boundaries) */
  lineWidth?: number;

  /** Line type */
  lineType?: 'solid' | 'dashed' | 'points' | 'spline' | 'fill';

  /** Anti-aliasing */
  antiAlias?: boolean;

  /** Saturation multiplier */
  saturation?: number;
}

/**
 * Fractal rendering configuration
 */
export interface FractalRenderConfig {
  /** Maximum iterations */
  maxIterations: number;

  /** Escape radius (for Mandelbrot/Julia) */
  escapeRadius?: number;

  /** Convergence tolerance (for Newton) */
  tolerance?: number;

  /** Use GPU rendering (WebGL) */
  useGPU: boolean;

  /** Resolution multiplier (for high-DPI) */
  resolutionMultiplier?: number;

  /** Super-sampling (anti-aliasing) */
  superSampling?: 1 | 2 | 4;

  /** Progressive rendering (show draft first) */
  progressive?: boolean;
}

/**
 * Newton fractal configuration
 */
export interface NewtonFractalConfig {
  /** Polynomial coefficients (lowest to highest degree) */
  coefficients?: Complex[];

  /** Polynomial roots (alternative to coefficients) */
  roots?: Complex[];

  /** Derivative coefficients (auto-computed if not provided) */
  derivativeCoefficients?: Complex[];

  /** Color per root */
  rootColors: string[];

  /** Highlight Julia set parameter */
  juliaHighlight?: number;

  /** Show black for cycles/non-convergent points */
  blackForCycles?: boolean;
}

/**
 * Mandelbrot/Julia set configuration
 */
export interface MandelbrotJuliaConfig {
  /** Julia set parameter (c value for z^2 + c) */
  juliaParameter?: Complex;

  /** Power (for generalized: z^p + c) */
  power?: number;

  /** Iteration colormap */
  colorMap: IterationColorConfig;

  /** Show orbit path for a point */
  showOrbit?: boolean;

  /** Orbit point */
  orbitPoint?: Complex;
}

/**
 * Fractal function definition (extends FunctionDefinition)
 */
export interface FractalFunction extends Omit<FunctionDefinition, 'style'> {
  /** Fractal type */
  fractalType: FractalType;

  /** Extended style with color modes */
  style: FractalStyle;

  /** Render configuration */
  renderConfig: FractalRenderConfig;

  /** Newton fractal config (if fractalType='newton') */
  newtonConfig?: NewtonFractalConfig;

  /** Mandelbrot/Julia config (if fractalType='mandelbrot' or 'julia') */
  mandelbrotJuliaConfig?: MandelbrotJuliaConfig;

  /** Custom shader code (if fractalType='custom') */
  customShaderCode?: string;
}

/**
 * Fractal evaluation result (for per-pixel rendering)
 */
export interface FractalEvaluationResult {
  /** Convergence/divergence */
  converged: boolean;

  /** Which root it converged to (Newton) */
  rootIndex?: number;

  /** Iteration count */
  iterations: number;

  /** Final z value */
  finalValue: Complex;

  /** Distance to nearest root/set */
  distance?: number;

  /** Color to render (RGB) */
  color: [number, number, number];

  /** Alpha (opacity) */
  alpha: number;
}

/**
 * Preset fractal configurations
 */
export const FRACTAL_PRESETS = {
  // Classic Newton fractals
  'newton-cubic': {
    name: 'Newton Cubic (z³ - 1)',
    fractalType: 'newton' as FractalType,
    newtonConfig: {
      coefficients: [
        { real: -1, imag: 0 }, // -1
        { real: 0, imag: 0 },  // 0*z
        { real: 0, imag: 0 },  // 0*z²
        { real: 1, imag: 0 },  // 1*z³
      ],
      rootColors: ['#FF0000', '#00FF00', '#0000FF'],
    },
  },

  'newton-quintic': {
    name: 'Newton Quintic (z⁵ - 1)',
    fractalType: 'newton' as FractalType,
    newtonConfig: {
      coefficients: [
        { real: -1, imag: 0 }, // -1
        { real: 0, imag: 0 },
        { real: 0, imag: 0 },
        { real: 0, imag: 0 },
        { real: 0, imag: 0 },
        { real: 1, imag: 0 },  // z⁵
      ],
      rootColors: ['#440154', '#3b528b', '#21908c', '#5dc963', '#fde725'],
    },
  },

  // Classic Mandelbrot
  'mandelbrot-classic': {
    name: 'Classic Mandelbrot Set',
    fractalType: 'mandelbrot' as FractalType,
    mandelbrotJuliaConfig: {
      power: 2,
      colorMap: {
        minIterations: 0,
        maxIterations: 256,
        colorScale: ['#000033', '#000055', '#0000BB', '#0E4C92', '#2E8BC0', '#1DD3B0', '#B2EC5D', '#FFFF00', '#FFFFFF'],
        insideColor: '#000000',
        smoothing: 'log',
      },
    },
  },

  // Julia set
  'julia-standard': {
    name: 'Julia Set (c = -0.7 + 0.27i)',
    fractalType: 'julia' as FractalType,
    mandelbrotJuliaConfig: {
      juliaParameter: { real: -0.7, imag: 0.27 },
      power: 2,
      colorMap: {
        minIterations: 0,
        maxIterations: 256,
        colorScale: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#94618e', '#f4abc4'],
        insideColor: '#000000',
        smoothing: 'sqrt',
      },
    },
  },

  // Burning Ship
  'burning-ship': {
    name: 'Burning Ship Fractal',
    fractalType: 'burning-ship' as FractalType,
    mandelbrotJuliaConfig: {
      power: 2,
      colorMap: {
        minIterations: 0,
        maxIterations: 512,
        colorScale: ['#000000', '#1a0000', '#330000', '#4d0000', '#800000', '#b30000', '#ff0000', '#ff6666', '#ffcccc'],
        insideColor: '#000000',
        smoothing: 'log',
      },
    },
  },
};

/**
 * Default fractal render config
 */
export const DEFAULT_FRACTAL_RENDER_CONFIG: FractalRenderConfig = {
  maxIterations: 100,
  escapeRadius: 2.0,
  tolerance: 1e-6,
  useGPU: true,
  resolutionMultiplier: 1,
  superSampling: 1,
  progressive: true,
};

/**
 * Default fractal style
 */
export const DEFAULT_FRACTAL_STYLE: FractalStyle = {
  colorMode: 'iteration-based',
  opacity: 1.0,
  lineWidth: 1,
  lineType: 'fill',
  antiAlias: true,
  saturation: 1.0,
  iterationColors: {
    minIterations: 0,
    maxIterations: 256,
    colorScale: ['#000033', '#0000BB', '#2E8BC0', '#B2EC5D', '#FFFF00', '#FFFFFF'],
    insideColor: '#000000',
    smoothing: 'log',
  },
};
