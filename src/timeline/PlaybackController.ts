/**
 * PlaybackController
 * Controls timeline playback (play/pause/scrub)
 * Phase 5: Keyframes & Timeline
 */

import { configManager } from '../config/ConfigManager';
import type { TimelineState } from './types';

/**
 * Callback for timeline updates
 */
export type TimelineUpdateCallback = (state: TimelineState) => void;

/**
 * Controller for timeline playback
 */
export class PlaybackController {
  private state: TimelineState;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private callbacks: Set<TimelineUpdateCallback> = new Set();

  constructor() {
    // Load defaults from config
    const timelineConfig = configManager.get('timeline');

    this.state = {
      duration: timelineConfig.defaultDuration,
      currentTime: 0,
      isPlaying: false,
      loopMode: timelineConfig.defaultLoopMode,
      playbackSpeed: timelineConfig.defaultPlaybackSpeed,
    };
  }

  /**
   * Get current timeline state
   */
  getState(): TimelineState {
    return { ...this.state };
  }

  /**
   * Set timeline duration
   */
  setDuration(duration: number): void {
    this.state.duration = Math.max(0, duration);

    // Clamp current time if it exceeds new duration
    if (this.state.currentTime > this.state.duration) {
      this.state.currentTime = this.state.duration;
    }

    this.notifyCallbacks();
  }

  /**
   * Set current time (scrub)
   */
  setCurrentTime(time: number): void {
    this.state.currentTime = Math.max(0, Math.min(time, this.state.duration));
    this.notifyCallbacks();
  }

  /**
   * Set loop mode
   */
  setLoopMode(mode: 'once' | 'loop' | 'pingpong'): void {
    this.state.loopMode = mode;
    this.notifyCallbacks();
  }

  /**
   * Set playback speed
   */
  setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.1, Math.min(speed, 10));
    this.notifyCallbacks();
  }

  /**
   * Start playback
   */
  play(): void {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.lastUpdateTime = performance.now();
    this.startAnimationLoop();
    this.notifyCallbacks();
  }

  /**
   * Pause playback
   */
  pause(): void {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;
    this.stopAnimationLoop();
    this.notifyCallbacks();
  }

  /**
   * Toggle play/pause
   */
  togglePlayPause(): void {
    if (this.state.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Stop playback and reset to start
   */
  stop(): void {
    this.pause();
    this.state.currentTime = 0;
    this.notifyCallbacks();
  }

  /**
   * Jump to start
   */
  jumpToStart(): void {
    this.state.currentTime = 0;
    this.notifyCallbacks();
  }

  /**
   * Jump to end
   */
  jumpToEnd(): void {
    this.state.currentTime = this.state.duration;
    this.notifyCallbacks();
  }

  /**
   * Step forward by a small amount (useful for frame-by-frame)
   * @param fps - Frames per second (default 60)
   */
  stepForward(fps: number = 60): void {
    const frameTime = 1 / fps;
    this.setCurrentTime(this.state.currentTime + frameTime);
  }

  /**
   * Step backward by a small amount
   * @param fps - Frames per second (default 60)
   */
  stepBackward(fps: number = 60): void {
    const frameTime = 1 / fps;
    this.setCurrentTime(this.state.currentTime - frameTime);
  }

  /**
   * Register a callback for timeline updates
   */
  subscribe(callback: TimelineUpdateCallback): () => void {
    this.callbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Start animation loop
   */
  private startAnimationLoop(): void {
    const update = (timestamp: number) => {
      if (!this.state.isPlaying) return;

      // Calculate delta time
      const deltaTime = (timestamp - this.lastUpdateTime) / 1000; // Convert to seconds
      this.lastUpdateTime = timestamp;

      // Update current time with playback speed
      const newTime = this.state.currentTime + (deltaTime * this.state.playbackSpeed);

      // Handle loop modes
      if (newTime >= this.state.duration) {
        switch (this.state.loopMode) {
          case 'once':
            // Stop at end
            this.state.currentTime = this.state.duration;
            this.pause();
            break;

          case 'loop':
            // Loop back to start
            this.state.currentTime = newTime % this.state.duration;
            break;

          case 'pingpong':
            // Reverse direction (not fully implemented - would need direction state)
            this.state.currentTime = this.state.duration;
            this.pause();
            break;
        }
      } else if (newTime < 0) {
        this.state.currentTime = 0;
      } else {
        this.state.currentTime = newTime;
      }

      this.notifyCallbacks();

      // Continue loop
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Stop animation loop
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Notify all callbacks of state change
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => callback(this.state));
  }

  /**
   * Cleanup - stop playback and remove callbacks
   */
  destroy(): void {
    this.stopAnimationLoop();
    this.callbacks.clear();
  }
}
