/**
 * Newton Fractal Operator Capability
 *
 * Defines Newton-Raphson root-finding fractals
 * Iteration: z_{n+1} = z_n - f(z_n)/f'(z_n)
 */

import type {
  OperatorCapability,
  OperatorConfig,
  PlottableFunction,
  IterationResult,
} from '../../operator-capability-types';
import { Complex, ComplexPolynomial } from '../../complex-types';

/**
 * Newton iteration function
 */
function newtonIteration(
  z: Complex,
  polynomial: ComplexPolynomial,
  derivative: ComplexPolynomial
): Complex {
  const fz = polynomial.evaluate({ real: z.real, imag: z.imag });
  const fpz = derivative.evaluate({ real: z.real, imag: z.imag });

  // z - f(z)/f'(z)
  const fzComplex = new Complex(fz.real, fz.imag);
  const fpzComplex = new Complex(fpz.real, fpz.imag);

  return new Complex(z.real, z.imag).subtract(fzComplex.divide(fpzComplex));
}

/**
 * Find nearest root
 */
function findNearestRoot(
  z: Complex,
  roots: Complex[],
  tolerance: number
): { converged: boolean; rootIndex?: number; distance?: number } {
  let minDistance = Infinity;
  let nearestIndex = -1;

  for (let i = 0; i < roots.length; i++) {
    const root = roots[i];
    const dx = z.real - root.real;
    const dy = z.imag - root.imag;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearestIndex = i;
    }
  }

  return {
    converged: minDistance < tolerance,
    rootIndex: nearestIndex >= 0 ? nearestIndex : undefined,
    distance: minDistance,
  };
}

/**
 * Blend root color based on distance
 */
function blendRootColor(
  baseColor: string,
  distance: number,
  saturation: number
): [number, number, number, number] {
  // Convert hex to RGB
  const rgb = hexToRgb(baseColor);

  // Apply distance-based shading
  const shadeFactor = Math.exp(-distance * 5) * saturation;

  return [rgb[0] * shadeFactor, rgb[1] * shadeFactor, rgb[2] * shadeFactor, 1.0];
}

/**
 * Hex to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1];
}

/**
 * Newton fractal capability
 */
export const newtonFractalCapability: OperatorCapability = {
  id: 'newton',
  name: 'Newton Fractal',
  category: 'fractal',
  description: 'Newton-Raphson root-finding fractal. Visualizes basins of attraction for polynomial roots.',

  visualizationModes: {
    iteration: {
      type: 'root-convergence',
      method: 'newton-raphson',
      outcome: 'root-index',
    },
    implicit: {
      type: 'complex',
      format: 'f(z) = 0',
      method: 'contour',
    },
  },

  requiredControls: [
    {
      id: 'roots',
      type: 'roots',
      label: 'Polynomial Roots',
      description: 'Complex roots of the polynomial (up to 5)',
      default: [
        { real: 1, imag: 0 },
        { real: -0.5, imag: 0.866 },
        { real: -0.5, imag: -0.866 },
      ],
      validation: {
        custom: (value) => {
          if (!Array.isArray(value)) {
            return { valid: false, error: 'Roots must be an array' };
          }
          if (value.length === 0) {
            return { valid: false, error: 'At least one root is required' };
          }
          if (value.length > 5) {
            return { valid: false, error: 'Maximum 5 roots supported' };
          }
          return { valid: true };
        },
      },
    },
    {
      id: 'rootColors',
      type: 'color-array',
      label: 'Root Colors',
      description: 'Color for each root basin',
      default: ['#FF0000', '#00FF00', '#0000FF'],
    },
    {
      id: 'maxIterations',
      type: 'number',
      label: 'Max Iterations',
      description: 'Maximum number of Newton iterations',
      default: 100,
      validation: {
        min: 10,
        max: 1000,
        integer: true,
      },
    },
    {
      id: 'tolerance',
      type: 'number',
      label: 'Convergence Tolerance',
      description: 'Distance threshold for root convergence',
      default: 1e-6,
      validation: {
        min: 1e-10,
        max: 0.1,
      },
    },
    {
      id: 'saturation',
      type: 'number',
      label: 'Color Saturation',
      description: 'Saturation factor for distance-based shading',
      default: 0.5,
      validation: {
        min: 0,
        max: 1,
      },
    },
    {
      id: 'blackForCycles',
      type: 'boolean',
      label: 'Black for Cycles',
      description: 'Show non-convergent points as black',
      default: false,
    },
  ],

  generatorFn: (config: OperatorConfig, capability: OperatorCapability): PlottableFunction => {
    const roots = config.values.roots as Complex[];
    const rootColors = config.values.rootColors as string[];
    const maxIterations = config.values.maxIterations as number;
    const tolerance = config.values.tolerance as number;
    const saturation = config.values.saturation as number;
    const blackForCycles = config.values.blackForCycles as boolean;

    // Build polynomial from roots
    const polynomial = ComplexPolynomial.fromRoots(roots);
    const derivative = polynomial.derivative();

    // Ensure enough colors
    const colors = [...rootColors];
    const defaultColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
    while (colors.length < roots.length) {
      colors.push(defaultColors[colors.length % defaultColors.length]);
    }

    return {
      id: `newton-${Date.now()}`,
      name: `Newton (degree ${roots.length})`,
      mode: 'iteration',

      iterationFn: (z: Complex) => newtonIteration(z, polynomial, derivative),

      convergenceTest: (z: Complex) => findNearestRoot(z, roots, tolerance),

      colorFn: (result: IterationResult): [number, number, number, number] => {
        if (!result.converged && blackForCycles) {
          return [0, 0, 0, 1];
        }

        if (result.rootIndex !== undefined && result.distance !== undefined) {
          const color = colors[result.rootIndex] || '#FFFFFF';
          return blendRootColor(color, result.distance, saturation);
        }

        // Divergent (should rarely happen with Newton)
        return [0.2, 0.2, 0.2, 1];
      },

      metadata: {
        category: 'fractal',
        complexity: roots.length > 3 ? 'high' : 'medium',
        gpuAccelerated: true,
      },
    };
  },

  presets: {
    'newton-cubic': {
      id: 'newton-cubic',
      name: 'Cubic (z³ - 1)',
      description: 'Classic Newton fractal with 3 roots',
      operatorId: 'newton',
      config: {
        roots: [
          { real: 1, imag: 0 },
          { real: -0.5, imag: 0.866 },
          { real: -0.5, imag: -0.866 },
        ],
        rootColors: ['#FF0000', '#00FF00', '#0000FF'],
        maxIterations: 100,
        tolerance: 1e-6,
        saturation: 0.5,
        blackForCycles: false,
      },
      tags: ['classic', 'cubic', 'simple'],
    },
    'newton-quintic': {
      id: 'newton-quintic',
      name: 'Quintic (z⁵ - 1)',
      description: 'Newton fractal with 5 roots',
      operatorId: 'newton',
      config: {
        roots: [
          { real: 1, imag: 0 },
          { real: 0.309, imag: 0.951 },
          { real: -0.809, imag: 0.588 },
          { real: -0.809, imag: -0.588 },
          { real: 0.309, imag: -0.951 },
        ],
        rootColors: ['#440154', '#3b528b', '#21908c', '#5dc963', '#fde725'],
        maxIterations: 100,
        tolerance: 1e-6,
        saturation: 0.6,
        blackForCycles: false,
      },
      tags: ['quintic', 'complex'],
    },
  },

  latexTemplate: '\\text{Newton}(f) \\text{ where } f(z) = {{polynomial}}',

  manimSupport: {
    supported: true,
    exportFn: (config: OperatorConfig) => {
      const roots = config.values.roots as Complex[];
      return `
# Newton fractal with ${roots.length} roots
newton_fractal = NewtonFractal(
    roots=${JSON.stringify(roots.map((r) => [r.real, r.imag]))},
    max_iterations=${config.values.maxIterations},
)
      `.trim();
    },
  },

  examples: [
    {
      title: 'Classic Cubic',
      config: {
        roots: [
          { real: 1, imag: 0 },
          { real: -0.5, imag: 0.866 },
          { real: -0.5, imag: -0.866 },
        ],
        rootColors: ['#FF0000', '#00FF00', '#0000FF'],
        maxIterations: 50,
        tolerance: 1e-6,
        saturation: 0.5,
        blackForCycles: false,
      },
      description: 'Three-fold rotational symmetry with RGB colors',
    },
  ],

  complexity: 'medium',
  gpuAccelerated: true,

  shaderCode: {
    fragment: `
// Newton fractal shader (placeholder - will use actual GLSL)
precision mediump float;
uniform vec2 u_roots[5];
uniform int u_numRoots;
uniform int u_maxIterations;
uniform float u_tolerance;

vec2 complexMul(vec2 a, vec2 b) {
  return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

void main() {
  vec2 z = gl_FragCoord.xy;
  // ... Newton iteration logic ...
  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
}
    `,
  },
};
