/**
 * Operator Registry
 *
 * Manages custom and built-in operators
 * Provides LaTeX/Desmos/Manim compatibility
 */

import { BUILTIN_OPERATORS, type OperatorDefinition, type OperatorRegistryEntry } from './operator-types';
import { Complex } from './complex-types';

export class OperatorRegistry {
  private operators: Map<string, OperatorRegistryEntry> = new Map();
  private latexMap: Map<string, string> = new Map(); // LaTeX → operator ID
  private mathJsMap: Map<string, string> = new Map(); // math.js name → operator ID

  constructor() {
    this.registerBuiltins();
  }

  /**
   * Register all built-in operators
   */
  private registerBuiltins(): void {
    for (const [id, definition] of Object.entries(BUILTIN_OPERATORS)) {
      this.register(definition, true, this.getDefaultPriority(definition.category));
    }
  }

  /**
   * Get default operator priority based on category
   */
  private getDefaultPriority(category: string): number {
    const priorities: Record<string, number> = {
      arithmetic: 100,
      trigonometric: 90,
      complex: 85,
      calculus: 80,
      list: 70,
      logic: 60,
      statistical: 50,
      special: 10,
    };
    return priorities[category] || 50;
  }

  /**
   * Register a custom operator
   */
  register(
    definition: OperatorDefinition,
    enabled = true,
    priority?: number
  ): void {
    const entry: OperatorRegistryEntry = {
      definition,
      enabled,
      priority: priority ?? this.getDefaultPriority(definition.category),
    };

    this.operators.set(definition.id, entry);

    // Build reverse lookup maps
    this.latexMap.set(definition.latex, definition.id);
    if (definition.mathJsName) {
      this.mathJsMap.set(definition.mathJsName, definition.id);
    }
  }

  /**
   * Unregister an operator
   */
  unregister(id: string): boolean {
    const entry = this.operators.get(id);
    if (!entry) return false;

    // Remove from reverse maps
    this.latexMap.delete(entry.definition.latex);
    if (entry.definition.mathJsName) {
      this.mathJsMap.delete(entry.definition.mathJsName);
    }

    return this.operators.delete(id);
  }

  /**
   * Get operator by ID
   */
  get(id: string): OperatorDefinition | undefined {
    return this.operators.get(id)?.definition;
  }

  /**
   * Get operator by LaTeX representation
   */
  getByLatex(latex: string): OperatorDefinition | undefined {
    const id = this.latexMap.get(latex);
    return id ? this.get(id) : undefined;
  }

  /**
   * Get operator by math.js function name
   */
  getByMathJs(mathJsName: string): OperatorDefinition | undefined {
    const id = this.mathJsMap.get(mathJsName);
    return id ? this.get(id) : undefined;
  }

  /**
   * Check if operator exists and is enabled
   */
  isEnabled(id: string): boolean {
    return this.operators.get(id)?.enabled ?? false;
  }

  /**
   * Enable/disable operator
   */
  setEnabled(id: string, enabled: boolean): boolean {
    const entry = this.operators.get(id);
    if (!entry) return false;

    entry.enabled = enabled;
    return true;
  }

  /**
   * Get all operators in a category
   */
  getByCategory(category: string): OperatorDefinition[] {
    return Array.from(this.operators.values())
      .filter((entry) => entry.enabled && entry.definition.category === category)
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.definition);
  }

  /**
   * Get all enabled operators
   */
  getAllEnabled(): OperatorDefinition[] {
    return Array.from(this.operators.values())
      .filter((entry) => entry.enabled)
      .sort((a, b) => b.priority - a.priority)
      .map((entry) => entry.definition);
  }

  /**
   * Convert expression with operators to LaTeX
   */
  toLatex(expression: string, context: Record<string, any> = {}): string {
    let latex = expression;

    // Replace operator calls with LaTeX equivalents
    for (const entry of this.operators.values()) {
      if (!entry.enabled) continue;

      const def = entry.definition;
      const regex = new RegExp(`\\b${def.id}\\s*\\(([^)]+)\\)`, 'g');

      latex = latex.replace(regex, (match, args) => {
        return this.renderLatex(def, args.split(',').map((s: string) => s.trim()), context);
      });
    }

    return latex;
  }

  /**
   * Render operator as LaTeX with given arguments
   */
  private renderLatex(
    def: OperatorDefinition,
    args: string[],
    context: Record<string, any>
  ): string {
    let latex = def.latex;

    // Special handling for different operators
    switch (def.id) {
      case 'integrate': {
        const [expr, lower, upper, variable = 'x'] = args;
        latex = latex
          .replace('{{{lower}}}', lower || context.lowerBound || 'a')
          .replace('{{{upper}}}', upper || context.upperBound || 'b')
          .replace('{{{expr}}}', expr)
          .replace('{{{var}}}', variable);
        break;
      }

      case 'sum':
      case 'product': {
        const [expr, start, end, variable = 'n'] = args;
        latex = latex
          .replace('{{{var}}}', variable)
          .replace('{{{start}}}', start || '0')
          .replace('{{{end}}}', end || 'N')
          .replace('{{{expr}}}', expr);
        break;
      }

      case 'derivative': {
        const [expr, variable = 'x'] = args;
        latex = latex
          .replace('{{{var}}}', variable)
          .replace('{{{expr}}}', expr);
        break;
      }

      case 'nthroot': {
        const [radicand, index = '2'] = args;
        latex = latex
          .replace('{{{radicand}}}', radicand)
          .replace('{{{index}}}', index);
        break;
      }

      case 'join':
      case 'repeat':
      case 'length': {
        const argsStr = args.join(', ');
        latex = latex.replace('{{{lists}}}', argsStr)
                     .replace('{{{list}}}', args[0] || '')
                     .replace('{{{count}}}', args[1] || '');
        break;
      }

      case 'conjugate':
      case 'arg':
      case 're':
      case 'im':
      case 'abs': {
        latex = latex.replace('{{{z}}}', args[0] || 'z')
                     .replace('{{{value}}}', args[0] || '');
        break;
      }

      default: {
        // Generic replacement: replace placeholders with args in order
        args.forEach((arg, idx) => {
          latex = latex.replace(`{{{arg${idx}}}}`, arg);
        });
      }
    }

    return latex;
  }

  /**
   * Parse LaTeX and convert to internal expression
   */
  fromLatex(latex: string): string {
    let expr = latex;

    // Integral: \int_{a}^{b} f(x) dx → integrate(f(x), a, b, x)
    expr = expr.replace(
      /\\int_\{([^}]+)\}\^\{([^}]+)\}\s*([^\\]+)\s*\\,?\s*d([a-z])/g,
      (_, lower, upper, integrand, variable) => {
        return `integrate(${integrand.trim()}, ${lower}, ${upper}, ${variable})`;
      }
    );

    // Sum: \sum_{n=a}^{b} expr → sum(expr, a, b, n)
    expr = expr.replace(
      /\\sum_\{([a-z])=([^}]+)\}\^\{([^}]+)\}\s*(.+)/g,
      (_, variable, start, end, expression) => {
        return `sum(${expression.trim()}, ${start}, ${end}, ${variable})`;
      }
    );

    // Product: \prod_{n=a}^{b} expr → product(expr, a, b, n)
    expr = expr.replace(
      /\\prod_\{([a-z])=([^}]+)\}\^\{([^}]+)\}\s*(.+)/g,
      (_, variable, start, end, expression) => {
        return `product(${expression.trim()}, ${start}, ${end}, ${variable})`;
      }
    );

    // Derivative: \frac{d}{dx} expr → derivative(expr, x)
    expr = expr.replace(
      /\\frac\{d\}\{d([a-z])\}\s*(.+)/g,
      (_, variable, expression) => {
        return `derivative(${expression.trim()}, ${variable})`;
      }
    );

    // Nth root: \sqrt[n]{x} → nthroot(x, n)
    expr = expr.replace(
      /\\sqrt\[([^]]+)\]\{([^}]+)\}/g,
      (_, index, radicand) => {
        return `nthroot(${radicand}, ${index})`;
      }
    );

    // Square root: \sqrt{x} → nthroot(x, 2) or sqrt(x)
    expr = expr.replace(
      /\\sqrt\{([^}]+)\}/g,
      (_, radicand) => {
        return `sqrt(${radicand})`;
      }
    );

    // Absolute value: |x| → abs(x)
    expr = expr.replace(
      /\\left\|([^|]+)\\right\|/g,
      (_, value) => {
        return `abs(${value})`;
      }
    );

    // Conjugate: \overline{z} → conjugate(z)
    expr = expr.replace(
      /\\overline\{([^}]+)\}/g,
      (_, z) => {
        return `conjugate(${z})`;
      }
    );

    // Operatorname functions: \operatorname{name}(...) → name(...)
    expr = expr.replace(
      /\\operatorname\{([^}]+)\}\\left\(([^)]+)\\right\)/g,
      (_, name, args) => {
        return `${name}(${args})`;
      }
    );

    return expr;
  }

  /**
   * Export registry state for save/load
   */
  exportState(): Record<string, OperatorRegistryEntry> {
    const state: Record<string, OperatorRegistryEntry> = {};
    for (const [id, entry] of this.operators.entries()) {
      state[id] = entry;
    }
    return state;
  }

  /**
   * Import registry state
   */
  importState(state: Record<string, OperatorRegistryEntry>): void {
    for (const [id, entry] of Object.entries(state)) {
      this.operators.set(id, entry);
      this.latexMap.set(entry.definition.latex, id);
      if (entry.definition.mathJsName) {
        this.mathJsMap.set(entry.definition.mathJsName, id);
      }
    }
  }
}

/**
 * Global operator registry instance
 */
export const operatorRegistry = new OperatorRegistry();
