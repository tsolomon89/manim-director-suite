/**
 * EasingRegistry
 * Loads and manages easing functions from configuration
 * Phase 5: Keyframes & Timeline
 */

import { configManager } from '../config/ConfigManager';
import type { EasingCurveConfig } from '../config/types';

/**
 * Easing function signature
 * @param t - Normalized time [0, 1]
 * @returns Eased value [0, 1]
 */
export type EasingFunction = (t: number) => number;

/**
 * Registry for easing functions
 * Implements Registry + Factory pattern from CLAUDE.md
 */
export class EasingRegistry {
  private easings: Map<string, EasingFunction> = new Map();

  constructor() {
    this.loadBuiltInEasings();
  }

  /**
   * Register an easing function
   */
  register(id: string, fn: EasingFunction): void {
    this.easings.set(id, fn);
  }

  /**
   * Get an easing function by ID
   * Falls back to linear if not found
   */
  get(id: string): EasingFunction {
    return this.easings.get(id) || this.easings.get('linear') || ((t) => t);
  }

  /**
   * Check if an easing function exists
   */
  has(id: string): boolean {
    return this.easings.has(id);
  }

  /**
   * Get all registered easing IDs
   */
  getIds(): string[] {
    return Array.from(this.easings.keys());
  }

  /**
   * Load easing curves from configuration
   */
  loadFromConfig(): void {
    try {
      const curves = configManager.getPresets<EasingCurveConfig>('easing-curves');

      for (const curve of curves) {
        const fn = this.createEasingFromConfig(curve);
        if (fn) {
          this.register(curve.id, fn);
        }
      }
    } catch (error) {
      console.error('Failed to load easing curves from config:', error);
      // Built-in easings are already loaded, so we can continue
    }
  }

  /**
   * Load built-in easing functions
   * These are always available even if config fails
   */
  private loadBuiltInEasings(): void {
    // Linear (identity)
    this.register('linear', (t) => t);

    // Smoothstep (cubic hermite)
    this.register('smoothstep', (t) => t * t * (3 - 2 * t));

    // Smootherstep (quintic hermite)
    this.register('smootherstep', (t) => t * t * t * (t * (t * 6 - 15) + 10));

    // Quadratic
    this.register('ease-in-quad', (t) => t * t);
    this.register('ease-out-quad', (t) => t * (2 - t));
    this.register('ease-in-out-quad', (t) =>
      t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    );

    // Cubic
    this.register('ease-in-cubic', (t) => t * t * t);
    this.register('ease-out-cubic', (t) => (--t) * t * t + 1);
    this.register('ease-in-out-cubic', (t) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
    );

    // Quartic
    this.register('ease-in-quart', (t) => t * t * t * t);
    this.register('ease-out-quart', (t) => 1 - (--t) * t * t * t);
    this.register('ease-in-out-quart', (t) =>
      t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t
    );

    // Quintic
    this.register('ease-in-quint', (t) => t * t * t * t * t);
    this.register('ease-out-quint', (t) => 1 + (--t) * t * t * t * t);
    this.register('ease-in-out-quint', (t) =>
      t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t
    );

    // Exponential
    this.register('ease-in-expo', (t) =>
      t === 0 ? 0 : Math.pow(2, 10 * (t - 1))
    );
    this.register('ease-out-expo', (t) =>
      t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
    );
    this.register('ease-in-out-expo', (t) => {
      if (t === 0 || t === 1) return t;
      if (t < 0.5) {
        return 0.5 * Math.pow(2, 20 * t - 10);
      }
      return 1 - 0.5 * Math.pow(2, -20 * t + 10);
    });

    // Circular
    this.register('ease-in-circ', (t) => 1 - Math.sqrt(1 - t * t));
    this.register('ease-out-circ', (t) => Math.sqrt(1 - (t - 1) * (t - 1)));
    this.register('ease-in-out-circ', (t) => {
      if (t < 0.5) {
        return 0.5 * (1 - Math.sqrt(1 - 4 * t * t));
      }
      return 0.5 * (Math.sqrt(1 - (-2 * t + 2) * (-2 * t + 2)) + 1);
    });

    // Back (overshoot)
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    const c3 = c1 + 1;

    this.register('ease-in-back', (t) => c3 * t * t * t - c1 * t * t);
    this.register('ease-out-back', (t) =>
      1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
    );
    this.register('ease-in-out-back', (t) => {
      if (t < 0.5) {
        return (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2;
      }
      return (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
    });

    // Elastic
    const c4 = (2 * Math.PI) / 3;
    const c5 = (2 * Math.PI) / 4.5;

    this.register('ease-in-elastic', (t) => {
      if (t === 0 || t === 1) return t;
      return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
    });
    this.register('ease-out-elastic', (t) => {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    });
    this.register('ease-in-out-elastic', (t) => {
      if (t === 0 || t === 1) return t;
      if (t < 0.5) {
        return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
      }
      return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
    });

    // Bounce
    this.register('ease-out-bounce', (t) => {
      const n1 = 7.5625;
      const d1 = 2.75;

      if (t < 1 / d1) {
        return n1 * t * t;
      } else if (t < 2 / d1) {
        return n1 * (t -= 1.5 / d1) * t + 0.75;
      } else if (t < 2.5 / d1) {
        return n1 * (t -= 2.25 / d1) * t + 0.9375;
      } else {
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
      }
    });
    this.register('ease-in-bounce', (t) =>
      1 - this.get('ease-out-bounce')(1 - t)
    );
    this.register('ease-in-out-bounce', (t) => {
      if (t < 0.5) {
        return (1 - this.get('ease-out-bounce')(1 - 2 * t)) / 2;
      }
      return (1 + this.get('ease-out-bounce')(2 * t - 1)) / 2;
    });
  }

  /**
   * Create an easing function from config
   * Supports formula-based and control-point-based curves
   */
  private createEasingFromConfig(config: EasingCurveConfig): EasingFunction | null {
    try {
      // If it's a built-in curve, use that
      if (this.easings.has(config.id)) {
        return this.easings.get(config.id)!;
      }

      // Formula-based easing
      if (config.formula) {
        return this.createFormulaEasing(config.formula);
      }

      // Control point-based (cubic bezier)
      if (config.controlPoints && config.controlPoints.length === 4) {
        return this.createBezierEasing(config.controlPoints);
      }

      console.warn(`Cannot create easing from config: ${config.id}`);
      return null;
    } catch (error) {
      console.error(`Error creating easing ${config.id}:`, error);
      return null;
    }
  }

  /**
   * Create easing from formula string
   * Formula should use variable 't' for time [0, 1]
   */
  private createFormulaEasing(formula: string): EasingFunction {
    // Sanitize formula (basic security check)
    if (!this.isFormulaValid(formula)) {
      throw new Error('Invalid formula');
    }

    // Create function from formula
    // Using Function constructor is safe here because we validate the formula
    return new Function('t', `return ${formula};`) as EasingFunction;
  }

  /**
   * Basic validation for formula safety
   */
  private isFormulaValid(formula: string): boolean {
    // Only allow mathematical operations, t variable, numbers, and basic Math functions
    const allowedPattern = /^[0-9t+\-*/().\s,]+$|^[0-9t+\-*/().\s,]*Math\.[a-z]+\([^)]*\)[0-9t+\-*/().\s,]*$/i;
    return allowedPattern.test(formula) && !formula.includes('eval');
  }

  /**
   * Create cubic bezier easing from control points
   * @param points - [x1, y1, x2, y2] control points
   */
  private createBezierEasing(points: number[]): EasingFunction {
    const [x1, y1, x2, y2] = points;

    // Cubic bezier curve implementation
    return (t: number): number => {
      // Binary search to find t that gives us the desired x
      let mid = t;

      // Newton-Raphson iteration for better precision
      for (let i = 0; i < 8; i++) {
        const x = this.bezier(mid, x1, x2);
        const diff = x - t;
        if (Math.abs(diff) < 0.001) break;

        const slope = this.bezierSlope(mid, x1, x2);
        if (Math.abs(slope) < 0.000001) break;

        mid -= diff / slope;
      }

      // Calculate y for the found t
      return this.bezier(mid, y1, y2);
    };
  }

  /**
   * Cubic bezier calculation for one dimension
   */
  private bezier(t: number, p1: number, p2: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * t * p1 +
           3 * oneMinusT * t * t * p2 +
           t * t * t;
  }

  /**
   * Slope of cubic bezier curve
   */
  private bezierSlope(t: number, p1: number, p2: number): number {
    const oneMinusT = 1 - t;
    return 3 * oneMinusT * oneMinusT * p1 +
           6 * oneMinusT * t * (p2 - p1) +
           3 * t * t * (1 - p2);
  }
}

// Global singleton instance
export const easingRegistry = new EasingRegistry();
