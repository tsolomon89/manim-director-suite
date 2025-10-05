/**
 * Dependency Graph
 * Tracks dependencies between parameters and determines evaluation order
 */

import type { DependencyNode, DependencyGraph as DependencyGraphType } from './types';

export class DependencyGraph {
  private nodes: Map<string, DependencyNode>;

  constructor() {
    this.nodes = new Map();
  }

  /**
   * Add a node to the graph
   * @param id - Parameter ID
   * @param name - Parameter name
   * @param dependencies - Array of parameter names this depends on
   */
  addNode(id: string, name: string, dependencies: string[]): void {
    // Get existing node or create new one
    const node = this.nodes.get(id) || {
      id,
      name,
      dependencies: [],
      dependents: [],
    };

    // Update dependencies
    node.dependencies = [...dependencies];

    this.nodes.set(id, node);

    // Update dependents in referenced nodes
    this.updateDependents();
  }

  /**
   * Remove a node from the graph
   */
  removeNode(id: string): void {
    this.nodes.delete(id);
    this.updateDependents();
  }

  /**
   * Update the dependents list for all nodes
   */
  private updateDependents(): void {
    // Clear all dependents
    for (const node of this.nodes.values()) {
      node.dependents = [];
    }

    // Rebuild dependents
    for (const node of this.nodes.values()) {
      for (const depName of node.dependencies) {
        // Find node with this name
        const depNode = this.findNodeByName(depName);
        if (depNode && !depNode.dependents.includes(node.id)) {
          depNode.dependents.push(node.id);
        }
      }
    }
  }

  /**
   * Find a node by parameter name
   */
  private findNodeByName(name: string): DependencyNode | undefined {
    for (const node of this.nodes.values()) {
      if (node.name === name) {
        return node;
      }
    }
    return undefined;
  }

  /**
   * Get topological sort order for evaluation
   * Returns IDs in the order they should be evaluated
   * @returns Array of parameter IDs or null if there's a circular dependency
   */
  getEvaluationOrder(): string[] | null {
    const visited = new Set<string>();
    const tempMarked = new Set<string>();
    const order: string[] = [];

    const visit = (id: string): boolean => {
      if (tempMarked.has(id)) {
        // Circular dependency detected
        return false;
      }

      if (visited.has(id)) {
        return true;
      }

      tempMarked.add(id);

      const node = this.nodes.get(id);
      if (node) {
        // Visit dependencies first
        for (const depName of node.dependencies) {
          const depNode = this.findNodeByName(depName);
          if (depNode && !visit(depNode.id)) {
            return false;
          }
        }
      }

      tempMarked.delete(id);
      visited.add(id);
      order.push(id);

      return true;
    };

    // Visit all nodes
    for (const id of this.nodes.keys()) {
      if (!visited.has(id)) {
        if (!visit(id)) {
          return null; // Circular dependency
        }
      }
    }

    return order;
  }

  /**
   * Detect circular dependencies
   * @returns Array of parameter IDs involved in circular dependency, or empty array if none
   */
  detectCircularDependencies(): string[] {
    const order = this.getEvaluationOrder();
    if (order === null) {
      // Find the cycle
      const visited = new Set<string>();
      const tempMarked = new Set<string>();
      const path: string[] = [];

      const findCycle = (id: string): string[] | null => {
        if (tempMarked.has(id)) {
          // Found cycle - return path from cycle start
          const cycleStart = path.indexOf(id);
          return path.slice(cycleStart);
        }

        if (visited.has(id)) {
          return null;
        }

        tempMarked.add(id);
        path.push(id);

        const node = this.nodes.get(id);
        if (node) {
          for (const depName of node.dependencies) {
            const depNode = this.findNodeByName(depName);
            if (depNode) {
              const cycle = findCycle(depNode.id);
              if (cycle) return cycle;
            }
          }
        }

        path.pop();
        tempMarked.delete(id);
        visited.add(id);

        return null;
      };

      for (const id of this.nodes.keys()) {
        if (!visited.has(id)) {
          const cycle = findCycle(id);
          if (cycle) return cycle;
        }
      }
    }

    return [];
  }

  /**
   * Get all dependents of a parameter (directly or indirectly)
   * @param id - Parameter ID
   * @returns Set of parameter IDs that depend on this parameter
   */
  getAllDependents(id: string): Set<string> {
    const result = new Set<string>();
    const node = this.nodes.get(id);

    if (!node) return result;

    const visit = (nodeId: string) => {
      const n = this.nodes.get(nodeId);
      if (!n) return;

      for (const depId of n.dependents) {
        if (!result.has(depId)) {
          result.add(depId);
          visit(depId);
        }
      }
    };

    visit(id);
    return result;
  }

  /**
   * Get all dependencies of a parameter (directly or indirectly)
   * @param id - Parameter ID
   * @returns Set of parameter names this parameter depends on
   */
  getAllDependencies(id: string): Set<string> {
    const result = new Set<string>();
    const node = this.nodes.get(id);

    if (!node) return result;

    const visit = (n: DependencyNode) => {
      for (const depName of n.dependencies) {
        if (!result.has(depName)) {
          result.add(depName);
          const depNode = this.findNodeByName(depName);
          if (depNode) {
            visit(depNode);
          }
        }
      }
    };

    visit(node);
    return result;
  }

  /**
   * Export graph state
   */
  toJSON(): DependencyGraphType {
    return {
      nodes: this.nodes,
      evaluationOrder: this.getEvaluationOrder() || [],
    };
  }

  /**
   * Get a node by ID
   */
  getNode(id: string): DependencyNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all nodes
   */
  getAllNodes(): Map<string, DependencyNode> {
    return new Map(this.nodes);
  }

  /**
   * Clear the graph
   */
  clear(): void {
    this.nodes.clear();
  }
}
