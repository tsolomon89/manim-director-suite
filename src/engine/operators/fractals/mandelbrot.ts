/**
 * Mandelbrot Set Operator Capability
 *
 * Defines classic Mandelbrot set: z_{n+1} = z_n^p + c
 * Escape-time fractal where c varies and z starts at 0
 */

import type {
  OperatorCapability,
  OperatorConfig,
  PlottableFunction,
  IterationResult,
} from '../../operator-capability-types';
import { Complex } from '../../complex-types';

/**
 * Mandelbrot iteration
 */
function mandelbrotIteration(z: Complex, c: Complex, power: number): Complex {
  return z.power(power).add(c);
}

/**
 * Escape test
 */
function escapeTest(z: Complex, escapeRadius: number): boolean {
  return z.magnitude() > escapeRadius;
}

/**
 * Color gradient interpolation
 */
function interpolateColorScale(
  t: number,
  colorScale: string[]
): [number, number, number, number] {
  const scaledT = t * (colorScale.length - 1);
  const idx = Math.floor(scaledT);
  const frac = scaledT - idx;

  const color1 = hexToRgb(colorScale[Math.min(idx, colorScale.length - 1)]);
  const color2 = hexToRgb(colorScale[Math.min(idx + 1, colorScale.length - 1)]);

  return [
    color1[0] + (color2[0] - color1[0]) * frac,
    color1[1] + (color2[1] - color1[1]) * frac,
    color1[2] + (color2[2] - color1[2]) * frac,
    1.0,
  ];
}

/**
 * Hex to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0];
}

/**
 * Apply smoothing to iteration count
 */
function applySmoothingToIterations(
  iterations: number,
  finalZ: Complex,
  maxIterations: number,
  smoothing: 'none' | 'linear' | 'log' | 'sqrt'
): number {
  if (iterations >= maxIterations) return 1.0; // Inside set

  let smoothed = iterations;

  switch (smoothing) {
    case 'log':
      smoothed = iterations + 1 - Math.log2(Math.log2(finalZ.magnitude()));
      break;
    case 'sqrt':
      smoothed = iterations + 1 - Math.sqrt(finalZ.magnitude()) / 2;
      break;
    case 'linear':
      smoothed = iterations;
      break;
    case 'none':
    default:
      smoothed = iterations;
  }

  return smoothed / maxIterations;
}

/**
 * Mandelbrot set capability
 */
export const mandelbrotCapability: OperatorCapability = {
  id: 'mandelbrot',
  name: 'Mandelbrot Set',
  category: 'fractal',
  description: 'Classic Mandelbrot set. The set of complex numbers c for which z_{n+1} = z_n² + c does not diverge.',

  visualizationModes: {
    iteration: {
      type: 'escape-time',
      formula: 'z^p + c',
      outcome: 'iteration-count',
    },
  },

  requiredControls: [
    {
      id: 'power',
      type: 'number',
      label: 'Power',
      description: 'Exponent in iteration formula (2 = classic)',
      default: 2,
      validation: {
        min: 2,
        max: 10,
        integer: true,
      },
    },
    {
      id: 'maxIterations',
      type: 'number',
      label: 'Max Iterations',
      description: 'Maximum escape-time iterations',
      default: 256,
      validation: {
        min: 10,
        max: 10000,
        integer: true,
      },
    },
    {
      id: 'escapeRadius',
      type: 'number',
      label: 'Escape Radius',
      description: 'Magnitude threshold for divergence',
      default: 2.0,
      validation: {
        min: 1.5,
        max: 100,
      },
    },
    {
      id: 'colorScale',
      type: 'color-array',
      label: 'Color Gradient',
      description: 'Color ramp for iteration count',
      default: ['#000033', '#000055', '#0000BB', '#0E4C92', '#2E8BC0', '#1DD3B0', '#B2EC5D', '#FFFF00', '#FFFFFF'],
    },
    {
      id: 'insideColor',
      type: 'color',
      label: 'Inside Color',
      description: 'Color for points inside the set',
      default: '#000000',
    },
    {
      id: 'smoothing',
      type: 'select',
      label: 'Smoothing',
      description: 'Smooth color transitions',
      default: 'log',
    },
  ],

  generatorFn: (config: OperatorConfig, capability: OperatorCapability): PlottableFunction => {
    const power = config.values.power as number;
    const maxIterations = config.values.maxIterations as number;
    const escapeRadius = config.values.escapeRadius as number;
    const colorScale = config.values.colorScale as string[];
    const insideColor = config.values.insideColor as string;
    const smoothing = (config.values.smoothing as 'none' | 'linear' | 'log' | 'sqrt') || 'log';

    return {
      id: `mandelbrot-${Date.now()}`,
      name: `Mandelbrot (z^${power})`,
      mode: 'iteration',

      iterationFn: (z: Complex, c?: Complex) => {
        const cVal = c || new Complex(0, 0);
        return mandelbrotIteration(z, cVal, power);
      },

      escapeTest: (z: Complex) => escapeTest(z, escapeRadius),

      colorFn: (result: IterationResult): [number, number, number, number] => {
        if (result.iterations >= maxIterations) {
          // Inside set
          const rgb = hexToRgb(insideColor);
          return [rgb[0], rgb[1], rgb[2], 1.0];
        }

        // Outside set - color by iterations
        const t = applySmoothingToIterations(result.iterations, result.finalValue, maxIterations, smoothing);
        return interpolateColorScale(t, colorScale);
      },

      metadata: {
        category: 'fractal',
        complexity: power > 2 ? 'high' : 'medium',
        gpuAccelerated: true,
      },
    };
  },

  presets: {
    'mandelbrot-classic': {
      id: 'mandelbrot-classic',
      name: 'Classic Mandelbrot',
      description: 'Standard Mandelbrot set with blue-white gradient',
      operatorId: 'mandelbrot',
      config: {
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#000033', '#000055', '#0000BB', '#0E4C92', '#2E8BC0', '#1DD3B0', '#B2EC5D', '#FFFF00', '#FFFFFF'],
        insideColor: '#000000',
        smoothing: 'log',
      },
      tags: ['classic', 'standard'],
    },
    'mandelbrot-fire': {
      id: 'mandelbrot-fire',
      name: 'Fire Palette',
      description: 'Mandelbrot with fire colors',
      operatorId: 'mandelbrot',
      config: {
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#000000', '#1a0000', '#4d0000', '#800000', '#b30000', '#ff0000', '#ff6600', '#ffcc00', '#ffff00'],
        insideColor: '#000000',
        smoothing: 'log',
      },
      tags: ['fire', 'warm'],
    },
    'mandelbrot-cubic': {
      id: 'mandelbrot-cubic',
      name: 'Cubic Mandelbrot',
      description: 'Higher power variation (z³)',
      operatorId: 'mandelbrot',
      config: {
        power: 3,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#94618e', '#f4abc4'],
        insideColor: '#000000',
        smoothing: 'log',
      },
      tags: ['cubic', 'variation'],
    },
  },

  latexTemplate: '\\mathcal{M} = \\{ c \\in \\mathbb{C} : z_{n+1} = z_n^{{power}} + c \\text{ bounded} \\}',

  manimSupport: {
    supported: true,
    exportFn: (config: OperatorConfig) => {
      return `
# Mandelbrot set
mandelbrot = MandelbrotSet(
    power=${config.values.power},
    max_iterations=${config.values.maxIterations},
)
      `.trim();
    },
  },

  examples: [
    {
      title: 'Classic View',
      config: {
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#000033', '#0000BB', '#2E8BC0', '#B2EC5D', '#FFFF00', '#FFFFFF'],
        insideColor: '#000000',
        smoothing: 'log',
      },
      description: 'Standard Mandelbrot set with smooth coloring',
    },
  ],

  complexity: 'medium',
  gpuAccelerated: true,
};
