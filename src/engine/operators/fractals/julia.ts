/**
 * Julia Set Operator Capability
 *
 * Defines Julia sets: z_{n+1} = z_n^p + c
 * Escape-time fractal where c is fixed and z varies
 */

import type {
  OperatorCapability,
  OperatorConfig,
  PlottableFunction,
  IterationResult,
} from '../../operator-capability-types';
import { Complex } from '../../complex-types';

/**
 * Julia iteration (same as Mandelbrot but c is fixed)
 */
function juliaIteration(z: Complex, c: Complex, power: number): Complex {
  return z.power(power).add(c);
}

/**
 * Color interpolation (reused from Mandelbrot)
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

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [0, 0, 0];
}

function applySmoothingToIterations(
  iterations: number,
  finalZ: Complex,
  maxIterations: number,
  smoothing: 'none' | 'linear' | 'log' | 'sqrt'
): number {
  if (iterations >= maxIterations) return 1.0;

  let smoothed = iterations;

  switch (smoothing) {
    case 'log':
      smoothed = iterations + 1 - Math.log2(Math.log2(finalZ.magnitude()));
      break;
    case 'sqrt':
      smoothed = iterations + 1 - Math.sqrt(finalZ.magnitude()) / 2;
      break;
    case 'linear':
    case 'none':
    default:
      smoothed = iterations;
  }

  return smoothed / maxIterations;
}

/**
 * Julia set capability
 */
export const juliaCapability: OperatorCapability = {
  id: 'julia',
  name: 'Julia Set',
  category: 'fractal',
  description: 'Julia sets for f(z) = z^p + c with fixed parameter c.',

  visualizationModes: {
    iteration: {
      type: 'escape-time',
      formula: 'z^p + c',
      outcome: 'iteration-count',
    },
  },

  requiredControls: [
    {
      id: 'juliaParameter',
      type: 'complex',
      label: 'Julia Parameter (c)',
      description: 'Fixed complex parameter c in z² + c',
      default: { real: -0.7, imag: 0.27 },
    },
    {
      id: 'power',
      type: 'number',
      label: 'Power',
      description: 'Exponent in iteration formula',
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
      default: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#94618e', '#f4abc4'],
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
      default: 'sqrt',
    },
  ],

  generatorFn: (config: OperatorConfig, capability: OperatorCapability): PlottableFunction => {
    const juliaParameter = config.values.juliaParameter as { real: number; imag: number };
    const power = config.values.power as number;
    const maxIterations = config.values.maxIterations as number;
    const escapeRadius = config.values.escapeRadius as number;
    const colorScale = config.values.colorScale as string[];
    const insideColor = config.values.insideColor as string;
    const smoothing = (config.values.smoothing as 'none' | 'linear' | 'log' | 'sqrt') || 'sqrt';

    const c = new Complex(juliaParameter.real, juliaParameter.imag);

    return {
      id: `julia-${Date.now()}`,
      name: `Julia (c=${c.toString()})`,
      mode: 'iteration',

      iterationFn: (z: Complex) => juliaIteration(z, c, power),

      escapeTest: (z: Complex) => z.magnitude() > escapeRadius,

      colorFn: (result: IterationResult): [number, number, number, number] => {
        if (result.iterations >= maxIterations) {
          const rgb = hexToRgb(insideColor);
          return [rgb[0], rgb[1], rgb[2], 1.0];
        }

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
    'julia-standard': {
      id: 'julia-standard',
      name: 'Standard Julia',
      description: 'c = -0.7 + 0.27i (dendrite-like)',
      operatorId: 'julia',
      config: {
        juliaParameter: { real: -0.7, imag: 0.27 },
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#1a1a2e', '#16213e', '#0f3460', '#533483', '#94618e', '#f4abc4'],
        insideColor: '#000000',
        smoothing: 'sqrt',
      },
      tags: ['classic', 'dendrite'],
    },
    'julia-douady-rabbit': {
      id: 'julia-douady-rabbit',
      name: 'Douady Rabbit',
      description: 'c = -0.123 + 0.745i',
      operatorId: 'julia',
      config: {
        juliaParameter: { real: -0.123, imag: 0.745 },
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#2c003e', '#512b58', '#9b59b6', '#d7bde2', '#f5eef8'],
        insideColor: '#000000',
        smoothing: 'sqrt',
      },
      tags: ['classic', 'rabbit'],
    },
    'julia-siegel-disk': {
      id: 'julia-siegel-disk',
      name: 'Siegel Disk',
      description: 'c = -0.39054 - 0.58679i',
      operatorId: 'julia',
      config: {
        juliaParameter: { real: -0.39054, imag: -0.58679 },
        power: 2,
        maxIterations: 512,
        escapeRadius: 2.0,
        colorScale: ['#0a0e27', '#1c3041', '#3e5c76', '#748da6', '#d0e1f9'],
        insideColor: '#000000',
        smoothing: 'log',
      },
      tags: ['siegel', 'disk'],
    },
    'julia-san-marco': {
      id: 'julia-san-marco',
      name: 'San Marco',
      description: 'c = -0.75 + 0i',
      operatorId: 'julia',
      config: {
        juliaParameter: { real: -0.75, imag: 0 },
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#ff9a00', '#ff6f00', '#ff3d00', '#dd2c00', '#bf360c'],
        insideColor: '#000000',
        smoothing: 'sqrt',
      },
      tags: ['real', 'symmetric'],
    },
  },

  latexTemplate: 'J_c = \\{ z \\in \\mathbb{C} : f^n(z) \\text{ bounded where } f(z) = z^{{power}} + c \\}',

  manimSupport: {
    supported: true,
    exportFn: (config: OperatorConfig) => {
      const c = config.values.juliaParameter as { real: number; imag: number };
      return `
# Julia set
julia = JuliaSet(
    c=complex(${c.real}, ${c.imag}),
    power=${config.values.power},
    max_iterations=${config.values.maxIterations},
)
      `.trim();
    },
  },

  examples: [
    {
      title: 'Explore Parameter Space',
      config: {
        juliaParameter: { real: -0.7, imag: 0.27 },
        power: 2,
        maxIterations: 256,
        escapeRadius: 2.0,
        colorScale: ['#1a1a2e', '#0f3460', '#94618e', '#f4abc4'],
        insideColor: '#000000',
        smoothing: 'sqrt',
      },
      description: 'Try varying c to explore different Julia sets',
    },
  ],

  complexity: 'medium',
  gpuAccelerated: true,
};
