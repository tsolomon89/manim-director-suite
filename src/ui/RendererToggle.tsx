/**
 * RendererToggle - UI component for switching between Canvas and Manim renderers
 * Phase A: Manim Integration Foundation
 */

import { useState } from 'react';
import './RendererToggle.css';

export type RendererType = 'canvas' | 'manim' | 'hybrid';

interface RendererToggleProps {
  currentRenderer: RendererType;
  onRendererChange: (renderer: RendererType) => void;
  manimAvailable?: boolean;
  cacheStats?: {
    hits: number;
    misses: number;
    hitRate: number;
    totalFrames: number;
  };
  latencyMs?: number;
}

export function RendererToggle({
  currentRenderer,
  onRendererChange,
  manimAvailable = false,
  cacheStats,
  latencyMs,
}: RendererToggleProps) {
  const [expanded, setExpanded] = useState(false);
  const showIndicator = true; // Always show for now (config field doesn't exist yet)

  if (!showIndicator) {
    return null;
  }

  const handleChange = (renderer: RendererType) => {
    onRendererChange(renderer);
    setExpanded(false);
  };

  const getRendererStatus = (): string => {
    switch (currentRenderer) {
      case 'canvas':
        return 'Canvas (Real-time)';
      case 'manim':
        return `Manim ${manimAvailable ? '(Ready)' : '(Unavailable)'}`;
      case 'hybrid':
        return 'Hybrid (Canvas + Manim)';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (): string => {
    if (currentRenderer === 'manim' && !manimAvailable) {
      return '#ff4444'; // Red - error
    }
    if (currentRenderer === 'manim' && latencyMs && latencyMs > 500) {
      return '#ffaa00'; // Yellow - slow
    }
    return '#44ff44'; // Green - good
  };

  return (
    <div className="renderer-toggle">
      <div className="renderer-status" onClick={() => setExpanded(!expanded)}>
        <div className="status-indicator" style={{ backgroundColor: getStatusColor() }} />
        <span className="status-text">{getRendererStatus()}</span>
        <span className="expand-icon">{expanded ? '▼' : '▶'}</span>
      </div>

      {expanded && (
        <div className="renderer-options">
          <div className="option-group">
            <label>
              <input
                type="radio"
                name="renderer"
                value="canvas"
                checked={currentRenderer === 'canvas'}
                onChange={() => handleChange('canvas')}
              />
              <span className="option-label">
                Canvas Renderer
                <span className="option-description">Real-time 60fps, instant feedback</span>
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="renderer"
                value="manim"
                checked={currentRenderer === 'manim'}
                onChange={() => handleChange('manim')}
                disabled={!manimAvailable}
              />
              <span className="option-label">
                Manim Renderer
                <span className="option-description">
                  {manimAvailable
                    ? 'WYSIWYG - Preview = Export'
                    : 'Manim not available (backend service needed)'}
                </span>
              </span>
            </label>

            <label>
              <input
                type="radio"
                name="renderer"
                value="hybrid"
                checked={currentRenderer === 'hybrid'}
                onChange={() => handleChange('hybrid')}
                disabled={!manimAvailable}
              />
              <span className="option-label">
                Hybrid Mode
                <span className="option-description">
                  Canvas for interaction, Manim on idle
                </span>
              </span>
            </label>
          </div>

          {currentRenderer === 'manim' && cacheStats && (
            <div className="cache-stats">
              <div className="stats-title">Cache Performance</div>
              <div className="stats-row">
                <span>Hit Rate:</span>
                <span>{(cacheStats.hitRate * 100).toFixed(1)}%</span>
              </div>
              <div className="stats-row">
                <span>Frames Cached:</span>
                <span>{cacheStats.totalFrames}</span>
              </div>
              <div className="stats-row">
                <span>Total Requests:</span>
                <span>{cacheStats.hits + cacheStats.misses}</span>
              </div>
            </div>
          )}

          {latencyMs !== undefined && currentRenderer === 'manim' && (
            <div className="latency-info">
              <span>Average Latency:</span>
              <span className={latencyMs > 500 ? 'latency-slow' : 'latency-good'}>
                {latencyMs.toFixed(0)}ms
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
