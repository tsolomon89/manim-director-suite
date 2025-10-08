/**
 * Fractal Panel UI
 *
 * User interface for creating and manipulating fractal functions
 * Supports Newton, Mandelbrot, Julia, and custom fractals
 */

import { useState } from 'react';
import { Complex } from '../engine/complex-types';
import type { FractalFunction, FractalType } from '../engine/fractal-types';
import { FRACTAL_PRESETS } from '../engine/fractal-types';
import './FunctionPanel.css';

export interface FractalPanelProps {
  fractals: FractalFunction[];
  onFractalCreate: (type: FractalType, config: any) => void;
  onFractalUpdate: (id: string, updates: Partial<FractalFunction>) => void;
  onFractalDelete: (id: string) => void;
  onFractalToggle: (id: string) => void;
  onRootUpdate?: (id: string, roots: Complex[]) => void;
}

type CreateMode = 'preset' | 'newton-roots' | 'newton-poly' | 'mandelbrot' | 'julia' | null;

export function FractalPanel({
  fractals,
  onFractalCreate,
  onFractalDelete,
  onFractalToggle,
  onRootUpdate,
}: FractalPanelProps) {
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('newton-cubic');

  // Newton fractal state
  const [newtonRoots, setNewtonRoots] = useState<{ real: string; imag: string }[]>([
    { real: '1', imag: '0' },
    { real: '-0.5', imag: '0.866' },
    { real: '-0.5', imag: '-0.866' },
  ]);
  const [rootColors, setRootColors] = useState<string[]>(['#FF0000', '#00FF00', '#0000FF']);

  // Julia set state
  const [juliaReal, setJuliaReal] = useState('-0.7');
  const [juliaImag, setJuliaImag] = useState('0.27');

  // Rendering config
  const [maxIterations, setMaxIterations] = useState(100);

  const [createError, setCreateError] = useState<string | null>(null);

  const handleCreateFromPreset = () => {
    setCreateError(null);
    onFractalCreate('newton', { preset: selectedPreset });
    setCreateMode(null);
  };

  const handleCreateNewtonFromRoots = () => {
    setCreateError(null);

    // Parse roots
    const roots: Complex[] = [];
    for (const root of newtonRoots) {
      const real = parseFloat(root.real);
      const imag = parseFloat(root.imag);

      if (isNaN(real) || isNaN(imag)) {
        setCreateError('All root coordinates must be valid numbers');
        return;
      }

      roots.push({ real, imag });
    }

    if (roots.length === 0) {
      setCreateError('At least one root is required');
      return;
    }

    if (roots.length > 5) {
      setCreateError('Maximum 5 roots allowed');
      return;
    }

    onFractalCreate('newton', {
      roots,
      rootColors: rootColors.slice(0, roots.length),
      maxIterations,
    });

    setCreateMode(null);
  };

  const handleCreateMandelbrot = () => {
    setCreateError(null);
    onFractalCreate('mandelbrot', { maxIterations });
    setCreateMode(null);
  };

  const handleCreateJulia = () => {
    setCreateError(null);

    const real = parseFloat(juliaReal);
    const imag = parseFloat(juliaImag);

    if (isNaN(real) || isNaN(imag)) {
      setCreateError('Julia parameter must be a valid complex number');
      return;
    }

    onFractalCreate('julia', {
      juliaParameter: { real, imag },
      maxIterations,
    });

    setCreateMode(null);
  };

  const addRoot = () => {
    if (newtonRoots.length < 5) {
      setNewtonRoots([...newtonRoots, { real: '0', imag: '0' }]);
      setRootColors([...rootColors, '#FF00FF']);
    }
  };

  const removeRoot = (index: number) => {
    setNewtonRoots(newtonRoots.filter((_, i) => i !== index));
    setRootColors(rootColors.filter((_, i) => i !== index));
  };

  const updateRoot = (index: number, field: 'real' | 'imag', value: string) => {
    const updated = [...newtonRoots];
    updated[index][field] = value;
    setNewtonRoots(updated);
  };

  const updateRootColor = (index: number, color: string) => {
    const updated = [...rootColors];
    updated[index] = color;
    setRootColors(updated);
  };

  return (
    <div className="function-panel">
      <div className="function-panel-header">
        <h2>Fractals</h2>
        <button
          className="add-button"
          onClick={() => setCreateMode(createMode ? null : 'preset')}
          title="Add fractal"
        >
          {createMode ? '×' : '+'}
        </button>
      </div>

      {/* Create Mode Selector */}
      {createMode && (
        <div className="fractal-create-selector">
          <div className="mode-buttons">
            <button
              className={createMode === 'preset' ? 'active' : ''}
              onClick={() => setCreateMode('preset')}
            >
              Preset
            </button>
            <button
              className={createMode === 'newton-roots' ? 'active' : ''}
              onClick={() => setCreateMode('newton-roots')}
            >
              Newton (Roots)
            </button>
            <button
              className={createMode === 'mandelbrot' ? 'active' : ''}
              onClick={() => setCreateMode('mandelbrot')}
            >
              Mandelbrot
            </button>
            <button
              className={createMode === 'julia' ? 'active' : ''}
              onClick={() => setCreateMode('julia')}
            >
              Julia Set
            </button>
          </div>
        </div>
      )}

      {/* Preset Mode */}
      {createMode === 'preset' && (
        <div className="fractal-create-form">
          <h3>Create from Preset</h3>

          <div className="form-row">
            <label>Preset:</label>
            <select
              value={selectedPreset}
              onChange={(e) => setSelectedPreset(e.target.value)}
            >
              {Object.keys(FRACTAL_PRESETS).map((key) => (
                <option key={key} value={key}>
                  {FRACTAL_PRESETS[key as keyof typeof FRACTAL_PRESETS].name}
                </option>
              ))}
            </select>
          </div>

          {createError && <div className="error-message">{createError}</div>}

          <div className="form-actions">
            <button onClick={handleCreateFromPreset} className="create-button">
              Create
            </button>
            <button onClick={() => setCreateMode(null)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Newton Roots Mode */}
      {createMode === 'newton-roots' && (
        <div className="fractal-create-form">
          <h3>Newton Fractal (from Roots)</h3>

          <div className="roots-editor">
            {newtonRoots.map((root, idx) => (
              <div key={idx} className="root-row">
                <span className="root-label">Root {idx + 1}:</span>
                <input
                  type="text"
                  value={root.real}
                  onChange={(e) => updateRoot(idx, 'real', e.target.value)}
                  placeholder="Real"
                  className="root-input"
                />
                <span>+</span>
                <input
                  type="text"
                  value={root.imag}
                  onChange={(e) => updateRoot(idx, 'imag', e.target.value)}
                  placeholder="Imag"
                  className="root-input"
                />
                <span>i</span>
                <input
                  type="color"
                  value={rootColors[idx]}
                  onChange={(e) => updateRootColor(idx, e.target.value)}
                  className="root-color"
                />
                {newtonRoots.length > 1 && (
                  <button onClick={() => removeRoot(idx)} className="remove-root-btn">
                    ×
                  </button>
                )}
              </div>
            ))}

            {newtonRoots.length < 5 && (
              <button onClick={addRoot} className="add-root-btn">
                + Add Root
              </button>
            )}
          </div>

          <div className="form-row">
            <label>Max Iterations:</label>
            <input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              min="10"
              max="1000"
            />
          </div>

          {createError && <div className="error-message">{createError}</div>}

          <div className="form-actions">
            <button onClick={handleCreateNewtonFromRoots} className="create-button">
              Create
            </button>
            <button onClick={() => setCreateMode(null)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Mandelbrot Mode */}
      {createMode === 'mandelbrot' && (
        <div className="fractal-create-form">
          <h3>Mandelbrot Set</h3>

          <div className="form-row">
            <label>Max Iterations:</label>
            <input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              min="10"
              max="2000"
            />
          </div>

          <div className="help-text">
            <p>The classic Mandelbrot set: z² + c</p>
            <p>Recommended viewport: [-2.5, 1] × [-1, 1]</p>
          </div>

          {createError && <div className="error-message">{createError}</div>}

          <div className="form-actions">
            <button onClick={handleCreateMandelbrot} className="create-button">
              Create
            </button>
            <button onClick={() => setCreateMode(null)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Julia Set Mode */}
      {createMode === 'julia' && (
        <div className="fractal-create-form">
          <h3>Julia Set</h3>

          <div className="form-row">
            <label>Julia Parameter (c):</label>
            <input
              type="text"
              value={juliaReal}
              onChange={(e) => setJuliaReal(e.target.value)}
              placeholder="Real part"
              className="julia-input"
            />
            <span>+</span>
            <input
              type="text"
              value={juliaImag}
              onChange={(e) => setJuliaImag(e.target.value)}
              placeholder="Imaginary part"
              className="julia-input"
            />
            <span>i</span>
          </div>

          <div className="form-row">
            <label>Max Iterations:</label>
            <input
              type="number"
              value={maxIterations}
              onChange={(e) => setMaxIterations(parseInt(e.target.value))}
              min="10"
              max="2000"
            />
          </div>

          <div className="help-text">
            <p><strong>Popular Julia sets:</strong></p>
            <ul>
              <li>c = -0.7 + 0.27i (dendrite)</li>
              <li>c = -0.8 + 0.156i (spiral)</li>
              <li>c = -0.4 + 0.6i (fractal tree)</li>
              <li>c = 0.285 + 0.01i (galaxy)</li>
            </ul>
          </div>

          {createError && <div className="error-message">{createError}</div>}

          <div className="form-actions">
            <button onClick={handleCreateJulia} className="create-button">
              Create
            </button>
            <button onClick={() => setCreateMode(null)} className="cancel-button">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Fractals List */}
      <div className="function-list">
        {fractals.map((fractal) => (
          <div key={fractal.id} className={`function-item ${!fractal.visible ? 'hidden' : ''}`}>
            <div className="function-header">
              <button
                className="visibility-toggle"
                onClick={() => onFractalToggle(fractal.id)}
              >
                {fractal.visible ? '●' : '○'}
              </button>
              <span className="function-name">{fractal.lhs.fullName}</span>
              <div className="function-actions">
                <button
                  onClick={() => onFractalDelete(fractal.id)}
                  className="delete-button"
                  title="Delete"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="function-expression">
              <code>{fractal.expression}</code>
            </div>

            <div className="function-info">
              <span className="fractal-type-badge">{fractal.fractalType}</span>
              <span className="iterations-info">
                {fractal.renderConfig.maxIterations} iterations
              </span>
            </div>

            {/* Show root colors for Newton fractals */}
            {fractal.fractalType === 'newton' && fractal.newtonConfig && (
              <div className="root-colors-display">
                {fractal.newtonConfig.rootColors.map((color, idx) => (
                  <div key={idx} className="root-color-indicator" style={{ backgroundColor: color }} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {fractals.length === 0 && !createMode && (
        <div className="empty-state">
          <p>No fractals yet.</p>
          <p>Click + to create one!</p>
        </div>
      )}
    </div>
  );
}
