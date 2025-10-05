/**
 * Independent Variable Manager
 * Manages independent variables (like x, t) that define function domains
 */

import type { IndependentVariable } from './expression-types';

export class IndependentVariableManager {
  private variables: Map<string, IndependentVariable> = new Map();
  private nextId = 1;

  constructor() {
    // Create default independent variable 'x'
    this.createVariable('x', {
      min: -10,
      max: 10,
      step: 0.05,
    });
  }

  /**
   * Create a new independent variable
   * @param name - Variable name (e.g., 'x', 't', 'x_{f}')
   * @param domain - Domain configuration
   * @returns Created variable or null if name already exists
   */
  createVariable(
    name: string,
    domain: { min: number; max: number; step: number }
  ): IndependentVariable | null {
    // Check if name already exists
    if (this.getVariableByName(name)) {
      return null;
    }

    const id = `indep-${this.nextId++}`;
    const variable: IndependentVariable = {
      id,
      name,
      domain,
      linkedFunctions: [],
    };

    this.variables.set(id, variable);
    return variable;
  }

  /**
   * Get variable by ID
   */
  getVariable(id: string): IndependentVariable | undefined {
    return this.variables.get(id);
  }

  /**
   * Get variable by name
   */
  getVariableByName(name: string): IndependentVariable | undefined {
    return Array.from(this.variables.values()).find(v => v.name === name);
  }

  /**
   * Get all independent variables
   */
  getAllVariables(): IndependentVariable[] {
    return Array.from(this.variables.values());
  }

  /**
   * Update domain for a variable
   * @param id - Variable ID
   * @param domain - New domain
   * @returns True if updated successfully
   */
  updateDomain(id: string, domain: { min: number; max: number; step: number }): boolean {
    const variable = this.variables.get(id);
    if (!variable) {
      return false;
    }

    variable.domain = domain;
    return true;
  }

  /**
   * Link a function to an independent variable
   * @param variableId - Independent variable ID
   * @param functionId - Function ID
   * @returns True if linked successfully
   */
  linkFunction(variableId: string, functionId: string): boolean {
    const variable = this.variables.get(variableId);
    if (!variable) {
      return false;
    }

    if (!variable.linkedFunctions.includes(functionId)) {
      variable.linkedFunctions.push(functionId);
    }

    return true;
  }

  /**
   * Unlink a function from an independent variable
   * @param variableId - Independent variable ID
   * @param functionId - Function ID
   * @returns True if unlinked successfully
   */
  unlinkFunction(variableId: string, functionId: string): boolean {
    const variable = this.variables.get(variableId);
    if (!variable) {
      return false;
    }

    variable.linkedFunctions = variable.linkedFunctions.filter(id => id !== functionId);
    return true;
  }

  /**
   * Get all functions linked to a variable
   * @param variableId - Independent variable ID
   * @returns Array of function IDs
   */
  getLinkedFunctions(variableId: string): string[] {
    const variable = this.variables.get(variableId);
    return variable?.linkedFunctions || [];
  }

  /**
   * Delete an independent variable
   * @param id - Variable ID
   * @returns True if deleted, false if variable has linked functions
   */
  deleteVariable(id: string): boolean {
    const variable = this.variables.get(id);
    if (!variable) {
      return false;
    }

    // Cannot delete if functions are still linked
    if (variable.linkedFunctions.length > 0) {
      return false;
    }

    this.variables.delete(id);
    return true;
  }

  /**
   * Get default independent variable (x)
   */
  getDefault(): IndependentVariable | undefined {
    return this.getVariableByName('x');
  }

  /**
   * Serialize to JSON
   */
  toJSON(): any {
    return {
      variables: Array.from(this.variables.values()),
      nextId: this.nextId,
    };
  }

  /**
   * Deserialize from JSON
   */
  fromJSON(data: any): void {
    if (!data || !data.variables) {
      return;
    }

    this.variables.clear();
    this.nextId = data.nextId || 1;

    for (const variable of data.variables) {
      this.variables.set(variable.id, variable);
    }
  }

  /**
   * Reset to initial state (only default 'x')
   */
  reset(): void {
    this.variables.clear();
    this.nextId = 1;
    this.createVariable('x', {
      min: -10,
      max: 10,
      step: 0.05,
    });
  }

  /**
   * Clear all variables (for ProjectIO load)
   * Unlike reset(), this does NOT recreate default 'x'
   */
  clear(): void {
    this.variables.clear();
    this.nextId = 1;
  }
}
