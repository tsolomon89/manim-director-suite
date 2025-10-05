/**
 * KeyframePanel UI Component
 * Manage keyframes (create, edit, delete)
 * Phase 5: Keyframes & Timeline
 */

import { useState } from 'react';
import type { Keyframe } from '../timeline/types';
import './KeyframePanel.css';

interface KeyframePanelProps {
  keyframes: Keyframe[];
  selectedKeyframeId: string | null;
  currentTime: number;
  onCreateKeyframe: (label: string | null) => void;
  onUpdateKeyframe: (id: string, label: string) => void;
  onDeleteKeyframe: (id: string) => void;
  onCloneKeyframe: (id: string) => void;
  onSelectKeyframe: (id: string | null) => void;
}

export function KeyframePanel({
  keyframes,
  selectedKeyframeId,
  currentTime,
  onCreateKeyframe,
  onUpdateKeyframe,
  onDeleteKeyframe,
  onCloneKeyframe,
  onSelectKeyframe,
}: KeyframePanelProps) {
  const [newLabel, setNewLabel] = useState('');
  const [editingLabel, setEditingLabel] = useState('');
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  const selectedKeyframe = keyframes.find(kf => kf.id === selectedKeyframeId);

  // Check for conflicts at current time
  const checkForConflict = (time: number) => {
    const threshold = 0.05; // 50ms threshold
    const conflict = keyframes.find(kf => Math.abs(kf.time - time) < threshold);
    if (conflict) {
      setConflictWarning(`Too close to "${conflict.label}" at ${conflict.time.toFixed(2)}s`);
      return true;
    }
    setConflictWarning(null);
    return false;
  };

  const handleCreate = () => {
    // Allow empty labels (will auto-generate)
    const label = newLabel.trim() || null;

    // Check for conflicts
    if (checkForConflict(currentTime)) {
      return;
    }

    onCreateKeyframe(label);
    setNewLabel('');
    setConflictWarning(null);
  };

  const handleUpdate = () => {
    if (!selectedKeyframe || !editingLabel.trim()) return;
    onUpdateKeyframe(selectedKeyframe.id, editingLabel.trim());
    setEditingLabel('');
  };

  return (
    <div className="keyframe-panel">
      <h3>Keyframes</h3>

      {/* Create new keyframe */}
      <div className="keyframe-create">
        <h4>Create at {currentTime.toFixed(2)}s</h4>
        <div className="input-group">
          <input
            type="text"
            placeholder="Label (optional, auto-generated if empty)"
            value={newLabel}
            onChange={(e) => {
              setNewLabel(e.target.value);
              setConflictWarning(null);
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
          />
          <button onClick={handleCreate}>Add Keyframe</button>
        </div>
        {conflictWarning && (
          <div className="conflict-warning">
            ⚠️ {conflictWarning}
          </div>
        )}
      </div>

      {/* Keyframe list */}
      <div className="keyframe-list">
        <h4>All Keyframes ({keyframes.length})</h4>
        {keyframes.length === 0 ? (
          <p className="empty-message">No keyframes yet. Create one above!</p>
        ) : (
          <div className="keyframe-items">
            {keyframes.map((keyframe) => (
              <div
                key={keyframe.id}
                className={`keyframe-item ${keyframe.id === selectedKeyframeId ? 'selected' : ''}`}
                onClick={() => onSelectKeyframe(keyframe.id)}
              >
                <div className="keyframe-header">
                  <span className="keyframe-label">{keyframe.label}</span>
                  <span className="keyframe-time">{keyframe.time.toFixed(2)}s</span>
                </div>
                <div className="keyframe-actions">
                  <button
                    className="action-btn clone"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloneKeyframe(keyframe.id);
                    }}
                    title="Clone keyframe"
                  >
                    📋
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteKeyframe(keyframe.id);
                    }}
                    title="Delete keyframe"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected keyframe details */}
      {selectedKeyframe && (
        <div className="keyframe-details">
          <h4>Selected Keyframe</h4>

          <div className="detail-group">
            <label>Label:</label>
            <div className="input-group">
              <input
                type="text"
                value={editingLabel || selectedKeyframe.label}
                onChange={(e) => setEditingLabel(e.target.value)}
                placeholder="Keyframe label"
              />
              <button onClick={handleUpdate}>Update</button>
            </div>
          </div>

          <div className="detail-group">
            <label>Time:</label>
            <span>{selectedKeyframe.time.toFixed(3)}s</span>
          </div>

          <div className="detail-group">
            <label>Parameters:</label>
            <div className="parameter-count">
              {Object.keys(selectedKeyframe.snapshot.parameters).length} parameters captured
            </div>
          </div>

          <div className="detail-group">
            <label>Camera:</label>
            <span>{selectedKeyframe.snapshot.camera.include ? 'Included' : 'Not included'}</span>
          </div>

          {/* Show easing info for parameters */}
          <div className="detail-group">
            <label>Easing curves used:</label>
            <div className="easing-list">
              {Object.entries(selectedKeyframe.snapshot.parameters).map(([id, param]) => (
                param.include && (
                  <div key={id} className="easing-item">
                    <span className="param-id">{id}</span>
                    <span className="easing-name">{param.easing}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Help text */}
      <div className="help-text">
        <p><strong>Tips:</strong></p>
        <ul>
          <li>Click on timeline to scrub</li>
          <li>Drag diamond markers to move keyframes</li>
          <li>Create keyframes at current time</li>
          <li>Clone to duplicate a keyframe</li>
        </ul>
      </div>
    </div>
  );
}
