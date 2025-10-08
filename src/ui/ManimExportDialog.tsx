/**
 * ManimExportDialog - UI for exporting Manim Python scripts
 * Phase 7: Rendering & Export
 */

import { useState, useEffect } from 'react';
import { ManimGenerator, type ManimExportOptions } from '../export/ManimGenerator';
import { ManimVideoExporter, type RenderProgress, type BackendStatus } from '../export/ManimVideoExporter';
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

  // Video rendering state
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [exporter] = useState(() => new ManimVideoExporter());

  // Check backend status on mount
  useEffect(() => {
    exporter.getBackendStatus().then(setBackendStatus);
  }, [exporter]);

  // Download script only (fallback)
  const handleDownloadScript = () => {
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

      alert('✅ Python script downloaded! Run it with Manim to generate the video.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Export failed';
      alert(`Export Error: ${msg}`);
    }
  };

  // Render video directly
  const handleRenderVideo = async () => {
    if (!backendStatus?.manimInstalled) {
      if (!backendStatus?.backendRunning) {
        alert('⚠️ Backend rendering service not available. Downloading script instead...');
      } else {
        alert('⚠️ Manim is not installed. Backend is running but cannot render videos. Downloading script instead...');
      }
      handleDownloadScript();
      return;
    }

    try {
      setIsRendering(true);
      setRenderProgress({ stage: 'generating', percent: 0, message: 'Starting render...' });

      const options: ManimExportOptions = {
        resolution,
        fps,
        quality,
        backgroundColor,
      };

      const result = await exporter.renderAnimation(
        keyframes,
        parameters,
        functions,
        camera,
        options,
        setRenderProgress
      );

      if (!result.success) {
        throw new Error(result.error || 'Render failed');
      }

      // Download video
      if (result.videoDataUrl) {
        const filename = ManimVideoExporter.generateVideoFilename(projectName);
        exporter.downloadVideo(result.videoDataUrl, filename);
        alert(`✅ Video rendered successfully! (${result.renderTimeSec}s, ${result.sizeMB}MB)`);
      } else {
        alert(`✅ Video rendered! File saved at: ${result.videoPath}`);
      }

      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Render failed';
      alert(`❌ Render Error: ${msg}`);
      setRenderProgress({ stage: 'error', percent: 0, message: msg });
    } finally {
      setIsRendering(false);
    }
  };

  const handleCancel = () => {
    if (isRendering) {
      exporter.cancel();
      setIsRendering(false);
      setRenderProgress(null);
    }
    onClose();
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

        {/* Rendering Progress */}
        {isRendering && renderProgress && (
          <div className="render-progress">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${renderProgress.percent}%` }}
              />
            </div>
            <div className="progress-message">
              {renderProgress.message}
            </div>
          </div>
        )}

        <div className="dialog-footer">
          <button className="cancel-button" onClick={handleCancel} disabled={isRendering}>
            {isRendering ? 'Cancel Render' : 'Cancel'}
          </button>
          <button
            className="export-button secondary"
            onClick={handleDownloadScript}
            disabled={isRendering}
            title="Download Python script only"
          >
            📄 Download Script
          </button>
          <button
            className="export-button"
            onClick={handleRenderVideo}
            disabled={isRendering || !backendStatus?.manimInstalled}
          >
            {isRendering ? '⏳ Rendering...' : '🎬 Render Video'}
          </button>
        </div>

        {backendStatus && !backendStatus.manimInstalled && (
          <div className="warning-box" style={{ marginTop: '1rem', backgroundColor: '#FEF3C7', color: '#92400E', padding: '0.75rem', borderRadius: '4px' }}>
            {backendStatus.backendRunning ? (
              <>
                <strong>⚠️ Manim Not Installed:</strong> The backend service is running at <code>http://localhost:5001</code>,
                but Manim executable is not found. Install Manim with <code>pip install manim</code> or use "Download Script" to render manually.
              </>
            ) : (
              <>
                <strong>⚠️ Backend Not Available:</strong> The Manim rendering service is not running.
                Start it with <code>npm run server</code> (or <code>npm run dev:full</code>) or use "Download Script" to render manually.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
