/**
 * TimelineView UI Component
 * Visual timeline with keyframes and scrubber
 * Phase 5: Keyframes & Timeline
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import type { Keyframe, TimelineState } from '../timeline/types';
import './TimelineView.css';

interface TimelineViewProps {
  timelineState: TimelineState;
  keyframes: Keyframe[];
  onTimeChange: (time: number) => void;
  onKeyframeSelect: (keyframeId: string | null) => void;
  onKeyframeMove: (keyframeId: string, newTime: number) => void;
  selectedKeyframeId: string | null;
}

export function TimelineView({
  timelineState,
  keyframes,
  onTimeChange,
  onKeyframeSelect,
  onKeyframeMove,
  selectedKeyframeId,
}: TimelineViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDraggingScrubber, setIsDraggingScrubber] = useState(false);
  const [isDraggingKeyframe, setIsDraggingKeyframe] = useState<string | null>(null);
  const [hoveredKeyframe, setHoveredKeyframe] = useState<string | null>(null);

  const { duration, currentTime } = timelineState;

  // Timeline dimensions
  const TIMELINE_HEIGHT = 80;
  const RULER_HEIGHT = 30;
  const TRACK_HEIGHT = 50;
  const KEYFRAME_RADIUS = 8;
  const SCRUBBER_WIDTH = 2;

  /**
   * Convert time to canvas X coordinate
   */
  const timeToX = useCallback((time: number, width: number): number => {
    return (time / duration) * width;
  }, [duration]);

  /**
   * Convert canvas X coordinate to time
   */
  const xToTime = useCallback((x: number, width: number): number => {
    return (x / width) * duration;
  }, [duration]);

  /**
   * Render the timeline
   */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw ruler with time markers
    ctx.fillStyle = '#2a2a2a';
    ctx.fillRect(0, 0, width, RULER_HEIGHT);

    // Time markers
    const numMarkers = 10;
    ctx.strokeStyle = '#666';
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i <= numMarkers; i++) {
      const x = (i / numMarkers) * width;
      const time = (i / numMarkers) * duration;

      // Draw tick
      ctx.beginPath();
      ctx.moveTo(x, RULER_HEIGHT - 10);
      ctx.lineTo(x, RULER_HEIGHT);
      ctx.stroke();

      // Draw time label
      ctx.fillText(time.toFixed(1) + 's', x, RULER_HEIGHT - 15);
    }

    // Draw track background
    ctx.fillStyle = '#252525';
    ctx.fillRect(0, RULER_HEIGHT, width, TRACK_HEIGHT);

    // Draw keyframes
    keyframes.forEach((keyframe) => {
      const x = timeToX(keyframe.time, width);
      const y = RULER_HEIGHT + TRACK_HEIGHT / 2;

      const isSelected = keyframe.id === selectedKeyframeId;
      const isHovered = keyframe.id === hoveredKeyframe;

      // Keyframe diamond shape
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);

      // Shadow for depth
      if (isSelected || isHovered) {
        ctx.shadowColor = isSelected ? '#4a9eff' : '#888';
        ctx.shadowBlur = 8;
      }

      // Fill
      ctx.fillStyle = isSelected ? '#4a9eff' : isHovered ? '#666' : '#555';
      ctx.fillRect(-KEYFRAME_RADIUS, -KEYFRAME_RADIUS, KEYFRAME_RADIUS * 2, KEYFRAME_RADIUS * 2);

      // Border
      ctx.strokeStyle = isSelected ? '#6eb4ff' : '#777';
      ctx.lineWidth = 2;
      ctx.strokeRect(-KEYFRAME_RADIUS, -KEYFRAME_RADIUS, KEYFRAME_RADIUS * 2, KEYFRAME_RADIUS * 2);

      ctx.restore();

      // Label
      if (isSelected || isHovered) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(keyframe.label, x, y - 20);
      }
    });

    // Draw current time scrubber
    const scrubberX = timeToX(currentTime, width);

    // Scrubber line
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = SCRUBBER_WIDTH;
    ctx.beginPath();
    ctx.moveTo(scrubberX, 0);
    ctx.lineTo(scrubberX, height);
    ctx.stroke();

    // Scrubber handle (triangle at top)
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.moveTo(scrubberX, 0);
    ctx.lineTo(scrubberX - 6, 10);
    ctx.lineTo(scrubberX + 6, 10);
    ctx.closePath();
    ctx.fill();

    // Current time label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = scrubberX > width - 50 ? 'right' : 'left';
    ctx.fillText(
      currentTime.toFixed(2) + 's',
      scrubberX + (scrubberX > width - 50 ? -10 : 10),
      height - 10
    );
  }, [
    currentTime,
    duration,
    keyframes,
    selectedKeyframeId,
    hoveredKeyframe,
    timeToX,
    RULER_HEIGHT,
    TRACK_HEIGHT,
    KEYFRAME_RADIUS,
    SCRUBBER_WIDTH,
  ]);

  /**
   * Handle mouse down - start dragging
   */
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = xToTime(x, canvas.width);

    // Check if clicking on a keyframe
    for (const keyframe of keyframes) {
      const kfX = timeToX(keyframe.time, canvas.width);
      const kfY = RULER_HEIGHT + TRACK_HEIGHT / 2;
      const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);

      if (distance < KEYFRAME_RADIUS * 1.5) {
        setIsDraggingKeyframe(keyframe.id);
        onKeyframeSelect(keyframe.id);
        return;
      }
    }

    // Otherwise, start scrubbing
    setIsDraggingScrubber(true);
    onTimeChange(time);
    onKeyframeSelect(null);
  }, [keyframes, onTimeChange, onKeyframeSelect, timeToX, xToTime, RULER_HEIGHT, TRACK_HEIGHT, KEYFRAME_RADIUS]);

  /**
   * Handle mouse move - drag scrubber or keyframe
   */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = xToTime(x, canvas.width);

    // Dragging keyframe
    if (isDraggingKeyframe) {
      onKeyframeMove(isDraggingKeyframe, Math.max(0, Math.min(time, duration)));
      return;
    }

    // Dragging scrubber
    if (isDraggingScrubber) {
      onTimeChange(time);
      return;
    }

    // Update hover state
    let newHovered: string | null = null;
    for (const keyframe of keyframes) {
      const kfX = timeToX(keyframe.time, canvas.width);
      const kfY = RULER_HEIGHT + TRACK_HEIGHT / 2;
      const distance = Math.sqrt((x - kfX) ** 2 + (y - kfY) ** 2);

      if (distance < KEYFRAME_RADIUS * 1.5) {
        newHovered = keyframe.id;
        break;
      }
    }
    setHoveredKeyframe(newHovered);
  }, [
    isDraggingScrubber,
    isDraggingKeyframe,
    keyframes,
    duration,
    onTimeChange,
    onKeyframeMove,
    timeToX,
    xToTime,
    RULER_HEIGHT,
    TRACK_HEIGHT,
    KEYFRAME_RADIUS,
  ]);

  /**
   * Handle mouse up - stop dragging
   */
  const handleMouseUp = useCallback(() => {
    setIsDraggingScrubber(false);
    setIsDraggingKeyframe(null);
  }, []);

  /**
   * Handle mouse leave - stop dragging
   */
  const handleMouseLeave = useCallback(() => {
    setIsDraggingScrubber(false);
    setIsDraggingKeyframe(null);
    setHoveredKeyframe(null);
  }, []);

  /**
   * Update canvas size and render
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Set canvas size to match container
    const updateSize = () => {
      const width = container.clientWidth;
      canvas.width = width;
      canvas.height = TIMELINE_HEIGHT;
      render();
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [render, TIMELINE_HEIGHT]);

  /**
   * Re-render when state changes
   */
  useEffect(() => {
    render();
  }, [render]);

  return (
    <div className="timeline-view" ref={containerRef}>
      <canvas
        ref={canvasRef}
        className="timeline-canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
