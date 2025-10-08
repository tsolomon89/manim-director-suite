/**
 * Fractal Function Manager
 *
 * Manages fractal functions (Newton, Mandelbrot, Julia, etc.)
 * Handles root/coefficient manipulation and validation
 */

import { Complex, ComplexPolynomial } from './complex-types';
import type {
  FractalFunction,
  FractalType,
  NewtonFractalConfig,
  MandelbrotJuliaConfig,
  FRACTAL_PRESETS,
} from './fractal-types';
import { DEFAULT_FRACTAL_RENDER_CONFIG, DEFAULT_FRACTAL_STYLE } from './fractal-types';

export interface FractalManagerOptions {
  // Can be extended with dependencies if needed
}

export class FractalManager {
  private fractals: Map<string, FractalFunction> = new Map();
  private nextId = 1;

  constructor(options?: FractalManagerOptions) {
    // Initialize if needed
  }

  /**
   * Create a Newton fractal from roots
   */
  createNewtonFromRoots(
    roots: Complex[],
    rootColors: string[],
    options?: Partial<NewtonFractalConfig>
  ): { success: boolean; fractal?: FractalFunction; error?: string } {
    if (roots.length === 0) {
      return { success: false, error: 'At least one root is required' };
    }

    if (roots.length > 5) {
      return { success: false, error: 'Maximum 5 roots supported for Newton fractals' };
    }

    // Compute polynomial from roots
    const poly = ComplexPolynomial.fromRoots(roots);
    const derivative = poly.derivative();

    // Generate colors if not enough provided
    const colors = this.ensureRootColors(rootColors, roots.length);

    const id = `fractal-${this.nextId++}`;

    const fractal: FractalFunction = {
      id,
      lhs: {
        kind: 'function',
        name: `Newton${this.nextId - 1}`,
        fullName: `Newton${this.nextId - 1}`,
        raw: `Newton${this.nextId - 1}(z)`,
        arity: 1,
        formalParams: ['z'],
      },
      expression: this.polynomialToString(poly),
      independentVarId: 'z', // Complex variable
      dependencies: [],
      fractalType: 'newton',
      style: {
        ...DEFAULT_FRACTAL_STYLE,
        colorMode: 'root-based',
        rootColors: {
          rootColors: colors,
          divergentColor: '#202020',
          blendMode: 'smooth',
          distanceShading: true,
        },
      },
      renderConfig: { ...DEFAULT_FRACTAL_RENDER_CONFIG },
      newtonConfig: {
        coefficients: poly.coefficients,
        roots,
        derivativeCoefficients: derivative.coefficients,
        rootColors: colors,
        blackForCycles: options?.blackForCycles ?? false,
        juliaHighlight: options?.juliaHighlight ?? 0,
      },
      visible: true,
    };

    this.fractals.set(id, fractal);

    return { success: true, fractal };
  }

  /**
   * Create a Newton fractal from polynomial coefficients
   */
  createNewtonFromCoefficients(
    coefficients: Complex[],
    rootColors?: string[],
    options?: Partial<NewtonFractalConfig>
  ): { success: boolean; fractal?: FractalFunction; error?: string } {
    if (coefficients.length === 0) {
      return { success: false, error: 'At least one coefficient is required' };
    }

    if (coefficients.length > 6) {
      return { success: false, error: 'Maximum degree 5 polynomial supported' };
    }

    // Find roots from coefficients
    const poly = new ComplexPolynomial(coefficients);
    const roots = poly.findRoots();

    // Use provided colors or generate defaults
    const colors = rootColors || this.ensureRootColors([], roots.length);

    return this.createNewtonFromRoots(roots, colors, options);
  }

  /**
   * Create a Mandelbrot set fractal
   */
  createMandelbrot(
    options?: Partial<MandelbrotJuliaConfig>
  ): { success: boolean; fractal?: FractalFunction; error?: string } {
    const id = `fractal-${this.nextId++}`;

    const colorScale = options?.colorMap?.colorScale || [
      '#000033', '#000055', '#0000BB', '#0E4C92', '#2E8BC0',
      '#1DD3B0', '#B2EC5D', '#FFFF00', '#FFFFFF'
    ];

    const fractal: FractalFunction = {
      id,
      lhs: {
        kind: 'function',
        name: 'Mandelbrot',
        fullName: 'Mandelbrot',
        raw: 'Mandelbrot(c)',
        arity: 1,
        formalParams: ['c'],
      },
      expression: 'z^2 + c',
      independentVarId: 'c',
      dependencies: [],
      fractalType: 'mandelbrot',
      style: {
        ...DEFAULT_FRACTAL_STYLE,
        colorMode: 'iteration-based',
        iterationColors: {
          minIterations: 0,
          maxIterations: 256,
          colorScale,
          insideColor: '#000000',
          outsideColor: colorScale[colorScale.length - 1],
          smoothing: 'log',
          reverse: false,
        },
      },
      renderConfig: {
        ...DEFAULT_FRACTAL_RENDER_CONFIG,
        maxIterations: 256,
        escapeRadius: 2.0,
      },
      mandelbrotJuliaConfig: {
        power: options?.power || 2,
        colorMap: {
          minIterations: 0,
          maxIterations: 256,
          colorScale,
          insideColor: '#000000',
          smoothing: 'log',
        },
      },
      visible: true,
    };

    this.fractals.set(id, fractal);

    return { success: true, fractal };
  }

  /**
   * Create a Julia set fractal
   */
  createJulia(
    juliaParameter: Complex,
    options?: Partial<MandelbrotJuliaConfig>
  ): { success: boolean; fractal?: FractalFunction; error?: string } {
    const id = `fractal-${this.nextId++}`;

    const colorScale = options?.colorMap?.colorScale || [
      '#1a1a2e', '#16213e', '#0f3460', '#533483', '#94618e', '#f4abc4'
    ];

    const fractal: FractalFunction = {
      id,
      lhs: {
        kind: 'function',
        name: 'Julia',
        fullName: 'Julia',
        raw: 'Julia(z)',
        arity: 1,
        formalParams: ['z'],
      },
      expression: `z^2 + (${juliaParameter.real}${juliaParameter.imag >= 0 ? '+' : ''}${juliaParameter.imag}i)`,
      independentVarId: 'z',
      dependencies: [],
      fractalType: 'julia',
      style: {
        ...DEFAULT_FRACTAL_STYLE,
        colorMode: 'iteration-based',
        iterationColors: {
          minIterations: 0,
          maxIterations: 256,
          colorScale,
          insideColor: '#000000',
          outsideColor: colorScale[colorScale.length - 1],
          smoothing: 'sqrt',
          reverse: false,
        },
      },
      renderConfig: {
        ...DEFAULT_FRACTAL_RENDER_CONFIG,
        maxIterations: 256,
        escapeRadius: 2.0,
      },
      mandelbrotJuliaConfig: {
        juliaParameter,
        power: options?.power || 2,
        colorMap: {
          minIterations: 0,
          maxIterations: 256,
          colorScale,
          insideColor: '#000000',
          smoothing: 'sqrt',
        },
      },
      visible: true,
    };

    this.fractals.set(id, fractal);

    return { success: true, fractal };
  }

  /**
   * Create fractal from preset
   */
  createFromPreset(
    presetId: keyof typeof FRACTAL_PRESETS
  ): { success: boolean; fractal?: FractalFunction; error?: string } {
    // Presets are defined in fractal-types.ts
    // This would load and instantiate the preset configuration

    switch (presetId) {
      case 'newton-cubic':
        return this.createNewtonFromCoefficients([
          { real: -1, imag: 0 },
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 1, imag: 0 },
        ], ['#FF0000', '#00FF00', '#0000FF']);

      case 'newton-quintic':
        return this.createNewtonFromCoefficients([
          { real: -1, imag: 0 },
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 0, imag: 0 },
          { real: 1, imag: 0 },
        ], ['#440154', '#3b528b', '#21908c', '#5dc963', '#fde725']);

      case 'mandelbrot-classic':
        return this.createMandelbrot();

      case 'julia-standard':
        return this.createJulia({ real: -0.7, imag: 0.27 });

      default:
        return { success: false, error: `Unknown preset: ${presetId}` };
    }
  }

  /**
   * Update fractal configuration
   */
  updateFractal(
    id: string,
    updates: Partial<FractalFunction>
  ): { success: boolean; error?: string } {
    const fractal = this.fractals.get(id);
    if (!fractal) {
      return { success: false, error: `Fractal not found: ${id}` };
    }

    // Merge updates
    Object.assign(fractal, updates);

    return { success: true };
  }

  /**
   * Update Newton fractal roots
   */
  updateNewtonRoots(
    id: string,
    roots: Complex[]
  ): { success: boolean; error?: string } {
    const fractal = this.fractals.get(id);
    if (!fractal || fractal.fractalType !== 'newton') {
      return { success: false, error: 'Not a Newton fractal' };
    }

    // Recompute polynomial from roots
    const poly = ComplexPolynomial.fromRoots(roots);
    const derivative = poly.derivative();

    if (fractal.newtonConfig) {
      fractal.newtonConfig.roots = roots;
      fractal.newtonConfig.coefficients = poly.coefficients;
      fractal.newtonConfig.derivativeCoefficients = derivative.coefficients;
      fractal.expression = this.polynomialToString(poly);
    }

    return { success: true };
  }

  /**
   * Update Mandelbrot/Julia parameter
   */
  updateJuliaParameter(
    id: string,
    juliaParameter: Complex
  ): { success: boolean; error?: string } {
    const fractal = this.fractals.get(id);
    if (!fractal || fractal.fractalType !== 'julia') {
      return { success: false, error: 'Not a Julia set' };
    }

    if (fractal.mandelbrotJuliaConfig) {
      fractal.mandelbrotJuliaConfig.juliaParameter = juliaParameter;
      fractal.expression = `z^2 + (${juliaParameter.real}${juliaParameter.imag >= 0 ? '+' : ''}${juliaParameter.imag}i)`;
    }

    return { success: true };
  }

  /**
   * Get fractal by ID
   */
  get(id: string): FractalFunction | undefined {
    return this.fractals.get(id);
  }

  /**
   * Get all fractals
   */
  getAll(): FractalFunction[] {
    return Array.from(this.fractals.values());
  }

  /**
   * Get visible fractals
   */
  getVisible(): FractalFunction[] {
    return Array.from(this.fractals.values()).filter(f => f.visible);
  }

  /**
   * Delete fractal
   */
  delete(id: string): boolean {
    return this.fractals.delete(id);
  }

  /**
   * Toggle fractal visibility
   */
  toggleVisibility(id: string): boolean {
    const fractal = this.fractals.get(id);
    if (!fractal) return false;

    fractal.visible = !fractal.visible;
    return true;
  }

  /**
   * Convert polynomial to string representation
   */
  private polynomialToString(poly: ComplexPolynomial): string {
    const coeffs = poly.coefficients;
    const terms: string[] = [];

    for (let i = coeffs.length - 1; i >= 0; i--) {
      const coef = coeffs[i];
      const degree = i;

      // Skip zero coefficients
      if (coef.real === 0 && coef.imag === 0) continue;

      // Format coefficient
      let term = '';
      if (coef.imag === 0) {
        // Real coefficient
        if (degree === 0) {
          term = coef.real.toString();
        } else if (Math.abs(coef.real) === 1) {
          term = coef.real < 0 ? '-' : '';
        } else {
          term = coef.real.toString();
        }
      } else {
        // Complex coefficient
        term = `(${coef.real}${coef.imag >= 0 ? '+' : ''}${coef.imag}i)`;
      }

      // Add variable
      if (degree === 1) {
        term += 'z';
      } else if (degree > 1) {
        term += `z^${degree}`;
      }

      terms.push(term);
    }

    return terms.join(' + ').replace(/\+ -/g, '- ');
  }

  /**
   * Ensure we have enough root colors
   */
  private ensureRootColors(provided: string[], needed: number): string[] {
    const defaultColors = [
      '#FF0000', // Red
      '#00FF00', // Green
      '#0000FF', // Blue
      '#FFFF00', // Yellow
      '#FF00FF', // Magenta
    ];

    const colors = [...provided];
    while (colors.length < needed) {
      colors.push(defaultColors[colors.length % defaultColors.length]);
    }

    return colors.slice(0, needed);
  }

  /**
   * Export all fractals for save/load
   */
  exportState(): FractalFunction[] {
    return this.getAll();
  }

  /**
   * Import fractals from saved state
   */
  importState(fractals: FractalFunction[]): void {
    this.fractals.clear();
    for (const fractal of fractals) {
      this.fractals.set(fractal.id, fractal);
    }

    // Update nextId to avoid conflicts
    const maxId = Math.max(
      0,
      ...Array.from(this.fractals.keys())
        .map(id => parseInt(id.replace('fractal-', '')))
        .filter(n => !isNaN(n))
    );
    this.nextId = maxId + 1;
  }
}
