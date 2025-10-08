import { useState } from 'react';
import { GridConfigPanel } from './GridConfigPanel';
import { ValueControl } from './ValueControl';
import type { GridRenderConfig } from '../scene/GridConfig';
import type { Camera } from '../scene/Camera';
import type { RendererType } from './RendererToggle';
import { configManager } from '../config/ConfigManager';
import './VisualSettingsSidebar.css';

export interface VisualSettingsSidebarProps {
  // Camera props
  camera: Camera | null;
  cameraInfo: { x: number; y: number; zoom: number };
  onResetCamera: () => void;
  onCameraXChange: (x: number) => void;
  onCameraYChange: (y: number) => void;
  onCameraZoomChange: (zoom: number) => void;

  // Grid props
  gridConfig: GridRenderConfig;
  onGridConfigChange: (config: GridRenderConfig) => void;

  // Rendering props
  currentRenderer: RendererType;
  onRendererChange: (renderer: RendererType) => void;
  manimAvailable: boolean;
  rendererStats: { latencyMs?: number; cacheStats?: any };
  complexMode: boolean;
  onComplexModeChange: (enabled: boolean) => void;
}

type TabId = 'camera' | 'grid' | 'rendering';

/**
 * Visual Settings sidebar with tabbed interface for Camera, Grid, and Rendering settings
 */
export function VisualSettingsSidebar({
  cameraInfo,
  onResetCamera,
  onCameraXChange,
  onCameraYChange,
  onCameraZoomChange,
  gridConfig,
  onGridConfigChange,
  currentRenderer,
  onRendererChange,
  manimAvailable,
  rendererStats,
  complexMode,
  onComplexModeChange,
}: VisualSettingsSidebarProps) {
  const [activeTab, setActiveTab] = useState<TabId>('camera');

  return (
    <div className="visual-settings-sidebar">
      <div className="visual-settings-tabs">
        <button
          className={`visual-settings-tab ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          Camera
        </button>
        <button
          className={`visual-settings-tab ${activeTab === 'grid' ? 'active' : ''}`}
          onClick={() => setActiveTab('grid')}
        >
          Grid
        </button>
        <button
          className={`visual-settings-tab ${activeTab === 'rendering' ? 'active' : ''}`}
          onClick={() => setActiveTab('rendering')}
        >
          Rendering
        </button>
      </div>

      <div className="visual-settings-content">
        {activeTab === 'camera' && (
          <div className="visual-settings-section">
            <div className="control-group">
              <button className="reset-button" onClick={onResetCamera}>
                Reset Camera
              </button>
            </div>

            <div className="camera-controls">
              <h4>Position</h4>
              <ValueControl
                label="X"
                value={cameraInfo.x}
                onChange={onCameraXChange}
                showSlider={false}
                stepAmount={1}
                precision={2}
              />
              <ValueControl
                label="Y"
                value={cameraInfo.y}
                onChange={onCameraYChange}
                showSlider={false}
                stepAmount={1}
                precision={2}
              />
              <ValueControl
                label="Zoom"
                value={cameraInfo.zoom}
                onChange={onCameraZoomChange}
                min={configManager.get<number>('camera.zoomMin')}
                max={configManager.get<number>('camera.zoomMax')}
                showSlider={true}
                step={0.1}
                stepAmount={0.5}
                precision={2}
              />
            </div>
          </div>
        )}

        {activeTab === 'grid' && (
          <div className="visual-settings-section">
            <GridConfigPanel
              config={gridConfig}
              onChange={onGridConfigChange}
            />
          </div>
        )}

        {activeTab === 'rendering' && (
          <div className="visual-settings-section">
            <div className="control-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={complexMode}
                  onChange={(e) => onComplexModeChange(e.target.checked)}
                />
                <span>Complex Mode (Enable <em>i</em>)</span>
              </label>
            </div>

            <div className="control-group">
              <label style={{ fontWeight: 500, marginBottom: '0.5rem', display: 'block', color: '#ccc' }}>
                Render Mode
              </label>
              <div className="renderer-radio-group">
                <label className="renderer-radio-label">
                  <input
                    type="radio"
                    name="renderer"
                    value="canvas"
                    checked={currentRenderer === 'canvas'}
                    onChange={() => onRendererChange('canvas')}
                  />
                  <span className="renderer-option-content">
                    <span className="renderer-option-title">Canvas Renderer</span>
                    <span className="renderer-option-description">Real-time 60fps, instant feedback</span>
                  </span>
                </label>

                <label className={`renderer-radio-label ${!manimAvailable ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="renderer"
                    value="manim"
                    checked={currentRenderer === 'manim'}
                    onChange={() => onRendererChange('manim')}
                    disabled={!manimAvailable}
                  />
                  <span className="renderer-option-content">
                    <span className="renderer-option-title">Manim Renderer</span>
                    <span className="renderer-option-description">
                      {manimAvailable
                        ? 'WYSIWYG - Preview = Export'
                        : 'Manim not available (backend service needed)'}
                    </span>
                  </span>
                </label>

                <label className={`renderer-radio-label ${!manimAvailable ? 'disabled' : ''}`}>
                  <input
                    type="radio"
                    name="renderer"
                    value="hybrid"
                    checked={currentRenderer === 'hybrid'}
                    onChange={() => onRendererChange('hybrid')}
                    disabled={!manimAvailable}
                  />
                  <span className="renderer-option-content">
                    <span className="renderer-option-title">Hybrid Mode</span>
                    <span className="renderer-option-description">
                      Canvas for interaction, Manim on idle
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {rendererStats.latencyMs !== undefined && currentRenderer === 'manim' && (
              <div className="renderer-stats">
                <small>Latency: {rendererStats.latencyMs.toFixed(1)}ms</small>
              </div>
            )}

            {currentRenderer === 'manim' && rendererStats.cacheStats && (
              <div className="renderer-stats">
                <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Cache Performance</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Hit Rate:</span>
                  <span>{(rendererStats.cacheStats.hitRate * 100).toFixed(1)}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>Cached Frames:</span>
                  <span>{rendererStats.cacheStats.totalFrames}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
