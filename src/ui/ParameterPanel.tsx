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
  onParameterClearValue?: (id: string) => void;
  onParameterUpdateDomain?: (id: string, domain: { min: number; max: number; step: number }) => void;
  onConvertToFunction?: (id: string) => void;
}

export function ParameterPanel({
  parameters,
  functions = [],
  onParameterChange,
  onParameterCreate,
  onParameterDelete,
  onParameterUpdateValue,
  onParameterClearValue,
  onParameterUpdateDomain,
  onConvertToFunction,
}: ParameterPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newControlType, setNewControlType] = useState<UIControlType>('slider');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [editDomainMin, setEditDomainMin] = useState('');
  const [editDomainMax, setEditDomainMax] = useState('');
  const [editDomainStep, setEditDomainStep] = useState('');
  const [clearValueOnSave, setClearValueOnSave] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [collisionSuggestions, setCollisionSuggestions] = useState<string[]>([]);
  const [showGreekPicker, setShowGreekPicker] = useState(false);
  const [greekPickerTarget, setGreekPickerTarget] = useState<'name' | 'value'>('name');
  const [showOperatorGuard, setShowOperatorGuard] = useState(false);

  // Create instances for validation
  const expressionEngine = new ExpressionEngine();
  const binder = new Binder(expressionEngine);

  const handleCreate = () => {
    // Clear previous errors
    setCreateError(null);
    setShowOperatorGuard(false);

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
      setShowOperatorGuard(true);
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
    setShowOperatorGuard(false);
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

  const handleStartEditDomain = (param: Parameter) => {
    setEditingDomainId(param.id);
    setEditDomainMin(String(param.domain?.min ?? ''));
    setEditDomainMax(String(param.domain?.max ?? ''));
    setEditDomainStep(String(param.domain?.step ?? ''));
    setClearValueOnSave(param.value === undefined);
  };

  const handleSaveDomain = (id: string) => {
    if (onParameterUpdateDomain) {
      const min = parseFloat(editDomainMin);
      const max = parseFloat(editDomainMax);
      const step = parseFloat(editDomainStep);

      if (!isNaN(min) && !isNaN(max) && !isNaN(step)) {
        onParameterUpdateDomain(id, { min, max, step });

        // Clear value if checkbox is checked
        if (clearValueOnSave && onParameterClearValue) {
          onParameterClearValue(id);
        }
      }
    }
    setEditingDomainId(null);
    setEditDomainMin('');
    setEditDomainMax('');
    setEditDomainStep('');
    setClearValueOnSave(false);
  };

  const handleCancelEditDomain = () => {
    setEditingDomainId(null);
    setEditDomainMin('');
    setEditDomainMax('');
    setEditDomainStep('');
    setClearValueOnSave(false);
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
              onBlur={handleCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreate();
                }
              }}
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
              {showOperatorGuard && (
                <div className="operator-guard">
                  <p className="guard-message">
                    Parameters can only hold numeric values. Use the Function panel for expressions.
                  </p>
                  <button
                    className="make-function-button"
                    onClick={() => {
                      // Switch to function panel (user will need to manually create)
                      setIsCreating(false);
                      setCreateError(null);
                      setShowOperatorGuard(false);
                    }}
                  >
                    Make this a Function →
                  </button>
                </div>
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
                  {onConvertToFunction && (
                    <button
                      onClick={() => onConvertToFunction(param.id)}
                      className="convert-button"
                      title="Convert to Function"
                    >
                      ƒ
                    </button>
                  )}
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
                    onBlur={() => handleSaveEdit(param.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEdit(param.id);
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCancelEdit();
                      }
                    }}
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
                  <span className="parameter-value">
                    {param.value === undefined
                      ? <em style={{ color: '#888' }}>implicit (domain-only)</em>
                      : typeof param.value === 'number'
                        ? param.value.toFixed(3)
                        : String(param.value)
                    }
                  </span>
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

              {!param.error && param.value !== undefined && (
                <div className="parameter-control-wrapper">
                  <ParameterControl
                    parameter={param}
                    onChange={(value) => onParameterChange(param.id, value)}
                  />
                </div>
              )}

              {/* Domain/Bounds Editor */}
              <div className="parameter-domain-section">
                {editingDomainId === param.id ? (
                  <div className="domain-edit">
                    <div className="domain-edit-header">
                      <span>Edit Domain/Bounds</span>
                    </div>
                    <div className="domain-inputs">
                      <label>
                        Min:
                        <input
                          type="number"
                          value={editDomainMin}
                          onChange={(e) => setEditDomainMin(e.target.value)}
                          placeholder="Min"
                          className="domain-input"
                        />
                      </label>
                      <label>
                        Max:
                        <input
                          type="number"
                          value={editDomainMax}
                          onChange={(e) => setEditDomainMax(e.target.value)}
                          placeholder="Max"
                          className="domain-input"
                        />
                      </label>
                      <label>
                        Step:
                        <input
                          type="number"
                          value={editDomainStep}
                          onChange={(e) => setEditDomainStep(e.target.value)}
                          placeholder="Step"
                          className="domain-input"
                          step="0.01"
                        />
                      </label>
                    </div>
                    {onParameterClearValue && (
                      <div className="domain-value-option">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={clearValueOnSave}
                            onChange={(e) => setClearValueOnSave(e.target.checked)}
                          />
                          <span>Make implicit (clear value, domain-only like x)</span>
                        </label>
                      </div>
                    )}
                    <div className="domain-edit-actions">
                      <button onClick={() => handleSaveDomain(param.id)} className="save-button">
                        Save Domain
                      </button>
                      <button onClick={handleCancelEditDomain} className="cancel-button">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="domain-display">
                    <div className="domain-info">
                      {param.domain ? (
                        <span className="domain-text">
                          Domain: [{param.domain.min.toFixed(2)}, {param.domain.max.toFixed(2)}] step: {param.domain.step}
                        </span>
                      ) : (
                        <span className="domain-text no-domain">No domain set (unbounded)</span>
                      )}
                    </div>
                    {onParameterUpdateDomain && (
                      <button
                        onClick={() => handleStartEditDomain(param)}
                        className="edit-domain-button"
                        title="Edit domain/bounds"
                      >
                        ⚙ Edit Domain
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
