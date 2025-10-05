import { useState } from 'react';
import type { GridRenderConfig } from '../scene/GridConfig';
import { ValueControl } from './ValueControl';
import './GridConfigPanel.css';

interface GridConfigPanelProps {
  config: GridRenderConfig;
  onChange: (config: GridRenderConfig) => void;
}

export function GridConfigPanel({ config, onChange }: GridConfigPanelProps) {
  const [activeSection, setActiveSection] = useState<string>('visibility');

  const updateConfig = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = JSON.parse(JSON.stringify(config)); // Deep clone

    let current: any = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    onChange(newConfig);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? '' : section);
  };

  return (
    <div className="grid-config-panel">
      <h3>Grid Configuration</h3>

      {/* Visibility Section */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'visibility' ? 'active' : ''}`}
          onClick={() => toggleSection('visibility')}
        >
          <span>👁️ Visibility</span>
          <span className="toggle-icon">{activeSection === 'visibility' ? '−' : '+'}</span>
        </button>

        {activeSection === 'visibility' && (
          <div className="section-content">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showAxes}
                onChange={(e) => updateConfig('showAxes', e.target.checked)}
              />
              <span>Show Axes</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showMajorGrid}
                onChange={(e) => updateConfig('showMajorGrid', e.target.checked)}
              />
              <span>Show Major Grid</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showMinorGrid}
                onChange={(e) => updateConfig('showMinorGrid', e.target.checked)}
              />
              <span>Show Minor Grid</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showLabels}
                onChange={(e) => updateConfig('showLabels', e.target.checked)}
              />
              <span>Show Labels</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.showOriginLabel}
                onChange={(e) => updateConfig('showOriginLabel', e.target.checked)}
              />
              <span>Show Origin Label</span>
            </label>
          </div>
        )}
      </div>

      {/* Coordinate System Section */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'coordinates' ? 'active' : ''}`}
          onClick={() => toggleSection('coordinates')}
        >
          <span>📐 Coordinate System</span>
          <span className="toggle-icon">{activeSection === 'coordinates' ? '−' : '+'}</span>
        </button>

        {activeSection === 'coordinates' && (
          <div className="section-content">
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="coordinateSystem"
                  checked={config.coordinateSystem === 'cartesian'}
                  onChange={() => updateConfig('coordinateSystem', 'cartesian')}
                />
                <span>Cartesian (X, Y)</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="coordinateSystem"
                  checked={config.coordinateSystem === 'polar'}
                  onChange={() => updateConfig('coordinateSystem', 'polar')}
                />
                <span>Polar (r, θ)</span>
              </label>

              <label className="radio-label">
                <input
                  type="radio"
                  name="coordinateSystem"
                  checked={config.coordinateSystem === 'radial'}
                  onChange={() => updateConfig('coordinateSystem', 'radial')}
                />
                <span>Radial</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Grid Scaling Section */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'scaling' ? 'active' : ''}`}
          onClick={() => toggleSection('scaling')}
        >
          <span>🔍 Grid Scaling</span>
          <span className="toggle-icon">{activeSection === 'scaling' ? '−' : '+'}</span>
        </button>

        {activeSection === 'scaling' && (
          <div className="section-content">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.adaptiveScaling}
                onChange={(e) => updateConfig('adaptiveScaling', e.target.checked)}
              />
              <span>Adaptive Scaling</span>
              <small>Auto-adjust grid density based on zoom</small>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.scaleWithZoom}
                onChange={(e) => updateConfig('scaleWithZoom', e.target.checked)}
              />
              <span>Scale Grid with Zoom</span>
              <small>Grid lines follow zoom level</small>
            </label>

            <ValueControl
              label="Major Grid Spacing"
              value={config.majorGrid.spacing}
              onChange={(val) => updateConfig('majorGrid.spacing', val)}
              min={0.1}
              max={10}
              step={0.1}
              stepAmount={0.5}
              precision={1}
            />

            <ValueControl
              label="Minor Subdivisions"
              value={config.minorGrid.subdivisions}
              onChange={(val) => updateConfig('minorGrid.subdivisions', Math.round(val))}
              min={2}
              max={10}
              step={1}
              stepAmount={1}
              precision={0}
            />
          </div>
        )}
      </div>

      {/* Axes Styling Section */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'axes' ? 'active' : ''}`}
          onClick={() => toggleSection('axes')}
        >
          <span>⊹ Axes Styling</span>
          <span className="toggle-icon">{activeSection === 'axes' ? '−' : '+'}</span>
        </button>

        {activeSection === 'axes' && (
          <div className="section-content">
            <label className="color-label">
              <span>Color</span>
              <input
                type="color"
                value={config.axes.color}
                onChange={(e) => updateConfig('axes.color', e.target.value)}
              />
            </label>

            <ValueControl
              label="Width"
              value={config.axes.width}
              onChange={(val) => updateConfig('axes.width', val)}
              min={0.5}
              max={5}
              step={0.5}
              stepAmount={0.5}
              precision={1}
            />

            <ValueControl
              label="Opacity"
              value={config.axes.opacity}
              onChange={(val) => updateConfig('axes.opacity', val)}
              min={0}
              max={1}
              step={0.1}
              stepAmount={0.1}
              precision={1}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.axes.showArrows}
                onChange={(e) => updateConfig('axes.showArrows', e.target.checked)}
              />
              <span>Show Arrows</span>
            </label>

            {config.axes.showArrows && (
              <ValueControl
                label="Arrow Size"
                value={config.axes.arrowSize}
                onChange={(val) => updateConfig('axes.arrowSize', Math.round(val))}
                min={5}
                max={20}
                step={1}
                stepAmount={1}
                precision={0}
              />
            )}
          </div>
        )}
      </div>

      {/* Major Grid Styling */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'major' ? 'active' : ''}`}
          onClick={() => toggleSection('major')}
        >
          <span>▦ Major Grid</span>
          <span className="toggle-icon">{activeSection === 'major' ? '−' : '+'}</span>
        </button>

        {activeSection === 'major' && (
          <div className="section-content">
            <label className="color-label">
              <span>Color</span>
              <input
                type="color"
                value={config.majorGrid.color}
                onChange={(e) => updateConfig('majorGrid.color', e.target.value)}
              />
            </label>

            <ValueControl
              label="Width"
              value={config.majorGrid.width}
              onChange={(val) => updateConfig('majorGrid.width', val)}
              min={0.5}
              max={3}
              step={0.5}
              stepAmount={0.5}
              precision={1}
            />

            <ValueControl
              label="Opacity"
              value={config.majorGrid.opacity}
              onChange={(val) => updateConfig('majorGrid.opacity', val)}
              min={0}
              max={1}
              step={0.1}
              stepAmount={0.1}
              precision={1}
            />

            <label className="select-label">
              <span>Line Style</span>
              <select
                value={config.majorGrid.style}
                onChange={(e) => updateConfig('majorGrid.style', e.target.value)}
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Minor Grid Styling */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'minor' ? 'active' : ''}`}
          onClick={() => toggleSection('minor')}
        >
          <span>▢ Minor Grid</span>
          <span className="toggle-icon">{activeSection === 'minor' ? '−' : '+'}</span>
        </button>

        {activeSection === 'minor' && (
          <div className="section-content">
            <label className="color-label">
              <span>Color</span>
              <input
                type="color"
                value={config.minorGrid.color}
                onChange={(e) => updateConfig('minorGrid.color', e.target.value)}
              />
            </label>

            <ValueControl
              label="Width"
              value={config.minorGrid.width}
              onChange={(val) => updateConfig('minorGrid.width', val)}
              min={0.25}
              max={2}
              step={0.25}
              stepAmount={0.25}
              precision={2}
            />

            <ValueControl
              label="Opacity"
              value={config.minorGrid.opacity}
              onChange={(val) => updateConfig('minorGrid.opacity', val)}
              min={0}
              max={1}
              step={0.1}
              stepAmount={0.1}
              precision={1}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.minorGrid.fadeWithZoom}
                onChange={(e) => updateConfig('minorGrid.fadeWithZoom', e.target.checked)}
              />
              <span>Fade When Zoomed Out</span>
            </label>
          </div>
        )}
      </div>

      {/* Labels Styling */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'labels' ? 'active' : ''}`}
          onClick={() => toggleSection('labels')}
        >
          <span>🏷️ Labels</span>
          <span className="toggle-icon">{activeSection === 'labels' ? '−' : '+'}</span>
        </button>

        {activeSection === 'labels' && (
          <div className="section-content">
            <label className="color-label">
              <span>Color</span>
              <input
                type="color"
                value={config.labels.color}
                onChange={(e) => updateConfig('labels.color', e.target.value)}
              />
            </label>

            <ValueControl
              label="Font Size"
              value={config.labels.fontSize}
              onChange={(val) => updateConfig('labels.fontSize', Math.round(val))}
              min={8}
              max={24}
              step={1}
              stepAmount={2}
              precision={0}
            />

            <ValueControl
              label="Precision (Decimals)"
              value={config.labels.precision}
              onChange={(val) => updateConfig('labels.precision', Math.round(val))}
              min={0}
              max={6}
              step={1}
              stepAmount={1}
              precision={0}
            />

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.labels.scientific}
                onChange={(e) => updateConfig('labels.scientific', e.target.checked)}
              />
              <span>Scientific Notation</span>
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={config.labels.fadeWithZoom}
                onChange={(e) => updateConfig('labels.fadeWithZoom', e.target.checked)}
              />
              <span>Fade When Zoomed Out</span>
            </label>
          </div>
        )}
      </div>

      {/* Background Section */}
      <div className="config-section">
        <button
          className={`section-header ${activeSection === 'background' ? 'active' : ''}`}
          onClick={() => toggleSection('background')}
        >
          <span>🎨 Background</span>
          <span className="toggle-icon">{activeSection === 'background' ? '−' : '+'}</span>
        </button>

        {activeSection === 'background' && (
          <div className="section-content">
            <label className="color-label">
              <span>Color</span>
              <input
                type="color"
                value={config.background.color}
                onChange={(e) => updateConfig('background.color', e.target.value)}
              />
            </label>

            <ValueControl
              label="Opacity"
              value={config.background.opacity}
              onChange={(val) => updateConfig('background.opacity', val)}
              min={0}
              max={1}
              step={0.1}
              stepAmount={0.1}
              precision={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}
