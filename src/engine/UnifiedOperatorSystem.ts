/**
 * Unified Operator System
 *
 * DRY architecture that manages all operators (fractals, calculus, complex, etc.)
 * Single source of truth for operator capabilities, generation, and UI controls.
 *
 * Replaces: FractalManager + OperatorRegistry with unified interface
 */

import type {
  OperatorCapability,
  OperatorConfig,
  OperatorRegistryEntry,
  OperatorPreset,
  PlottableFunction,
  ControlSpec,
  VisualizationModes,
  OperatorCategory,
} from './operator-capability-types';

export interface UnifiedOperatorSystemOptions {
  /** Auto-register built-in operators */
  autoRegisterBuiltins?: boolean;

  /** Default priority for operators */
  defaultPriority?: number;
}

export class UnifiedOperatorSystem {
  private operators: Map<string, OperatorRegistryEntry> = new Map();
  private categoryIndex: Map<OperatorCategory, string[]> = new Map();
  private presetIndex: Map<string, { operatorId: string; preset: OperatorPreset }> = new Map();

  constructor(options?: UnifiedOperatorSystemOptions) {
    const opts = {
      autoRegisterBuiltins: true,
      defaultPriority: 50,
      ...options,
    };

    if (opts.autoRegisterBuiltins) {
      this.registerBuiltinOperators();
    }
  }

  /**
   * Register an operator capability
   */
  register(
    capability: OperatorCapability,
    options?: {
      enabled?: boolean;
      priority?: number;
    }
  ): void {
    const entry: OperatorRegistryEntry = {
      capability,
      enabled: options?.enabled ?? true,
      priority: options?.priority ?? this.getDefaultPriority(capability.category),
      stats: {
        usageCount: 0,
      },
    };

    // Add to main registry
    this.operators.set(capability.id, entry);

    // Update category index
    if (!this.categoryIndex.has(capability.category)) {
      this.categoryIndex.set(capability.category, []);
    }
    this.categoryIndex.get(capability.category)!.push(capability.id);

    // Index presets
    if (capability.presets) {
      for (const [presetId, preset] of Object.entries(capability.presets)) {
        this.presetIndex.set(presetId, {
          operatorId: capability.id,
          preset,
        });
      }
    }
  }

  /**
   * Unregister an operator
   */
  unregister(operatorId: string): boolean {
    const entry = this.operators.get(operatorId);
    if (!entry) return false;

    // Remove from category index
    const categoryOps = this.categoryIndex.get(entry.capability.category);
    if (categoryOps) {
      const idx = categoryOps.indexOf(operatorId);
      if (idx !== -1) {
        categoryOps.splice(idx, 1);
      }
    }

    // Remove presets
    if (entry.capability.presets) {
      for (const presetId of Object.keys(entry.capability.presets)) {
        this.presetIndex.delete(presetId);
      }
    }

    return this.operators.delete(operatorId);
  }

  /**
   * Get operator capability by ID
   */
  get(operatorId: string): OperatorCapability | undefined {
    return this.operators.get(operatorId)?.capability;
  }

  /**
   * Check if operator is enabled
   */
  isEnabled(operatorId: string): boolean {
    return this.operators.get(operatorId)?.enabled ?? false;
  }

  /**
   * Enable/disable operator
   */
  setEnabled(operatorId: string, enabled: boolean): boolean {
    const entry = this.operators.get(operatorId);
    if (!entry) return false;

    entry.enabled = enabled;
    return true;
  }

  /**
   * Get all operators in a category
   */
  getByCategory(category: OperatorCategory): OperatorCapability[] {
    const ids = this.categoryIndex.get(category) || [];
    return ids
      .map((id) => this.operators.get(id))
      .filter((entry): entry is OperatorRegistryEntry => entry !== undefined && entry.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.capability);
  }

  /**
   * Get all enabled operators
   */
  getAllEnabled(): OperatorCapability[] {
    return Array.from(this.operators.values())
      .filter((entry) => entry.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.capability);
  }

  /**
   * Get controls for an operator
   */
  getControlsFor(operatorId: string): ControlSpec[] {
    const capability = this.get(operatorId);
    return capability?.requiredControls || [];
  }

  /**
   * Get visualization modes for an operator
   */
  getVisualizationModesFor(operatorId: string): VisualizationModes | undefined {
    const capability = this.get(operatorId);
    return capability?.visualizationModes;
  }

  /**
   * Create a plottable function from operator + config
   */
  create(operatorId: string, config: OperatorConfig): PlottableFunction {
    const entry = this.operators.get(operatorId);
    if (!entry) {
      throw new Error(`Unknown operator: ${operatorId}`);
    }

    if (!entry.enabled) {
      throw new Error(`Operator disabled: ${operatorId}`);
    }

    // Validate config
    this.validateConfig(entry.capability, config);

    // Generate plottable function
    const plottable = entry.capability.generatorFn(config, entry.capability);

    // Update usage stats
    entry.stats = {
      usageCount: (entry.stats?.usageCount || 0) + 1,
      lastUsed: new Date(),
    };

    return plottable;
  }

  /**
   * Create from preset
   */
  createFromPreset(presetId: string): PlottableFunction {
    const presetEntry = this.presetIndex.get(presetId);
    if (!presetEntry) {
      throw new Error(`Unknown preset: ${presetId}`);
    }

    const config: OperatorConfig = {
      operatorId: presetEntry.operatorId,
      values: presetEntry.preset.config,
    };

    return this.create(presetEntry.operatorId, config);
  }

  /**
   * Get preset by ID
   */
  getPreset(presetId: string): OperatorPreset | undefined {
    return this.presetIndex.get(presetId)?.preset;
  }

  /**
   * Get all presets for an operator
   */
  getPresetsFor(operatorId: string): OperatorPreset[] {
    const capability = this.get(operatorId);
    if (!capability?.presets) return [];

    return Object.values(capability.presets);
  }

  /**
   * Search operators by query
   */
  search(query: string): OperatorCapability[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.operators.values())
      .filter((entry) => {
        if (!entry.enabled) return false;

        const cap = entry.capability;
        return (
          cap.name.toLowerCase().includes(lowerQuery) ||
          cap.description.toLowerCase().includes(lowerQuery) ||
          cap.id.toLowerCase().includes(lowerQuery) ||
          cap.category.toLowerCase().includes(lowerQuery)
        );
      })
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.capability);
  }

  /**
   * Get most used operators
   */
  getMostUsed(limit: number = 5): OperatorCapability[] {
    return Array.from(this.operators.values())
      .filter((entry) => entry.enabled)
      .sort((a, b) => (b.stats?.usageCount || 0) - (a.stats?.usageCount || 0))
      .slice(0, limit)
      .map((entry) => entry.capability);
  }

  /**
   * Export state for save/load
   */
  exportState(): {
    operators: Array<{ id: string; enabled: boolean; priority: number }>;
    stats: Record<string, { usageCount: number; lastUsed?: string }>;
  } {
    const operators = Array.from(this.operators.entries()).map(([id, entry]) => ({
      id,
      enabled: entry.enabled,
      priority: entry.priority,
    }));

    const stats: Record<string, { usageCount: number; lastUsed?: string }> = {};
    for (const [id, entry] of this.operators.entries()) {
      if (entry.stats) {
        stats[id] = {
          usageCount: entry.stats.usageCount,
          lastUsed: entry.stats.lastUsed?.toISOString(),
        };
      }
    }

    return { operators, stats };
  }

  /**
   * Import state
   */
  importState(state: {
    operators: Array<{ id: string; enabled: boolean; priority: number }>;
    stats: Record<string, { usageCount: number; lastUsed?: string }>;
  }): void {
    // Update enabled/priority state
    for (const op of state.operators) {
      const entry = this.operators.get(op.id);
      if (entry) {
        entry.enabled = op.enabled;
        entry.priority = op.priority;
      }
    }

    // Update stats
    for (const [id, stats] of Object.entries(state.stats)) {
      const entry = this.operators.get(id);
      if (entry) {
        entry.stats = {
          usageCount: stats.usageCount,
          lastUsed: stats.lastUsed ? new Date(stats.lastUsed) : undefined,
        };
      }
    }
  }

  /**
   * Validate configuration against capability controls
   */
  private validateConfig(capability: OperatorCapability, config: OperatorConfig): void {
    for (const control of capability.requiredControls) {
      const value = config.values[control.id];

      // Check required
      if (control.validation?.required && value === undefined) {
        throw new Error(`Missing required control: ${control.label} (${control.id})`);
      }

      // Type-specific validation
      if (value !== undefined && control.validation) {
        const { min, max, step, integer, custom } = control.validation;

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            throw new Error(`${control.label} must be >= ${min}`);
          }
          if (max !== undefined && value > max) {
            throw new Error(`${control.label} must be <= ${max}`);
          }
          if (integer && !Number.isInteger(value)) {
            throw new Error(`${control.label} must be an integer`);
          }
        }

        // Custom validation
        if (custom) {
          const result = custom(value);
          if (!result.valid) {
            throw new Error(result.error || `Invalid value for ${control.label}`);
          }
        }
      }
    }
  }

  /**
   * Get default priority based on category
   */
  private getDefaultPriority(category: OperatorCategory): number {
    const priorities: Record<OperatorCategory, number> = {
      fractal: 100,
      calculus: 90,
      complex: 85,
      geometric: 80,
      transformation: 70,
      custom: 50,
    };
    return priorities[category] || 50;
  }

  /**
   * Register built-in operators
   */
  private registerBuiltinOperators(): void {
    // Import operator capabilities
    import('./operators/fractals/newton').then(({ newtonFractalCapability }) => {
      this.register(newtonFractalCapability);
    });

    import('./operators/fractals/mandelbrot').then(({ mandelbrotCapability }) => {
      this.register(mandelbrotCapability);
    });

    import('./operators/fractals/julia').then(({ juliaCapability }) => {
      this.register(juliaCapability);
    });
  }
}

/**
 * Global unified operator system instance
 */
export const unifiedOperatorSystem = new UnifiedOperatorSystem();
