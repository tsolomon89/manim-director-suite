/**
 * Parameter Manager
 * Manages parameter CRUD operations (numeric-only, no expressions)
 * Per spec §6: "Parameters are numeric-only (scalars or lists) and never contain operators"
 */

import { configManager } from '../config/ConfigManager';
import { ExpressionEngine } from './ExpressionEngine';
import type { Parameter, ParameterDomain, UIControl, ParameterRole } from './types';

export class ParameterManager {
  private parameters: Map<string, Parameter>;
  private expressionEngine: ExpressionEngine;
  private nextId: number;

  constructor() {
    this.parameters = new Map();
    this.expressionEngine = new ExpressionEngine();
    this.nextId = 1;
  }

  /**
   * Create a new parameter (numeric value only)
   * @param name - Parameter name (e.g., "Z", "k", "T")
   * @param value - Numeric value (scalar or array)
   * @param options - Optional domain, UI control, role, and metadata
   * @returns The created parameter or null if validation fails
   */
  createParameter(
    name: string,
    value: number | number[],
    options?: {
      domain?: ParameterDomain;
      uiControl?: UIControl;
      role?: ParameterRole;
      metadata?: any;
    }
  ): Parameter | null {
    // Validate name
    const nameValidation = this.expressionEngine.validateParameterName(name);
    if (!nameValidation.valid) {
      console.error('Invalid parameter name:', nameValidation.errors);
      return null;
    }

    // Check for duplicate names
    if (this.findParameterByName(name)) {
      console.error(`Parameter with name "${name}" already exists`);
      return null;
    }

    // Get defaults from config
    const defaults = configManager.get('parameters.defaults');

    // Validate domain if provided
    if (typeof value === 'number' && options?.domain) {
      const domainValidation = this.expressionEngine.validateDomain(
        value,
        options.domain.min,
        options.domain.max
      );
      if (!domainValidation.valid) {
        console.error('Value out of domain:', domainValidation.errors);
        return null;
      }
    }

    // Create parameter object
    const id = `param-${this.nextId++}`;
    const parameter: Parameter = {
      id,
      name,
      value,
      domain: options?.domain,
      uiControl: options?.uiControl || {
        type: 'number',
        min: defaults.min,
        max: defaults.max,
        step: defaults.step,
      },
      role: options?.role,
      metadata: {
        source: 'user',
        created: new Date().toISOString(),
        ...options?.metadata,
      },
    };

    // Add to parameters map
    this.parameters.set(id, parameter);

    return parameter;
  }

  /**
   * Get a parameter by ID
   */
  getParameter(id: string): Parameter | undefined {
    return this.parameters.get(id);
  }

  /**
   * Get all parameters
   */
  getAllParameters(): Parameter[] {
    return Array.from(this.parameters.values());
  }

  /**
   * Find a parameter by name
   */
  findParameterByName(name: string): Parameter | undefined {
    for (const param of this.parameters.values()) {
      if (param.name === name) {
        return param;
      }
    }
    return undefined;
  }

  /**
   * Update a parameter's role
   */
  updateRole(id: string, newRole: ParameterRole | undefined): boolean {
    const parameter = this.parameters.get(id);
    if (!parameter) return false;

    parameter.role = newRole;
    if (parameter.metadata) {
      parameter.metadata.modified = new Date().toISOString();
    }

    return true;
  }

  /**
   * Update a parameter's value
   */
  updateValue(id: string, newValue: number | number[]): boolean {
    const parameter = this.parameters.get(id);
    if (!parameter) return false;

    // Validate domain if scalar and domain exists
    if (typeof newValue === 'number' && parameter.domain) {
      const domainValidation = this.expressionEngine.validateDomain(
        newValue,
        parameter.domain.min,
        parameter.domain.max
      );

      if (!domainValidation.valid) {
        console.error('Value out of domain:', domainValidation.errors);
        return false;
      }
    }

    parameter.value = newValue;
    if (parameter.metadata) {
      parameter.metadata.modified = new Date().toISOString();
    }

    return true;
  }

  /**
   * Delete a parameter
   */
  deleteParameter(id: string): boolean {
    const parameter = this.parameters.get(id);
    if (!parameter) return false;

    // Note: No dependency check needed since parameters don't have dependencies
    // Functions may depend on parameters, but that's checked in FunctionManager

    this.parameters.delete(id);
    return true;
  }

  /**
   * Clear all parameters
   */
  clear(): void {
    this.parameters.clear();
    this.nextId = 1;
  }

  /**
   * Export all parameters to JSON
   */
  toJSON(): any {
    return {
      parameters: Array.from(this.parameters.values()),
    };
  }

  /**
   * Import parameters from JSON
   */
  fromJSON(data: any): void {
    this.clear();

    if (data.parameters) {
      for (const param of data.parameters) {
        this.parameters.set(param.id, param);

        // Update nextId
        const idNum = parseInt(param.id.split('-')[1]);
        if (idNum >= this.nextId) {
          this.nextId = idNum + 1;
        }
      }
    }
  }

  /**
   * Get the expression engine instance
   */
  getExpressionEngine(): ExpressionEngine {
    return this.expressionEngine;
  }

  /**
   * Create an independent variable (special parameter with role='independent')
   * @param name - Variable name (e.g., 'x', 't')
   * @param domain - Domain with min, max, step
   * @returns Created parameter or null if validation fails
   */
  createIndependentVariable(
    name: string,
    domain: { min: number; max: number; step: number }
  ): Parameter | null {
    // Independent variables have a default value at domain midpoint
    const defaultValue = (domain.min + domain.max) / 2;

    return this.createParameter(name, defaultValue, {
      role: 'independent',
      domain: {
        min: domain.min,
        max: domain.max,
        step: domain.step,
      },
      uiControl: {
        type: 'domain-editor',
        min: domain.min,
        max: domain.max,
        step: domain.step,
      },
      metadata: {
        source: 'user',
        created: new Date().toISOString(),
      },
    });
  }

  /**
   * Get all independent variables (parameters with role='independent')
   */
  getIndependentVariables(): Parameter[] {
    return this.getAllParameters().filter(p => p.role === 'independent');
  }

  /**
   * Get independent variable by name
   */
  getIndependentVariableByName(name: string): Parameter | undefined {
    return this.getIndependentVariables().find(p => p.name === name);
  }
}
