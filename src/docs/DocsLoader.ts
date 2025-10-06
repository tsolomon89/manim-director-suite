/**
 * Service for loading and caching documentation files
 */

import type { DocsIndex, DocsDocument, DocsCategory, DocSearchResult } from './types';

export class DocsLoader {
  private static indexCache: DocsIndex | null = null;
  private static documentCache = new Map<string, string>();

  /**
   * Load the documentation index (master catalog)
   */
  static async loadIndex(): Promise<DocsIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const response = await fetch('/docs/index.json');
      if (!response.ok) {
        throw new Error(`Failed to load docs index: ${response.statusText}`);
      }

      const index: DocsIndex = await response.json();
      this.indexCache = index;
      return index;
    } catch (error) {
      console.error('Error loading docs index:', error);
      throw error;
    }
  }

  /**
   * Load a specific document by file path
   */
  static async loadDocument(filePath: string): Promise<string> {
    // Check cache first
    if (this.documentCache.has(filePath)) {
      return this.documentCache.get(filePath)!;
    }

    try {
      const response = await fetch(`/docs/${filePath}`);
      if (!response.ok) {
        throw new Error(`Failed to load document: ${response.statusText}`);
      }

      const content = await response.text();
      this.documentCache.set(filePath, content);
      return content;
    } catch (error) {
      console.error(`Error loading document ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Find a document by category and document ID
   */
  static findDocument(
    index: DocsIndex,
    categoryId: string,
    documentId: string
  ): { category: DocsCategory; document: DocsDocument } | null {
    const category = index.categories.find(c => c.id === categoryId);
    if (!category) {
      return null;
    }

    const document = category.documents.find(d => d.id === documentId);
    if (!document) {
      return null;
    }

    return { category, document };
  }

  /**
   * Search documents by query (title, tags, description)
   */
  static search(query: string, index: DocsIndex): DocSearchResult[] {
    if (!query.trim()) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const results: DocSearchResult[] = [];

    for (const category of index.categories) {
      for (const document of category.documents) {
        // Check title match
        if (document.title.toLowerCase().includes(lowerQuery)) {
          results.push({
            category,
            document,
            matchType: 'title',
            score: 3, // Title matches are highest priority
          });
          continue;
        }

        // Check tag match
        if (document.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))) {
          results.push({
            category,
            document,
            matchType: 'tag',
            score: 2,
          });
          continue;
        }

        // Check description match
        if (document.description?.toLowerCase().includes(lowerQuery)) {
          results.push({
            category,
            document,
            matchType: 'description',
            score: 1,
          });
        }
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get the first document (for default home page)
   */
  static getFirstDocument(index: DocsIndex): { category: DocsCategory; document: DocsDocument } | null {
    const firstCategory = index.categories[0];
    if (!firstCategory || firstCategory.documents.length === 0) {
      return null;
    }

    return {
      category: firstCategory,
      document: firstCategory.documents[0],
    };
  }

  /**
   * Clear all caches (useful for development/testing)
   */
  static clearCache(): void {
    this.indexCache = null;
    this.documentCache.clear();
  }
}
