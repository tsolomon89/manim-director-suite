/**
 * Function Manager
 * Manages function definitions with LHS/RHS parsing and auto-parameterization
 */

import { ExpressionEngine } from './ExpressionEngine';
import { Binder } from './Binder';
import { IndependentVariableManager } from './IndependentVariableManager';
import type {
  FunctionDefinition,
  FunctionStats,
  AutoParameterizationResult,
} from './expression-types';
import type { Parameter } from './types';

export interface FunctionManagerOptions {
  expressionEngine: ExpressionEngine;
  binder: Binder;
  independentVarManager: IndependentVariableManager;
}

export class FunctionManager {
  private functions: Map<string, FunctionDefinition> = new Map();
  private expressionEngine: ExpressionEngine;
  private binder: Binder;
  private independentVarManager: IndependentVariableManager;
  private nextId = 1;

  // Default style configuration
  private readonly DEFAULT_COLORS = [
    '#3B82F6', // blue
    '#EF4444', // red
    '#10B981', // green
    '#F59E0B', // amber
    '#8B5CF6', // purple
    '#EC4899', // pink
  ];

  constructor(options: FunctionManagerOptions) {
    this.expressionEngine = options.expressionEngine;
    this.binder = options.binder;
    this.independentVarManager = options.independentVarManager;
  }

  /**
   * Create a function from a full expression (LHS = RHS)
   * @param fullExpression - Full expression with = sign (e.g., "f(x) = sin(k*x)")
   * @param existingParams - Map of existing parameter names to IDs
   * @param onCreateParameter - Callback to create auto-parameters
   * @returns Created function or error
   */
  createFunction(
    fullExpression: string,
    existingParams: Map<string, string>,
    onCreateParameter: (name: string) => Parameter
  ): { success: boolean; function?: FunctionDefinition; error?: string; autoParams?: AutoParameterizationResult } {
    // Apply implicit multiplication to the full expression first
    let expandedExpression = this.expressionEngine.insertImplicitMultiplication(fullExpression);

    // Check for anonymous plot shorthand: y = expr
    // Convert to anonymous(x) = expr for internal processing
    if (expandedExpression.trim().startsWith('y=') || expandedExpression.trim().startsWith('y =')) {
      const rhsMatch = expandedExpression.match(/^y\s*=\s*(.+)$/);
      if (rhsMatch) {
        // Get default independent variable name (usually 'x')
        const defaultIndepVar = this.independentVarManager.getDefault();
        const indepVarName = defaultIndepVar?.name || 'x';

        // Expand to anonymous function: anonymous(x) = rhs
        expandedExpression = `anonymous(${indepVarName})=${rhsMatch[1]}`;
      }
    }

    // Parse the expression
    const parseResult = this.expressionEngine.parseExpression(expandedExpression);
    if (!parseResult.success || !parseResult.lhs || !parseResult.rhs) {
      return {
        success: false,
        error: parseResult.error || 'Failed to parse expression',
      };
    }

    const { lhs, rhs } = parseResult;

    // Check for duplicate names
    if (this.getFunctionByName(lhs.fullName)) {
      return {
        success: false,
        error: `Function "${lhs.fullName}" already exists`,
      };
    }

    // Auto-parameterization: bind free symbols
    const formalParams = lhs.formalParams || [];
    const autoParams = this.binder.bindExpression(
      rhs,
      formalParams,
      existingParams,
      onCreateParameter
    );

    if (autoParams.errors && autoParams.errors.length > 0) {
      return {
        success: false,
        error: autoParams.errors.join('; '),
      };
    }

    // Get or create independent variable
    let independentVar = this.independentVarManager.getDefault();
    if (!independentVar) {
      return {
        success: false,
        error: 'No independent variable available',
      };
    }

    // Create function
    const id = `func-${this.nextId++}`;
    const colorIndex = (this.nextId - 1) % this.DEFAULT_COLORS.length;

    const func: FunctionDefinition = {
      id,
      lhs,
      expression: rhs,
      independentVarId: independentVar.id,
      dependencies: [...autoParams.created, ...autoParams.existing],
      style: {
        color: this.DEFAULT_COLORS[colorIndex],
        opacity: 1.0,
        lineWidth: 2,
        lineType: 'solid',
      },
      visible: true,
    };

    // Link function to independent variable
    this.independentVarManager.linkFunction(independentVar.id, id);

    this.functions.set(id, func);

    return {
      success: true,
      function: func,
      autoParams,
    };
  }

  /**
   * Get function by ID
   */
  getFunction(id: string): FunctionDefinition | undefined {
    return this.functions.get(id);
  }

  /**
   * Get function by name
   */
  getFunctionByName(name: string): FunctionDefinition | undefined {
    return Array.from(this.functions.values()).find(f => f.lhs.fullName === name);
  }

  /**
   * Get all functions
   */
  getAllFunctions(): FunctionDefinition[] {
    return Array.from(this.functions.values());
  }

  /**
   * Update function expression
   * @param id - Function ID
   * @param newExpression - New RHS expression
   * @param existingParams - Map of existing parameters
   * @param onCreateParameter - Callback to create auto-parameters
   * @returns Success flag and auto-parameterization result
   */
  updateExpression(
    id: string,
    newExpression: string,
    existingParams: Map<string, string>,
    onCreateParameter: (name: string) => Parameter
  ): { success: boolean; error?: string; autoParams?: AutoParameterizationResult } {
    const func = this.functions.get(id);
    if (!func) {
      return { success: false, error: 'Function not found' };
    }

    // Apply implicit multiplication, then normalize
    const withImplicitMult = this.expressionEngine.insertImplicitMultiplication(newExpression);
    const normalized = this.expressionEngine.normalizeExpression(withImplicitMult);

    // Auto-parameterization
    const formalParams = func.lhs.formalParams || [];
    const autoParams = this.binder.bindExpression(
      normalized,
      formalParams,
      existingParams,
      onCreateParameter
    );

    if (autoParams.errors && autoParams.errors.length > 0) {
      return {
        success: false,
        error: autoParams.errors.join('; '),
      };
    }

    // Update function
    func.expression = normalized;
    func.dependencies = [...autoParams.created, ...autoParams.existing];
    delete func.error;
    delete func.stats; // Invalidate stats

    return {
      success: true,
      autoParams,
    };
  }

  /**
   * Update function style
   */
  updateStyle(
    id: string,
    updates: Partial<FunctionDefinition['style']>
  ): boolean {
    const func = this.functions.get(id);
    if (!func) {
      return false;
    }

    func.style = { ...func.style, ...updates };
    return true;
  }

  /**
   * Toggle function visibility
   */
  toggleVisibility(id: string): boolean {
    const func = this.functions.get(id);
    if (!func) {
      return false;
    }

    func.visible = !func.visible;
    return true;
  }

  /**
   * Link function to a different independent variable
   */
  changeIndependentVariable(functionId: string, newVarId: string): boolean {
    const func = this.functions.get(functionId);
    if (!func) {
      return false;
    }

    const newVar = this.independentVarManager.getVariable(newVarId);
    if (!newVar) {
      return false;
    }

    // Unlink from old variable
    this.independentVarManager.unlinkFunction(func.independentVarId, functionId);

    // Link to new variable
    func.independentVarId = newVarId;
    this.independentVarManager.linkFunction(newVarId, functionId);
    delete func.stats; // Invalidate stats

    return true;
  }

  /**
   * Compute statistics for a function
   * @param id - Function ID
   * @param paramValues - Current parameter values
   * @returns Computed stats or error
   */
  computeStats(
    id: string,
    paramValues: Record<string, number>
  ): { success: boolean; stats?: FunctionStats; error?: string } {
    const func = this.functions.get(id);
    if (!func) {
      return { success: false, error: 'Function not found' };
    }

    const independentVar = this.independentVarManager.getVariable(func.independentVarId);
    if (!independentVar) {
      return { success: false, error: 'Independent variable not found' };
    }

    const { domain } = independentVar;
    const samples: number[] = [];
    let sampleCount = 0;
    let yMin = Infinity;
    let yMax = -Infinity;
    let sum = 0;
    let prevY: number | null = null;
    let zeroCrossings = 0;
    let continuous = true;

    // Sample the function
    for (let x = domain.min; x <= domain.max; x += domain.step) {
      const scope = { ...paramValues, x };
      const result = this.expressionEngine.evaluate(func.expression, scope);

      if (result.success && isFinite(result.value!)) {
        const y = result.value!;
        samples.push(y);
        sampleCount++;
        yMin = Math.min(yMin, y);
        yMax = Math.max(yMax, y);
        sum += y;

        // Detect zero crossings
        if (prevY !== null && Math.sign(prevY) !== Math.sign(y)) {
          zeroCrossings++;
        }
        prevY = y;
      } else {
        // Discontinuity detected
        continuous = false;
        prevY = null;
      }
    }

    if (sampleCount === 0) {
      return {
        success: false,
        error: 'No valid samples (function may be undefined over domain)',
      };
    }

    const stats: FunctionStats = {
      sampleCount,
      yMin,
      yMax,
      zeroCrossings,
      mean: sum / sampleCount,
      continuous,
    };

    func.stats = stats;

    return {
      success: true,
      stats,
    };
  }

  /**
   * Delete a function
   */
  deleteFunction(id: string): boolean {
    const func = this.functions.get(id);
    if (!func) {
      return false;
    }

    // Unlink from independent variable
    this.independentVarManager.unlinkFunction(func.independentVarId, id);

    this.functions.delete(id);
    return true;
  }

  /**
   * Get all function names for validation
   */
  getFunctionNames(): Map<string, number> {
    const names = new Map<string, number>();
    for (const func of this.functions.values()) {
      names.set(func.lhs.fullName, func.lhs.arity || 0);
    }
    return names;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      functions: Array.from(this.functions.values()),
      nextId: this.nextId,
    };
  }

  /**
   * Deserialize from JSON
   */
  fromJSON(data: any): void {
    if (!data || !data.functions) {
      return;
    }

    this.functions.clear();
    this.nextId = data.nextId || 1;

    for (const func of data.functions) {
      this.functions.set(func.id, func);
    }
  }

  /**
   * Reset to empty state
   */
  reset(): void {
    // Unlink all functions from independent variables
    for (const func of this.functions.values()) {
      this.independentVarManager.unlinkFunction(func.independentVarId, func.id);
    }

    this.functions.clear();
    this.nextId = 1;
  }

  /**
   * Clear all functions (alias for reset, used by ProjectIO)
   */
  clear(): void {
    this.reset();
  }

  /**
   * Restore a function from saved state (for ProjectIO load)
   * @param func - FunctionDefinition to restore
   */
  restoreFunction(func: FunctionDefinition): void {
    // Update nextId if necessary
    const idNum = parseInt(func.id.replace('func-', ''));
    if (!isNaN(idNum) && idNum >= this.nextId) {
      this.nextId = idNum + 1;
    }

    // Link to independent variable
    this.independentVarManager.linkFunction(func.independentVarId, func.id);

    // Add to functions map
    this.functions.set(func.id, func);
  }

  /**
   * Check if a function is an anonymous plot (created from y = expr)
   */
  isAnonymous(func: FunctionDefinition): boolean {
    return func.lhs.fullName === 'anonymous';
  }

  /**
   * Get display name for a function
   * Returns "y" for anonymous plots, otherwise the full function name
   */
  getDisplayName(func: FunctionDefinition): string {
    return this.isAnonymous(func) ? 'y' : func.lhs.fullName;
  }
}
