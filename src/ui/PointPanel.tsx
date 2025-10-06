/**
 * Point Panel - For coordinate plotting
 * Supports: (x,y), ([0..10], 5), ([0,1,2], [3,4,5])
 */

import { useState } from 'react';
import { ExpressionEngine } from '../engine/ExpressionEngine';
import type { PlottedPoints } from '../scene/PointPlotter';
import './FunctionPanel.css';

const DEFAULT_COLORS = [
  '#3B82F6', // blue
  '#EF4444', // red
  '#10B981', // green
  '#F59E0B', // amber
  '#8B5CF6', // purple
  '#EC4899', // pink
];

const POINT_STYLES = ['circle', 'square', 'cross', 'dot'] as const;

export interface PointPanelProps {
  points: PlottedPoints[];
  parameterValues: Record<string, number>;
  onPointCreate: (expression: string, color: string, style: 'circle' | 'square' | 'cross' | 'dot') => void;
  onPointUpdate: (id: string, updates: Partial<PlottedPoints>) => void;
  onPointDelete: (id: string) => void;
  onPointToggle: (id: string) => void;
}

export function PointPanel({
  points,
  parameterValues,
  onPointCreate,
  onPointUpdate,
  onPointDelete,
  onPointToggle,
}: PointPanelProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [newExpression, setNewExpression] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [newStyle, setNewStyle] = useState<'circle' | 'square' | 'cross' | 'dot'>('circle');
  const [createError, setCreateError] = useState<string | null>(null);
  const [editExpression, setEditExpression] = useState('');

  const expressionEngine = new ExpressionEngine();

  const handleCreate = () => {
    setCreateError(null);

    if (!newExpression.trim()) {
      setCreateError('Expression is required');
      return;
    }

    // Validate coordinate expression
    const result = expressionEngine.parseCoordinates(newExpression.trim(), parameterValues);

    if (!result.success) {
      setCreateError(result.error || 'Invalid coordinate expression');
      return;
    }

    // Check point count
    const pointCount = result.points?.length || 0;
    if (pointCount === 0) {
      setCreateError('Expression produces no points');
      return;
    }

    if (pointCount > 100000) {
      setCreateError(`Warning: ${pointCount} points will be generated. This may impact performance.`);
      // Allow anyway for now
    }

    // Call parent
    onPointCreate(newExpression.trim(), newColor, newStyle);

    // Reset
    setNewExpression('');
    setNewColor(DEFAULT_COLORS[(points.length + 1) % DEFAULT_COLORS.length]);
    setNewStyle('circle');
    setCreateError(null);
    setIsCreating(false);
  };

  const handleStartEdit = (pts: PlottedPoints) => {
    setEditingId(pts.id);
    setEditExpression(pts.expression);
  };

  const handleSaveEdit = (id: string) => {
    if (editExpression) {
      onPointUpdate(id, { expression: editExpression.trim() });
    }
    setEditingId(null);
    setEditExpression('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditExpression('');
  };

  return (
    <div className="function-panel">
      <div className="function-panel-header">
        <h2>Coordinate Points</h2>
        <button
          className="add-button"
          onClick={() => setIsCreating(!isCreating)}
          title="Add point set"
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
              placeholder="e.g., (0,0) or ([0..10], [0..10])"
              className="expression-input"
              autoFocus
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

            <label>Style:</label>
            <select
              value={newStyle}
              onChange={(e) => setNewStyle(e.target.value as any)}
              className="style-select"
            >
              {POINT_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
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
              <li><code>(0, 0)</code> - Single point</li>
              <li><code>([0..10], 5)</code> - 11 points along y=5</li>
              <li><code>([0..10], [0..10])</code> - 121-point grid</li>
              <li><code>([0,1,2], [3,4,5])</code> - 3 specific points</li>
            </ul>
          </div>
        </div>
      )}

      {/* Points list */}
      <div className="function-list">
        {points.map((pts) => (
          <div key={pts.id} className={`function-item ${!pts.visible ? 'hidden' : ''}`}>
            <div className="function-header">
              <button
                className="visibility-toggle"
                onClick={() => onPointToggle(pts.id)}
                style={{ color: pts.color }}
              >
                {pts.visible ? '●' : '○'}
              </button>
              <span className="function-name">{pts.name}</span>
              <div className="function-actions">
                <button onClick={() => handleStartEdit(pts)} title="Edit">
                  ✎
                </button>
                <button
                  onClick={() => onPointDelete(pts.id)}
                  className="delete-button"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>

            {editingId === pts.id ? (
              <div className="function-edit-form">
                <input
                  type="text"
                  value={editExpression}
                  onChange={(e) => setEditExpression(e.target.value)}
                  className="expression-input"
                />
                <div className="form-actions">
                  <button onClick={() => handleSaveEdit(pts.id)} className="save-button">
                    Save
                  </button>
                  <button onClick={handleCancelEdit} className="cancel-button">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="function-expression">
                <code>{pts.expression}</code>
              </div>
            )}

            <div className="point-info">
              <span className="point-style">Style: {pts.pointStyle}</span>
              <span className="point-size">Size: {pts.pointSize}</span>
            </div>
          </div>
        ))}
      </div>

      {points.length === 0 && !isCreating && (
        <div className="empty-state">
          <p>No coordinate points yet.</p>
          <p>Click + to add one!</p>
        </div>
      )}
    </div>
  );
}
