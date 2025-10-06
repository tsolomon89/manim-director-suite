/**
 * FrameCache - LRU cache for Manim-rendered frames
 * Phase A: Manim Integration Foundation
 */

import { createHash } from 'crypto';

export interface CachedFrame {
  key: string;
  imagePath: string;
  timestamp: number;
  sizeBytes: number;
  metadata: {
    parameters: Record<string, number>;
    camera: { x: number; y: number; zoom: number };
    time: number;
  };
}

export interface CacheStats {
  hits: number;
  misses: number;
  totalFrames: number;
  totalSizeMB: number;
  hitRate: number;
}

/**
 * LRU cache for Manim-rendered PNG frames
 * Evicts least recently used frames when size limits are exceeded
 */
export class FrameCache {
  private cache: Map<string, CachedFrame>;
  private accessOrder: string[]; // LRU tracking
  private maxSizeFrames: number;
  private maxSizeMB: number;
  private stats: CacheStats;
  private currentSizeBytes: number;

  constructor(maxSizeFrames: number = 100, maxSizeMB: number = 500) {
    this.cache = new Map();
    this.accessOrder = [];
    this.maxSizeFrames = maxSizeFrames;
    this.maxSizeMB = maxSizeMB;
    this.currentSizeBytes = 0;
    this.stats = {
      hits: 0,
      misses: 0,
      totalFrames: 0,
      totalSizeMB: 0,
      hitRate: 0,
    };
  }

  /**
   * Generate cache key from state
   */
  private generateKey(
    parameters: Record<string, number>,
    camera: { x: number; y: number; zoom: number },
    functions: any[],
    time: number
  ): string {
    const stateString = JSON.stringify({
      params: parameters,
      cam: { x: camera.x.toFixed(4), y: camera.y.toFixed(4), z: camera.zoom.toFixed(4) },
      funcs: functions.map(f => ({ id: f.id, expr: f.expression })),
      t: time.toFixed(3),
    });

    // Use simple hash for browser compatibility (no crypto module in browser)
    return this.simpleHash(stateString);
  }

  /**
   * Simple hash function for browser (replaces crypto.createHash)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached frame if exists
   */
  get(
    parameters: Record<string, number>,
    camera: { x: number; y: number; zoom: number },
    functions: any[],
    time: number
  ): CachedFrame | null {
    const key = this.generateKey(parameters, camera, functions, time);
    const frame = this.cache.get(key);

    if (frame) {
      this.stats.hits++;
      this.updateAccessOrder(key);
      this.updateHitRate();
      return frame;
    }

    this.stats.misses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Set cached frame
   */
  set(
    parameters: Record<string, number>,
    camera: { x: number; y: number; zoom: number },
    functions: any[],
    time: number,
    imagePath: string,
    sizeBytes: number
  ): void {
    const key = this.generateKey(parameters, camera, functions, time);

    // Check if we need to evict
    this.evictIfNecessary(sizeBytes);

    const frame: CachedFrame = {
      key,
      imagePath,
      timestamp: Date.now(),
      sizeBytes,
      metadata: {
        parameters: { ...parameters },
        camera: { ...camera },
        time,
      },
    };

    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldFrame = this.cache.get(key)!;
      this.currentSizeBytes -= oldFrame.sizeBytes;
    }

    this.cache.set(key, frame);
    this.currentSizeBytes += sizeBytes;
    this.updateAccessOrder(key);
    this.updateStats();
  }

  /**
   * Update access order for LRU
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key); // Most recently used goes to end
  }

  /**
   * Evict least recently used frames if necessary
   */
  private evictIfNecessary(incomingSizeBytes: number): void {
    const maxSizeBytes = this.maxSizeMB * 1024 * 1024;

    // Evict by count limit
    while (this.cache.size >= this.maxSizeFrames && this.accessOrder.length > 0) {
      const lruKey = this.accessOrder.shift()!; // Least recently used at start
      const frame = this.cache.get(lruKey);
      if (frame) {
        this.currentSizeBytes -= frame.sizeBytes;
        this.cache.delete(lruKey);
      }
    }

    // Evict by size limit
    while (
      this.currentSizeBytes + incomingSizeBytes > maxSizeBytes &&
      this.accessOrder.length > 0
    ) {
      const lruKey = this.accessOrder.shift()!;
      const frame = this.cache.get(lruKey);
      if (frame) {
        this.currentSizeBytes -= frame.sizeBytes;
        this.cache.delete(lruKey);
      }
    }
  }

  /**
   * Invalidate all frames (e.g., on parameter/function change)
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.currentSizeBytes = 0;
    this.updateStats();
  }

  /**
   * Invalidate frames matching a condition
   */
  invalidate(predicate: (frame: CachedFrame) => boolean): void {
    const keysToRemove: string[] = [];

    for (const [key, frame] of this.cache.entries()) {
      if (predicate(frame)) {
        keysToRemove.push(key);
        this.currentSizeBytes -= frame.sizeBytes;
      }
    }

    for (const key of keysToRemove) {
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    }

    this.updateStats();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Update statistics
   */
  private updateStats(): void {
    this.stats.totalFrames = this.cache.size;
    this.stats.totalSizeMB = this.currentSizeBytes / (1024 * 1024);
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats.hits = 0;
    this.stats.misses = 0;
    this.updateHitRate();
  }
}
