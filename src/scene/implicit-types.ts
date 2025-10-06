/**
 * Type definitions for implicit function plotting (F20)
 *
 * Implicit functions are equations of the form: f(x, y) = c
 * Examples:
 * - Circle: x² + y² = 1
 * - Ellipse: x²/4 + y²/9 = 1
 * - Hyperbola: x² - y² = 1
 */

export interface ImplicitFunction {
  id: string;
  name: string;
  expression: string; // e.g., "x^2 + y^2"
  constant: number;   // The value c in f(x,y) = c
  color: string;
  lineWidth: number;
  visible: boolean;
  resolution: number; // Grid resolution for marching squares (e.g., 100 = 100x100 grid)
}

export interface ImplicitPlotOptions {
  threshold?: number;      // Tolerance for zero-crossing detection (default: 0.01)
  smoothCurve?: boolean;   // Use interpolation for smoother curves (default: true)
  adaptiveResolution?: boolean; // Increase resolution in high-curvature areas (default: false)
}

export interface ContourSegment {
  start: { x: number; y: number };
  end: { x: number; y: number };
}

export interface MarchingSquaresResult {
  segments: ContourSegment[];
  gridSize: number;
  evaluationCount: number; // For performance tracking
}
