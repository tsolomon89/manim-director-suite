/**
 * SaveLoadDialog - UI for saving and loading projects
 * Phase 8: Testing & Polish - Project persistence
 */

import { useState, useRef } from 'react';
import type { ProjectMetadata } from '../state/types';
import './SaveLoadDialog.css';

interface SaveLoadDialogProps {
  mode: 'save' | 'load';
  currentMetadata?: Partial<ProjectMetadata>;
  onSave?: (metadata: ProjectMetadata) => void;
  onLoad?: (file: File) => void;
  onClose: () => void;
}

export function SaveLoadDialog({
  mode,
  currentMetadata,
  onSave,
  onLoad,
  onClose,
}: SaveLoadDialogProps) {
  const [metadata, setMetadata] = useState<Partial<ProjectMetadata>>({
    name: currentMetadata?.name || 'Untitled Project',
    description: currentMetadata?.description || '',
    author: currentMetadata?.author || '',
    tags: currentMetadata?.tags || [],
  });
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    if (!onSave) return;

    const completeMetadata: ProjectMetadata = {
      name: metadata.name || 'Untitled Project',
      description: metadata.description,
      created: currentMetadata?.created || new Date().toISOString(),
      modified: new Date().toISOString(),
      author: metadata.author,
      tags: metadata.tags,
    };

    onSave(completeMetadata);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onLoad) {
      onLoad(file);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !metadata.tags?.includes(tagInput.trim())) {
      setMetadata({
        ...metadata,
        tags: [...(metadata.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags?.filter(t => t !== tag),
    });
  };

  return (
    <div className="save-load-dialog-overlay" onClick={onClose}>
      <div className="save-load-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{mode === 'save' ? '💾 Save Project' : '📂 Load Project'}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dialog-content">
          {mode === 'save' ? (
            <div className="save-form">
              <div className="form-group">
                <label htmlFor="project-name">Project Name *</label>
                <input
                  id="project-name"
                  type="text"
                  value={metadata.name}
                  onChange={e => setMetadata({ ...metadata, name: e.target.value })}
                  placeholder="My Awesome Animation"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-description">Description</label>
                <textarea
                  id="project-description"
                  value={metadata.description}
                  onChange={e => setMetadata({ ...metadata, description: e.target.value })}
                  placeholder="Brief description of your project..."
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="project-author">Author</label>
                <input
                  id="project-author"
                  type="text"
                  value={metadata.author}
                  onChange={e => setMetadata({ ...metadata, author: e.target.value })}
                  placeholder="Your name"
                />
              </div>

              <div className="form-group">
                <label>Tags</label>
                <div className="tags-input-container">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add tag and press Enter"
                  />
                  <button type="button" onClick={handleAddTag}>
                    Add
                  </button>
                </div>
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="tags-list">
                    {metadata.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="file-info">
                <p className="info-text">
                  <strong>Filename:</strong> {metadata.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'untitled'}.pkstudio
                </p>
                <p className="info-text hint">
                  The project will be saved as a JSON file that can be shared and loaded later.
                </p>
              </div>
            </div>
          ) : (
            <div className="load-form">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pkstudio,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />

              <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="upload-icon">📂</div>
                <h3>Choose Project File</h3>
                <p>Select a .pkstudio or .json file to load</p>
                <button type="button" className="upload-button">
                  Browse Files
                </button>
              </div>

              <div className="supported-formats">
                <h4>Supported Formats</h4>
                <ul>
                  <li><strong>.pkstudio</strong> - Parametric Keyframe Studio project files</li>
                  <li><strong>.json</strong> - JSON project files</li>
                </ul>
              </div>

              <div className="warning-box">
                <strong>⚠️ Warning:</strong> Loading a project will replace your current work.
                Make sure to save your current project first if needed.
              </div>
            </div>
          )}
        </div>

        <div className="dialog-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
          {mode === 'save' && (
            <button
              className="save-button"
              onClick={handleSave}
              disabled={!metadata.name?.trim()}
            >
              💾 Save Project
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
