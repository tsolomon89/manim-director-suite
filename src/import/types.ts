/**
 * Types for Desmos Import functionality
 * Phase 4: Desmos Import - MVP
 */

/**
 * Desmos graph state JSON structure
 */
export interface DesmosGraphState {
  version: number;
  randomSeed?: string;
  graph: {
    viewport: {
      xmin: number;
      ymin: number;
      xmax: number;
      ymax: number;
    };
    complex?: boolean;
  };
  expressions: {
    list: DesmosExpression[];
  };
}

/**
 * Base Desmos expression item
 */
export interface DesmosExpression {
  type: 'expression' | 'folder' | 'text';
  id: string;
  color?: string;
  hidden?: boolean;
  folderId?: string;
}

/**
 * Desmos expression with LaTeX formula
 */
export interface DesmosExpressionItem extends DesmosExpression {
  type: 'expression';
  latex: string;
  slider?: {
    hardMin?: boolean;
    hardMax?: boolean;
    min?: string;
    max?: string;
    step?: string;
    animationPeriod?: number;
    loopMode?: string;
    playDirection?: number;
  };
  lineStyle?: string;
  lineWidth?: string;
  lineOpacity?: string;
  pointStyle?: string;
  pointSize?: string;
  displayEvaluationAsFraction?: boolean;
}

/**
 * Desmos folder item
 */
export interface DesmosFolder extends DesmosExpression {
  type: 'folder';
  title: string;
  collapsed?: boolean;
}

/**
 * Desmos text note item
 */
export interface DesmosText extends DesmosExpression {
  type: 'text';
  text: string;
}

/**
 * Result of parsing a Desmos expression
 */
export interface ParsedExpression {
  isNumeric: boolean;
  name?: string;
  expression?: string;
  value?: number;
  desmosId: string;
  folderId?: string;
  slider?: {
    min: number;
    max: number;
    step: number;
  };
  reason?: string; // Why it was rejected
}

/**
 * Result of parsing entire Desmos JSON
 */
export interface DesmosParseResult {
  version: number;
  viewport: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  complexMode: boolean;
  expressions: ParsedExpression[];
  folders: Array<{ id: string; title: string }>;
  warnings: string[];
  errors: string[];
}

/**
 * Import configuration options
 */
export interface ImportOptions {
  includeHidden?: boolean; // Import hidden expressions
  autoSetViewport?: boolean; // Set scene bounds from viewport
  defaultSliderMin?: number; // Default min if no slider
  defaultSliderMax?: number; // Default max if no slider
  defaultSliderStep?: number; // Default step if no slider
}

/**
 * Import result
 */
export interface ImportResult {
  success: boolean;
  parametersCreated: number;
  warnings: string[];
  errors: string[];
}
