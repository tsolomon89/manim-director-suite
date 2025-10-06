/**
 * Type definitions for coordinate plotting (P1)
 */

export interface CoordinateResult {
  success: boolean;
  points?: Array<{ x: number; y: number }>;
  error?: string;
}

export interface ListRange {
  type: 'range';
  start: number;
  end: number;
  step?: number;
}

export interface ExplicitList {
  type: 'explicit';
  values: number[];
}

export interface SingleValue {
  type: 'single';
  value: number;
}

export type ListOrValue = ListRange | ExplicitList | SingleValue;

export interface ParsedCoordinate {
  x: ListOrValue;
  y: ListOrValue;
}
