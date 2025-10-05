import { useState } from 'react';
import { ParameterControl } from './ParameterControl';
import { ParameterSyntaxHelp } from './ParameterSyntaxHelp';
import { MathInput, MathRenderer, GreekSymbolPicker } from './MathRenderer';
import { ExpressionEngine } from '../engine/ExpressionEngine';
import { Binder } from '../engine/Binder';
import { CollisionDetector } from '../engine/CollisionDetector';
import type { Parameter, UIControlType, ParameterRole } from '../engine/types';
import type { FunctionDefinition } from '../engine/expression-types';
import './ParameterPanel.css';

interface ParameterPanelProps {
  parameters: Parameter[];
  functions?: FunctionDefinition[];
  onParameterChange: (id: string, value: number) => void;
  onParameterCreate: (name: string, value: number, controlType: UIControlType, role?: ParameterRole) => void;
  onParameterDelete: (id: string) => void;
  onParameterUpdateValue: (id: string, value: number) => void;
  onConvertToFunction?: (id: string) => void;
}

export function ParameterPanel({
  parameters,
  functions = [],
  onParameterChange,
  onParameterCreate,
  onParameterDelete,
  onParameterUpdateValue,
  onConvertToFunction,
}: ParameterPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newControlType, setNewControlType] = useState<UIControlType>('slider');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [collisionSuggestions, setCollisionSuggestions] = useState<string[]>([]);
  const [showGreekPicker, setShowGreekPicker] = useState(false);
  const [greekPickerTarget, setGreekPickerTarget] = useState<'name' | 'value'>('name');

  // Create instances for validation
  const expressionEngine = new ExpressionEngine();
  const binder = new Binder(expressionEngine);

  const handleCreate = () => {
    // Clear previous errors
    setCreateError(null);

    // Normalize inputs
    const normalizedName = expressionEngine.normalizeExpression(newName.trim());
    const normalizedValue = expressionEngine.normalizeExpression(newValue.trim());

    // Validation: name required
    if (!normalizedName) {
      setCreateError('Parameter name is required');
      return;
    }

    // Validation: value required
    if (!normalizedValue) {
      setCreateError('Value is required');
      return;
    }

    // Validate name format (single letter + optional subscript)
    const lhsResult = expressionEngine.parseLHS(normalizedName);
    if (!lhsResult || lhsResult.kind !== 'parameter') {
      setCreateError('Name must be a single letter, optionally with subscript (e.g., k, k_{gain}, γ)');
      return;
    }

    // Validate LHS
    const lhsValidation = expressionEngine.validateLHS(lhsResult);
    if (!lhsValidation.valid) {
      setCreateError(lhsValidation.errors?.join('; ') || 'Invalid parameter name');
      return;
    }

    // Check for name collisions with parameters and functions
    const collision = CollisionDetector.checkName(
      lhsResult.fullName,
      parameters,
      functions
    );

    if (collision.hasCollision) {
      setCreateError(collision.message || 'Name collision detected');
      setCollisionSuggestions(collision.suggestions || []);
      return;
    } else {
      setCollisionSuggestions([]);
    }

    // Validate that value is numeric-only (no operators)
    const numericValidation = binder.validateNumericOnly(normalizedValue);
    if (numericValidation) {
      setCreateError(numericValidation);
      return;
    }

    // Parse numeric value
    const parsedValue = parseFloat(normalizedValue);
    if (isNaN(parsedValue)) {
      setCreateError('Value must be a valid number');
      return;
    }

    // Call parent handler
    onParameterCreate(lhsResult.fullName, parsedValue, newControlType);

    // Reset form
    setNewName('');
    setNewValue('');
    setNewControlType('slider');
    setCreateError(null);
    setIsCreating(false);
  };

  const handleStartEdit = (param: Parameter) => {
    setEditingId(param.id);
    setEditValue(String(param.value));
  };

  const handleSaveEdit = (id: string) => {
    if (editValue) {
      const parsedValue = parseFloat(editValue);
      if (!isNaN(parsedValue)) {
        onParameterUpdateValue(id, parsedValue);
      }
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const handleGreekSymbolSelect = (symbol: string) => {
    if (greekPickerTarget === 'name') {
      setNewName(newName + symbol);
    } else {
      setNewValue(newValue + symbol);
    }
  };

  const openGreekPicker = (target: 'name' | 'value') => {
    setGreekPickerTarget(target);
    setShowGreekPicker(true);
  };

  const getParameterRoleBadge = (param: Parameter): { icon: string; label: string; color: string } | null => {
    if (!param.role) return null;

    switch (param.role) {
      case 'independent':
        return { icon: '🔢', label: 'Independent Variable', color: '#3b82f6' };
      case 'slider':
        return { icon: '🎚️', label: 'Slider', color: '#10b981' };
      case 'constant-approx':
        return { icon: '📍', label: 'Constant', color: '#8b5cf6' };
      default:
        return null;
    }
  };

  // Filter parameters by search query
  const filteredParameters = parameters.filter(param =>
    param.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(param.value).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="parameter-panel">
      <div className="parameter-panel-header">
        <h2>Parameters</h2>
        <div className="header-actions">
          <ParameterSyntaxHelp />
          <button
            className="add-parameter-button"
            onClick={() => setIsCreating(!isCreating)}
          >
            {isCreating ? '✕' : '+'}
          </button>
        </div>
      </div>

      {isCreating && (
        <div className="parameter-create-form">
          <div className="input-with-greek">
            <MathInput
              value={newName}
              onChange={setNewName}
              placeholder="Name (e.g., k, γ, x_{gain})"
              className="param-name-input"
              autoFocus
              showPreview={false}
            />
            <button
              className="greek-picker-button"
              onClick={() => openGreekPicker('name')}
              title="Insert Greek symbol"
            >
              Ω
            </button>
          </div>

          <div className="input-with-greek">
            <MathInput
              value={newValue}
              onChange={setNewValue}
              placeholder="Value (numeric only, e.g., 710, 3.14)"
              className="param-value-input"
              showPreview={true}
            />
            <button
              className="greek-picker-button"
              onClick={() => openGreekPicker('value')}
              title="Insert Greek symbol"
            >
              Ω
            </button>
          </div>

          <select
            value={newControlType}
            onChange={(e) => setNewControlType(e.target.value as UIControlType)}
            className="param-control-type-select"
          >
            <option value="slider">Slider</option>
            <option value="number">Number</option>
            <option value="stepper">Stepper</option>
          </select>

          {createError && (
            <div className="create-error">
              ⚠️ {createError}
              {createError.includes('operators') && onConvertToFunction && (
                <button
                  className="fix-it-button"
                  onClick={() => {
                    // Can't convert during creation, just show hint
                  }}
                >
                  Use Function Panel instead →
                </button>
              )}
              {collisionSuggestions.length > 0 && (
                <div className="collision-suggestions">
                  <strong>Suggestions:</strong>{' '}
                  {collisionSuggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      className="suggestion-button"
                      onClick={() => setNewName(suggestion)}
                      title={`Use ${suggestion} instead`}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button onClick={handleCreate} className="create-button">
              Create Parameter
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setCreateError(null);
                setNewName('');
                setNewValue('');
              }}
              className="cancel-create-button"
            >
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

      <div className="parameter-search">
        <input
          type="text"
          placeholder="Search parameters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="parameter-list">
        {filteredParameters.length === 0 ? (
          <div className="no-parameters">
            <p>No parameters yet.</p>
            <p className="hint">Click + to create your first parameter</p>
          </div>
        ) : (
          filteredParameters.map((param) => (
            <div
              key={param.id}
              className={`parameter-item ${param.error ? 'has-error' : ''}`}
            >
              <div className="parameter-header">
                <div className="parameter-name-row">
                  <MathRenderer expression={param.name} mode="inline" className="parameter-name" />
                  {getParameterRoleBadge(param) && (
                    <span
                      className="role-badge"
                      style={{ backgroundColor: getParameterRoleBadge(param)!.color }}
                      title={getParameterRoleBadge(param)!.label}
                    >
                      {getParameterRoleBadge(param)!.icon}
                    </span>
                  )}
                </div>
                <div className="parameter-actions">
                  <button
                    onClick={() => handleStartEdit(param)}
                    className="edit-button"
                    title="Edit value"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => onParameterDelete(param.id)}
                    className="delete-button"
                    title="Delete parameter"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {editingId === param.id ? (
                <div className="value-edit">
                  <MathInput
                    value={editValue}
                    onChange={setEditValue}
                    onBlur={() => {}}
                    className="value-input"
                    autoFocus
                    showPreview={false}
                  />
                  <div className="value-edit-actions">
                    <button onClick={() => handleSaveEdit(param.id)} className="save-button">
                      Save
                    </button>
                    <button onClick={handleCancelEdit} className="cancel-button">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="parameter-value-display">
                  <span className="parameter-value">{typeof param.value === 'number' ? param.value.toFixed(3) : String(param.value)}</span>
                </div>
              )}

              {param.error && (
                <div className="parameter-error">
                  ⚠️ {param.error}
                  {param.error.includes('operator') && onConvertToFunction && (
                    <button
                      className="fix-it-button"
                      onClick={() => onConvertToFunction(param.id)}
                      title="Convert this parameter to a function"
                    >
                      Make this a Function →
                    </button>
                  )}
                </div>
              )}

              {!param.error && (
                <div className="parameter-control-wrapper">
                  <ParameterControl
                    parameter={param}
                    onChange={(value) => onParameterChange(param.id, value)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
