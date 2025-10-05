/**
 * Expression Engine
 * Parses and evaluates mathematical expressions using math.js
 * Enhanced with LHS parsing and Greek symbol support
 */

import { create, all, MathJsInstance } from 'mathjs';
import { configManager } from '../config/ConfigManager';
import { symbolRegistry } from './SymbolRegistry';
import type { ExpressionResult, ValidationResult } from './types';
import type { ParsedLHS, ParseResult, LHSValidationResult } from './expression-types';

export class ExpressionEngine {
  private math: MathJsInstance;
  private validationRules: any;

  constructor() {
    // Create math.js instance with all functions
    this.math = create(all, {
      number: 'number', // Use native numbers instead of BigNumbers for performance
      precision: 14,
    });

    // Load validation rules from config
    this.validationRules = configManager.getValidationRules();
  }

  /**
   * Evaluate an expression with given scope (context)
   * @param expression - Mathematical expression string
   * @param scope - Variables available in the expression (e.g., { x: 5, y: 10 })
   * @returns Result with success flag and value or error
   */
  evaluate(expression: string, scope: Record<string, number> = {}): ExpressionResult {
    try {
      // Validate expression first
      const validation = this.validate(expression);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors?.join(', '),
        };
      }

      // Evaluate with scope
      const value = this.math.evaluate(expression, scope);

      // Ensure result is a number
      if (typeof value !== 'number') {
        return {
          success: false,
          error: `Expression must evaluate to a number, got ${typeof value}`,
        };
      }

      // Check for invalid numbers
      if (!isFinite(value)) {
        return {
          success: false,
          error: `Expression evaluates to ${value} (infinity or NaN)`,
        };
      }

      return {
        success: true,
        value,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown evaluation error',
      };
    }
  }

  /**
   * Parse an expression to extract variable dependencies
   * @param expression - Mathematical expression string
   * @returns Array of variable names that the expression depends on
   */
  extractDependencies(expression: string): string[] {
    try {
      const node = this.math.parse(expression);
      const dependencies = new Set<string>();

      // Traverse the expression tree to find symbol nodes
      node.traverse((node: any) => {
        if (node.type === 'SymbolNode') {
          // Exclude built-in functions and constants
          if (!this.isBuiltIn(node.name)) {
            dependencies.add(node.name);
          }
        }
      });

      return Array.from(dependencies);
    } catch (error) {
      // If parsing fails, return empty array
      return [];
    }
  }

  /**
   * Check if a name is a built-in function or constant
   */
  private isBuiltIn(name: string): boolean {
    const builtIns = [
      // Math constants
      'pi', 'e', 'PI', 'E', 'tau', 'phi',
      // Common functions
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
      'sqrt', 'cbrt', 'abs', 'sign', 'floor', 'ceil', 'round',
      'exp', 'log', 'log10', 'log2', 'ln',
      'pow', 'mod', 'min', 'max',
      // Other
      'i', 'true', 'false', 'null', 'undefined',
    ];

    return builtIns.includes(name) || this.math[name as keyof MathJsInstance] !== undefined;
  }

  /**
   * Validate an expression against configured rules
   * @param expression - Expression to validate
   * @returns Validation result with errors and warnings
   */
  validate(expression: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Fallback validation rules
    const defaultMaxLength = 500;
    const defaultForbiddenPatterns = ['while\\s*\\(', 'for\\s*\\(', 'eval\\s*\\('];

    // Check expression length
    const maxLength = this.validationRules?.parameters?.expression?.maxLength || defaultMaxLength;
    if (expression.length > maxLength) {
      errors.push(`Expression exceeds maximum length of ${maxLength} characters`);
    }

    // Check for forbidden patterns
    const forbiddenPatterns = this.validationRules?.parameters?.expression?.forbiddenPatterns || defaultForbiddenPatterns;
    for (const pattern of forbiddenPatterns) {
      const regex = new RegExp(pattern);
      if (regex.test(expression)) {
        errors.push(`Expression contains forbidden pattern: ${pattern}`);
      }
    }

    // Try to parse the expression
    try {
      this.math.parse(expression);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'Invalid expression syntax');
      return { valid: false, errors };
    }

    // Check for potential singularities (division by zero, log of zero, etc.)
    if (expression.includes('/0') || expression.includes('/ 0')) {
      warnings.push('Expression may contain division by zero');
    }

    if (/log\s*\(\s*0\s*\)/.test(expression)) {
      warnings.push('Expression may contain log(0) which is undefined');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a parameter name
   * @param name - Parameter name to validate
   * @returns Validation result
   */
  validateParameterName(name: string): ValidationResult {
    const errors: string[] = [];

    // Fallback validation rules if config not loaded
    const defaultPattern = '^[a-zA-Z_][a-zA-Z0-9_]*$';
    const defaultMaxLength = 50;

    // Check pattern (must start with letter or underscore, followed by alphanumeric or underscore)
    const pattern = this.validationRules?.parameters?.name?.pattern || defaultPattern;
    const regex = new RegExp(pattern);
    if (!regex.test(name)) {
      errors.push('Parameter name must start with a letter or underscore and contain only alphanumeric characters and underscores');
    }

    // Check length
    const maxLength = this.validationRules?.parameters?.name?.maxLength || defaultMaxLength;
    if (name.length > maxLength) {
      errors.push(`Parameter name exceeds maximum length of ${maxLength} characters`);
    }

    // Check if it's a reserved word
    if (this.isBuiltIn(name)) {
      errors.push(`"${name}" is a reserved word and cannot be used as a parameter name`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Check if a value is within domain constraints
   * @param value - Value to check
   * @param min - Minimum allowed value
   * @param max - Maximum allowed value
   * @returns Validation result
   */
  validateDomain(value: number, min: number, max: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (value < min) {
      errors.push(`Value ${value} is below minimum ${min}`);
    }

    if (value > max) {
      errors.push(`Value ${value} is above maximum ${max}`);
    }

    // Check for values close to singularities
    const defaultThreshold = 0.001;
    const threshold = this.validationRules?.parameters?.domain?.singularityWarningThreshold || defaultThreshold;
    if (Math.abs(value) < threshold && value !== 0) {
      warnings.push(`Value ${value} is very close to zero, which may cause numerical instability`);
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Get the math.js instance for advanced usage
   */
  getMathInstance(): MathJsInstance {
    return this.math;
  }

  /**
   * Normalize an expression (expand Greek symbols and aliases)
   * @param expression - Raw input expression
   * @returns Normalized expression with glyphs
   */
  normalizeExpression(expression: string): string {
    return symbolRegistry.normalizeExpression(expression);
  }

  /**
   * Parse a full expression with LHS and RHS
   * Example: "f(x) = sin(k*x)" or "k = 2*Z"
   * @param fullExpression - Full expression with = sign
   * @returns Parse result with LHS and RHS
   */
  parseExpression(fullExpression: string): ParseResult {
    try {
      // Normalize the expression first (expand Greek symbols)
      const normalized = this.normalizeExpression(fullExpression);

      // Split on = sign
      const parts = normalized.split('=');
      if (parts.length !== 2) {
        return {
          success: false,
          error: 'Expression must contain exactly one = sign',
        };
      }

      const [lhsRaw, rhsRaw] = parts.map(p => p.trim());

      // Parse LHS
      const lhs = this.parseLHS(lhsRaw);
      if (!lhs) {
        return {
          success: false,
          error: 'Invalid left-hand side syntax',
        };
      }

      // Validate LHS
      const validation = this.validateLHS(lhs);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors?.join('; '),
          warnings: validation.warnings,
        };
      }

      // Normalize RHS
      const rhs = this.normalizeExpression(rhsRaw);

      return {
        success: true,
        lhs,
        rhs,
        warnings: validation.warnings,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown parsing error',
      };
    }
  }

  /**
   * Parse the left-hand side of an expression
   * Supports:
   * - Parameters: k, k_{gain}, γ
   * - Functions: f(x), g_{3}(x,y)
   * - Anonymous: y (special case for plotting)
   * @param lhs - Left-hand side string
   * @returns Parsed LHS or null if invalid
   */
  parseLHS(lhs: string): ParsedLHS | null {
    try {
      // Special case: y (anonymous plot)
      if (lhs === 'y') {
        return {
          kind: 'anonymous',
          name: 'y',
          fullName: 'y',
          raw: lhs,
        };
      }

      // Check for function pattern: name(args)
      const funcPattern = /^([a-zA-Zα-ωΑ-Ω])(?:_\{([^}]+)\})?\s*\(([^)]*)\)$/;
      const funcMatch = lhs.match(funcPattern);

      if (funcMatch) {
        const [, name, subscript, argsStr] = funcMatch;
        const formalParams = argsStr
          .split(',')
          .map(arg => arg.trim())
          .filter(arg => arg.length > 0);

        const fullName = subscript ? `${name}_{${subscript}}` : name;

        return {
          kind: 'function',
          name,
          subscript,
          fullName,
          arity: formalParams.length,
          formalParams,
          raw: lhs,
        };
      }

      // Check for parameter pattern: name or name_{subscript}
      const paramPattern = /^([a-zA-Zα-ωΑ-Ω])(?:_\{([^}]+)\})?$/;
      const paramMatch = lhs.match(paramPattern);

      if (paramMatch) {
        const [, name, subscript] = paramMatch;
        const fullName = subscript ? `${name}_{${subscript}}` : name;

        return {
          kind: 'parameter',
          name,
          subscript,
          fullName,
          raw: lhs,
        };
      }

      // Invalid LHS
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Validate a parsed LHS
   * @param lhs - Parsed LHS
   * @returns Validation result with errors and suggestions
   */
  validateLHS(lhs: ParsedLHS): LHSValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check if name is a single letter (already validated by regex, but double-check)
    if (lhs.name.length !== 1) {
      errors.push('Name must be a single letter');
      suggestions.push(`Use a single letter like "${lhs.name[0]}" with subscript if needed`);
    }

    // Check if name is a reserved constant
    if (symbolRegistry.isBuiltin(lhs.name)) {
      errors.push(`"${lhs.name}" is a reserved constant and cannot be redefined`);
      suggestions.push(`Use a different name like "${lhs.name}_approx" or "${lhs.name}_{custom}"`);
    }

    // For functions, validate formal parameters
    if (lhs.kind === 'function' && lhs.formalParams) {
      for (const param of lhs.formalParams) {
        // Each formal parameter must be a single letter (no subscripts in formals)
        if (!/^[a-zA-Zα-ωΑ-Ω]$/.test(param)) {
          errors.push(`Formal parameter "${param}" must be a single letter`);
          suggestions.push(`Use simple names like "x", "t", or "θ" for function arguments`);
        }

        // Check for duplicates
        const duplicates = lhs.formalParams.filter(p => p === param).length;
        if (duplicates > 1) {
          errors.push(`Duplicate parameter "${param}" in function signature`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  }

  /**
   * Extract dependencies from RHS, excluding formal parameters
   * @param rhs - Right-hand side expression
   * @param formalParams - Formal parameters to exclude (for functions)
   * @returns Array of free symbols
   */
  extractFreeDependencies(rhs: string, formalParams: string[] = []): string[] {
    const allDeps = this.extractDependencies(rhs);

    // Filter out formal parameters
    const freeDeps = allDeps.filter(dep => !formalParams.includes(dep));

    return freeDeps;
  }

  /**
   * Extract formal parameters from a function LHS
   * @param lhs - Left-hand side (e.g., "f(x,y)")
   * @returns Array of formal parameter names
   */
  extractFormalParameters(lhs: string): string[] {
    const parsed = this.parseLHS(lhs);
    return parsed?.formalParams || [];
  }

  /**
   * Insert implicit multiplication into expression
   * Per spec §7: "2x" → "2*x", "xy" → "x*y", "sin(x)y" → "sin(x)*y"
   *
   * Rules:
   * 1. Number followed by letter: 2x → 2*x
   * 2. Letter followed by letter: xy → x*y (respecting subscripts)
   * 3. Closing paren followed by letter/number: (x+1)y → (x+1)*y
   * 4. Number followed by opening paren: 2(x) → 2*(x)
   * 5. Preserve subscripts: x_{fast} stays as one token
   * 6. Preserve Greek symbols: 2π → 2*π, πx → π*x
   *
   * @param expression - Expression to process
   * @returns Expression with explicit multiplication operators
   */
  insertImplicitMultiplication(expression: string): string {
    let result = '';
    let i = 0;
    const len = expression.length;

    while (i < len) {
      const char = expression[i];
      const nextChar = i + 1 < len ? expression[i + 1] : '';

      // Check for subscript pattern: _{...}
      if (char === '_' && nextChar === '{') {
        // Copy subscript verbatim
        result += char + nextChar;
        i += 2;
        let braceDepth = 1;
        while (i < len && braceDepth > 0) {
          if (expression[i] === '{') braceDepth++;
          if (expression[i] === '}') braceDepth--;
          result += expression[i];
          i++;
        }

        // Check if we need multiplication after subscript
        if (i < len) {
          const afterSubscript = expression[i];
          if (this.isLetterOrGreek(afterSubscript) || this.isDigit(afterSubscript) || afterSubscript === '(') {
            result += '*';
          }
        }
        continue;
      }

      // Add current character
      result += char;

      // Check if we need to insert * after current character
      if (i + 1 < len) {
        const needsMult = this.needsImplicitMultiplication(char, nextChar, expression, i);
        if (needsMult) {
          result += '*';
        }
      }

      i++;
    }

    return result;
  }

  /**
   * Check if implicit multiplication is needed between two characters
   */
  private needsImplicitMultiplication(
    currentChar: string,
    nextChar: string,
    expression: string,
    currentIndex: number
  ): boolean {
    // Rule 1: digit followed by letter or Greek symbol or (
    if (this.isDigit(currentChar) && (this.isLetterOrGreek(nextChar) || nextChar === '(')) {
      return true;
    }

    // Rule 2: letter/Greek followed by letter/Greek (but not if starting subscript)
    if (this.isLetterOrGreek(currentChar) && this.isLetterOrGreek(nextChar)) {
      // Don't insert if next is start of subscript
      if (nextChar !== '_') {
        return true;
      }
    }

    // Rule 3: ) followed by letter/Greek/digit/(
    if (currentChar === ')' && (this.isLetterOrGreek(nextChar) || this.isDigit(nextChar) || nextChar === '(')) {
      return true;
    }

    // Rule 4: letter/Greek followed by (
    if (this.isLetterOrGreek(currentChar) && nextChar === '(') {
      // Check if this is a known function name (don't insert * before function calls)
      const beforeIndex = currentIndex;
      let functionName = '';
      let j = beforeIndex;
      while (j >= 0 && this.isLetterOrGreek(expression[j])) {
        functionName = expression[j] + functionName;
        j--;
      }

      // If it's a built-in function, don't insert multiplication
      if (symbolRegistry.isBuiltin(functionName)) {
        return false;
      }

      return true;
    }

    return false;
  }

  /**
   * Check if character is a digit
   */
  private isDigit(char: string): boolean {
    return /[0-9]/.test(char);
  }

  /**
   * Check if character is a letter or Greek symbol
   */
  private isLetterOrGreek(char: string): boolean {
    // ASCII letters
    if (/[a-zA-Z]/.test(char)) {
      return true;
    }

    // Greek letters (Unicode range)
    const code = char.charCodeAt(0);
    // Greek: α-ω (U+03B1 to U+03C9), Α-Ω (U+0391 to U+03A9)
    if ((code >= 0x03B1 && code <= 0x03C9) || (code >= 0x0391 && code <= 0x03A9)) {
      return true;
    }

    // Special symbols: π, τ, etc.
    if ('πτγδεζηθικλμνξοπρστυφχψωΓΔΘΛΞΠΣΦΨΩ'.includes(char)) {
      return true;
    }

    return false;
  }
}
