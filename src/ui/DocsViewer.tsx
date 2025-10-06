/**
 * Main documentation viewer component with search and navigation
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { DocsLoader } from '../docs/DocsLoader';
import { DocsNavigation } from './DocsNavigation';
import { MarkdownRenderer } from './MarkdownRenderer';
import type { DocsIndex, DocsCategory, DocsDocument } from '../docs/types';
import './DocsViewer.css';

export function DocsViewer() {
  const params = useParams<{ category?: string; doc?: string }>();
  const navigate = useNavigate();

  const [index, setIndex] = useState<DocsIndex | null>(null);
  const [currentDoc, setCurrentDoc] = useState<{ category: DocsCategory; document: DocsDocument } | null>(null);
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Load index on mount
  useEffect(() => {
    DocsLoader.loadIndex()
      .then(setIndex)
      .catch(err => {
        console.error('Failed to load docs index:', err);
        setError('Failed to load documentation index');
      });
  }, []);

  // Load document when params change
  useEffect(() => {
    if (!index) return;

    setLoading(true);
    setError(null);

    // If no category/doc specified, load the first document
    if (!params.category || !params.doc) {
      const firstDoc = DocsLoader.getFirstDocument(index);
      if (firstDoc) {
        navigate(`/docs/${firstDoc.category.id}/${firstDoc.document.id}`, { replace: true });
      } else {
        setError('No documents available');
        setLoading(false);
      }
      return;
    }

    // Find the requested document
    const docInfo = DocsLoader.findDocument(index, params.category, params.doc);
    if (!docInfo) {
      setError(`Document not found: ${params.category}/${params.doc}`);
      setLoading(false);
      return;
    }

    setCurrentDoc(docInfo);

    // Load the document content
    DocsLoader.loadDocument(docInfo.document.file)
      .then(setContent)
      .catch(err => {
        console.error('Failed to load document:', err);
        setError(`Failed to load document: ${docInfo.document.title}`);
      })
      .finally(() => setLoading(false));
  }, [index, params.category, params.doc, navigate]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Search implementation can be enhanced to filter navigation or show results panel
  };

  if (!index) {
    return (
      <div className="docs-viewer">
        <div className="docs-loading">Loading documentation...</div>
      </div>
    );
  }

  return (
    <div className="docs-viewer">
      <DocsNavigation index={index} />

      <div className="docs-content-wrapper">
        <div className="docs-header">
          <div className="docs-breadcrumbs">
            <Link to="/" className="docs-home-link">← Studio</Link>
            {currentDoc && (
              <>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item">{currentDoc.category.title}</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-item current">{currentDoc.document.title}</span>
              </>
            )}
          </div>

          <div className="docs-search">
            <input
              type="text"
              placeholder="Search documentation..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="docs-search-input"
            />
          </div>
        </div>

        <main className="docs-main-content">
          {loading && (
            <div className="docs-loading">Loading document...</div>
          )}

          {error && (
            <div className="docs-error">
              <h2>Error</h2>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && currentDoc && (
            <div className="docs-document">
              <div className="docs-document-header">
                <h1>{currentDoc.document.title}</h1>
                {currentDoc.document.description && (
                  <p className="docs-document-description">{currentDoc.document.description}</p>
                )}
                {currentDoc.document.tags && currentDoc.document.tags.length > 0 && (
                  <div className="docs-tags">
                    {currentDoc.document.tags.map(tag => (
                      <span key={tag} className="docs-tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>

              <MarkdownRenderer content={content} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
