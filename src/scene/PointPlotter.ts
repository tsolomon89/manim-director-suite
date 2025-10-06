/**
 * PointPlotter - Renders coordinate points from list/range expressions
 * Supports: (x,y), ([0..10], 5), ([0,1,2], [3,4,5])
 */

import { ExpressionEngine } from '../engine/ExpressionEngine';
import { Space } from './Space';
import type { CameraState, Point2D } from './types';
import type { ViewportDimensions } from './Viewport';

export interface PlottedPoints {
  id: string;
  name: string;
  expression: string; // e.g., "([0..10], [0..10])"
  color: string;
  pointSize: number;
  pointStyle: 'circle' | 'square' | 'cross' | 'dot';
  visible: boolean;
}

export interface PointPlotOptions {
  fillPoints?: boolean;
  strokePoints?: boolean;
  opacity?: number;
}

export class PointPlotter {
  private expressionEngine: ExpressionEngine;
  private space: Space;

  constructor(space?: Space) {
    this.expressionEngine = new ExpressionEngine();
    this.space = space || new Space();
  }

  /**
   * Plot coordinate points on the canvas
   * @param points - Points configuration
   * @param parameters - Current parameter values
   * @param ctx - Canvas rendering context
   * @param camera - Camera state
   * @param viewport - Viewport dimensions
   * @param options - Optional rendering options
   */
  plotPoints(
    points: PlottedPoints,
    parameters: Record<string, number>,
    ctx: CanvasRenderingContext2D,
    camera: CameraState,
    viewport: ViewportDimensions,
    options: PointPlotOptions = {}
  ): void {
    if (!points.visible) return;

    // Parse coordinates
    const result = this.expressionEngine.parseCoordinates(points.expression, parameters);

    if (!result.success || !result.points) {
      console.error(`Failed to parse coordinates for ${points.name}:`, result.error);
      return;
    }

    // Render each point
    const { fillPoints = true, strokePoints = false, opacity = 1 } = options;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.fillStyle = points.color;
    ctx.strokeStyle = points.color;

    for (const worldPoint of result.points) {
      const screenPoint = this.space.worldToScreen(worldPoint, camera, viewport);

      // Clip to viewport (with margin)
      if (
        screenPoint.x < -100 ||
        screenPoint.x > viewport.width + 100 ||
        screenPoint.y < -100 ||
        screenPoint.y > viewport.height + 100
      ) {
        continue;
      }

      this.renderPoint(ctx, screenPoint, points.pointSize, points.pointStyle, fillPoints, strokePoints);
    }

    ctx.restore();
  }

  /**
   * Render a single point with specified style
   */
  private renderPoint(
    ctx: CanvasRenderingContext2D,
    screenPoint: Point2D,
    size: number,
    style: 'circle' | 'square' | 'cross' | 'dot',
    fill: boolean,
    stroke: boolean
  ): void {
    ctx.beginPath();

    switch (style) {
      case 'circle':
        ctx.arc(screenPoint.x, screenPoint.y, size, 0, Math.PI * 2);
        break;

      case 'square':
        ctx.rect(screenPoint.x - size, screenPoint.y - size, size * 2, size * 2);
        break;

      case 'cross': {
        const halfSize = size;
        ctx.moveTo(screenPoint.x - halfSize, screenPoint.y);
        ctx.lineTo(screenPoint.x + halfSize, screenPoint.y);
        ctx.moveTo(screenPoint.x, screenPoint.y - halfSize);
        ctx.lineTo(screenPoint.x, screenPoint.y + halfSize);
        break;
      }

      case 'dot':
        ctx.arc(screenPoint.x, screenPoint.y, Math.max(1, size / 2), 0, Math.PI * 2);
        break;
    }

    if (fill && style !== 'cross') {
      ctx.fill();
    }

    if (stroke || style === 'cross') {
      ctx.lineWidth = Math.max(1, size / 3);
      ctx.stroke();
    }
  }

  /**
   * Count how many points will be generated (for performance warnings)
   */
  countPoints(expression: string, parameters: Record<string, number>): { count: number; error?: string } {
    const result = this.expressionEngine.parseCoordinates(expression, parameters);

    if (!result.success) {
      return { count: 0, error: result.error };
    }

    return { count: result.points?.length || 0 };
  }

  /**
   * Validate coordinate expression
   */
  validateExpression(
    expression: string,
    parameters: Record<string, number>
  ): { valid: boolean; error?: string; pointCount?: number } {
    const result = this.expressionEngine.parseCoordinates(expression, parameters);

    if (!result.success) {
      return { valid: false, error: result.error };
    }

    const pointCount = result.points?.length || 0;

    // Warn if too many points (configurable threshold)
    if (pointCount > 100000) {
      return {
        valid: true,
        error: `Warning: ${pointCount} points will be generated. This may impact performance.`,
        pointCount,
      };
    }

    return { valid: true, pointCount };
  }
}
