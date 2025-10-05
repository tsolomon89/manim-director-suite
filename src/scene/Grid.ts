/**
 * Grid Renderer
 * Renders grid, axes, and labels based on GridStyleConfig
 * All styling loaded from configuration
 */

import { configManager } from '../config/ConfigManager';
import type { GridStyleConfig } from '../config/types';
import type { GridRenderConfig } from './GridConfig';
import type { RenderContext, Point2D } from './types';
import { Space } from './Space';

interface RenderContextWithConfig extends RenderContext {
  config: GridRenderConfig;
}

export class Grid {
  private space: Space;
  private styleId: string;

  constructor(space: Space) {
    this.space = space;
    this.styleId = configManager.get<string>('grid.defaultStyleId');
  }

  /**
   * Set grid style by ID
   */
  setStyle(styleId: string): void {
    this.styleId = styleId;
  }

  /**
   * Get current grid style
   */
  getStyle(): GridStyleConfig {
    const style = configManager.getPreset<GridStyleConfig>('grid-styles', this.styleId);
    if (!style) {
      throw new Error(`Grid style not found: ${this.styleId}`);
    }
    return style;
  }

  /**
   * Render the complete grid system
   */
  render(renderCtx: RenderContext): void {
    const { ctx, camera, viewport } = renderCtx;
    const style = this.getStyle();

    // Clear canvas with background color
    ctx.fillStyle = style.background;
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    // Get visible bounds
    const visibleBounds = this.space.getVisibleBounds(camera, viewport);

    // Render in order: minor grid, major grid, axes, labels
    if (style.minorGrid.visible) {
      this.renderMinorGrid(ctx, camera, viewport, visibleBounds, style);
    }

    if (style.majorGrid.visible) {
      this.renderMajorGrid(ctx, camera, viewport, visibleBounds, style);
    }

    this.renderAxes(ctx, camera, viewport, visibleBounds, style);

    if (style.labels.show) {
      this.renderLabels(ctx, camera, viewport, visibleBounds, style);
    }
  }

  /**
   * Render with comprehensive GridRenderConfig
   */
  renderWithConfig(renderCtx: RenderContextWithConfig): void {
    const { ctx, camera, viewport, config } = renderCtx;

    // Clear canvas with background color and opacity
    ctx.save();
    ctx.globalAlpha = config.background.opacity;
    ctx.fillStyle = config.background.color;
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    ctx.restore();

    // Get visible bounds
    const visibleBounds = this.space.getVisibleBounds(camera, viewport);

    // Render based on coordinate system
    if (config.coordinateSystem === 'cartesian') {
      this.renderCartesian(ctx, camera, viewport, visibleBounds, config);
    } else if (config.coordinateSystem === 'polar') {
      this.renderPolar(ctx, camera, viewport, visibleBounds, config);
    } else if (config.coordinateSystem === 'radial') {
      this.renderRadial(ctx, camera, viewport, visibleBounds, config);
    }
  }

  /**
   * Render Cartesian coordinate system with GridRenderConfig
   */
  private renderCartesian(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    // Render in order: minor grid, major grid, axes, labels
    if (config.showMinorGrid) {
      this.renderMinorGridWithConfig(ctx, camera, viewport, visibleBounds, config);
    }

    if (config.showMajorGrid) {
      this.renderMajorGridWithConfig(ctx, camera, viewport, visibleBounds, config);
    }

    if (config.showAxes) {
      this.renderAxesWithConfig(ctx, camera, viewport, visibleBounds, config);
    }

    if (config.showLabels) {
      this.renderLabelsWithConfig(ctx, camera, viewport, visibleBounds, config);
    }
  }

  /**
   * Render Polar coordinate system
   */
  private renderPolar(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    if (!config.polar) return;

    ctx.save();

    // Get origin in screen coordinates
    const origin = this.space.worldToScreen({ x: 0, y: 0 }, camera, viewport);

    // Draw radial circles
    if (config.polar.showCircles) {
      ctx.strokeStyle = config.majorGrid.color;
      ctx.lineWidth = config.majorGrid.width;
      ctx.globalAlpha = config.majorGrid.opacity;

      const maxRadius = Math.max(
        Math.abs(visibleBounds.xMin),
        Math.abs(visibleBounds.xMax),
        Math.abs(visibleBounds.yMin),
        Math.abs(visibleBounds.yMax)
      );

      for (let r = config.polar.circleStep; r <= maxRadius; r += config.polar.circleStep) {
        const radiusPixels = r * camera.zoom;
        ctx.beginPath();
        ctx.arc(origin.x, origin.y, radiusPixels, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw angle lines
    if (config.polar.showAngleLines) {
      ctx.strokeStyle = config.majorGrid.color;
      ctx.lineWidth = config.majorGrid.width;
      ctx.globalAlpha = config.majorGrid.opacity;

      const maxRadius = Math.max(
        Math.abs(visibleBounds.xMin),
        Math.abs(visibleBounds.xMax),
        Math.abs(visibleBounds.yMin),
        Math.abs(visibleBounds.yMax)
      );

      const angleStepRad = (config.polar.angleStep * Math.PI) / 180;

      for (let angle = 0; angle < Math.PI * 2; angle += angleStepRad) {
        const endX = Math.cos(angle) * maxRadius;
        const endY = Math.sin(angle) * maxRadius;

        const start = this.space.worldToScreen({ x: 0, y: 0 }, camera, viewport);
        const end = this.space.worldToScreen({ x: endX, y: endY }, camera, viewport);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    }

    ctx.restore();
  }

  /**
   * Render Radial coordinate system (similar to polar but different visualization)
   */
  private renderRadial(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    // For now, render same as polar
    this.renderPolar(ctx, camera, viewport, visibleBounds, config);
  }

  /**
   * Apply line style (solid, dashed, dotted)
   */
  private applyLineStyle(ctx: CanvasRenderingContext2D, style: 'solid' | 'dashed' | 'dotted', dashPattern?: number[]): void {
    if (style === 'solid') {
      ctx.setLineDash([]);
    } else if (style === 'dashed') {
      ctx.setLineDash(dashPattern || [5, 5]);
    } else if (style === 'dotted') {
      ctx.setLineDash(dashPattern || [2, 3]);
    }
  }

  /**
   * Render minor grid with GridRenderConfig
   */
  private renderMinorGridWithConfig(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    ctx.save();
    ctx.strokeStyle = config.minorGrid.color;
    ctx.lineWidth = config.minorGrid.width;
    ctx.globalAlpha = config.minorGrid.opacity;

    // Apply fade with zoom if enabled
    if (config.minorGrid.fadeWithZoom && camera.zoom < 0.5) {
      ctx.globalAlpha *= camera.zoom / 0.5;
    }

    this.applyLineStyle(ctx, config.minorGrid.style);

    const spacing = config.majorGrid.spacing / config.minorGrid.subdivisions;

    ctx.beginPath();

    // Vertical lines
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      const screenStart = this.space.worldToScreen({ x, y: visibleBounds.yMin }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x, y: visibleBounds.yMax }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    // Horizontal lines
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      const screenStart = this.space.worldToScreen({ x: visibleBounds.xMin, y }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x: visibleBounds.xMax, y }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Render major grid with GridRenderConfig
   */
  private renderMajorGridWithConfig(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    ctx.save();
    ctx.strokeStyle = config.majorGrid.color;
    ctx.lineWidth = config.majorGrid.width;
    ctx.globalAlpha = config.majorGrid.opacity;

    this.applyLineStyle(ctx, config.majorGrid.style, config.majorGrid.dashPattern);

    const spacing = config.majorGrid.spacing;

    ctx.beginPath();

    // Vertical lines
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      if (Math.abs(x) < 0.0001) continue; // Skip axis
      const screenStart = this.space.worldToScreen({ x, y: visibleBounds.yMin }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x, y: visibleBounds.yMax }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    // Horizontal lines
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      if (Math.abs(y) < 0.0001) continue; // Skip axis
      const screenStart = this.space.worldToScreen({ x: visibleBounds.xMin, y }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x: visibleBounds.xMax, y }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    ctx.stroke();
    ctx.restore();
  }

  /**
   * Render axes with GridRenderConfig
   */
  private renderAxesWithConfig(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    ctx.save();
    ctx.strokeStyle = config.axes.color;
    ctx.lineWidth = config.axes.width;
    ctx.globalAlpha = config.axes.opacity;

    ctx.beginPath();

    // X-axis (y=0)
    const xAxisStart = this.space.worldToScreen(
      { x: visibleBounds.xMin, y: 0 },
      camera,
      viewport
    );
    const xAxisEnd = this.space.worldToScreen(
      { x: visibleBounds.xMax, y: 0 },
      camera,
      viewport
    );
    ctx.moveTo(xAxisStart.x, xAxisStart.y);
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y);

    // Y-axis (x=0)
    const yAxisStart = this.space.worldToScreen(
      { x: 0, y: visibleBounds.yMin },
      camera,
      viewport
    );
    const yAxisEnd = this.space.worldToScreen(
      { x: 0, y: visibleBounds.yMax },
      camera,
      viewport
    );
    ctx.moveTo(yAxisStart.x, yAxisStart.y);
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y);

    ctx.stroke();

    // Draw arrows if enabled
    if (config.axes.showArrows) {
      this.renderArrow(ctx, xAxisEnd, { x: 1, y: 0 }, config.axes.arrowSize, config.axes.color);
      this.renderArrow(ctx, yAxisEnd, { x: 0, y: -1 }, config.axes.arrowSize, config.axes.color);
    }

    ctx.restore();
  }

  /**
   * Render labels with GridRenderConfig
   */
  private renderLabelsWithConfig(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    config: GridRenderConfig
  ): void {
    ctx.save();
    ctx.fillStyle = config.labels.color;
    ctx.font = `${config.labels.fontWeight} ${config.labels.fontSize}px ${config.labels.fontFamily}`;
    ctx.globalAlpha = config.labels.opacity;

    // Apply fade with zoom if enabled
    if (config.labels.fadeWithZoom && camera.zoom < 0.5) {
      ctx.globalAlpha *= camera.zoom / 0.5;
    }

    const spacing = config.majorGrid.spacing;
    const precision = config.labels.precision;

    // X-axis labels
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      if (Math.abs(x) < 0.0001) continue; // Skip origin

      const screenPos = this.space.worldToScreen({ x, y: 0 }, camera, viewport);
      const label = config.labels.scientific && Math.abs(x) >= 1000
        ? x.toExponential(precision)
        : x.toFixed(precision);

      ctx.fillText(label, screenPos.x, screenPos.y + config.labels.offset);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      if (Math.abs(y) < 0.0001) continue; // Skip origin

      const screenPos = this.space.worldToScreen({ x: 0, y }, camera, viewport);
      const label = config.labels.scientific && Math.abs(y) >= 1000
        ? y.toExponential(precision)
        : y.toFixed(precision);

      ctx.fillText(label, screenPos.x - config.labels.offset, screenPos.y);
    }

    // Origin label
    if (config.showOriginLabel) {
      ctx.textAlign = 'right';
      ctx.textBaseline = 'top';
      const origin = this.space.worldToScreen({ x: 0, y: 0 }, camera, viewport);
      ctx.fillText('0', origin.x - config.labels.offset, origin.y + config.labels.offset);
    }

    ctx.restore();
  }

  /**
   * Render minor grid lines
   */
  private renderMinorGrid(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    style: GridStyleConfig
  ): void {
    ctx.strokeStyle = style.minorGrid.color;
    ctx.lineWidth = style.minorGrid.width;
    ctx.beginPath();

    const spacing = style.minorGrid.spacing;

    // Vertical lines
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      const screenStart = this.space.worldToScreen({ x, y: visibleBounds.yMin }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x, y: visibleBounds.yMax }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    // Horizontal lines
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      const screenStart = this.space.worldToScreen({ x: visibleBounds.xMin, y }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x: visibleBounds.xMax, y }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    ctx.stroke();
  }

  /**
   * Render major grid lines
   */
  private renderMajorGrid(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    style: GridStyleConfig
  ): void {
    ctx.strokeStyle = style.majorGrid.color;
    ctx.lineWidth = style.majorGrid.width;
    ctx.beginPath();

    const spacing = style.majorGrid.spacing;

    // Vertical lines
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      if (Math.abs(x) < 0.0001) continue; // Skip axis
      const screenStart = this.space.worldToScreen({ x, y: visibleBounds.yMin }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x, y: visibleBounds.yMax }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    // Horizontal lines
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      if (Math.abs(y) < 0.0001) continue; // Skip axis
      const screenStart = this.space.worldToScreen({ x: visibleBounds.xMin, y }, camera, viewport);
      const screenEnd = this.space.worldToScreen({ x: visibleBounds.xMax, y }, camera, viewport);
      ctx.moveTo(screenStart.x, screenStart.y);
      ctx.lineTo(screenEnd.x, screenEnd.y);
    }

    ctx.stroke();
  }

  /**
   * Render coordinate axes (x and y)
   */
  private renderAxes(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    style: GridStyleConfig
  ): void {
    ctx.strokeStyle = style.axes.color;
    ctx.lineWidth = style.axes.width;
    ctx.beginPath();

    // X-axis (y=0)
    const xAxisStart = this.space.worldToScreen(
      { x: visibleBounds.xMin, y: 0 },
      camera,
      viewport
    );
    const xAxisEnd = this.space.worldToScreen(
      { x: visibleBounds.xMax, y: 0 },
      camera,
      viewport
    );
    ctx.moveTo(xAxisStart.x, xAxisStart.y);
    ctx.lineTo(xAxisEnd.x, xAxisEnd.y);

    // Y-axis (x=0)
    const yAxisStart = this.space.worldToScreen(
      { x: 0, y: visibleBounds.yMin },
      camera,
      viewport
    );
    const yAxisEnd = this.space.worldToScreen(
      { x: 0, y: visibleBounds.yMax },
      camera,
      viewport
    );
    ctx.moveTo(yAxisStart.x, yAxisStart.y);
    ctx.lineTo(yAxisEnd.x, yAxisEnd.y);

    ctx.stroke();

    // Draw arrows if enabled
    if (style.axes.showArrows) {
      this.renderArrow(ctx, xAxisEnd, { x: 1, y: 0 }, style.axes.arrowSize, style.axes.color);
      this.renderArrow(ctx, yAxisEnd, { x: 0, y: -1 }, style.axes.arrowSize, style.axes.color);
    }
  }

  /**
   * Render an arrow at the end of an axis
   */
  private renderArrow(
    ctx: CanvasRenderingContext2D,
    tip: Point2D,
    direction: Point2D,
    size: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();

    // Arrow pointing in the direction
    const angle = Math.atan2(direction.y, direction.x);
    const arrowAngle = Math.PI / 6; // 30 degrees

    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(
      tip.x - size * Math.cos(angle - arrowAngle),
      tip.y - size * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      tip.x - size * Math.cos(angle + arrowAngle),
      tip.y - size * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  }

  /**
   * Render axis labels
   */
  private renderLabels(
    ctx: CanvasRenderingContext2D,
    camera: any,
    viewport: any,
    visibleBounds: any,
    style: GridStyleConfig
  ): void {
    ctx.fillStyle = style.labels.color;
    ctx.font = `${style.labels.fontSize}px ${style.labels.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const spacing = style.majorGrid.spacing;
    const precision = style.labels.precision;

    // X-axis labels
    const startX = Math.floor(visibleBounds.xMin / spacing) * spacing;
    for (let x = startX; x <= visibleBounds.xMax; x += spacing) {
      if (Math.abs(x) < 0.0001) continue; // Skip origin

      const screenPos = this.space.worldToScreen({ x, y: 0 }, camera, viewport);
      const label = x.toFixed(precision);

      // Position label below x-axis
      ctx.fillText(label, screenPos.x, screenPos.y + 5);
    }

    // Y-axis labels
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    const startY = Math.floor(visibleBounds.yMin / spacing) * spacing;
    for (let y = startY; y <= visibleBounds.yMax; y += spacing) {
      if (Math.abs(y) < 0.0001) continue; // Skip origin

      const screenPos = this.space.worldToScreen({ x: 0, y }, camera, viewport);
      const label = y.toFixed(precision);

      // Position label left of y-axis
      ctx.fillText(label, screenPos.x - 5, screenPos.y);
    }

    // Origin label
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    const origin = this.space.worldToScreen({ x: 0, y: 0 }, camera, viewport);
    ctx.fillText('0', origin.x - 5, origin.y + 5);
  }
}
