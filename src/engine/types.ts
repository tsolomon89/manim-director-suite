/**
 * Type definitions for the Expression Engine and Parameter System
 *
 * SPEC-COMPLIANT: Parameters are numeric-only, no expressions
 */

export type UIControlType = 'slider' | 'number' | 'stepper' | 'domain-editor';

export type ParameterRole = 'independent' | 'slider' | 'constant-approx';

export interface UIControl {
  type: UIControlType;
  min: number;
  max: number;
  step: number;
}

export interface ParameterDomain {
  min: number;
  max: number;
  step?: number; // For independent variables
}

export interface ParameterMetadata {
  source?: 'user' | 'desmos' | 'import' | 'auto';
  desmosId?: string;
  folderId?: string;
  created?: string;
  modified?: string;
  description?: string;
}

/**
 * Parameter: Numeric-only values (no expressions, no dependencies)
 * Per spec §6: "Parameters are numeric-only (scalars or lists) and never contain operators"
 */
export interface Parameter {
  id: string;
  name: string;
  /** Direct numeric value - NO EXPRESSIONS ALLOWED */
  value: number | number[];
  /** Optional domain constraints (for sliders and independent variables) */
  domain?: ParameterDomain;
  /** UI control configuration */
  uiControl?: UIControl;
  /** Role in the system */
  role?: ParameterRole;
  /** Metadata */
  metadata?: ParameterMetadata;
  /** Error message if value is invalid */
  error?: string;
}

export interface ExpressionResult {
  success: boolean;
  value?: number;
  error?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

export interface DependencyNode {
  id: string;
  name: string;
  dependencies: string[];
  dependents: string[];
}

export interface DependencyGraph {
  nodes: Map<string, DependencyNode>;
  evaluationOrder: string[];
}
