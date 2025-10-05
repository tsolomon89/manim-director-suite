/**
 * Type definitions for the configuration system
 */

export interface GridStyleConfig {
  id: string;
  name: string;
  description: string;
  axes: {
    color: string;
    width: number;
    showArrows: boolean;
    arrowSize: number;
  };
  majorGrid: {
    color: string;
    width: number;
    spacing: number;
    visible: boolean;
  };
  minorGrid: {
    color: string;
    width: number;
    spacing: number;
    visible: boolean;
  };
  labels: {
    show: boolean;
    color: string;
    fontSize: number;
    fontFamily: string;
    precision: number;
  };
  background: string;
}

export interface EasingCurveConfig {
  id: string;
  name: string;
  type: 'linear' | 'cubic' | 'bezier' | 'custom';
  formula?: string;
  controlPoints?: number[];
  discrete?: boolean;
}

export interface WarpConfig {
  id: string;
  name: string;
  description: string;
  type: 'identity' | 'radial' | 'conformal' | 'custom';
  formula?: string;
  parameters?: Record<string, number>;
}

export interface ColorSchemeConfig {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
    grid: string;
    axes: string;
  };
}

export interface PerformanceConfig {
  debounceMs: number;
  enableCache: boolean;
  workerThreshold: number;
  idleThresholdMs: number;
}

export interface CameraConfig {
  panSpeed: number;
  zoomSpeed: number;
  zoomMin: number;
  zoomMax: number;
  zoomDefault: number;
}

export interface TimelineConfig {
  snapEnabled: boolean;
  loopMode: 'once' | 'loop' | 'bounce';
  playbackSpeed: number;
}

export interface ParameterDefaultsConfig {
  min: number;
  max: number;
  step: number;
}

export interface ExportResolution {
  name: string;
  width: number;
  height: number;
}

export interface ExportConfig {
  resolutions: ExportResolution[];
  frameRates: number[];
  qualities: Array<'draft' | 'medium' | 'high'>;
}

export interface ValidationRules {
  parameters: {
    name: {
      pattern: string;
      maxLength: number;
    };
    expression: {
      maxLength: number;
      forbiddenPatterns: string[];
    };
    domain: {
      minRange: number;
      maxRange: number;
      singularityWarningThreshold: number;
    };
  };
}

export interface SceneConfig {
  spaceType: 'cartesian' | 'polar';
  bounds: {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  };
  allQuadrants: boolean;
}

export interface DefaultsConfig {
  scene: SceneConfig;
  grid: {
    defaultStyleId: string;
  };
  camera: CameraConfig & {
    defaultPosition: {
      x: number;
      y: number;
      zoom: number;
      rotation: number;
    };
  };
  timeline: TimelineConfig;
  parameters: {
    defaults: ParameterDefaultsConfig;
  };
  performance: PerformanceConfig;
  export: ExportConfig;
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  autoSave: boolean;
  autoSaveIntervalMs: number;
  recentProjects: string[];
  viewport: {
    renderMode: 'draft' | 'high';
    showFps: boolean;
  };
}

export interface PresetsConfig {
  'grid-styles': GridStyleConfig[];
  'color-schemes': ColorSchemeConfig[];
  'easing-curves': EasingCurveConfig[];
  'warps': WarpConfig[];
}

export interface ConfigState {
  defaults: DefaultsConfig;
  presets: PresetsConfig;
  userSettings: UserSettings;
  validationRules: ValidationRules;
}
