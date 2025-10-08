/**
 * Fractal Renderer
 *
 * WebGL-based renderer for fractals using custom shaders
 * Supports Newton, Mandelbrot, Julia, and custom fractals
 */

import type {
  FractalFunction,
  FractalEvaluationResult,
  FractalRenderConfig,
  NewtonFractalConfig,
  MandelbrotJuliaConfig,
} from '../engine/fractal-types';
import { Complex } from '../engine/complex-types';

// Import shader sources (will be loaded as strings)
import vertexShaderSource from './shaders/fractal-vertex.glsl?raw';
import newtonShaderSource from './shaders/newton-fractal.glsl?raw';
import mandelbrotShaderSource from './shaders/mandelbrot.glsl?raw';

export interface FractalRendererOptions {
  canvas: HTMLCanvasElement;
  fractalFunction: FractalFunction;
  viewportBounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
}

export class FractalRenderer {
  private canvas: HTMLCanvasElement;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private fractalFunction: FractalFunction;
  private viewportBounds: { xMin: number; xMax: number; yMin: number; yMax: number };

  // WebGL buffers
  private positionBuffer: WebGLBuffer | null = null;

  // Uniform locations (cached)
  private uniformLocations: Map<string, WebGLUniformLocation | null> = new Map();

  constructor(options: FractalRendererOptions) {
    this.canvas = options.canvas;
    this.fractalFunction = options.fractalFunction;
    this.viewportBounds = options.viewportBounds;

    this.initWebGL();
  }

  /**
   * Initialize WebGL context and compile shaders
   */
  private initWebGL(): void {
    const gl = this.canvas.getContext('webgl', {
      alpha: false,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    if (!gl) {
      throw new Error('WebGL not supported');
    }

    this.gl = gl;

    // Create shader program based on fractal type
    const fragmentShaderSource = this.getFragmentShaderSource();
    this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);

    if (!this.program) {
      throw new Error('Failed to create shader program');
    }

    // Set up geometry (full-screen quad)
    this.setupGeometry();

    // Cache uniform locations
    this.cacheUniformLocations();
  }

  /**
   * Get fragment shader source based on fractal type
   */
  private getFragmentShaderSource(): string {
    switch (this.fractalFunction.fractalType) {
      case 'newton':
        return newtonShaderSource;
      case 'mandelbrot':
      case 'julia':
        return mandelbrotShaderSource;
      case 'custom':
        return this.fractalFunction.customShaderCode || mandelbrotShaderSource;
      default:
        throw new Error(`Unsupported fractal type: ${this.fractalFunction.fractalType}`);
    }
  }

  /**
   * Create shader program from source
   */
  private createProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(this.gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this.compileShader(this.gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('Shader program link failed:', this.gl.getProgramInfoLog(program));
      return null;
    }

    return program;
  }

  /**
   * Compile shader from source
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', this.gl.getShaderInfoLog(shader));
      console.error('Source:', source);
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Set up full-screen quad geometry
   */
  private setupGeometry(): void {
    if (!this.gl || !this.program) return;

    // Full-screen quad vertices
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    // Set up position attribute
    const positionLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);
  }

  /**
   * Cache uniform locations for performance
   */
  private cacheUniformLocations(): void {
    if (!this.gl || !this.program) return;

    const uniformNames = this.getUniformNames();

    for (const name of uniformNames) {
      const location = this.gl.getUniformLocation(this.program, name);
      this.uniformLocations.set(name, location);
    }
  }

  /**
   * Get uniform names based on fractal type
   */
  private getUniformNames(): string[] {
    const baseUniforms = [
      'u_viewportMin',
      'u_viewportMax',
      'u_resolution',
      'u_maxIterations',
    ];

    if (this.fractalFunction.fractalType === 'newton') {
      return [
        ...baseUniforms,
        'u_degree',
        'u_coef0', 'u_coef1', 'u_coef2', 'u_coef3', 'u_coef4', 'u_coef5',
        'u_numRoots',
        'u_root0', 'u_root1', 'u_root2', 'u_root3', 'u_root4',
        'u_color0', 'u_color1', 'u_color2', 'u_color3', 'u_color4',
        'u_tolerance',
        'u_saturationFactor',
        'u_divergentColor',
        'u_blackForCycles',
      ];
    } else {
      // Mandelbrot/Julia
      return [
        ...baseUniforms,
        'u_power',
        'u_escapeRadius',
        'u_numColorStops',
        'u_colorStop0', 'u_colorStop1', 'u_colorStop2', 'u_colorStop3',
        'u_colorStop4', 'u_colorStop5', 'u_colorStop6', 'u_colorStop7', 'u_colorStop8',
        'u_insideColor',
        'u_smoothingMode',
      ];
    }
  }

  /**
   * Set uniform value
   */
  private setUniform(name: string, value: number | number[] | boolean): void {
    if (!this.gl) return;

    const location = this.uniformLocations.get(name);
    if (!location) return;

    if (typeof value === 'boolean') {
      this.gl.uniform1i(location, value ? 1 : 0);
    } else if (typeof value === 'number') {
      this.gl.uniform1f(location, value);
    } else if (Array.isArray(value)) {
      if (value.length === 2) {
        this.gl.uniform2f(location, value[0], value[1]);
      } else if (value.length === 3) {
        this.gl.uniform3f(location, value[0], value[1], value[2]);
      } else if (value.length === 4) {
        this.gl.uniform4f(location, value[0], value[1], value[2], value[3]);
      }
    }
  }

  /**
   * Update uniforms from fractal function config
   */
  private updateUniforms(): void {
    if (!this.gl || !this.program) return;

    // Viewport bounds
    this.setUniform('u_viewportMin', [this.viewportBounds.xMin, this.viewportBounds.yMin]);
    this.setUniform('u_viewportMax', [this.viewportBounds.xMax, this.viewportBounds.yMax]);
    this.setUniform('u_resolution', [this.canvas.width, this.canvas.height]);
    this.setUniform('u_maxIterations', this.fractalFunction.renderConfig.maxIterations);

    if (this.fractalFunction.fractalType === 'newton') {
      this.updateNewtonUniforms();
    } else if (this.fractalFunction.fractalType === 'mandelbrot' || this.fractalFunction.fractalType === 'julia') {
      this.updateMandelbrotUniforms();
    }
  }

  /**
   * Update Newton fractal uniforms
   */
  private updateNewtonUniforms(): void {
    const config = this.fractalFunction.newtonConfig;
    if (!config) return;

    // Polynomial degree
    const degree = (config.coefficients?.length || 0) - 1;
    this.setUniform('u_degree', degree);

    // Coefficients
    const coeffs = config.coefficients || [];
    for (let i = 0; i <= 5; i++) {
      const coef = i < coeffs.length ? coeffs[i] : { real: 0, imag: 0 };
      this.setUniform(`u_coef${i}`, [coef.real, coef.imag]);
    }

    // Roots
    const roots = config.roots || [];
    this.setUniform('u_numRoots', roots.length);
    for (let i = 0; i < 5; i++) {
      const root = i < roots.length ? roots[i] : { real: 0, imag: 0 };
      this.setUniform(`u_root${i}`, [root.real, root.imag]);
    }

    // Root colors
    for (let i = 0; i < 5; i++) {
      const color = i < config.rootColors.length
        ? this.hexToRgb(config.rootColors[i])
        : [1, 1, 1];
      this.setUniform(`u_color${i}`, color);
    }

    // Other parameters
    this.setUniform('u_tolerance', this.fractalFunction.renderConfig.tolerance || 1e-6);
    this.setUniform('u_saturationFactor', this.fractalFunction.style.saturation || 0.5);
    this.setUniform('u_divergentColor', [0.2, 0.2, 0.2]);
    this.setUniform('u_blackForCycles', config.blackForCycles || false);
  }

  /**
   * Update Mandelbrot/Julia uniforms
   */
  private updateMandelbrotUniforms(): void {
    const config = this.fractalFunction.mandelbrotJuliaConfig;
    if (!config) return;

    this.setUniform('u_power', config.power || 2);
    this.setUniform('u_escapeRadius', this.fractalFunction.renderConfig.escapeRadius || 2.0);

    // Color stops
    const colorScale = config.colorMap.colorScale;
    this.setUniform('u_numColorStops', colorScale.length);
    for (let i = 0; i < 9; i++) {
      const color = i < colorScale.length
        ? this.hexToRgb(colorScale[i])
        : [1, 1, 1];
      this.setUniform(`u_colorStop${i}`, color);
    }

    this.setUniform('u_insideColor', this.hexToRgb(config.colorMap.insideColor));

    // Smoothing mode
    const smoothingMap: Record<string, number> = {
      'none': 0,
      'linear': 1,
      'log': 2,
      'sqrt': 3,
    };
    this.setUniform('u_smoothingMode', smoothingMap[config.colorMap.smoothing || 'log']);
  }

  /**
   * Convert hex color to RGB [0,1]
   */
  private hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16) / 255,
          parseInt(result[2], 16) / 255,
          parseInt(result[3], 16) / 255,
        ]
      : [1, 1, 1];
  }

  /**
   * Render the fractal
   */
  render(): void {
    if (!this.gl || !this.program) return;

    // Use program
    this.gl.useProgram(this.program);

    // Update uniforms
    this.updateUniforms();

    // Set viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);

    // Clear
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    // Draw full-screen quad
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Update viewport bounds
   */
  setViewportBounds(bounds: { xMin: number; xMax: number; yMin: number; yMax: number }): void {
    this.viewportBounds = bounds;
  }

  /**
   * Update fractal function
   */
  setFractalFunction(fractalFunction: FractalFunction): void {
    // Check if shader needs to be recompiled
    if (fractalFunction.fractalType !== this.fractalFunction.fractalType) {
      this.fractalFunction = fractalFunction;
      this.initWebGL(); // Recompile shaders
    } else {
      this.fractalFunction = fractalFunction;
    }
  }

  /**
   * Resize canvas
   */
  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    if (this.gl) {
      this.gl.viewport(0, 0, width, height);
    }
  }

  /**
   * Clean up WebGL resources
   */
  dispose(): void {
    if (this.gl) {
      if (this.program) {
        this.gl.deleteProgram(this.program);
      }
      if (this.positionBuffer) {
        this.gl.deleteBuffer(this.positionBuffer);
      }
    }
  }
}
