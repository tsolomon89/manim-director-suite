/**
 * ManimRenderer - Manage Manim subprocess execution and frame caching
 * Phase A: Manim Integration Foundation
 *
 * Note: In browser environment, this communicates with a backend service.
 * For Electron/Tauri, this can execute Manim directly via Node.js subprocess.
 */

import { FrameCache } from './FrameCache';
import { ManimScriptBuilder, type ManimSceneConfig, type ManimScriptOptions } from './ManimScriptBuilder';
import { configManager } from '../config/ConfigManager';

export interface RenderResult {
  success: boolean;
  imagePath?: string;
  imageDataUrl?: string; // Base64 data URL for browser display
  error?: string;
  renderTimeMs: number;
  fromCache: boolean;
}

export interface RenderProgress {
  status: 'queued' | 'rendering' | 'completed' | 'failed';
  progress: number; // 0-1
  message: string;
}

/**
 * Manim renderer with subprocess management and caching
 */
export class ManimRenderer {
  private cache: FrameCache;
  private renderQueue: Array<{ config: ManimSceneConfig; options: ManimScriptOptions; callback: (result: RenderResult) => void }>;
  private isRendering: boolean;
  private apiEndpoint: string | null;

  constructor() {
    const cacheConfig = configManager.get<any>('cache') || {};
    const maxFrames = cacheConfig.maxSizeFrames || 100;
    const maxSizeMB = cacheConfig.maxSizeMB || 500;

    this.cache = new FrameCache(maxFrames, maxSizeMB);
    this.renderQueue = [];
    this.isRendering = false;

    // Check if we're in browser or Node.js
    this.apiEndpoint = this.detectEnvironment();
  }

  /**
   * Detect if running in browser (needs API) or Node.js (can use subprocess)
   */
  private detectEnvironment(): string | null {
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
      // Browser environment - use API
      return '/api/manim/render'; // Backend service endpoint
    }
    return null; // Node.js - can use subprocess directly
  }

  /**
   * Render a frame (checks cache first)
   */
  async renderFrame(
    config: ManimSceneConfig,
    options: ManimScriptOptions = { quality: 'draft' }
  ): Promise<RenderResult> {
    const startTime = performance.now();

    // Check cache first
    const cached = this.cache.get(
      config.parameters,
      config.camera,
      config.functions,
      0 // time = 0 for static frame
    );

    if (cached) {
      return {
        success: true,
        imagePath: cached.imagePath,
        imageDataUrl: await this.loadImageAsDataUrl(cached.imagePath),
        renderTimeMs: performance.now() - startTime,
        fromCache: true,
      };
    }

    // Not in cache - render new frame
    return new Promise((resolve) => {
      this.renderQueue.push({
        config,
        options,
        callback: resolve,
      });

      this.processQueue();
    });
  }

  /**
   * Process render queue (one at a time to avoid overload)
   */
  private async processQueue(): Promise<void> {
    if (this.isRendering || this.renderQueue.length === 0) {
      return;
    }

    this.isRendering = true;
    const job = this.renderQueue.shift()!;

    try {
      const result = await this.executeRender(job.config, job.options);
      job.callback(result);
    } catch (error) {
      job.callback({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown render error',
        renderTimeMs: 0,
        fromCache: false,
      });
    } finally {
      this.isRendering = false;
      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Execute actual Manim rendering
   */
  private async executeRender(
    config: ManimSceneConfig,
    options: ManimScriptOptions
  ): Promise<RenderResult> {
    const startTime = performance.now();

    // Generate Python script
    const script = ManimScriptBuilder.generateScript(config, options);

    // Choose execution path based on environment
    if (this.apiEndpoint) {
      return this.renderViaAPI(script, config, options, startTime);
    } else {
      return this.renderViaSubprocess(script, config, options, startTime);
    }
  }

  /**
   * Render via backend API (browser environment)
   */
  private async renderViaAPI(
    script: string,
    config: ManimSceneConfig,
    options: ManimScriptOptions,
    startTime: number
  ): Promise<RenderResult> {
    try {
      const response = await fetch(this.apiEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script,
          quality: options.quality,
          frameNumber: options.frameNumber || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Render failed');
      }

      // Cache the result
      const imageDataUrl = data.imageDataUrl;
      const imagePath = data.imagePath || 'api-rendered-frame.png';

      this.cache.set(
        config.parameters,
        config.camera,
        config.functions,
        0,
        imagePath,
        data.sizeBytes || 0
      );

      return {
        success: true,
        imagePath,
        imageDataUrl,
        renderTimeMs: performance.now() - startTime,
        fromCache: false,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API render failed',
        renderTimeMs: performance.now() - startTime,
        fromCache: false,
      };
    }
  }

  /**
   * Render via subprocess (Node.js/Electron/Tauri environment)
   */
  private async renderViaSubprocess(
    _script: string,
    _config: ManimSceneConfig,
    _options: ManimScriptOptions,
    startTime: number
  ): Promise<RenderResult> {
    // Note: This would use Node.js child_process module
    // For now, return placeholder
    console.warn('Subprocess rendering not implemented yet - running in browser mode');

    return {
      success: false,
      error: 'Subprocess rendering requires Node.js environment (Electron/Tauri)',
      renderTimeMs: performance.now() - startTime,
      fromCache: false,
    };
  }

  /**
   * Load image as data URL for browser display
   */
  private async loadImageAsDataUrl(imagePath: string): Promise<string> {
    // In browser, imagePath might already be a data URL from API
    if (imagePath.startsWith('data:')) {
      return imagePath;
    }

    // Otherwise, fetch the image
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      return '';
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache entries matching a condition
   */
  invalidateCache(predicate: (frame: any) => boolean): void {
    this.cache.invalidate(predicate);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Check if Manim is available
   */
  async checkManimAvailable(): Promise<{ available: boolean; version?: string; error?: string }> {
    if (this.apiEndpoint) {
      // Check via API
      try {
        const response = await fetch(`${this.apiEndpoint}/health`);
        const data = await response.json();
        return {
          available: data.manimAvailable || false,
          version: data.manimVersion,
        };
      } catch (error) {
        return {
          available: false,
          error: 'Backend service not available',
        };
      }
    }

    // Check via subprocess (would need Node.js)
    return {
      available: false,
      error: 'Subprocess check requires Node.js environment',
    };
  }
}
