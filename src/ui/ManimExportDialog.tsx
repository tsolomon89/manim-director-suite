/**
 * ManimExportDialog - UI for exporting Manim Python scripts
 * Phase 7: Rendering & Export
 */

import { useState } from 'react';
import { ManimGenerator, type ManimExportOptions } from '../export/ManimGenerator';
import type { Keyframe } from '../timeline/types';
import type { Parameter } from '../engine/types';
import type { FunctionDefinition } from '../engine/expression-types';
import type { CameraState } from '../scene/types';
import './ExportDialog.css';

interface ManimExportDialogProps {
  keyframes: Keyframe[];
  parameters: Parameter[];
  functions: FunctionDefinition[];
  camera: CameraState;
  projectName: string;
  onClose: () => void;
  onExport?: (scriptContent: string, filename: string) => void;
}

export function ManimExportDialog({
  keyframes,
  parameters,
  functions,
  camera,
  projectName,
  onClose,
  onExport,
}: ManimExportDialogProps) {
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4k'>('1080p');
  const [fps, setFps] = useState(30);
  const [quality, setQuality] = useState<'draft' | 'medium' | 'high'>('medium');
  const [backgroundColor, setBackgroundColor] = useState('#000000');

  const handleExport = () => {
    try {
      const options: ManimExportOptions = {
        resolution,
        fps,
        quality,
        backgroundColor,
      };

      // Generate Python script
      const scriptContent = ManimGenerator.generateScript(
        keyframes,
        parameters,
        functions,
        camera,
        options
      );

      // Generate filename
      const filename = ManimGenerator.generateScriptFilename(projectName);

      // Download script as .py file
      const blob = new Blob([scriptContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (onExport) {
        onExport(scriptContent, filename);
      }

      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Export failed';
      alert(`Export Error: ${msg}`);
    }
  };

  const getManimCommand = () => {
    const filename = ManimGenerator.generateScriptFilename(projectName);
    return ManimGenerator.getManimCommand(filename, {
      resolution,
      fps,
      quality,
      backgroundColor,
    });
  };

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>🎬 Export Manim Animation</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label htmlFor="manim-resolution">Resolution</label>
            <select
              id="manim-resolution"
              value={resolution}
              onChange={e => setResolution(e.target.value as typeof resolution)}
            >
              <option value="720p">720p (1280×720 HD)</option>
              <option value="1080p">1080p (1920×1080 Full HD)</option>
              <option value="1440p">1440p (2560×1440 2K)</option>
              <option value="4k">4K (3840×2160 Ultra HD)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manim-fps">Frame Rate (FPS)</label>
            <select
              id="manim-fps"
              value={fps}
              onChange={e => setFps(parseInt(e.target.value))}
            >
              <option value={24}>24 fps (Film)</option>
              <option value={30}>30 fps (Standard)</option>
              <option value={60}>60 fps (Smooth)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manim-quality">Quality</label>
            <select
              id="manim-quality"
              value={quality}
              onChange={e => setQuality(e.target.value as typeof quality)}
            >
              <option value="draft">Draft (Fast preview)</option>
              <option value="medium">Medium (Balanced)</option>
              <option value="high">High (Production quality)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="manim-bgcolor">Background Color</label>
            <div className="color-input-group">
              <input
                id="manim-bgcolor"
                type="color"
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
              />
              <input
                type="text"
                value={backgroundColor}
                onChange={e => setBackgroundColor(e.target.value)}
                placeholder="#000000"
              />
            </div>
          </div>

          <div className="export-info">
            <h4>Export Summary</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Keyframes:</span>
                <span className="info-value">{keyframes.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Parameters:</span>
                <span className="info-value">{parameters.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Functions:</span>
                <span className="info-value">{functions.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Duration:</span>
                <span className="info-value">
                  {keyframes.length > 0
                    ? `${Math.max(...keyframes.map(kf => kf.time)).toFixed(1)}s`
                    : '0s'}
                </span>
              </div>
            </div>
          </div>

          <div className="hint-box">
            <strong>💡 How to render:</strong>
            <ol style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
              <li>Install Manim Community: <code>pip install manim</code></li>
              <li>Download the generated Python script</li>
              <li>Run: <code style={{ fontSize: '0.9em' }}>{getManimCommand()}</code></li>
              <li>Find your video in the <code>media/</code> folder</li>
            </ol>
          </div>

          {keyframes.length === 0 && (
            <div className="warning-box" style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.75rem', borderRadius: '4px', marginTop: '1rem' }}>
              <strong>⚠️ Warning:</strong> No keyframes detected. The animation will be static.
              Create keyframes to animate parameters over time.
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="export-button" onClick={handleExport}>
            🎬 Generate Script
          </button>
        </div>
      </div>
    </div>
  );
}
