/**
 * TimelineControls UI Component
 * Play/pause/stop controls for timeline
 * Phase 5: Keyframes & Timeline
 */

import type { TimelineState } from '../timeline/types';
import './TimelineControls.css';

interface TimelineControlsProps {
  timelineState: TimelineState;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onJumpToStart: () => void;
  onJumpToEnd: () => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onSpeedChange: (speed: number) => void;
  onLoopModeChange: (mode: 'once' | 'loop' | 'pingpong') => void;
}

export function TimelineControls({
  timelineState,
  onPlay,
  onPause,
  onStop,
  onJumpToStart,
  onJumpToEnd,
  onStepForward,
  onStepBackward,
  onSpeedChange,
  onLoopModeChange,
}: TimelineControlsProps) {
  const { isPlaying, playbackSpeed, loopMode } = timelineState;

  return (
    <div className="timeline-controls">
      <div className="controls-row">
        {/* Transport controls */}
        <div className="transport-controls">
          <button
            className="control-btn"
            onClick={onJumpToStart}
            title="Jump to start"
          >
            ⏮
          </button>

          <button
            className="control-btn"
            onClick={onStepBackward}
            title="Step backward"
          >
            ⏪
          </button>

          {isPlaying ? (
            <button
              className="control-btn primary"
              onClick={onPause}
              title="Pause"
            >
              ⏸
            </button>
          ) : (
            <button
              className="control-btn primary"
              onClick={onPlay}
              title="Play"
            >
              ▶
            </button>
          )}

          <button
            className="control-btn"
            onClick={onStepForward}
            title="Step forward"
          >
            ⏩
          </button>

          <button
            className="control-btn"
            onClick={onJumpToEnd}
            title="Jump to end"
          >
            ⏭
          </button>

          <button
            className="control-btn"
            onClick={onStop}
            title="Stop"
          >
            ⏹
          </button>
        </div>

        {/* Playback speed */}
        <div className="speed-control">
          <label htmlFor="playback-speed">Speed:</label>
          <select
            id="playback-speed"
            value={playbackSpeed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
          >
            <option value="0.25">0.25x</option>
            <option value="0.5">0.5x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
            <option value="4">4x</option>
          </select>
        </div>

        {/* Loop mode */}
        <div className="loop-control">
          <label htmlFor="loop-mode">Loop:</label>
          <select
            id="loop-mode"
            value={loopMode}
            onChange={(e) => onLoopModeChange(e.target.value as 'once' | 'loop' | 'pingpong')}
          >
            <option value="once">Once</option>
            <option value="loop">Loop</option>
            <option value="pingpong">Ping-pong</option>
          </select>
        </div>
      </div>
    </div>
  );
}
