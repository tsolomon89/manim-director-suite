/**
 * Extended Grid Configuration
 * Comprehensive configuration for grid rendering with all possible options
 */

export interface GridRenderConfig {
  // Visibility controls
  showAxes: boolean;
  showMajorGrid: boolean;
  showMinorGrid: boolean;
  showLabels: boolean;
  showOriginLabel: boolean;

  // Grid type
  coordinateSystem: 'cartesian' | 'polar' | 'radial';

  // Grid scaling behavior
  adaptiveScaling: boolean;
  scaleWithZoom: boolean;
  fixedGridAtDepth: boolean;
  gridDepth: number; // Z-depth for 3D-like layering

  // Axes configuration
  axes: {
    color: string;
    width: number;
    opacity: number;
    showArrows: boolean;
    arrowSize: number;
    arrowStyle: 'filled' | 'outline' | 'line';
    extendBeyondBounds: boolean;
  };

  // Major grid configuration
  majorGrid: {
    color: string;
    width: number;
    opacity: number;
    spacing: number;
    minSpacing: number; // Minimum pixels between lines before scaling
    maxSpacing: number; // Maximum pixels before subdividing
    style: 'solid' | 'dashed' | 'dotted';
    dashPattern?: number[]; // [dash, gap, dash, gap...]
  };

  // Minor grid configuration
  minorGrid: {
    color: string;
    width: number;
    opacity: number;
    spacing: number;
    subdivisions: number; // Number of minor divisions per major division
    style: 'solid' | 'dashed' | 'dotted';
    fadeWithZoom: boolean; // Fade out when zoomed out
  };

  // Labels configuration
  labels: {
    color: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold';
    opacity: number;
    precision: number; // Decimal places
    showFractions: boolean; // Display as fractions when possible
    orientation: 'horizontal' | 'aligned' | 'perpendicular';
    offset: number; // Distance from axis
    scientific: boolean; // Use scientific notation
    fadeWithZoom: boolean;
  };

  // Polar/Radial specific
  polar?: {
    showAngleLines: boolean;
    angleStep: number; // Degrees
    showCircles: boolean;
    circleStep: number; // Radius step
    centerAtOrigin: boolean;
  };

  // Advanced rendering
  rendering: {
    antialiasing: boolean;
    shadowBlur: number;
    shadowColor: string;
    shadowOpacity: number;
    glowEffect: boolean;
    glowIntensity: number;
  };

  // Animation
  animation: {
    animateChanges: boolean;
    transitionDuration: number; // ms
    easingFunction: string;
  };

  // Background
  background: {
    color: string;
    opacity: number;
    gradient: boolean;
    gradientColors?: string[];
    gradientAngle?: number;
  };
}

/**
 * Get default grid configuration
 */
export function getDefaultGridConfig(): GridRenderConfig {
  return {
    showAxes: true,
    showMajorGrid: true,
    showMinorGrid: true,
    showLabels: true,
    showOriginLabel: true,

    coordinateSystem: 'cartesian',

    adaptiveScaling: true,
    scaleWithZoom: true,
    fixedGridAtDepth: false,
    gridDepth: 0,

    axes: {
      color: '#FFFFFF',
      width: 2,
      opacity: 1.0,
      showArrows: true,
      arrowSize: 10,
      arrowStyle: 'filled',
      extendBeyondBounds: true,
    },

    majorGrid: {
      color: '#444444',
      width: 1,
      opacity: 0.8,
      spacing: 1.0,
      minSpacing: 20, // pixels
      maxSpacing: 100, // pixels
      style: 'solid',
    },

    minorGrid: {
      color: '#2A2A2A',
      width: 0.5,
      opacity: 0.5,
      spacing: 0.2,
      subdivisions: 5,
      style: 'solid',
      fadeWithZoom: true,
    },

    labels: {
      color: '#CCCCCC',
      fontSize: 12,
      fontFamily: 'monospace',
      fontWeight: 'normal',
      opacity: 1.0,
      precision: 2,
      showFractions: false,
      orientation: 'horizontal',
      offset: 5,
      scientific: false,
      fadeWithZoom: false,
    },

    polar: {
      showAngleLines: true,
      angleStep: 30,
      showCircles: true,
      circleStep: 1.0,
      centerAtOrigin: true,
    },

    rendering: {
      antialiasing: true,
      shadowBlur: 0,
      shadowColor: '#000000',
      shadowOpacity: 0,
      glowEffect: false,
      glowIntensity: 0,
    },

    animation: {
      animateChanges: false,
      transitionDuration: 300,
      easingFunction: 'ease-out',
    },

    background: {
      color: '#000000',
      opacity: 1.0,
      gradient: false,
    },
  };
}
