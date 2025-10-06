/**
 * Documentation sidebar navigation with collapsible categories
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DocsIndex, DocsCategory } from '../docs/types';
import './DocsNavigation.css';

interface DocsNavigationProps {
  index: DocsIndex;
}

export function DocsNavigation({ index }: DocsNavigationProps) {
  const navigate = useNavigate();
  const params = useParams<{ category?: string; doc?: string }>();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleDocClick = (category: DocsCategory, docId: string) => {
    navigate(`/docs/${category.id}/${docId}`);
  };

  return (
    <nav className="docs-navigation">
      <div className="docs-navigation-header">
        <h2>Documentation</h2>
        <span className="docs-version">v{index.version}</span>
      </div>

      <div className="docs-navigation-content">
        {index.categories.map(category => {
          const isCollapsed = collapsedCategories.has(category.id);
          const isActive = params.category === category.id;

          return (
            <div key={category.id} className="docs-category">
              <button
                className={`docs-category-header ${isActive ? 'active' : ''}`}
                onClick={() => toggleCategory(category.id)}
              >
                <span className="category-icon">{category.icon || '📄'}</span>
                <span className="category-title">{category.title}</span>
                <span className={`category-chevron ${isCollapsed ? 'collapsed' : ''}`}>
                  ▼
                </span>
              </button>

              {!isCollapsed && (
                <ul className="docs-list">
                  {category.documents.map(doc => {
                    const isDocActive = params.category === category.id && params.doc === doc.id;

                    return (
                      <li key={doc.id}>
                        <button
                          className={`docs-item ${isDocActive ? 'active' : ''}`}
                          onClick={() => handleDocClick(category, doc.id)}
                          title={doc.description}
                        >
                          {doc.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
}
