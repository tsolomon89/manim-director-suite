import { useState } from 'react';
import { DEFAULT_COLORS } from '../constants';
import type { PlottedFunction } from '../scene/FunctionPlotter';
import './FunctionPanel.css';

export interface FunctionPanelProps {
  functions: PlottedFunction[];
  onFunctionCreate: (name: string, expression: string, color: string) => void;
  onFunctionUpdate: (id: string, updates: Partial<PlottedFunction>) => void;
  onFunctionDelete: (id: string) => void;
  onFunctionToggle: (id: string) => void;
}

export function FunctionPanel({
  functions,
  onFunctionCreate,
  onFunctionUpdate,
  onFunctionDelete,
  onFunctionToggle,
}: FunctionPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newExpression, setNewExpression] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);

  const handleCreate = () => {
    if (!newName.trim() || !newExpression.trim()) {
      alert('Please provide both name and expression');
      return;
    }

    onFunctionCreate(newName.trim(), newExpression.trim(), newColor);

    // Reset form
    setNewName('');
    setNewExpression('');
    setNewColor(DEFAULT_COLORS[(functions.length + 1) % DEFAULT_COLORS.length]);
    setIsCreating(false);
  };

  const handleUpdate = (id: string, field: keyof PlottedFunction, value: any) => {
    onFunctionUpdate(id, { [field]: value });
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
          <input
            type="text"
            placeholder="Name (e.g., f, g, curve1)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            autoFocus
          />

          <input
            type="text"
            placeholder="Expression (e.g., sin(k*x), x^2 + Z)"
            value={newExpression}
            onChange={(e) => setNewExpression(e.target.value)}
          />

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

      <div className="function-list">
        {functions.length === 0 && !isCreating && (
          <div className="empty-state">
            <p>No functions yet</p>
            <p className="hint">Click + to add a function to visualize</p>
          </div>
        )}

        {functions.map((func) => (
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
                style={{ backgroundColor: func.color }}
              />

              {editingId === func.id ? (
                <input
                  type="text"
                  value={func.name}
                  onChange={(e) => handleUpdate(func.id, 'name', e.target.value)}
                  onBlur={() => setEditingId(null)}
                  autoFocus
                  className="name-edit"
                />
              ) : (
                <h3
                  className="function-name"
                  onClick={() => setEditingId(func.id)}
                  title="Click to edit name"
                >
                  {func.name}
                </h3>
              )}

              <button
                className="delete-button"
                onClick={() => {
                  if (confirm(`Delete function "${func.name}"?`)) {
                    onFunctionDelete(func.id);
                  }
                }}
                title="Delete function"
              >
                🗑️
              </button>
            </div>

            <div className="function-body">
              <div className="expression-display">
                <label>y =</label>
                <input
                  type="text"
                  value={func.expression}
                  onChange={(e) => handleUpdate(func.id, 'expression', e.target.value)}
                  placeholder="Expression"
                  className="expression-input"
                />
              </div>

              <div className="function-controls">
                <div className="control-row">
                  <label>Line Width:</label>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={func.lineWidth}
                    onChange={(e) =>
                      handleUpdate(func.id, 'lineWidth', parseFloat(e.target.value))
                    }
                  />
                  <span className="value-display">{func.lineWidth}px</span>
                </div>

                <div className="control-row">
                  <label>Color:</label>
                  <input
                    type="color"
                    value={func.color}
                    onChange={(e) => handleUpdate(func.id, 'color', e.target.value)}
                  />
                  <input
                    type="text"
                    value={func.color}
                    onChange={(e) => handleUpdate(func.id, 'color', e.target.value)}
                    placeholder="#RRGGBB"
                    className="color-text-input"
                  />
                </div>

                <div className="control-row">
                  <label>Domain:</label>
                  <div className="domain-inputs">
                    <input
                      type="number"
                      value={func.domain.min}
                      onChange={(e) =>
                        handleUpdate(func.id, 'domain', {
                          ...func.domain,
                          min: parseFloat(e.target.value),
                        })
                      }
                      placeholder="Min"
                    />
                    <span>to</span>
                    <input
                      type="number"
                      value={func.domain.max}
                      onChange={(e) =>
                        handleUpdate(func.id, 'domain', {
                          ...func.domain,
                          max: parseFloat(e.target.value),
                        })
                      }
                      placeholder="Max"
                    />
                  </div>
                </div>

                <div className="control-row">
                  <label>Step:</label>
                  <input
                    type="number"
                    value={func.domain.step}
                    onChange={(e) =>
                      handleUpdate(func.id, 'domain', {
                        ...func.domain,
                        step: parseFloat(e.target.value),
                      })
                    }
                    step="0.001"
                    min="0.001"
                    placeholder="Step size"
                  />
                  <span className="hint-text">Smaller = smoother</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
