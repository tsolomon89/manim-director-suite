/**
 * DesmosImportDialog - UI for importing Desmos JSON files
 * Phase 4: Desmos Import - MVP
 */

import { useState, useRef } from 'react';
import { DesmosParser } from '../import/DesmosParser';
import { MappingService } from '../import/MappingService';
import type { DesmosParseResult, ImportOptions, ImportResult } from '../import/types';
import type { ParameterManager } from '../engine/ParameterManager';
import './DesmosImportDialog.css';

interface DesmosImportDialogProps {
  parameterManager: ParameterManager;
  onImportComplete: (result: ImportResult) => void;
  onClose: () => void;
  onApplyViewport?: (bounds: { xMin: number; xMax: number; yMin: number; yMax: number }) => void;
}

export function DesmosImportDialog({
  parameterManager,
  onImportComplete,
  onClose,
  onApplyViewport,
}: DesmosImportDialogProps) {
  const [parseResult, setParseResult] = useState<DesmosParseResult | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [options, setOptions] = useState<ImportOptions>({
    includeHidden: false,
    autoSetViewport: true,
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const result = DesmosParser.parse(text, options);
      setParseResult(result);
      setError(null);

      // Select all by default
      const allIds = new Set(result.expressions.map(e => e.desmosId));
      setSelectedIds(allIds);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setParseResult(null);
    }
  };

  const handleToggleExpression = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (!parseResult) return;
    setSelectedIds(new Set(parseResult.expressions.map(e => e.desmosId)));
  };

  const handleSelectNone = () => {
    setSelectedIds(new Set());
  };

  const handleImport = () => {
    if (!parseResult) return;

    // Filter to selected expressions only
    const filteredResult = {
      ...parseResult,
      expressions: parseResult.expressions.filter(e => selectedIds.has(e.desmosId)),
    };

    // Validate before import
    const validation = MappingService.validateImport(filteredResult);
    if (!validation.valid) {
      setError(`Validation failed:\n${validation.issues.join('\n')}`);
      return;
    }

    // Apply viewport if option enabled
    if (options.autoSetViewport && onApplyViewport) {
      MappingService.applyViewport(filteredResult, onApplyViewport);
    }

    // Map to parameters
    const result = MappingService.mapToParameters(filteredResult, parameterManager, options);

    onImportComplete(result);
  };

  const preview = parseResult ? MappingService.generatePreview(parseResult) : null;

  return (
    <div className="desmos-import-dialog-overlay" onClick={onClose}>
      <div className="desmos-import-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Import from Desmos</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          {/* File Upload Section */}
          {!parseResult && (
            <div className="upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                className="upload-button"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose Desmos JSON File
              </button>
              <p className="upload-hint">
                Select a .json file exported from Desmos
              </p>
            </div>
          )}

          {/* Options */}
          {!parseResult && (
            <div className="import-options">
              <h3>Import Options</h3>
              <label>
                <input
                  type="checkbox"
                  checked={options.includeHidden}
                  onChange={e => setOptions({ ...options, includeHidden: e.target.checked })}
                />
                Include hidden expressions
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={options.autoSetViewport}
                  onChange={e => setOptions({ ...options, autoSetViewport: e.target.checked })}
                />
                Set viewport to Desmos bounds
              </label>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <strong>Error:</strong>
              <pre>{error}</pre>
            </div>
          )}

          {/* Preview Section */}
          {parseResult && preview && (
            <div className="preview-section">
              <h3>Import Preview</h3>
              <div className="preview-stats">
                <div className="stat">
                  <span className="stat-label">Numeric Definitions:</span>
                  <span className="stat-value">{preview.numericDefinitions}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">With Sliders:</span>
                  <span className="stat-value">{preview.withSliders}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Skipped:</span>
                  <span className="stat-value">{preview.skipped}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Folders:</span>
                  <span className="stat-value">{preview.folders}</span>
                </div>
              </div>

              {/* Selection Controls */}
              <div className="selection-controls">
                <button onClick={handleSelectAll}>Select All</button>
                <button onClick={handleSelectNone}>Select None</button>
                <span className="selection-count">
                  {selectedIds.size} of {parseResult.expressions.length} selected
                </span>
              </div>

              {/* Expression List */}
              <div className="expression-list">
                <h4>Parameters to Import</h4>
                {parseResult.expressions.map(expr => {
                  const folderName = DesmosParser.getFolderName(expr.folderId, parseResult);
                  return (
                    <div key={expr.desmosId} className="expression-item">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(expr.desmosId)}
                        onChange={() => handleToggleExpression(expr.desmosId)}
                      />
                      <div className="expression-info">
                        <div className="expression-name">
                          {expr.name}
                          {folderName && <span className="folder-badge">{folderName}</span>}
                        </div>
                        <div className="expression-formula">{expr.expression}</div>
                        {expr.slider && (
                          <div className="expression-slider">
                            Slider: [{expr.slider.min}, {expr.slider.max}] step {expr.slider.step}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Warnings */}
              {parseResult.warnings.length > 0 && (
                <div className="warnings-section">
                  <h4>Warnings ({parseResult.warnings.length})</h4>
                  <ul>
                    {parseResult.warnings.slice(0, 10).map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                    {parseResult.warnings.length > 10 && (
                      <li>... and {parseResult.warnings.length - 10} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="dialog-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          {parseResult && (
            <>
              <button
                className="back-button"
                onClick={() => {
                  setParseResult(null);
                  setError(null);
                }}
              >
                Choose Different File
              </button>
              <button
                className="import-button"
                onClick={handleImport}
                disabled={selectedIds.size === 0}
              >
                Import {selectedIds.size} Parameter{selectedIds.size !== 1 ? 's' : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
