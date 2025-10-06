/**
 * Marching Squares Algorithm
 * Finds contour lines where f(x,y) = c
 *
 * Algorithm: https://en.wikipedia.org/wiki/Marching_squares
 */

import type { ContourSegment, MarchingSquaresResult } from './implicit-types';
import type { Bounds2D } from './types';

export class MarchingSquares {
  /**
   * Find contour lines for implicit function f(x,y) = targetValue
   *
   * @param evaluator - Function that evaluates f(x,y)
   * @param bounds - World space bounds to search
   * @param targetValue - The constant c in f(x,y) = c
   * @param resolution - Grid resolution (e.g., 100 means 100x100 grid)
   * @param threshold - Tolerance for zero-crossing (default: 0.01)
   */
  findContours(
    evaluator: (x: number, y: number) => number,
    bounds: Bounds2D,
    targetValue: number,
    resolution: number,
    threshold: number = 0.01
  ): MarchingSquaresResult {
    const segments: ContourSegment[] = [];
    let evaluationCount = 0;

    const { xMin, xMax, yMin, yMax } = bounds;
    const dx = (xMax - xMin) / resolution;
    const dy = (yMax - yMin) / resolution;

    // Sample grid values
    const grid: number[][] = [];
    for (let i = 0; i <= resolution; i++) {
      grid[i] = [];
      for (let j = 0; j <= resolution; j++) {
        const x = xMin + i * dx;
        const y = yMin + j * dy;
        grid[i][j] = evaluator(x, y) - targetValue; // f(x,y) - c
        evaluationCount++;
      }
    }

    // March through each square
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x0 = xMin + i * dx;
        const y0 = yMin + j * dy;
        const x1 = x0 + dx;
        const y1 = y0 + dy;

        // Get corner values (already evaluated - targetValue)
        const v00 = grid[i][j];     // bottom-left
        const v10 = grid[i + 1][j]; // bottom-right
        const v11 = grid[i + 1][j + 1]; // top-right
        const v01 = grid[i][j + 1]; // top-left

        // Create marching squares case
        const caseIndex = this.getCaseIndex(v00, v10, v11, v01, threshold);

        // Get segments for this case
        const localSegments = this.getSegmentsForCase(
          caseIndex,
          x0,
          y0,
          x1,
          y1,
          v00,
          v10,
          v11,
          v01
        );

        segments.push(...localSegments);
      }
    }

    return {
      segments,
      gridSize: resolution,
      evaluationCount,
    };
  }

  /**
   * Determine marching squares case from corner values
   * Returns 4-bit index: bit 0 = v00, bit 1 = v10, bit 2 = v11, bit 3 = v01
   */
  private getCaseIndex(
    v00: number,
    v10: number,
    v11: number,
    v01: number,
    threshold: number
  ): number {
    let index = 0;
    if (Math.abs(v00) < threshold || v00 > 0) index |= 1;
    if (Math.abs(v10) < threshold || v10 > 0) index |= 2;
    if (Math.abs(v11) < threshold || v11 > 0) index |= 4;
    if (Math.abs(v01) < threshold || v01 > 0) index |= 8;
    return index;
  }

  /**
   * Get line segments for a marching squares case
   * Uses linear interpolation to find zero-crossing points
   */
  private getSegmentsForCase(
    caseIndex: number,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    v00: number,
    v10: number,
    v11: number,
    v01: number
  ): ContourSegment[] {
    // Edge midpoints (interpolated)
    const edges = {
      bottom: { x: this.lerp(x0, x1, this.zeroFraction(v00, v10)), y: y0 },
      right: { x: x1, y: this.lerp(y0, y1, this.zeroFraction(v10, v11)) },
      top: { x: this.lerp(x0, x1, this.zeroFraction(v01, v11)), y: y1 },
      left: { x: x0, y: this.lerp(y0, y1, this.zeroFraction(v00, v01)) },
    };

    // Marching squares lookup table
    // Cases 0 and 15 have no contours
    // Other cases define which edges to connect
    switch (caseIndex) {
      case 0:
      case 15:
        return [];

      case 1:
      case 14:
        return [{ start: edges.bottom, end: edges.left }];

      case 2:
      case 13:
        return [{ start: edges.bottom, end: edges.right }];

      case 3:
      case 12:
        return [{ start: edges.left, end: edges.right }];

      case 4:
      case 11:
        return [{ start: edges.top, end: edges.right }];

      case 5:
        // Saddle case: two separate segments
        return [
          { start: edges.bottom, end: edges.left },
          { start: edges.top, end: edges.right },
        ];

      case 6:
      case 9:
        return [{ start: edges.bottom, end: edges.top }];

      case 7:
      case 8:
        return [{ start: edges.left, end: edges.top }];

      case 10:
        // Saddle case: two separate segments
        return [
          { start: edges.bottom, end: edges.right },
          { start: edges.left, end: edges.top },
        ];

      default:
        return [];
    }
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }

  /**
   * Find interpolation factor for zero crossing
   * Given values v0 and v1, find t such that lerp(0, 1, t) crosses zero
   */
  private zeroFraction(v0: number, v1: number): number {
    if (Math.abs(v1 - v0) < 1e-10) return 0.5; // Avoid division by zero
    return -v0 / (v1 - v0);
  }
}
