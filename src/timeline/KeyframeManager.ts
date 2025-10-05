/**
 * KeyframeManager
 * CRUD operations for keyframes
 * Phase 5: Keyframes & Timeline
 */

import type { Keyframe, KeyframeSnapshot } from './types';
import type { CameraState } from '../scene/types';

/**
 * Manages keyframe storage and operations
 */
export class KeyframeManager {
  private keyframes: Keyframe[] = [];
  private nextId: number = 1;

  /**
   * Create a new keyframe at the specified time
   * @param time - Time position in seconds
   * @param label - User-friendly label (optional, defaults to ID)
   * @param snapshot - State snapshot
   * @returns The created keyframe
   */
  createKeyframe(time: number, label: string | null, snapshot: KeyframeSnapshot): Keyframe {
    const id = `kf-${this.nextId++}`;
    const keyframe: Keyframe = {
      id,
      time,
      label: label || `Keyframe ${id}`,
      snapshot,
    };

    this.keyframes.push(keyframe);
    this.sortKeyframes();
    return keyframe;
  }

  /**
   * Get all keyframes sorted by time
   */
  getAllKeyframes(): Keyframe[] {
    return [...this.keyframes];
  }

  /**
   * Get keyframe by ID
   */
  getKeyframe(id: string): Keyframe | null {
    return this.keyframes.find(kf => kf.id === id) || null;
  }

  /**
   * Update an existing keyframe
   * @param id - Keyframe ID
   * @param updates - Partial keyframe data to update
   * @returns true if successful
   */
  updateKeyframe(id: string, updates: Partial<Omit<Keyframe, 'id'>>): boolean {
    const index = this.keyframes.findIndex(kf => kf.id === id);
    if (index === -1) return false;

    this.keyframes[index] = {
      ...this.keyframes[index],
      ...updates,
    };

    // Re-sort if time changed
    if (updates.time !== undefined) {
      this.sortKeyframes();
    }

    return true;
  }

  /**
   * Delete a keyframe
   * @param id - Keyframe ID
   * @returns true if successful
   */
  deleteKeyframe(id: string): boolean {
    const initialLength = this.keyframes.length;
    this.keyframes = this.keyframes.filter(kf => kf.id !== id);
    return this.keyframes.length < initialLength;
  }

  /**
   * Clone an existing keyframe at a new time
   * @param id - Source keyframe ID
   * @param newTime - Time for the cloned keyframe
   * @param newLabel - Optional label for clone
   * @returns The cloned keyframe or null
   */
  cloneKeyframe(id: string, newTime: number, newLabel?: string): Keyframe | null {
    const source = this.getKeyframe(id);
    if (!source) return null;

    const label = newLabel || `${source.label} (copy)`;
    return this.createKeyframe(newTime, label, source.snapshot);
  }

  /**
   * Get keyframe at or before the specified time
   */
  getKeyframeBefore(time: number): Keyframe | null {
    const sorted = this.keyframes
      .filter(kf => kf.time <= time)
      .sort((a, b) => b.time - a.time);
    return sorted[0] || null;
  }

  /**
   * Get keyframe after the specified time
   */
  getKeyframeAfter(time: number): Keyframe | null {
    const sorted = this.keyframes
      .filter(kf => kf.time > time)
      .sort((a, b) => a.time - b.time);
    return sorted[0] || null;
  }

  /**
   * Get keyframes surrounding the specified time
   * @returns [before, after] tuple, either may be null
   */
  getSurroundingKeyframes(time: number): [Keyframe | null, Keyframe | null] {
    return [this.getKeyframeBefore(time), this.getKeyframeAfter(time)];
  }

  /**
   * Find closest keyframe to the specified time
   * @param time - Time to search near
   * @param maxDistance - Maximum distance in seconds (optional)
   */
  findClosestKeyframe(time: number, maxDistance?: number): Keyframe | null {
    if (this.keyframes.length === 0) return null;

    let closest = this.keyframes[0];
    let minDistance = Math.abs(closest.time - time);

    for (const kf of this.keyframes) {
      const distance = Math.abs(kf.time - time);
      if (distance < minDistance) {
        minDistance = distance;
        closest = kf;
      }
    }

    if (maxDistance !== undefined && minDistance > maxDistance) {
      return null;
    }

    return closest;
  }

  /**
   * Check if a keyframe at the given time would conflict with existing keyframes
   * @param time - Time to check
   * @param threshold - Minimum time difference (default 0.01s)
   * @param excludeId - Keyframe ID to exclude from check (for updates)
   * @returns The conflicting keyframe or null
   */
  checkConflict(time: number, threshold: number = 0.01, excludeId?: string): Keyframe | null {
    for (const kf of this.keyframes) {
      if (excludeId && kf.id === excludeId) continue;
      if (Math.abs(kf.time - time) < threshold) {
        return kf;
      }
    }
    return null;
  }

  /**
   * Clear all keyframes
   */
  clear(): void {
    this.keyframes = [];
    this.nextId = 1;
  }

  /**
   * Get the number of keyframes
   */
  count(): number {
    return this.keyframes.length;
  }

  /**
   * Sort keyframes by time (internal)
   */
  private sortKeyframes(): void {
    this.keyframes.sort((a, b) => a.time - b.time);
  }

  /**
   * Serialize keyframes to JSON
   */
  toJSON(): Keyframe[] {
    return this.getAllKeyframes();
  }

  /**
   * Load keyframes from JSON
   */
  fromJSON(data: Keyframe[]): void {
    this.keyframes = [...data];
    this.sortKeyframes();

    // Update nextId to avoid collisions
    const maxId = this.keyframes.reduce((max, kf) => {
      const match = kf.id.match(/^kf-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    this.nextId = maxId + 1;
  }
}

/**
 * Builder for creating keyframe snapshots
 * Implements the Builder pattern from CLAUDE.md
 */
export class KeyframeSnapshotBuilder {
  private snapshot: KeyframeSnapshot = {
    parameters: {},
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      rotation: 0,
      include: false,
    },
    warp: {
      type: 'identity',
      parameters: {},
      include: false,
    },
  };

  /**
   * Add a parameter to the snapshot
   */
  withParameter(id: string, value: number, include: boolean = true, easing: string = 'linear'): this {
    this.snapshot.parameters[id] = { value, include, easing };
    return this;
  }

  /**
   * Add multiple parameters at once
   */
  withParameters(params: Record<string, { value: number; include?: boolean; easing?: string }>): this {
    for (const [id, data] of Object.entries(params)) {
      this.withParameter(
        id,
        data.value,
        data.include ?? true,
        data.easing ?? 'linear'
      );
    }
    return this;
  }

  /**
   * Set camera state
   */
  withCamera(camera: CameraState, include: boolean = true): this {
    this.snapshot.camera = { ...camera, include };
    return this;
  }

  /**
   * Set warp state
   */
  withWarp(type: string, parameters: Record<string, number> = {}, include: boolean = false): this {
    this.snapshot.warp = { type, parameters, include };
    return this;
  }

  /**
   * Build the snapshot
   */
  build(): KeyframeSnapshot {
    return this.snapshot;
  }
}
