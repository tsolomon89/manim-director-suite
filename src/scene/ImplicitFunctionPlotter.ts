/**
 * Implicit Function Plotter
 * Plots equations of the form f(x,y) = c
 * Examples: x² + y² = 1 (circle), x²/a² + y²/b² = 1 (ellipse)
 */

import { ExpressionEngine } from '../engine/ExpressionEngine';
import { Space } from './Space';
import { MarchingSquares } from './MarchingSquares';
import type { CameraState, Point2D } from './types';
import type { ViewportDimensions } from './Viewport';
import type { ImplicitFunction, ImplicitPlotOptions } from './implicit-types';

export class ImplicitFunctionPlotter {
  private expressionEngine: ExpressionEngine;
  private space: Space;
  private marchingSquares: MarchingSquares;

  constructor(space?: Space) {
    this.expressionEngine = new ExpressionEngine();
    this.space = space || new Space();
    this.marchingSquares = new MarchingSquares();
  }

  /**
   * Plot an implicit function on the canvas
   * @param func - Implicit function configuration
   * @param parameters - Current parameter values
   * @param ctx - Canvas rendering context
   * @param camera - Camera state
   * @param viewport - Viewport dimensions
   * @param options - Optional plotting options
   */
  plotImplicitFunction(
    func: ImplicitFunction,
    parameters: Record<string, number>,
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    viewport: ViewportDimensions,
    options: ImplicitPlotOptions = {}
  ): void {
    if (!func.visible) return;

    const { threshold = 0.01, smoothCurve = true } = options;

    // Create evaluator function f(x,y)
    const evaluator = (x: number, y: number): number => {
      const scope = { ...parameters, x, y };
      const result = this.expressionEngine.evaluate(func.expression, scope);
      return result.success ? result.value! : NaN;
    };

    // Get world bounds (use camera view bounds)
    const bounds = this.space.getBounds();

    // Find contours using marching squares
    const contourResult = this.marchingSquares.findContours(
      evaluator,
      bounds,
      func.constant,
      func.resolution,
      threshold
    );

    // Render contour segments
    ctx.save();
    ctx.strokeStyle = func.color;
    ctx.lineWidth = func.lineWidth;
    ctx.lineCap = smoothCurve ? 'round' : 'butt';
    ctx.lineJoin = smoothCurve ? 'round' : 'miter';

    for (const segment of contourResult.segments) {
      const startScreen = this.space.worldToScreen(segment.start, camera, viewport);
      const endScreen = this.space.worldToScreen(segment.end, camera, viewport);

      // Clip check (with margin)
      if (this.isSegmentVisible(startScreen, endScreen, viewport)) {
        ctx.beginPath();
        ctx.moveTo(startScreen.x, startScreen.y);
        ctx.lineTo(endScreen.x, endScreen.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Check if a line segment is visible in viewport
   */
  private isSegmentVisible(
    start: Point2D,
    end: Point2D,
    viewport: ViewportDimensions
  ): boolean {
    const margin = 100;
    const xMin = -margin;
    const xMax = viewport.width + margin;
    const yMin = -margin;
    const yMax = viewport.height + margin;

    // Check if either endpoint is visible
    const startVisible =
      start.x >= xMin && start.x <= xMax && start.y >= yMin && start.y <= yMax;
    const endVisible =
      end.x >= xMin && end.x <= xMax && end.y >= yMin && end.y <= yMax;

    return startVisible || endVisible;
  }

  /**
   * Validate implicit function expression
   */
  validateExpression(
    expression: string,
    constant: number,
    parameters: Record<string, number>
  ): { valid: boolean; error?: string } {
    // Test evaluation at a few points
    const testPoints = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: -1, y: -1 },
    ];

    for (const { x, y } of testPoints) {
      const scope = { ...parameters, x, y };
      const result = this.expressionEngine.evaluate(expression, scope);

      if (!result.success) {
        return { valid: false, error: result.error };
      }

      // Check for NaN or Infinity
      if (!isFinite(result.value!)) {
        return {
          valid: false,
          error: `Expression evaluates to ${result.value} at (${x}, ${y})`,
        };
      }
    }

    // Validate constant
    if (!isFinite(constant)) {
      return { valid: false, error: 'Constant must be a finite number' };
    }

    return { valid: true };
  }

  /**
   * Estimate complexity of implicit function (for performance warnings)
   */
  estimateComplexity(resolution: number): {
    evaluations: number;
    estimatedMs: number;
    warning?: string;
  } {
    const gridPoints = (resolution + 1) * (resolution + 1);
    const estimatedMs = gridPoints * 0.001; // Rough estimate: 0.001ms per evaluation

    let warning: string | undefined;
    if (gridPoints > 100000) {
      warning = `High resolution (${resolution}x${resolution} = ${gridPoints} evaluations). May impact performance.`;
    }

    return {
      evaluations: gridPoints,
      estimatedMs,
      warning,
    };
  }
}
