/**
 * State Management Types
 * Project save/load data structures
 */

import type { Parameter } from '../engine/types';
import type { Keyframe } from '../timeline/types';
import type { FunctionDefinition } from '../engine/expression-types';
import type { IndependentVariable } from '../engine/expression-types';
import type { GridRenderConfig } from '../scene/GridConfig';

/**
 * Complete project state for serialization
 */
export interface ProjectState {
  version: string;
  metadata: ProjectMetadata;
  parameters: Parameter[];
  keyframes: Keyframe[];
  functions: FunctionDefinition[];
  independentVariables: IndependentVariable[];
  timeline: TimelineConfig;
  scene: SceneConfig;
  camera: CameraConfig;
  rendering: RenderingConfig;
}

/**
 * Project metadata
 */
export interface ProjectMetadata {
  name: string;
  description?: string;
  created: string; // ISO 8601 date
  modified: string; // ISO 8601 date
  author?: string;
  tags?: string[];
}

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  duration: number;
  currentTime: number;
  playbackSpeed: number;
  loopMode: 'once' | 'loop' | 'pingpong';
  fps: number;
}

/**
 * Scene configuration
 */
export interface SceneConfig {
  spaceType: 'cartesian' | 'polar';
  gridStyleId: string;
  gridConfig: GridRenderConfig;
}

/**
 * Camera configuration
 */
export interface CameraConfig {
  x: number;
  y: number;
  zoom: number;
  rotation: number;
}

/**
 * Rendering configuration
 */
export interface RenderingConfig {
  resolution: string; // e.g., "1920x1080"
  fps: number;
  quality: 'draft' | 'medium' | 'high';
}

/**
 * Project file validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Export/Import options
 */
export interface ProjectIOOptions {
  pretty?: boolean; // Pretty-print JSON
  compress?: boolean; // Minify JSON
  includeMetadata?: boolean; // Include metadata
}
