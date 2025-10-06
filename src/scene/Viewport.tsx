import { useRef, useEffect, useState, useCallback } from 'react';
import { Camera } from './Camera';
import { Space } from './Space';
import { Grid } from './Grid';
import { FunctionPlotter } from './FunctionPlotter';
import { PointPlotter } from './PointPlotter';
import { ImplicitFunctionPlotter } from './ImplicitFunctionPlotter';
import { ManimRenderer } from './ManimRenderer';
import { type ManimSceneConfig } from './ManimScriptBuilder';
import { configManager } from '../config/ConfigManager';
import type { ViewportDimensions } from './types';
import type { PlottedFunction } from './FunctionPlotter';
import type { PlottedPoints } from './PointPlotter';
import type { ImplicitFunction } from './implicit-types';
import type { GridRenderConfig } from './GridConfig';
import './Viewport.css';

export type RendererType = 'canvas' | 'manim' | 'hybrid';

export type { ViewportDimensions };

interface ViewportProps {
  gridStyleId?: string;
  gridConfig?: GridRenderConfig;
  functions?: PlottedFunction[];
  points?: PlottedPoints[];
  implicitFunctions?: ImplicitFunction[];
  parameterValues?: Record<string, number>;
  onCameraChange?: (camera: Camera) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  renderer?: RendererType; // Which renderer to use
  onRendererStatsUpdate?: (stats: { latencyMs?: number; cacheStats?: any }) => void;
}

export function Viewport({
  gridStyleId,
  gridConfig,
  functions = [],
  points = [],
  implicitFunctions = [],
  parameterValues = {},
  onCameraChange,
  onCanvasReady,
  renderer: rendererProp,
  onRendererStatsUpdate,
}: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const manimImageRef = useRef<HTMLImageElement>(null);
  const cameraRef = useRef<Camera>(new Camera());
  const spaceRef = useRef<Space>(new Space());
  const gridRef = useRef<Grid>(new Grid(spaceRef.current));
  const plotterRef = useRef<FunctionPlotter>(new FunctionPlotter());
  const pointPlotterRef = useRef<PointPlotter>(new PointPlotter());
  const implicitPlotterRef = useRef<ImplicitFunctionPlotter>(new ImplicitFunctionPlotter(spaceRef.current));
  const manimRendererRef = useRef<ManimRenderer | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastInteractionRef = useRef<number>(Date.now());

  const [fps, setFps] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [manimImageUrl, setManimImageUrl] = useState<string | null>(null);
  const [isRenderingManim, setIsRenderingManim] = useState(false);
  const lastFrameTimeRef = useRef(performance.now());
  const fpsCounterRef = useRef({ frames: 0, lastUpdate: performance.now() });

  const userSettings = configManager.getUserSettings();
  const showFps = userSettings?.viewport?.showFps ?? false;
  const configRenderer = (userSettings?.viewport as any)?.renderer; // Temporary cast until config is updated
  const renderer: RendererType = rendererProp || configRenderer || 'canvas';
  const hybridIdleTimeMs = configManager.get<number>('viewport.hybridIdleTimeMs') || 500;

  // Update grid style when prop changes
  useEffect(() => {
    if (gridStyleId) {
      gridRef.current.setStyle(gridStyleId);
    }
  }, [gridStyleId]);

  // Initialize Manim renderer if needed
  useEffect(() => {
    if ((renderer === 'manim' || renderer === 'hybrid') && !manimRendererRef.current) {
      manimRendererRef.current = new ManimRenderer();
    }
  }, [renderer]);

  // Render function (Canvas)
  const renderCanvas = useCallback(() => {
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

    // Render points
    const pointPlotter = pointPlotterRef.current;
    points.forEach((pts) => {
      pointPlotter.plotPoints(
        pts,
        parameterValues,
        ctx,
        camera.getState(),
        viewport,
        { fillPoints: true }
      );
    });

    // Render implicit functions
    const implicitPlotter = implicitPlotterRef.current;
    implicitFunctions.forEach((implFunc) => {
      implicitPlotter.plotImplicitFunction(
        implFunc,
        parameterValues,
        ctx,
        camera.getState(),
        viewport,
        { smoothCurve: true }
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
  }, [functions, points, implicitFunctions, parameterValues, gridConfig]);

  // Render function (Manim)
  const renderManim = useCallback(async () => {
    if (!gridConfig || !manimRendererRef.current) return;

    const manimConfig: ManimSceneConfig = {
      parameters: parameterValues,
      camera: cameraRef.current.getState(),
      gridConfig,
      functions,
      points,
      implicitFunctions,
      backgroundColor: (gridConfig.background as any)?.color || '#000000',
    };

    setIsRenderingManim(true);

    try {
      const result = await manimRendererRef.current.renderFrame(manimConfig, {
        quality: 'draft',
        frameNumber: 0,
      });

      if (result.success && result.imageDataUrl) {
        setManimImageUrl(result.imageDataUrl);

        // Update stats
        if (onRendererStatsUpdate) {
          const stats = manimRendererRef.current.getCacheStats();
          onRendererStatsUpdate({
            latencyMs: result.renderTimeMs,
            cacheStats: stats,
          });
        }
      } else {
        console.error('Manim render failed:', result.error);
      }
    } catch (error) {
      console.error('Manim render error:', error);
    } finally {
      setIsRenderingManim(false);
    }
  }, [functions, points, implicitFunctions, parameterValues, gridConfig, onRendererStatsUpdate]);

  // Main render function (switches based on renderer type)
  const render = useCallback(() => {
    if (renderer === 'canvas') {
      renderCanvas();
    } else if (renderer === 'manim') {
      // Manim rendering is async, done separately
      // Canvas is hidden when using Manim
    } else if (renderer === 'hybrid') {
      // Hybrid: Always render Canvas, trigger Manim on idle
      renderCanvas();
    }
  }, [renderer, renderCanvas]);

  // Trigger Manim render when needed
  useEffect(() => {
    if (renderer === 'manim') {
      // Debounce Manim rendering
      const timeoutId = setTimeout(() => {
        renderManim();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [renderer, renderManim, parameterValues, functions, points, implicitFunctions, gridConfig]);

  // Hybrid mode: Render Manim after idle period
  useEffect(() => {
    if (renderer !== 'hybrid') return;

    const checkIdle = () => {
      const idleTime = Date.now() - lastInteractionRef.current;
      if (idleTime > hybridIdleTimeMs && !isRenderingManim) {
        renderManim();
      }
    };

    const intervalId = setInterval(checkIdle, 500);
    return () => clearInterval(intervalId);
  }, [renderer, hybridIdleTimeMs, renderManim, isRenderingManim]);

  // Animation loop (Canvas only)
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
    lastInteractionRef.current = Date.now(); // Track interaction for hybrid mode
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    cameraRef.current.pan(dx, dy);
    setLastMousePos({ x: e.clientX, y: e.clientY });
    lastInteractionRef.current = Date.now(); // Track interaction for hybrid mode

    if (onCameraChange) {
      onCameraChange(cameraRef.current);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastInteractionRef.current = Date.now(); // Track interaction for hybrid mode
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
    const zoomSpeed = configManager.get<number>('camera.zoomSpeed') ?? 0.1;
    const factor = e.deltaY < 0 ? 1 + zoomSpeed : 1 - zoomSpeed;

    cameraRef.current.zoom(factor, worldPos.x, worldPos.y);
    lastInteractionRef.current = Date.now(); // Track interaction for hybrid mode

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
      {/* Canvas renderer (visible in canvas/hybrid mode) */}
      <canvas
        ref={canvasRef}
        className={`viewport-canvas ${isDragging ? 'dragging' : ''}`}
        style={{
          display: renderer === 'manim' ? 'none' : 'block',
          opacity: renderer === 'hybrid' && manimImageUrl ? 0.5 : 1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Manim renderer (visible in manim/hybrid mode) */}
      {(renderer === 'manim' || renderer === 'hybrid') && manimImageUrl && (
        <img
          ref={manimImageRef}
          src={manimImageUrl}
          alt="Manim rendered frame"
          className="viewport-manim-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            pointerEvents: 'none',
            opacity: renderer === 'hybrid' ? 0.5 : 1,
          }}
        />
      )}

      {/* Rendering indicator */}
      {isRenderingManim && (
        <div className="rendering-indicator">
          Rendering with Manim...
        </div>
      )}

      {/* FPS counter */}
      {showFps && renderer !== 'manim' && (
        <div className="fps-counter">
          {fps} FPS
        </div>
      )}
    </div>
  );
}
