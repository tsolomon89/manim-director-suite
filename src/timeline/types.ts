/**
 * Timeline and Keyframe Type Definitions
 * Phase 5: Keyframes & Timeline
 */

import type { CameraState } from '../scene/types';

/**
 * Snapshot of a single parameter at a keyframe
 */
export interface ParameterSnapshot {
  value: number;
  include: boolean; // Whether to interpolate this parameter
  easing: string; // Easing curve ID from config
}

/**
 * Snapshot of camera state at a keyframe
 */
export interface CameraSnapshot extends CameraState {
  include: boolean; // Whether to interpolate camera
}

/**
 * Snapshot of warp state at a keyframe
 */
export interface WarpSnapshot {
  type: string; // Warp type ID
  parameters: Record<string, number>; // Warp-specific parameters
  include: boolean; // Whether to interpolate warp
}

/**
 * Complete snapshot of application state at a keyframe
 */
export interface KeyframeSnapshot {
  parameters: Record<string, ParameterSnapshot>; // Parameter ID -> snapshot
  camera: CameraSnapshot;
  warp: WarpSnapshot;
}

/**
 * A single keyframe in the timeline
 */
export interface Keyframe {
  id: string;
  time: number; // Time position in seconds
  label: string; // User-friendly label
  snapshot: KeyframeSnapshot;
}

/**
 * Timeline configuration and state
 */
export interface TimelineState {
  duration: number; // Total timeline duration in seconds
  currentTime: number; // Current playhead position in seconds
  isPlaying: boolean; // Whether playback is active
  loopMode: 'once' | 'loop' | 'pingpong'; // Playback loop mode
  playbackSpeed: number; // Playback speed multiplier (1.0 = normal)
}

/**
 * Timeline configuration from config
 */
export interface TimelineConfig {
  defaultDuration: number;
  defaultLoopMode: 'once' | 'loop' | 'pingpong';
  defaultPlaybackSpeed: number;
  snapEnabled: boolean;
  snapThreshold: number; // Pixels to snap to keyframe
  minKeyframeSpacing: number; // Minimum seconds between keyframes
}

/**
 * Result of tweening calculation
 */
export interface TweenResult {
  parameters: Record<string, number>; // Parameter ID -> interpolated value
  camera: CameraState;
  warp: {
    type: string;
    parameters: Record<string, number>;
  };
}
