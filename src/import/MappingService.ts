/**
 * MappingService - Convert parsed Desmos expressions to internal Parameter format
 * Phase 4: Desmos Import - MVP
 */

import type { ParsedExpression, DesmosParseResult, ImportOptions, ImportResult } from './types';
import type { ParameterManager } from '../engine/ParameterManager';
import { configManager } from '../config/ConfigManager';

export class MappingService {
  /**
   * Map parsed Desmos expressions to Parameters
   * Creates parameters in the ParameterManager
   */
  static mapToParameters(
    parseResult: DesmosParseResult,
    parameterManager: ParameterManager,
    options: ImportOptions = {}
  ): ImportResult {
    const result: ImportResult = {
      success: true,
      parametersCreated: 0,
      warnings: [...parseResult.warnings],
      errors: [...parseResult.errors],
    };

    // Get defaults from config
    const defaults = configManager.get('parameters.defaults');
    const defaultMin = options.defaultSliderMin ?? defaults.min;
    const defaultMax = options.defaultSliderMax ?? defaults.max;
    const defaultStep = options.defaultSliderStep ?? defaults.step;

    // Track creation order for dependency resolution
    const creationOrder: ParsedExpression[] = [];

    // Simple dependency sort: constants first, then expressions
    // (More sophisticated topological sort happens in ParameterManager)
    const constants = parseResult.expressions.filter(e => !this.hasVariables(e.expression!));
    const expressions = parseResult.expressions.filter(e => this.hasVariables(e.expression!));

    creationOrder.push(...constants, ...expressions);

    // Create parameters in order
    for (const expr of creationOrder) {
      try {
        // Parse numeric value from expression
        const numericValue = parseFloat(expr.expression!);
        if (isNaN(numericValue)) {
          result.warnings.push(`Skipped non-numeric expression for ${expr.name}: "${expr.expression}"`);
          continue;
        }

        const param = parameterManager.createParameter(expr.name!, numericValue, {
          uiControl: {
            type: expr.slider ? 'slider' : 'number',
            min: expr.slider?.min ?? defaultMin,
            max: expr.slider?.max ?? defaultMax,
            step: expr.slider?.step ?? defaultStep,
          },
          metadata: {
            source: 'desmos',
            desmosId: expr.desmosId,
            folderId: expr.folderId,
          },
        });

        if (param) {
          result.parametersCreated++;
        } else {
          result.warnings.push(`Failed to create parameter: ${expr.name}`);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        result.errors.push(`Error creating parameter ${expr.name}: ${message}`);
        result.success = false;
      }
    }

    return result;
  }

  /**
   * Check if expression contains variable references
   * Simple heuristic: if it's not a pure number, it probably has variables
   */
  private static hasVariables(expression: string): boolean {
    // Try to evaluate as pure number
    const num = parseFloat(expression);
    if (!isNaN(num) && expression.trim() === num.toString()) {
      return false;
    }

    // Check for variable-like patterns
    // Contains letters (excluding common math functions)
    const funcPattern = /\b(sin|cos|tan|sqrt|log|ln|exp|abs|floor|ceil|round|min|max|pi|e|tau)\b/gi;
    const withoutFuncs = expression.replace(funcPattern, '');

    // If still contains letters, likely has variables
    return /[a-zA-Z_]/.test(withoutFuncs);
  }

  /**
   * Apply viewport bounds to scene configuration
   * Sets scene bounds from Desmos viewport
   */
  static applyViewport(
    parseResult: DesmosParseResult,
    onApply: (bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) => void
  ): void {
    const viewport = parseResult.viewport;

    onApply({
      xMin: viewport.xmin,
      xMax: viewport.xmax,
      yMin: viewport.ymin,
      yMax: viewport.ymax,
    });
  }

  /**
   * Validate import before executing
   * Checks for potential issues
   */
  static validateImport(parseResult: DesmosParseResult): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check if any expressions were found
    if (parseResult.expressions.length === 0) {
      issues.push('No numeric definitions found to import');
    }

    // Check for name conflicts
    const names = parseResult.expressions.map(e => e.name!);
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    if (duplicates.length > 0) {
      issues.push(`Duplicate parameter names found: ${duplicates.join(', ')}`);
    }

    // Check for reserved names (math.js built-ins)
    const reserved = ['sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'exp', 'abs', 'pi', 'e', 'tau'];
    const conflicts = names.filter(name => reserved.includes(name.toLowerCase()));
    if (conflicts.length > 0) {
      issues.push(`Parameters use reserved names: ${conflicts.join(', ')}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  /**
   * Generate import preview summary
   */
  static generatePreview(parseResult: DesmosParseResult): {
    totalExpressions: number;
    numericDefinitions: number;
    withSliders: number;
    skipped: number;
    folders: number;
    warnings: number;
  } {
    return {
      totalExpressions: parseResult.expressions.length,
      numericDefinitions: parseResult.expressions.length,
      withSliders: parseResult.expressions.filter(e => e.slider !== undefined).length,
      skipped: parseResult.warnings.length,
      folders: parseResult.folders.length,
      warnings: parseResult.warnings.length + parseResult.errors.length,
    };
  }
}
