/**
 * ExportDialog - UI for exporting PNG images
 * Phase 7: Rendering & Export
 */

import { useState } from 'react';
import { exportCanvasToPNG, EXPORT_RESOLUTIONS, generateTimestampedFilename, type ExportResolution } from '../export/ExportUtils';
import './ExportDialog.css';

interface ExportDialogProps {
  canvas: HTMLCanvasElement | null;
  onClose: () => void;
  onExport?: (filename: string) => void;
}

export function ExportDialog({ canvas, onClose, onExport }: ExportDialogProps) {
  const [resolution, setResolution] = useState<ExportResolution | 'custom'>('1080p');
  const [customWidth, setCustomWidth] = useState(1920);
  const [customHeight, setCustomHeight] = useState(1080);
  const [filename, setFilename] = useState(generateTimestampedFilename('frame', 'png'));

  const handleExport = () => {
    if (!canvas) {
      alert('No canvas available for export');
      return;
    }

    try {
      if (resolution === 'custom') {
        exportCanvasToPNG(canvas, filename, customWidth, customHeight);
      } else {
        const res = EXPORT_RESOLUTIONS[resolution];
        exportCanvasToPNG(canvas, filename, res.width, res.height);
      }

      if (onExport) {
        onExport(filename);
      }

      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Export failed';
      alert(`Export Error: ${msg}`);
    }
  };

  const handleGenerateFilename = () => {
    setFilename(generateTimestampedFilename('frame', 'png'));
  };

  const selectedRes = resolution === 'custom'
    ? { width: customWidth, height: customHeight }
    : EXPORT_RESOLUTIONS[resolution];

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>📸 Export Image</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          <div className="form-group">
            <label htmlFor="export-resolution">Resolution</label>
            <select
              id="export-resolution"
              value={resolution}
              onChange={e => setResolution(e.target.value as ExportResolution | 'custom')}
            >
              {Object.entries(EXPORT_RESOLUTIONS).map(([key, res]) => (
                <option key={key} value={key}>
                  {res.label} ({res.width}×{res.height})
                </option>
              ))}
              <option value="custom">Custom Resolution</option>
            </select>
          </div>

          {resolution === 'custom' && (
            <div className="custom-resolution">
              <div className="form-group">
                <label htmlFor="custom-width">Width (px)</label>
                <input
                  id="custom-width"
                  type="number"
                  value={customWidth}
                  onChange={e => setCustomWidth(parseInt(e.target.value) || 1920)}
                  min={1}
                  max={7680}
                />
              </div>
              <div className="form-group">
                <label htmlFor="custom-height">Height (px)</label>
                <input
                  id="custom-height"
                  type="number"
                  value={customHeight}
                  onChange={e => setCustomHeight(parseInt(e.target.value) || 1080)}
                  min={1}
                  max={4320}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="export-filename">Filename</label>
            <div className="filename-input-group">
              <input
                id="export-filename"
                type="text"
                value={filename}
                onChange={e => setFilename(e.target.value)}
              />
              <button
                type="button"
                onClick={handleGenerateFilename}
                className="generate-button"
                title="Generate timestamped filename"
              >
                🔄
              </button>
            </div>
          </div>

          <div className="export-info">
            <h4>Export Settings</h4>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Resolution:</span>
                <span className="info-value">{selectedRes.width} × {selectedRes.height}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Format:</span>
                <span className="info-value">PNG (Lossless)</span>
              </div>
              <div className="info-item">
                <span className="info-label">Aspect Ratio:</span>
                <span className="info-value">
                  {(selectedRes.width / selectedRes.height).toFixed(2)}:1
                </span>
              </div>
            </div>
          </div>

          <div className="hint-box">
            <strong>💡 Tip:</strong> The image will be exported from the current viewport state.
            Make sure your scene is set up exactly as you want it to appear.
          </div>
        </div>

        <div className="dialog-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          <button className="export-button" onClick={handleExport}>
            📸 Export Image
          </button>
        </div>
      </div>
    </div>
  );
}
