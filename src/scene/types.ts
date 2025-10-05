/**
 * Type definitions for the Scene & Rendering system
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Bounds2D {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
  rotation: number; // degrees, 0 for MVP
}

export interface ViewportDimensions {
  width: number;
  height: number;
}

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  camera: CameraState;
  viewport: ViewportDimensions;
  bounds: Bounds2D;
}
