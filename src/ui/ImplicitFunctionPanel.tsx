/**
 * Implicit Function Panel
 * For plotting equations like x² + y² = 1
 */

import { useState } from 'react';
import { ExpressionEngine } from '../engine/ExpressionEngine';
import { ImplicitFunctionPlotter } from '../scene/ImplicitFunctionPlotter';
import type { ImplicitFunction } from '../scene/implicit-types';
import './FunctionPanel.css';

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export interface ImplicitFunctionPanelProps {
  implicitFunctions: ImplicitFunction[];
  parameterValues: Record<string, number>;
  onFunctionCreate: (expression: string, constant: number, color: string, resolution: number) => void;
  onFunctionUpdate: (id: string, updates: Partial<ImplicitFunction>) => void;
  onFunctionDelete: (id: string) => void;
  onFunctionToggle: (id: string) => void;
}

export function ImplicitFunctionPanel({
  implicitFunctions,
  parameterValues,
  onFunctionCreate,
  onFunctionUpdate,
  onFunctionDelete,
  onFunctionToggle,
}: ImplicitFunctionPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [newExpression, setNewExpression] = useState('');
  const [newConstant, setNewConstant] = useState('1');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [newResolution, setNewResolution] = useState(50);
  const [createError, setCreateError] = useState<string | null>(null);

  const expressionEngine = new ExpressionEngine();
  const plotter = new ImplicitFunctionPlotter();

  const handleCreate = () => {
    setCreateError(null);

    if (!newExpression.trim()) {
      setCreateError('Expression is required');
      return;
    }

    // Parse constant
    const constantValue = parseFloat(newConstant);
    if (isNaN(constantValue)) {
      setCreateError('Constant must be a number');
      return;
    }

    // Validate expression
    const validation = plotter.validateExpression(
      newExpression.trim(),
      constantValue,
      parameterValues
    );

    if (!validation.valid) {
      setCreateError(validation.error || 'Invalid expression');
      return;
    }

    // Check complexity
    const complexity = plotter.estimateComplexity(newResolution);
    if (complexity.warning) {
      // Show warning but allow
      console.warn(complexity.warning);
    }

    // Call parent
    onFunctionCreate(newExpression.trim(), constantValue, newColor, newResolution);

    // Reset
    setNewExpression('');
    setNewConstant('1');
    setNewColor(DEFAULT_COLORS[(implicitFunctions.length + 1) % DEFAULT_COLORS.length]);
    setNewResolution(50);
    setCreateError(null);
    setIsCreating(false);
  };

  return (
    <div className="function-panel">
      <div className="function-panel-header">
        <h2>Implicit Functions</h2>
        <button
          className="add-button"
          onClick={() => setIsCreating(!isCreating)}
          title="Add implicit function"
        >
          {isCreating ? '×' : '+'}
        </button>
      </div>

      {/* Create form */}
      {isCreating && (
        <div className="function-create-form">
          <div className="form-row">
            <input
              type="text"
              value={newExpression}
              onChange={(e) => setNewExpression(e.target.value)}
              placeholder="f(x,y) e.g., x^2 + y^2"
              className="expression-input"
              autoFocus
            />
            <span>=</span>
            <input
              type="text"
              value={newConstant}
              onChange={(e) => setNewConstant(e.target.value)}
              placeholder="c"
              className="constant-input"
              style={{ width: '80px' }}
            />
          </div>

          <div className="form-row">
            <label>Color:</label>
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="color-input"
            />

            <label>Resolution:</label>
            <input
              type="range"
              min="20"
              max="200"
              value={newResolution}
              onChange={(e) => setNewResolution(parseInt(e.target.value))}
              className="resolution-slider"
            />
            <span>{newResolution}</span>
          </div>

          {createError && <div className="error-message">{createError}</div>}

          <div className="form-actions">
            <button onClick={handleCreate} className="create-button">
              Create
            </button>
            <button onClick={() => setIsCreating(false)} className="cancel-button">
              Cancel
            </button>
          </div>

          <div className="help-text">
            <p><strong>Examples:</strong></p>
            <ul>
              <li><code>x^2 + y^2 = 1</code> - Unit circle</li>
              <li><code>x^2/4 + y^2/9 = 1</code> - Ellipse</li>
              <li><code>x^2 - y^2 = 1</code> - Hyperbola</li>
              <li><code>sin(x*y) = 0.5</code> - Trigonometric curve</li>
            </ul>
          </div>
        </div>
      )}

      {/* Functions list */}
      <div className="function-list">
        {implicitFunctions.map((func) => (
          <div key={func.id} className={`function-item ${!func.visible ? 'hidden' : ''}`}>
            <div className="function-header">
              <button
                className="visibility-toggle"
                onClick={() => onFunctionToggle(func.id)}
                style={{ color: func.color }}
              >
                {func.visible ? '●' : '○'}
              </button>
              <span className="function-name">{func.name}</span>
              <div className="function-actions">
                <button
                  onClick={() => onFunctionDelete(func.id)}
                  className="delete-button"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="function-expression">
              <code>{func.expression} = {func.constant}</code>
            </div>

            <div className="function-info">
              <span className="resolution-info">Resolution: {func.resolution}×{func.resolution}</span>
            </div>
          </div>
        ))}
      </div>

      {implicitFunctions.length === 0 && !isCreating && (
        <div className="empty-state">
          <p>No implicit functions yet.</p>
          <p>Click + to add one!</p>
        </div>
      )}
    </div>
  );
}
