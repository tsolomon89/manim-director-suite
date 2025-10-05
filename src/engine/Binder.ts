/**
 * Binder Service
 * Resolves free symbols in expressions and auto-creates missing parameters
 */

import { ExpressionEngine } from './ExpressionEngine';
import { symbolRegistry } from './SymbolRegistry';
import type { AutoParameterizationResult, FunctionCall } from './expression-types';
import type { Parameter } from './types';

export interface ParameterDefaults {
  value: number;
  min: number;
  max: number;
  step: number;
}

export class Binder {
  private expressionEngine: ExpressionEngine;
  private parameterDefaults: ParameterDefaults;

  constructor(
    expressionEngine: ExpressionEngine,
    defaults?: Partial<ParameterDefaults>
  ) {
    this.expressionEngine = expressionEngine;
    this.parameterDefaults = {
      value: defaults?.value ?? 1,
      min: defaults?.min ?? -10,
      max: defaults?.max ?? 10,
      step: defaults?.step ?? 0.1,
    };
  }

  /**
   * Bind free symbols in an expression to parameters
   * Auto-creates parameters for symbols that don't exist
   * @param rhs - Right-hand side expression
   * @param formalParams - Formal parameters to exclude (for functions)
   * @param existingParams - Map of existing parameter names to IDs
   * @param onCreate - Callback to create a new parameter
   * @returns Binding result with created/existing/unresolved symbols
   */
  bindExpression(
    rhs: string,
    formalParams: string[],
    existingParams: Map<string, string>, // name → ID
    onCreate: (name: string) => Parameter
  ): AutoParameterizationResult {
    const created: string[] = [];
    const existing: string[] = [];
    const builtins: string[] = [];
    const errors: string[] = [];

    // Extract free dependencies (excluding formals)
    const freeDeps = this.expressionEngine.extractFreeDependencies(rhs, formalParams);

    for (const symbol of freeDeps) {
      // Skip built-ins
      if (symbolRegistry.isBuiltin(symbol)) {
        builtins.push(symbol);
        continue;
      }

      // Check if parameter already exists
      if (existingParams.has(symbol)) {
        existing.push(symbol);
        continue;
      }

      // Auto-create parameter
      try {
        const param = onCreate(symbol);
        created.push(symbol);
        existingParams.set(symbol, param.id);
      } catch (error) {
        errors.push(`Failed to create parameter "${symbol}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return {
      created,
      existing,
      builtins,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Create default parameter configuration for auto-parameterization
   * @param name - Parameter name
   * @returns Parameter object with defaults
   */
  createDefaultParameter(name: string, id: string): Parameter {
    return {
      id,
      name,
      value: this.parameterDefaults.value,
      domain: {
        min: this.parameterDefaults.min,
        max: this.parameterDefaults.max,
      },
      uiControl: {
        type: 'slider',
        min: this.parameterDefaults.min,
        max: this.parameterDefaults.max,
        step: this.parameterDefaults.step,
      },
      metadata: {
        source: 'auto',
        created: new Date().toISOString(),
      },
    };
  }

  /**
   * Detect function calls in an expression and validate arity
   * @param rhs - Right-hand side expression
   * @param knownFunctions - Map of function names to expected arity
   * @returns Array of function calls with arity information
   */
  detectFunctionCalls(
    rhs: string,
    knownFunctions: Map<string, number>
  ): FunctionCall[] {
    const calls: FunctionCall[] = [];

    try {
      const node = this.expressionEngine.getMathInstance().parse(rhs);

      // Traverse AST to find function calls
      node.traverse((n: any) => {
        if (n.type === 'FunctionNode') {
          const name = n.fn?.name || n.name;
          const argsProvided = n.args?.length || 0;

          // Skip built-ins
          if (symbolRegistry.isBuiltin(name)) {
            return;
          }

          const arityExpected = knownFunctions.get(name);

          calls.push({
            name,
            argsProvided,
            arityExpected,
          });
        }
      });
    } catch {
      // Parsing failed, return empty array
    }

    return calls;
  }

  /**
   * Validate function call signatures
   * @param calls - Detected function calls
   * @returns Array of error messages for mismatched arities
   */
  validateFunctionCalls(calls: FunctionCall[]): string[] {
    const errors: string[] = [];

    for (const call of calls) {
      if (call.arityExpected === undefined) {
        errors.push(`Unknown function "${call.name}" (not defined)`);
        continue;
      }

      if (call.argsProvided !== call.arityExpected) {
        errors.push(
          `Function "${call.name}" takes ${call.arityExpected} argument(s), but ${call.argsProvided} provided`
        );
      }
    }

    return errors;
  }

  /**
   * Suggest fixes for binding errors
   * @param symbol - Symbol that couldn't be resolved
   * @param context - Context for the suggestion
   * @returns Array of suggested fixes
   */
  suggestFixes(symbol: string, context: 'parameter' | 'function'): string[] {
    const suggestions: string[] = [];

    if (context === 'parameter') {
      suggestions.push(`Did you mean to call "${symbol}(x)"?`);
      suggestions.push(`Auto-create parameter "${symbol}"`);
    } else if (context === 'function') {
      suggestions.push(`"${symbol}" is a parameter, use its value directly or call a function`);
      suggestions.push(`Define function "${symbol}(x) = ..."`);
    }

    return suggestions;
  }

  /**
   * Check if an expression contains operators (for parameter validation)
   * Parameters should only hold numeric values, not expressions
   * @param expression - Expression to check
   * @returns True if expression contains operators
   */
  containsOperators(expression: string): boolean {
    // Simple check for common operators
    // Parameters should be numeric literals or simple identifiers
    const operatorPattern = /[+\-*/^()[\]{}]/;
    return operatorPattern.test(expression);
  }

  /**
   * Validate that an expression is numeric-only (for parameters)
   * @param expression - Expression to validate
   * @returns Error message if not numeric, undefined otherwise
   */
  validateNumericOnly(expression: string): string | undefined {
    // Check for operators
    if (this.containsOperators(expression)) {
      return 'Parameters cannot contain operators. Use a Function for expressions.';
    }

    // Try to parse as number
    const num = parseFloat(expression);
    if (isNaN(num)) {
      return 'Expression must be a numeric value.';
    }

    return undefined;
  }
}
