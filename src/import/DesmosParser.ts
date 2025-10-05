/**
 * DesmosParser - Parse Desmos JSON and extract numeric definitions
 * Phase 4: Desmos Import - MVP
 *
 * Extracts only numeric variable definitions (e.g., Z=710, k=2*Z)
 * Skips: lists, graphables, complex expressions, parametric plots
 */

import type {
  DesmosGraphState,
  DesmosExpressionItem,
  DesmosFolder,
  ParsedExpression,
  DesmosParseResult,
  ImportOptions,
} from './types';

export class DesmosParser {
  /**
   * Parse Desmos JSON string
   */
  static parse(jsonString: string, options: ImportOptions = {}): DesmosParseResult {
    try {
      const data: DesmosGraphState = JSON.parse(jsonString);
      return this.parseGraphState(data, options);
    } catch (error) {
      throw new Error(`Failed to parse Desmos JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse Desmos graph state object
   */
  static parseGraphState(data: DesmosGraphState, options: ImportOptions = {}): DesmosParseResult {
    const result: DesmosParseResult = {
      version: data.version,
      viewport: data.graph.viewport,
      complexMode: data.graph.complex === true,
      expressions: [],
      folders: [],
      warnings: [],
      errors: [],
    };

    // Extract folders first for reference
    for (const item of data.expressions.list) {
      if (item.type === 'folder') {
        const folder = item as DesmosFolder;
        result.folders.push({
          id: folder.id,
          title: folder.title,
        });
      }
    }

    // Parse expressions
    for (const item of data.expressions.list) {
      if (item.type === 'expression') {
        const exprItem = item as DesmosExpressionItem;

        // Skip hidden expressions unless option enabled
        if (exprItem.hidden && !options.includeHidden) {
          continue;
        }

        const parsed = this.parseExpression(exprItem);

        if (parsed.isNumeric) {
          result.expressions.push(parsed);
        } else if (parsed.reason) {
          result.warnings.push(`Skipped "${exprItem.latex}": ${parsed.reason}`);
        }
      }
    }

    // Warn if complex mode is enabled
    if (result.complexMode) {
      result.warnings.push('Complex mode detected - complex number features not supported in MVP');
    }

    return result;
  }

  /**
   * Parse a single Desmos expression
   * Returns parsed data if numeric definition, or reason for rejection
   */
  static parseExpression(item: DesmosExpressionItem): ParsedExpression {
    const latex = item.latex;

    // Check for simple variable definition: "name=expression"
    // Pattern matches: Z=710, k=2*Z, f_0=\tau^{-1}, etc.
    const match = latex.match(/^([a-zA-Z_][a-zA-Z0-9_]*(?:_{[^}]+})?)\s*=\s*(.+)$/);

    if (!match) {
      // Not a definition (might be equation, inequality, graphable)
      return {
        isNumeric: false,
        desmosId: item.id,
        folderId: item.folderId,
        reason: 'Not a variable definition',
      };
    }

    const [, nameRaw, expressionRaw] = match;

    // Clean up name (remove LaTeX subscripts like f_{0} -> f_0)
    const name = this.cleanLatexName(nameRaw);

    // Clean up expression (remove LaTeX syntax)
    const expression = this.cleanLatexExpression(expressionRaw);

    // Check for unsupported features in expression
    const unsupportedCheck = this.checkUnsupportedFeatures(expression, latex);
    if (!unsupportedCheck.supported) {
      return {
        isNumeric: false,
        desmosId: item.id,
        folderId: item.folderId,
        reason: unsupportedCheck.reason,
      };
    }

    // Extract slider metadata if present
    let slider: { min: number; max: number; step: number } | undefined;
    if (item.slider) {
      slider = {
        min: this.parseSliderValue(item.slider.min, -100),
        max: this.parseSliderValue(item.slider.max, 100),
        step: this.parseSliderValue(item.slider.step, 1),
      };
    }

    return {
      isNumeric: true,
      name,
      expression,
      desmosId: item.id,
      folderId: item.folderId,
      slider,
    };
  }

  /**
   * Clean LaTeX variable name to plain text
   * f_{0} -> f_0
   * \theta -> theta
   */
  private static cleanLatexName(latex: string): string {
    return latex
      .replace(/\\([a-zA-Z]+)/g, '$1') // \theta -> theta
      .replace(/_{([^}]+)}/g, '_$1')   // _{0} -> _0
      .replace(/[{}]/g, '');           // Remove remaining braces
  }

  /**
   * Clean LaTeX expression to plain math
   * Converts common LaTeX math to mathjs syntax
   */
  private static cleanLatexExpression(latex: string): string {
    let expr = latex;

    // LaTeX fractions: \frac{a}{b} -> (a)/(b)
    expr = expr.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');

    // LaTeX sqrt: \sqrt{x} -> sqrt(x)
    expr = expr.replace(/\\sqrt\{([^}]+)\}/g, 'sqrt($1)');

    // LaTeX log: \log_{base}(x) -> log(x, base)
    expr = expr.replace(/\\log_{([^}]+)}\(([^)]+)\)/g, 'log($2, $1)');
    expr = expr.replace(/\\log\(([^)]+)\)/g, 'log($1)');

    // LaTeX operatorname functions: \operatorname{mod}(x,y) -> mod(x,y)
    expr = expr.replace(/\\operatorname\{([^}]+)\}/g, '$1');

    // LaTeX left/right delimiters: \left( -> (, \right) -> )
    expr = expr.replace(/\\left|\\right/g, '');

    // Greek letters and constants
    expr = expr.replace(/\\tau/g, 'tau');    // τ = 2π
    expr = expr.replace(/\\pi/g, 'pi');
    expr = expr.replace(/\\theta/g, 'theta');
    expr = expr.replace(/\\alpha/g, 'alpha');
    expr = expr.replace(/\\beta/g, 'beta');
    expr = expr.replace(/\\gamma/g, 'gamma');

    // Subscripts: a_{k} -> a_k
    expr = expr.replace(/_{([^}]+)}/g, '_$1');

    // Superscripts: \tau^{-1} -> tau^(-1)
    expr = expr.replace(/\^{([^}]+)}/g, '^($1)');

    // LaTeX spacing: \  -> (remove)
    expr = expr.replace(/\\ /g, '');

    // Remove remaining LaTeX commands
    expr = expr.replace(/\\([a-zA-Z]+)/g, '$1');

    // Remove all remaining braces
    expr = expr.replace(/[{}]/g, '');

    // Clean up whitespace
    expr = expr.replace(/\s+/g, ' ').trim();

    return expr;
  }

  /**
   * Check if expression contains unsupported features
   */
  private static checkUnsupportedFeatures(
    expression: string,
    originalLatex: string
  ): { supported: boolean; reason?: string } {
    // List syntax: [0...Z-1] or [1,2,3,4]
    if (expression.includes('[') && expression.includes(']')) {
      if (expression.includes('...')) {
        return { supported: false, reason: 'Contains list range syntax ([...])'};
      }
      if (expression.includes(',') && expression.match(/\[[^\]]*,/)) {
        return { supported: false, reason: 'Contains list literal ([1,2,3])'};
      }
    }

    // Complex number operations: e^{i*x}, i (as imaginary unit)
    if (originalLatex.match(/e\^{?i[^a-zA-Z]/) || originalLatex.match(/[^a-zA-Z]i[^a-zA-Z]/)) {
      return { supported: false, reason: 'Contains complex number notation' };
    }

    // Points/tuples: (x, y)
    if (originalLatex.match(/\([^)]+,[^)]+\)/)) {
      return { supported: false, reason: 'Contains point/tuple notation' };
    }

    // Conditional/piecewise: { condition: value, condition: value }
    if (originalLatex.includes('\\left\\{') || expression.match(/\{[^}]*:/)) {
      return { supported: false, reason: 'Contains conditional/piecewise expression' };
    }

    // Inequalities and relations: <, >, <=, >=, equations with =
    if (expression.match(/[<>]=?/) && !expression.startsWith('=')) {
      return { supported: false, reason: 'Contains inequality (not a definition)' };
    }

    return { supported: true };
  }

  /**
   * Parse slider value (can be string expression or number)
   */
  private static parseSliderValue(value: string | undefined, defaultValue: number): number {
    if (!value) return defaultValue;

    // Try to parse as number
    const num = parseFloat(value);
    if (!isNaN(num)) return num;

    // If it's an expression (e.g., "Z", "\tau^2"), return default
    // (We'll handle expression-based slider bounds in a future phase)
    return defaultValue;
  }

  /**
   * Get folder name by ID
   */
  static getFolderName(folderId: string | undefined, result: DesmosParseResult): string | undefined {
    if (!folderId) return undefined;
    const folder = result.folders.find(f => f.id === folderId);
    return folder?.title;
  }
}
