/**
 * Space Class
 * Handles coordinate system and transformations between world and screen space
 */

import { configManager } from '../config/ConfigManager';
import type { Point2D, Bounds2D, CameraState, ViewportDimensions } from './types';

export class Space {
  private bounds: Bounds2D;
  private spaceType: 'cartesian' | 'polar';

  constructor() {
    // Load scene configuration
    const sceneConfig = configManager.get('scene');
    this.bounds = sceneConfig.bounds;
    this.spaceType = sceneConfig.spaceType;
  }

  /**
   * Get current bounds
   */
  getBounds(): Bounds2D {
    return { ...this.bounds };
  }

  /**
   * Set new bounds
   */
  setBounds(bounds: Bounds2D): void {
    this.bounds = { ...bounds };
  }

  /**
   * Get space type
   */
  getSpaceType(): 'cartesian' | 'polar' {
    return this.spaceType;
  }

  /**
   * Transform world coordinates to screen coordinates
   * @param worldPoint - Point in world space
   * @param camera - Current camera state
   * @param viewport - Viewport dimensions
   * @returns Point in screen space (canvas pixels)
   */
  worldToScreen(
    worldPoint: Point2D,
    camera: CameraState,
    viewport: ViewportDimensions
  ): Point2D {
    // Calculate offset from camera center
    const dx = worldPoint.x - camera.x;
    const dy = worldPoint.y - camera.y;

    // Apply zoom and convert to screen space
    const screenX = viewport.width / 2 + dx * camera.zoom;
    const screenY = viewport.height / 2 - dy * camera.zoom; // Y inverted

    return { x: screenX, y: screenY };
  }

  /**
   * Transform screen coordinates to world coordinates
   * @param screenPoint - Point in screen space (canvas pixels)
   * @param camera - Current camera state
   * @param viewport - Viewport dimensions
   * @returns Point in world space
   */
  screenToWorld(
    screenPoint: Point2D,
    camera: CameraState,
    viewport: ViewportDimensions
  ): Point2D {
    // Calculate offset from viewport center
    const dx = screenPoint.x - viewport.width / 2;
    const dy = screenPoint.y - viewport.height / 2;

    // Apply inverse zoom and convert to world space
    const worldX = camera.x + dx / camera.zoom;
    const worldY = camera.y - dy / camera.zoom; // Y inverted

    return { x: worldX, y: worldY };
  }

  /**
   * Get visible world bounds given current camera and viewport
   * @param camera - Current camera state
   * @param viewport - Viewport dimensions
   * @returns Bounds of visible world space
   */
  getVisibleBounds(
    camera: CameraState,
    viewport: ViewportDimensions
  ): Bounds2D {
    // Transform viewport corners to world space
    const topLeft = this.screenToWorld({ x: 0, y: 0 }, camera, viewport);
    const bottomRight = this.screenToWorld(
      { x: viewport.width, y: viewport.height },
      camera,
      viewport
    );

    return {
      xMin: topLeft.x,
      xMax: bottomRight.x,
      yMin: bottomRight.y,
      yMax: topLeft.y,
    };
  }

  /**
   * Calculate grid spacing for current zoom level
   * Returns appropriate spacing to avoid too dense or too sparse grids
   * @param baseSpacing - Base spacing from grid style config
   * @param zoom - Current zoom level
   * @returns Adjusted spacing for current zoom
   */
  calculateGridSpacing(baseSpacing: number, zoom: number): number {
    // Use powers of 10 or common fractions to keep nice round numbers
    const logSpacing = Math.log10(baseSpacing / zoom);
    const roundedLog = Math.round(logSpacing);
    return Math.pow(10, roundedLog);
  }

  /**
   * Snap a value to grid spacing
   * @param value - Value to snap
   * @param spacing - Grid spacing
   * @returns Snapped value
   */
  snapToGrid(value: number, spacing: number): number {
    return Math.round(value / spacing) * spacing;
  }

  /**
   * Check if a point is within bounds
   * @param point - Point to check
   * @returns True if point is within bounds
   */
  isInBounds(point: Point2D): boolean {
    return (
      point.x >= this.bounds.xMin &&
      point.x <= this.bounds.xMax &&
      point.y >= this.bounds.yMin &&
      point.y <= this.bounds.yMax
    );
  }
}
