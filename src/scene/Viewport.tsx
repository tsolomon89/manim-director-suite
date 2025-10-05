import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera } from './Camera';
import { Space } from './Space';
import { Grid } from './Grid';
import { FunctionPlotter } from './FunctionPlotter';
import { configManager } from '../config/ConfigManager';
import type { ViewportDimensions } from './types';
import type { PlottedFunction } from './FunctionPlotter';
import type { GridRenderConfig } from './GridConfig';
import './Viewport.css';

export type { ViewportDimensions };

interface ViewportProps {
  gridStyleId?: string;
  gridConfig?: GridRenderConfig;
  functions?: PlottedFunction[];
  parameterValues?: Record<string, number>;
  onCameraChange?: (camera: Camera) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function Viewport({ gridStyleId, gridConfig, functions = [], parameterValues = {}, onCameraChange, onCanvasReady }: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<Camera>(new Camera());
  const spaceRef = useRef<Space>(new Space());
  const gridRef = useRef<Grid>(new Grid(spaceRef.current));
  const plotterRef = useRef<FunctionPlotter>(new FunctionPlotter());
  const animationFrameRef = useRef<number | undefined>(undefined);

  const [fps, setFps] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const lastFrameTimeRef = useRef(performance.now());
  const fpsCounterRef = useRef({ frames: 0, lastUpdate: performance.now() });

  const showFps = configManager.getUserSettings().viewport.showFps;

  // Update grid style when prop changes
  useEffect(() => {
    if (gridStyleId) {
      gridRef.current.setStyle(gridStyleId);
    }
  }, [gridStyleId]);

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const camera = cameraRef.current;
    const space = spaceRef.current;
    const grid = gridRef.current;
    const plotter = plotterRef.current;

    const viewport: ViewportDimensions = {
      width: canvas.width,
      height: canvas.height,
    };

    // Render grid (with GridRenderConfig if provided)
    if (gridConfig) {
      grid.renderWithConfig({
        ctx,
        camera: camera.getState(),
        viewport,
        bounds: space.getBounds(),
        config: gridConfig,
      });
    } else {
      // Fallback to old style-based rendering
      grid.render({
        ctx,
        camera: camera.getState(),
        viewport,
        bounds: space.getBounds(),
      });
    }

    // Render functions
    functions.forEach((func) => {
      plotter.plotFunction(
        func,
        parameterValues,
        ctx,
        camera.getState(),
        viewport,
        { clipToBounds: true }
      );
    });

    // Update FPS counter
    const now = performance.now();
    fpsCounterRef.current.frames++;
    if (now - fpsCounterRef.current.lastUpdate >= 1000) {
      setFps(fpsCounterRef.current.frames);
      fpsCounterRef.current.frames = 0;
      fpsCounterRef.current.lastUpdate = now;
    }
    lastFrameTimeRef.current = now;
  }, [functions, parameterValues, gridConfig]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      render();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Notify parent that canvas is ready
    if (onCanvasReady) {
      onCanvasReady(canvas);
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [onCanvasReady]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    cameraRef.current.pan(dx, dy);
    setLastMousePos({ x: e.clientX, y: e.clientY });

    if (onCameraChange) {
      onCameraChange(cameraRef.current);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert to world coordinates
    const worldPos = spaceRef.current.screenToWorld(
      { x: mouseX, y: mouseY },
      cameraRef.current.getState(),
      { width: canvas.width, height: canvas.height }
    );

    // Zoom
    const zoomSpeed = configManager.get<number>('camera.zoomSpeed');
    const factor = e.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

    cameraRef.current.zoom(factor, worldPos.x, worldPos.y);

    if (onCameraChange) {
      onCameraChange(cameraRef.current);
    }
  };

  // Public API for parent components
  useEffect(() => {
    // Expose camera to parent via ref callback
    if (onCameraChange) {
      onCameraChange(cameraRef.current);
    }
  }, [onCameraChange]);

  return (
    <div className="viewport-container">
      <canvas
        ref={canvasRef}
        className={`viewport-canvas ${isDragging ? 'dragging' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
      {showFps && (
        <div className="fps-counter">
          {fps} FPS
        </div>
      )}
    </div>
  );
}
