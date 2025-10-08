/**
 * ManimVideoExporter - Client service for rendering Manim animations
 * Phase 7: Rendering & Export
 */

import { ManimGenerator, type ManimExportOptions } from './ManimGenerator';
import type { Keyframe } from '../timeline/types';
import type { Parameter } from '../engine/types';
import type { FunctionDefinition } from '../engine/expression-types';
import type { CameraState } from '../scene/types';

export interface VideoRenderResult {
  success: boolean;
  videoDataUrl?: string;
  videoPath?: string;
  sizeBytes?: number;
  sizeMB?: string;
  renderTimeMs?: number;
  renderTimeSec?: string;
  error?: string;
  quality?: string;
  resolution?: string;
  fps?: number;
  renderId?: string;
}

export interface RenderProgress {
  stage: 'generating' | 'uploading' | 'rendering' | 'downloading' | 'complete' | 'error';
  percent: number;
  message: string;
}

export interface BackendStatus {
  backendRunning: boolean;
  manimInstalled: boolean;
  error?: string;
}

export type ProgressCallback = (progress: RenderProgress) => void;

/**
 * Service for rendering Manim animations via backend API
 */
export class ManimVideoExporter {
  private apiEndpoint: string;
  private abortController: AbortController | null = null;

  constructor(apiEndpoint: string = 'http://localhost:5001') {
    this.apiEndpoint = apiEndpoint;
  }

  /**
   * Check if Manim backend service is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiEndpoint}/api/manim/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) return false;

      const data = await response.json();
      return data.manimAvailable === true;
    } catch (error) {
      console.warn('Manim backend not available:', error);
      return false;
    }
  }

  /**
   * Get detailed backend status
   */
  async getBackendStatus(): Promise<BackendStatus> {
    try {
      const response = await fetch(`${this.apiEndpoint}/api/manim/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return { backendRunning: false, manimInstalled: false, error: 'Backend not responding' };
      }

      const data = await response.json();
      return {
        backendRunning: true,
        manimInstalled: data.manimAvailable === true,
        error: data.error
      };
    } catch (error) {
      return {
        backendRunning: false,
        manimInstalled: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  /**
   * Render animation and return video
   */
  async renderAnimation(
    keyframes: Keyframe[],
    parameters: Parameter[],
    functions: FunctionDefinition[],
    camera: CameraState,
    options: ManimExportOptions,
    onProgress?: ProgressCallback
  ): Promise<VideoRenderResult> {
    this.abortController = new AbortController();

    try {
      // Stage 1: Generate Python script
      if (onProgress) {
        onProgress({
          stage: 'generating',
          percent: 10,
          message: 'Generating Manim Python script...',
        });
      }

      const script = ManimGenerator.generateScript(
        keyframes,
        parameters,
        functions,
        camera,
        options
      );

      // Stage 2: Send to backend
      if (onProgress) {
        onProgress({
          stage: 'uploading',
          percent: 20,
          message: 'Sending script to rendering service...',
        });
      }

      const payload = {
        script,
        quality: options.quality,
        resolution: options.resolution,
        fps: options.fps,
      };

      // Stage 3: Start rendering
      if (onProgress) {
        onProgress({
          stage: 'rendering',
          percent: 30,
          message: 'Rendering animation with Manim...',
        });
      }

      const response = await fetch(`${this.apiEndpoint}/api/manim/render-animation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result: VideoRenderResult = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown rendering error');
      }

      // Stage 4: Complete
      if (onProgress) {
        onProgress({
          stage: 'complete',
          percent: 100,
          message: `Render complete! (${result.renderTimeSec}s, ${result.sizeMB}MB)`,
        });
      }

      return result;
    } catch (error) {
      if (onProgress) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        onProgress({
          stage: 'error',
          percent: 0,
          message: `Rendering failed: ${errorMessage}`,
        });
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Download rendered video file
   */
  downloadVideo(videoDataUrl: string, filename: string): void {
    const link = document.createElement('a');
    link.href = videoDataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Cancel ongoing render
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Generate default filename for video
   */
  static generateVideoFilename(projectName: string = 'animation'): string {
    const safe = projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    return `${safe}_${timestamp}.mp4`;
  }
}
