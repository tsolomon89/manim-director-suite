/**
 * Camera Class
 * Manages camera position, zoom, and transformations
 * All values configurable from ConfigManager
 */

import { configManager } from '../config/ConfigManager';
import type { CameraState, Bounds2D } from './types';

export class Camera {
  private state: CameraState;
  private panSpeed: number;
  private zoomMin: number;
  private zoomMax: number;

  constructor() {
    // Load default position from config
    const defaultPos = configManager.get<CameraState>('camera.defaultPosition');
    this.state = { ...defaultPos };

    // Load camera settings from config
    this.panSpeed = configManager.get<number>('camera.panSpeed');
    this.zoomMin = configManager.get<number>('camera.zoomMin');
    this.zoomMax = configManager.get<number>('camera.zoomMax');
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return { ...this.state };
  }

  /**
   * Set camera state directly
   */
  setState(state: Partial<CameraState>): void {
    this.state = { ...this.state, ...state };
  }

  /**
   * Pan the camera by delta pixels (screen space)
   * @param dx - Delta X in screen pixels
   * @param dy - Delta Y in screen pixels
   */
  pan(dx: number, dy: number): void {
    // Convert screen space delta to world space based on zoom
    const worldDx = (dx / this.state.zoom) * this.panSpeed;
    const worldDy = (dy / this.state.zoom) * this.panSpeed;

    this.state.x -= worldDx;
    this.state.y += worldDy; // Y inverted (screen coords go down, world coords go up)
  }

  /**
   * Zoom the camera by a factor
   * @param factor - Zoom factor (>1 = zoom in, <1 = zoom out)
   * @param centerX - Screen X coordinate to zoom towards (optional)
   * @param centerY - Screen Y coordinate to zoom towards (optional)
   */
  zoom(factor: number, centerX?: number, centerY?: number): void {
    const oldZoom = this.state.zoom;
    const newZoom = Math.max(
      this.zoomMin,
      Math.min(this.zoomMax, oldZoom * factor)
    );

    // If zoom actually changed and center point provided, adjust position
    // to zoom towards that point
    if (newZoom !== oldZoom && centerX !== undefined && centerY !== undefined) {
      const zoomChange = newZoom / oldZoom;
      // This keeps the point under the cursor stationary during zoom
      this.state.x = centerX - (centerX - this.state.x) * zoomChange;
      this.state.y = centerY - (centerY - this.state.y) * zoomChange;
    }

    this.state.zoom = newZoom;
  }

  /**
   * Reset camera to default position
   */
  reset(): void {
    const defaultPos = configManager.get<CameraState>('camera.defaultPosition');
    this.state = { ...defaultPos };
  }

  /**
   * Fit camera to show the given bounds
   * @param bounds - The bounds to fit
   * @param viewportWidth - Viewport width in pixels
   * @param viewportHeight - Viewport height in pixels
   * @param padding - Padding as fraction of viewport (default 0.1 = 10%)
   */
  fitToBounds(
    bounds: Bounds2D,
    viewportWidth: number,
    viewportHeight: number,
    padding: number = 0.1
  ): void {
    const boundsWidth = bounds.xMax - bounds.xMin;
    const boundsHeight = bounds.yMax - bounds.yMin;
    const boundsCenterX = (bounds.xMin + bounds.xMax) / 2;
    const boundsCenterY = (bounds.yMin + bounds.yMax) / 2;

    // Calculate zoom to fit bounds with padding
    const paddingFactor = 1 - padding * 2;
    const zoomX = (viewportWidth * paddingFactor) / boundsWidth;
    const zoomY = (viewportHeight * paddingFactor) / boundsHeight;
    const zoom = Math.min(zoomX, zoomY);

    // Clamp zoom to limits
    this.state.zoom = Math.max(this.zoomMin, Math.min(this.zoomMax, zoom));

    // Center on bounds center
    this.state.x = boundsCenterX;
    this.state.y = boundsCenterY;
  }

  /**
   * Serialize camera state to JSON
   */
  toJSON(): CameraState {
    return { ...this.state };
  }

  /**
   * Load camera state from JSON
   */
  fromJSON(json: CameraState): void {
    this.state = { ...json };
  }

  /**
   * Get camera position
   */
  getPosition(): { x: number; y: number } {
    return { x: this.state.x, y: this.state.y };
  }

  /**
   * Get current zoom level
   */
  getZoom(): number {
    return this.state.zoom;
  }

  /**
   * Get zoom limits from config
   */
  getZoomLimits(): { min: number; max: number } {
    return { min: this.zoomMin, max: this.zoomMax };
  }
}
