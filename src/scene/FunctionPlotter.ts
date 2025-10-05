import { ExpressionEngine } from '../engine/ExpressionEngine';
import { Space } from './Space';
import type { CameraState, Point2D } from './types';
import type { ViewportDimensions } from './Viewport';

export interface PlottedFunction {
  id: string;
  name: string;
  expression: string;
  color: string;
  lineWidth: number;
  visible: boolean;
  domain: {
    min: number;
    max: number;
    step: number;
  };
}

export interface FunctionPlotOptions {
  showPoints?: boolean;
  smoothCurve?: boolean;
  clipToBounds?: boolean;
}

export class FunctionPlotter {
  private expressionEngine: ExpressionEngine;
  private space: Space;

  constructor() {
    this.expressionEngine = new ExpressionEngine();
    this.space = new Space();
  }

  /**
   * Plot a function on the canvas
   * @param func - Function configuration
   * @param parameters - Current parameter values
   * @param ctx - Canvas rendering context
   * @param camera - Camera state
   * @param viewport - Viewport dimensions
   * @param options - Optional rendering options
   */
  plotFunction(
    func: PlottedFunction,
    parameters: Record<string, number>,
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    viewport: ViewportDimensions,
    options: FunctionPlotOptions = {}
  ): void {
    if (!func.visible) return;

    const { domain } = func;
    const points: Point2D[] = [];

    // Evaluate function at each x value
    for (let x = domain.min; x <= domain.max; x += domain.step) {
      const scope = { ...parameters, x };
      const result = this.expressionEngine.evaluate(func.expression, scope);

      if (result.success && isFinite(result.value!)) {
        points.push({ x, y: result.value! });
      } else {
        // If evaluation fails, break the curve (discontinuity)
        if (points.length > 0) {
          this.renderCurve(points, func, ctx, camera, viewport, options);
          points.length = 0; // Reset for next continuous segment
        }
      }
    }

    // Render any remaining points
    if (points.length > 0) {
      this.renderCurve(points, func, ctx, camera, viewport, options);
    }
  }

  /**
   * Render a continuous curve segment
   */
  private renderCurve(
    points: Point2D[],
    func: PlottedFunction,
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    viewport: ViewportDimensions,
    options: FunctionPlotOptions
  ): void {
    if (points.length === 0) return;

    ctx.save();
    ctx.strokeStyle = func.color;
    ctx.lineWidth = func.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();

    let started = false;
    for (let i = 0; i < points.length; i++) {
      const worldPoint = points[i];
      const screenPoint = this.space.worldToScreen(worldPoint, camera, viewport);

      // Optional clipping to viewport bounds
      if (options.clipToBounds) {
        if (
          screenPoint.x < -100 ||
          screenPoint.x > viewport.width + 100 ||
          screenPoint.y < -100 ||
          screenPoint.y > viewport.height + 100
        ) {
          continue;
        }
      }

      if (!started) {
        ctx.moveTo(screenPoint.x, screenPoint.y);
        started = true;
      } else {
        ctx.lineTo(screenPoint.x, screenPoint.y);
      }
    }

    ctx.stroke();

    // Optional: Show points
    if (options.showPoints) {
      ctx.fillStyle = func.color;
      for (const worldPoint of points) {
        const screenPoint = this.space.worldToScreen(worldPoint, camera, viewport);
        ctx.beginPath();
        ctx.arc(screenPoint.x, screenPoint.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /**
   * Auto-calculate domain based on scene bounds
   */
  calculateDomain(bounds: { xMin: number; xMax: number }, zoom: number): { min: number; max: number; step: number } {
    const range = bounds.xMax - bounds.xMin;

    // Adaptive step size based on zoom
    // More zoom = finer step for smoother curves
    const baseStep = range / 500;
    const adaptiveStep = baseStep / Math.sqrt(zoom);

    return {
      min: bounds.xMin,
      max: bounds.xMax,
      step: Math.max(adaptiveStep, 0.001) // Minimum step to avoid infinite loops
    };
  }

  /**
   * Validate function expression
   */
  validateExpression(expression: string, parameters: Record<string, number>): { valid: boolean; error?: string } {
    // Test evaluation at a few points
    const testValues = [-1, 0, 1];

    for (const x of testValues) {
      const scope = { ...parameters, x };
      const result = this.expressionEngine.evaluate(expression, scope);

      if (!result.success) {
        return { valid: false, error: result.error };
      }
    }

    return { valid: true };
  }
}
