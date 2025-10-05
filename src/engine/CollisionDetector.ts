/**
 * Collision Detector
 * Detects naming collisions between Parameters and Functions
 * Per spec §1: "The app detects collisions with existing Parameters/Functions and prompts user to rename"
 */

import type { Parameter } from './types';
import type { FunctionDefinition } from './expression-types';

export interface CollisionResult {
  hasCollision: boolean;
  collisionType?: 'parameter' | 'function' | 'both';
  existingName?: string;
  message?: string;
  suggestions?: string[];
}

export class CollisionDetector {
  /**
   * Check if a name collides with existing parameters or functions
   * @param name - Name to check (e.g., "k", "f", "x_{fast}")
   * @param parameters - Existing parameters
   * @param functions - Existing functions
   * @param excludeId - ID to exclude from check (for updates)
   * @returns Collision result with suggestions
   */
  static checkName(
    name: string,
    parameters: Parameter[],
    functions: FunctionDefinition[],
    excludeId?: string
  ): CollisionResult {
    let hasParameterCollision = false;
    let hasFunctionCollision = false;

    // Check parameter collisions
    for (const param of parameters) {
      if (param.id === excludeId) continue;
      if (param.name === name) {
        hasParameterCollision = true;
        break;
      }
    }

    // Check function collisions
    for (const func of functions) {
      if (func.id === excludeId) continue;
      if (func.lhs.fullName === name) {
        hasFunctionCollision = true;
        break;
      }
    }

    // No collision
    if (!hasParameterCollision && !hasFunctionCollision) {
      return { hasCollision: false };
    }

    // Determine collision type
    let collisionType: 'parameter' | 'function' | 'both';
    if (hasParameterCollision && hasFunctionCollision) {
      collisionType = 'both';
    } else if (hasParameterCollision) {
      collisionType = 'parameter';
    } else {
      collisionType = 'function';
    }

    // Generate message
    let message: string;
    if (collisionType === 'both') {
      message = `Name "${name}" already exists as both a parameter and a function. Please choose a different name.`;
    } else if (collisionType === 'parameter') {
      message = `A parameter named "${name}" already exists. Please choose a different name.`;
    } else {
      message = `A function named "${name}" already exists. Please choose a different name.`;
    }

    // Generate suggestions
    const suggestions = this.generateSuggestions(name, parameters, functions);

    return {
      hasCollision: true,
      collisionType,
      existingName: name,
      message,
      suggestions,
    };
  }

  /**
   * Generate alternative name suggestions
   * @param name - Original name
   * @param parameters - Existing parameters
   * @param functions - Existing functions
   * @returns Array of suggested alternative names
   */
  private static generateSuggestions(
    name: string,
    parameters: Parameter[],
    functions: FunctionDefinition[]
  ): string[] {
    const suggestions: string[] = [];
    const existingNames = new Set([
      ...parameters.map(p => p.name),
      ...functions.map(f => f.lhs.fullName),
    ]);

    // Strategy 1: Add subscript number
    for (let i = 1; i <= 5; i++) {
      const candidate = `${name}_{${i}}`;
      if (!existingNames.has(candidate)) {
        suggestions.push(candidate);
        if (suggestions.length >= 3) break;
      }
    }

    // Strategy 2: Add prime marks
    if (suggestions.length < 3) {
      for (let i = 1; i <= 3; i++) {
        const primes = "'".repeat(i);
        const candidate = `${name}${primes}`;
        if (!existingNames.has(candidate)) {
          suggestions.push(candidate);
          if (suggestions.length >= 3) break;
        }
      }
    }

    // Strategy 3: Add descriptive subscripts
    if (suggestions.length < 3) {
      const descriptors = ['new', 'alt', 'tmp'];
      for (const desc of descriptors) {
        const candidate = `${name}_{${desc}}`;
        if (!existingNames.has(candidate)) {
          suggestions.push(candidate);
          if (suggestions.length >= 3) break;
        }
      }
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
  }

  /**
   * Check for parameter-function call ambiguity
   * Per spec §8: f(g) calls f with parameter g's value, not function g
   * @param expression - Expression to check
   * @param parameters - Existing parameters
   * @param functions - Existing functions
   * @returns Warning if ambiguity detected
   */
  static checkFunctionCallAmbiguity(
    expression: string,
    parameters: Parameter[],
    functions: FunctionDefinition[]
  ): { hasAmbiguity: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const paramNames = new Set(parameters.map(p => p.name));
    const functionNames = new Set(functions.map(f => f.lhs.fullName));

    // Simple regex to find function calls: word(...)
    const callPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;

    while ((match = callPattern.exec(expression)) !== null) {
      const calledName = match[1];

      // Check if argument looks like a symbol (not a number or expression)
      const argsStart = match.index + match[0].length;
      const argsEnd = this.findMatchingParen(expression, argsStart - 1);
      if (argsEnd === -1) continue;

      const argsContent = expression.substring(argsStart, argsEnd).trim();

      // Check if argument is a symbol that exists as both parameter and function
      if (paramNames.has(argsContent) && functionNames.has(argsContent)) {
        warnings.push(
          `Ambiguous: "${calledName}(${argsContent})" - "${argsContent}" is both a parameter and a function. ` +
          `This will use the parameter value. To call the function, use "${calledName}(${argsContent}(x))".`
        );
      }
    }

    return {
      hasAmbiguity: warnings.length > 0,
      warnings,
    };
  }

  /**
   * Helper to find matching closing parenthesis
   */
  private static findMatchingParen(str: string, openIndex: number): number {
    let depth = 1;
    for (let i = openIndex + 1; i < str.length; i++) {
      if (str[i] === '(') depth++;
      if (str[i] === ')') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }
}
