/**
 * Function Panel (New Expression UX)
 * Supports LHS input, stats display, independent variable selection
 */

import { useState } from 'react';
import { MathInput, MathRenderer, GreekSymbolPicker } from './MathRenderer';
import { ExpressionEngine } from '../engine/ExpressionEngine';
import type { FunctionDefinition } from '../engine/expression-types';
import type { IndependentVariable } from '../engine/expression-types';
// FunctionStats is used via FunctionDefinition.stats property
import './FunctionPanel.css';

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
];

export interface FunctionPanelNewProps {
  functions: FunctionDefinition[];
  independentVariables: IndependentVariable[];
  onFunctionCreate: (fullExpression: string, color: string) => { success: boolean; errors?: string[] } | void;
  onFunctionUpdate: (id: string, updates: Partial<FunctionDefinition>) => void;
  onFunctionUpdateExpression: (id: string, newExpression: string) => void;
  onFunctionDelete: (id: string) => void;
  onFunctionToggle: (id: string) => void;
  onChangeIndependentVariable: (functionId: string, independentVarId: string) => void;
  onDemoteToParameter?: (id: string) => void;
}

export function FunctionPanelNew({
  functions,
  independentVariables,
  onFunctionCreate,
  onFunctionUpdate,
  onFunctionUpdateExpression,
  onFunctionDelete,
  onFunctionToggle,
  onChangeIndependentVariable,
  onDemoteToParameter,
}: FunctionPanelNewProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showGreekPicker, setShowGreekPicker] = useState(false);

  // Form state
  const [newFullExpression, setNewFullExpression] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editExpression, setEditExpression] = useState('');

  // Validation
  const expressionEngine = new ExpressionEngine();

  const handleCreate = () => {
    setCreateError(null);

    if (!newFullExpression.trim()) {
      setCreateError('Expression is required');
      return;
    }

    // Normalize
    const normalized = expressionEngine.normalizeExpression(newFullExpression.trim());

    // Validate full expression (should have =)
    if (!normalized.includes('=')) {
      setCreateError('Expression must be in form: f(x) = ... or b = sin(x)');
      return;
    }

    // Parse to validate LHS and RHS
    const parseResult = expressionEngine.parseExpression(normalized);
    if (!parseResult.success) {
      setCreateError(parseResult.error || 'Invalid expression');
      return;
    }

    // Accept function (with args), parameter (0-arity expression), or anonymous plot (y = expr)
    // Per spec: Functions can have formal arguments OR be 0-arity expressions
    if (parseResult.lhs?.kind === 'function' || parseResult.lhs?.kind === 'anonymous') {
      // Valid: f(x) = ... or y = ...
    } else if (parseResult.lhs?.kind === 'parameter') {
      // Valid as 0-arity function/expression: b = sin(x f(k))
      // This is allowed in the Function panel per spec section 1
    } else {
      setCreateError('Left-hand side must be a single letter with optional subscript (e.g., f(x), b, γ_{3})');
      return;
    }

    // Call parent - it may return a result object
    const result = onFunctionCreate(normalized, newColor);

    // Check if result indicates failure
    if (result && 'success' in result && !result.success) {
      setCreateError(result.errors?.join(', ') || 'Failed to create function');
      return;
    }

    // Reset form on success
    setNewFullExpression('');
    setNewColor(DEFAULT_COLORS[(functions.length + 1) % DEFAULT_COLORS.length]);
    setCreateError(null);
    setIsCreating(false);
  };

  const handleStartEdit = (func: FunctionDefinition) => {
    setEditingId(func.id);
    // Reconstruct full expression from LHS + RHS
    const lhsStr = func.lhs.formalParams
      ? `${func.lhs.fullName}(${func.lhs.formalParams.join(',')})`
      : func.lhs.fullName;
    setEditExpression(`${lhsStr} = ${func.expression}`);
  };

  const handleSaveEdit = (id: string) => {
    if (editExpression) {
      // Extract RHS only (LHS can't change for existing functions)
      const parts = editExpression.split('=');
      if (parts.length === 2) {
        onFunctionUpdateExpression(id, parts[1].trim());
      }
    }
    setEditingId(null);
    setEditExpression('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditExpression('');
  };

  // Removed formatStats - using inline grid display instead

  const handleGreekSymbolSelect = (symbol: string) => {
    if (isCreating) {
      setNewFullExpression(newFullExpression + symbol);
    } else if (editingId) {
      setEditExpression(editExpression + symbol);
    }
  };

  return (
    <div className="function-panel">
      <div className="function-panel-header">
        <h2>Functions</h2>
        <button
          className="add-button"
          onClick={() => setIsCreating(!isCreating)}
          title="Add function"
        >
          {isCreating ? '×' : '+'}
        </button>
      </div>

      {isCreating && (
        <div className="function-create-form">
          <div className="input-with-greek">
            <MathInput
              value={newFullExpression}
              onChange={setNewFullExpression}
              placeholder="f(x) = sin(k·x) or y = cos(x) for quick plot"
              autoFocus
              showPreview={true}
              className="full-expression-input"
            />
            <button
              className="greek-picker-button"
              onClick={() => setShowGreekPicker(true)}
              title="Insert Greek symbol"
            >
              Ω
            </button>
          </div>

          <div className="color-picker">
            <label>Color:</label>
            <div className="color-options">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${newColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewColor(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          {createError && (
            <div className="create-error">
              ⚠️ {createError}
            </div>
          )}

          <div className="form-actions">
            <button className="create-button" onClick={handleCreate}>
              Create Function
            </button>
            <button className="cancel-button" onClick={() => setIsCreating(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {showGreekPicker && (
        <div className="greek-picker-overlay" onClick={() => setShowGreekPicker(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <GreekSymbolPicker
              onSelect={handleGreekSymbolSelect}
              onClose={() => setShowGreekPicker(false)}
            />
          </div>
        </div>
      )}

      <div className="function-list">
        {functions.length === 0 && !isCreating && (
          <div className="empty-state">
            <p>No functions yet</p>
            <p className="hint">Click + to add a function to visualize</p>
          </div>
        )}

        {functions.map((func) => {
          // independentVar available for future use (domain display, etc.)
          // const independentVar = independentVariables.find(v => v.id === func.independentVarId);
          const lhsDisplay = func.lhs.formalParams
            ? `${func.lhs.fullName}(${func.lhs.formalParams.join(',')})`
            : func.lhs.fullName;

          return (
            <div
              key={func.id}
              className={`function-item ${!func.visible ? 'hidden' : ''}`}
            >
              <div className="function-header">
                <button
                  className="visibility-toggle"
                  onClick={() => onFunctionToggle(func.id)}
                  title={func.visible ? 'Hide' : 'Show'}
                >
                  {func.visible ? '👁️' : '👁️‍🗨️'}
                </button>

                <div
                  className="color-indicator"
                  style={{ backgroundColor: func.style.color }}
                />

                <div className="function-name">
                  <MathRenderer expression={lhsDisplay} mode="inline" />
                </div>

                {func.lhs.arity === 0 && onDemoteToParameter && (
                  <button
                    className="demote-button"
                    onClick={() => onDemoteToParameter(func.id)}
                    title="Convert to parameter (0-arity function)"
                  >
                    ⬇️ Param
                  </button>
                )}

                <button
                  className="delete-button"
                  onClick={() => {
                    if (confirm(`Delete function "${lhsDisplay}"?`)) {
                      onFunctionDelete(func.id);
                    }
                  }}
                  title="Delete function"
                >
                  🗑️
                </button>
              </div>

              <div className="function-body">
                {editingId === func.id ? (
                  <div className="expression-edit">
                    <MathInput
                      value={editExpression}
                      onChange={setEditExpression}
                      className="expression-input"
                      autoFocus
                      showPreview={true}
                    />
                    <div className="expression-edit-actions">
                      <button onClick={() => handleSaveEdit(func.id)} className="save-button">
                        Save
                      </button>
                      <button onClick={handleCancelEdit} className="cancel-button">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="expression-display" onClick={() => handleStartEdit(func)}>
                    <MathRenderer expression={`${lhsDisplay} = ${func.expression}`} mode="inline" />
                    <button className="edit-icon" title="Click to edit">✎</button>
                  </div>
                )}

                {func.error && (
                  <div className="function-error">
                    ⚠️ {func.error}
                  </div>
                )}

                {/* Independent Variable Selector */}
                <div className="independent-var-row">
                  <label>Independent Variable:</label>
                  <select
                    value={func.independentVarId}
                    onChange={(e) => onChangeIndependentVariable(func.id, e.target.value)}
                    className="independent-var-select"
                  >
                    {independentVariables.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} [{v.domain.min}, {v.domain.max}] step {v.domain.step}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Style Controls */}
                <div className="function-controls">
                  <div className="control-row">
                    <label>Line Width:</label>
                    <input
                      type="range"
                      min="0.5"
                      max="5"
                      step="0.5"
                      value={func.style.lineWidth}
                      onChange={(e) =>
                        onFunctionUpdate(func.id, {
                          style: { ...func.style, lineWidth: parseFloat(e.target.value) },
                        })
                      }
                    />
                    <span className="value-display">{func.style.lineWidth}px</span>
                  </div>

                  <div className="control-row">
                    <label>Color:</label>
                    <input
                      type="color"
                      value={func.style.color}
                      onChange={(e) =>
                        onFunctionUpdate(func.id, {
                          style: { ...func.style, color: e.target.value },
                        })
                      }
                    />
                    <input
                      type="text"
                      value={func.style.color}
                      onChange={(e) =>
                        onFunctionUpdate(func.id, {
                          style: { ...func.style, color: e.target.value },
                        })
                      }
                      placeholder="#RRGGBB"
                      className="color-text-input"
                    />
                  </div>
                </div>

                {/* Function Stats (Read-Only) */}
                {func.stats && (
                  <div className="function-stats">
                    <div className="stats-header">📊 Statistics</div>
                    <div className="stats-grid">
                      <div className="stat-item">
                        <span className="stat-label">Samples:</span>
                        <span className="stat-value">{func.stats.sampleCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Y Range:</span>
                        <span className="stat-value">
                          [{func.stats.yMin.toFixed(2)}, {func.stats.yMax.toFixed(2)}]
                        </span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Mean:</span>
                        <span className="stat-value">{func.stats.mean.toFixed(3)}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Zero Crossings:</span>
                        <span className="stat-value">{func.stats.zeroCrossings}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Continuous:</span>
                        <span className="stat-value">{func.stats.continuous ? '✓' : '✗'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
