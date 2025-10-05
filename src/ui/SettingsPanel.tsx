import { useState } from 'react';
import { configManager } from '../config/ConfigManager';
import { PresetSelector } from './PresetSelector';
import type { ColorSchemeConfig, EasingCurveConfig, WarpConfig } from '../config/types';
import './SettingsPanel.css';

export function SettingsPanel() {
  const [selectedColorScheme, setSelectedColorScheme] = useState<string>('scientific');
  const [selectedEasing, setSelectedEasing] = useState<string>('linear');
  const [selectedWarp, setSelectedWarp] = useState<string>('identity');

  const colorScheme = configManager.getPreset<ColorSchemeConfig>('color-schemes', selectedColorScheme);
  const easingCurve = configManager.getPreset<EasingCurveConfig>('easing-curves', selectedEasing);
  const warp = configManager.getPreset<WarpConfig>('warps', selectedWarp);

  return (
    <div className="settings-panel">
      <h2>Settings</h2>

      <section className="settings-section">
        <h3>Color Scheme</h3>
        <PresetSelector
          category="color-schemes"
          currentId={selectedColorScheme}
          onSelect={setSelectedColorScheme}
        />
        {colorScheme && (
          <div className="preset-info">
            <p className="preset-description">{colorScheme.description}</p>
            <div className="color-palette">
              {Object.entries(colorScheme.colors).map(([name, color]) => (
                <div key={name} className="color-item">
                  <div className="color-swatch" style={{ backgroundColor: color }}></div>
                  <span className="color-name">{name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Easing Curve</h3>
        <PresetSelector
          category="easing-curves"
          currentId={selectedEasing}
          onSelect={setSelectedEasing}
        />
        {easingCurve && (
          <div className="preset-info">
            <p className="preset-meta">Type: {easingCurve.type}</p>
            {easingCurve.formula && (
              <p className="preset-formula">f(t) = {easingCurve.formula}</p>
            )}
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Warp Function</h3>
        <PresetSelector
          category="warps"
          currentId={selectedWarp}
          onSelect={setSelectedWarp}
        />
        {warp && (
          <div className="preset-info">
            <p className="preset-description">{warp.description}</p>
            <p className="preset-meta">Type: {warp.type}</p>
          </div>
        )}
      </section>

      <section className="settings-section">
        <h3>Camera Settings</h3>
        <div className="setting-item">
          <label>Pan Speed</label>
          <input
            type="number"
            value={configManager.get('camera.panSpeed')}
            onChange={(e) => configManager.set('camera.panSpeed', parseFloat(e.target.value))}
            step="0.1"
            min="0.1"
            max="5"
          />
        </div>
        <div className="setting-item">
          <label>Zoom Speed</label>
          <input
            type="number"
            value={configManager.get('camera.zoomSpeed')}
            onChange={(e) => configManager.set('camera.zoomSpeed', parseFloat(e.target.value))}
            step="0.01"
            min="0.01"
            max="1"
          />
        </div>
      </section>

      <section className="settings-section">
        <h3>Performance</h3>
        <div className="setting-item">
          <label>Debounce (ms)</label>
          <input
            type="number"
            value={configManager.get('performance.debounceMs')}
            onChange={(e) => configManager.set('performance.debounceMs', parseInt(e.target.value))}
            step="1"
            min="0"
            max="100"
          />
        </div>
        <div className="setting-item">
          <label>Enable Cache</label>
          <input
            type="checkbox"
            checked={configManager.get('performance.enableCache')}
            onChange={(e) => configManager.set('performance.enableCache', e.target.checked)}
          />
        </div>
      </section>
    </div>
  );
}
