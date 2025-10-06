/**
 * Type definitions for the documentation system
 */

export interface DocsIndex {
  version: string;
  categories: DocsCategory[];
}

export interface DocsCategory {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  order: number;
  documents: DocsDocument[];
}

export interface DocsDocument {
  id: string;
  title: string;
  file: string;
  description?: string;
  tags?: string[];
  order: number;
}

export interface DocSearchResult {
  category: DocsCategory;
  document: DocsDocument;
  matchType: 'title' | 'tag' | 'description';
  score: number;
}
